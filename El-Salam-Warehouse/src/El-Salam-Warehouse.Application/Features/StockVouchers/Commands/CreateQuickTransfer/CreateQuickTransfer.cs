using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.CurrentUser;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.Products.Shared;
using El_Salam_Warehouse.Application.Features.StockVouchers.Commands.CreateStockVoucher;
using El_Salam_Warehouse.Application.Features.StockVouchers.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Constants;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.StockVouchers.Commands.CreateQuickTransfer;

// نتيجة الحركة السريعة المزدوجة (إذن وارد + إذن صرف)
public record QuickTransferResult(
    Guid InboundVoucherId,
    string InboundVoucherNumber,
    Guid OutboundVoucherId,
    string OutboundVoucherNumber,
    int ItemsCount,
    DateOnly Date);

// 1. الـ Command
public record CreateQuickTransferCommand(
    DateOnly? Date,
    VoucherSource InboundSource,
    string? InboundPartyName,
    string InboundDelivererName,
    string InboundReceiverName,
    string OutboundPartyName,
    string OutboundReceiverName,
    string? Notes,
    List<StockVoucherItemInput> Items) : ICommand<QuickTransferResult>;

// 2. الـ Validator
public class CreateQuickTransferCommandValidator : AbstractValidator<CreateQuickTransferCommand>
{
    public CreateQuickTransferCommandValidator(IDateTime dateTime)
    {
        RuleFor(x => x.InboundSource).IsInEnum().WithMessage("مصدر إذن الوارد غير صحيح.");

        RuleFor(x => x.Date)
            .Must(d => d!.Value <= DateOnly.FromDateTime(dateTime.Now))
            .When(x => x.Date.HasValue)
            .WithMessage("تاريخ الحركة لا يمكن أن يكون في المستقبل.");

        // الوارد
        RuleFor(x => x.InboundPartyName)
            .NotEmpty()
            .When(x => x.InboundSource == VoucherSource.External)
            .WithMessage("اسم جهة التوريد مطلوب عند اختيار مصدر خارجي.")
            .MaximumLength(150).WithMessage("اسم جهة التوريد طويل جداً.");

        RuleFor(x => x.InboundDelivererName)
            .NotEmpty().WithMessage("اسم الشخص المُسلِّم (مندوب التوريد) مطلوب.")
            .MaximumLength(150).WithMessage("اسم المُسلِّم طويل جداً.");

        RuleFor(x => x.InboundReceiverName)
            .NotEmpty().WithMessage("اسم أمين المخزن المستلم مطلوب.")
            .MaximumLength(150).WithMessage("اسم أمين المخزن طويل جداً.");

        // المنصرف
        RuleFor(x => x.OutboundPartyName)
            .NotEmpty().WithMessage("اسم الجهة المنصرف إليها (العميل) مطلوب.")
            .MaximumLength(150).WithMessage("اسم العميل طويل جداً.");

        RuleFor(x => x.OutboundReceiverName)
            .NotEmpty().WithMessage("اسم المستلم الفعلي للعميل مطلوب.")
            .MaximumLength(150).WithMessage("اسم مستلم العميل طويل جداً.");

        RuleFor(x => x.Notes).MaximumLength(500).WithMessage("الملاحظات طويلة جداً.");

        // الأصناف
        RuleFor(x => x.Items)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("يجب إضافة صنف واحد على الأقل للحركة السريعة.")
            .Must(items => items.Select(i => i.ProductId).Distinct().Count() == items.Count)
            .WithMessage("لا يمكن تكرار نفس الصنف في نفس الحركة.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).NotEmpty().WithMessage("يجب تحديد الصنف.");
            item.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("الكمية يجب أن تكون أكبر من صفر.")
                .LessThanOrEqualTo(1_000_000).WithMessage("الكمية كبيرة جداً.");
        });
    }
}

// 3. الـ Handler
internal sealed class CreateQuickTransferCommandHandler : ICommandHandler<CreateQuickTransferCommand, QuickTransferResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTime _dateTime;
    private readonly ICurrentUser _currentUser;

    public CreateQuickTransferCommandHandler(
        IApplicationDbContext context, 
        IDateTime dateTime, 
        ICurrentUser currentUser)
    {
        _context = context;
        _dateTime = dateTime;
        _currentUser = currentUser;
    }

    public async Task<Result<QuickTransferResult>> Handle(CreateQuickTransferCommand request, CancellationToken cancellationToken)
    {
        // التحقق من صلاحيات الوارد والصرف معاً
        if (!_currentUser.HasPermission(Permissions.Vouchers.CreateInbound))
        {
            return Result<QuickTransferResult>.Failure(new Error("Auth.Forbidden", "ليس لديك صلاحية تسجيل إذن وارد.", ErrorType.Forbidden));
        }

        if (!_currentUser.HasPermission(Permissions.Vouchers.CreateOutbound))
        {
            return Result<QuickTransferResult>.Failure(new Error("Auth.Forbidden", "ليس لديك صلاحية تسجيل إذن منصرف.", ErrorType.Forbidden));
        }

        var voucherDate = request.Date ?? DateOnly.FromDateTime(_dateTime.Now);
        var nowUtc = _dateTime.UtcNow;

        // جلب المنتجات وتتبعها
        var productIds = request.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        if (products.Count != productIds.Count)
        {
            return Result<QuickTransferResult>.Failure(ProductErrors.NotFound);
        }

        // إذا كان الوارد من صالة الإنتاج: كشاكيل وكراريس بس
        if (request.InboundSource == VoucherSource.ProductionHall)
        {
            var invalid = products.Values.FirstOrDefault(p => p.EntryUnit != StockEntryUnit.SubUnit);
            if (invalid is not null)
            {
                return Result<QuickTransferResult>.Failure(StockVoucherErrors.ProductionHallNotebooksOnly(invalid.Name));
            }
        }

        // 1. توليد رقم إذن الوارد (IN-YYYY-XXXX)
        var inPrefix = $"IN-{voucherDate.Year}-";
        var inCount = await _context.StockVouchers.CountAsync(v => v.VoucherNumber.StartsWith(inPrefix), cancellationToken);
        var inboundVoucherNumber = $"{inPrefix}{inCount + 1:D4}";

        // 2. توليد رقم إذن المنصرف (OUT-YYYY-XXXX)
        var outPrefix = $"OUT-{voucherDate.Year}-";
        var outCount = await _context.StockVouchers.CountAsync(v => v.VoucherNumber.StartsWith(outPrefix), cancellationToken);
        var outboundVoucherNumber = $"{outPrefix}{outCount + 1:D4}";

        var isExternalInbound = request.InboundSource == VoucherSource.External;
        var inParty = isExternalInbound ? request.InboundPartyName?.Trim() : "صالة الإنتاج والتجليد";

        var commonNotes = string.IsNullOrWhiteSpace(request.Notes) ? "" : $" ({request.Notes.Trim()})";
        var inNotes = $"حركة سريعة: تم استلام البضاعة وصرفها فوراً للعميل {request.OutboundPartyName.Trim()}{commonNotes}";
        var outNotes = $"حركة سريعة: تم صرفها فوراً بمجرد ورودها من {inParty}{commonNotes}";

        // إنشاء كائن إذن الوارد
        var inboundVoucher = new StockVoucher(
            inboundVoucherNumber,
            StockVoucherType.Inbound,
            voucherDate,
            request.InboundSource,
            isExternalInbound ? request.InboundPartyName?.Trim() : null,
            request.InboundReceiverName.Trim(),
            request.InboundDelivererName.Trim(),
            inNotes,
            null,
            null,
            null,
            nowUtc);

        // إنشاء كائن إذن المنصرف
        var outboundVoucher = new StockVoucher(
            outboundVoucherNumber,
            StockVoucherType.Outbound,
            voucherDate,
            VoucherSource.External,
            request.OutboundPartyName.Trim(),
            request.OutboundReceiverName.Trim(),
            request.InboundReceiverName.Trim(), // المُسلّم في الصرف هو أمين المخزن الذي استلمها
            outNotes,
            null,
            null,
            null,
            nowUtc.AddSeconds(1)); // إضافة ثانية واحدة حتى يظهر ترتيب اليومية: وارد ثم منصرف

        // معالجة حركة الأصناف: زيادة الوارد ثم خصم المنصرف
        foreach (var line in request.Items)
        {
            var product = products[line.ProductId];
            var entryUnit = line.EntryUnit ?? product.EntryUnit;
            var isBase = entryUnit == StockEntryUnit.BaseUnit;
            var unitLabel = isBase ? product.BaseUnit : product.SubUnit;
            var quantitySubUnits = isBase
                ? checked(line.Quantity * product.UnitsPerBaseUnit)
                : line.Quantity;

            // --- أ. تسجيل الوارد ---
            var balanceBeforeIn = product.TotalSubUnitStock;
            product.IncreaseStock(quantitySubUnits);
            var balanceAfterIn = product.TotalSubUnitStock;

            inboundVoucher.AddItem(new StockVoucherItem(
                product.Id,
                product.Name,
                unitLabel,
                entryUnit,
                line.Quantity,
                quantitySubUnits,
                balanceBeforeIn,
                balanceAfterIn));

            // --- ب. تسجيل المنصرف فوراً ---
            var balanceBeforeOut = balanceAfterIn;
            product.DecreaseStock(quantitySubUnits);
            var balanceAfterOut = product.TotalSubUnitStock;

            outboundVoucher.AddItem(new StockVoucherItem(
                product.Id,
                product.Name,
                unitLabel,
                entryUnit,
                line.Quantity,
                quantitySubUnits,
                balanceBeforeOut,
                balanceAfterOut));
        }

        _context.StockVouchers.Add(inboundVoucher);
        _context.StockVouchers.Add(outboundVoucher);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result<QuickTransferResult>.Failure(StockVoucherErrors.ConcurrencyConflict);
        }

        return Result<QuickTransferResult>.Success(new QuickTransferResult(
            inboundVoucher.Id,
            inboundVoucher.VoucherNumber,
            outboundVoucher.Id,
            outboundVoucher.VoucherNumber,
            request.Items.Count,
            voucherDate));
    }
}
