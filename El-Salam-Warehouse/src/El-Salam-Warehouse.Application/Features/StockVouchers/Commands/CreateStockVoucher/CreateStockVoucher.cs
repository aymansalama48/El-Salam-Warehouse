using El_Salam_Warehouse.Application.Common.Abstractions.Identity.CurrentUser;
using El_Salam_Warehouse.Domain.Constants;
using El_Salam_Warehouse.Application.Common.Abstractions.Core; // تمت إضافة IDateTime هنا
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.Products.Shared;
using El_Salam_Warehouse.Application.Features.StockVouchers.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.StockVouchers.Commands.CreateStockVoucher;

// صنف في الإذن (المنتج + الكمية + الوحدة المحددة اختيارياً)
public record StockVoucherItemInput(Guid ProductId, int Quantity, StockEntryUnit? EntryUnit = null);

// 1. الـ Command
public record CreateStockVoucherCommand(
    StockVoucherType Type,
    DateOnly? Date,
    VoucherSource Source,
    string? PartyName,
    string ReceiverName,
    string? DelivererName,
    string? Notes,
    List<StockVoucherItemInput> Items,
    ReturnDirection? ReturnDirection = null,
    string? ReturnReason = null,
    string? ShortageReason = null) : ICommand<Guid>;

// 2. الـ Validator
public class CreateStockVoucherCommandValidator : AbstractValidator<CreateStockVoucherCommand>
{
    // تم حقن IDateTime هنا عشان الفاليديشن
    public CreateStockVoucherCommandValidator(IDateTime dateTime)
    {
        RuleFor(x => x.Type).IsInEnum().WithMessage("نوع الإذن غير صحيح.");
        RuleFor(x => x.Source).IsInEnum().WithMessage("مصدر الإذن غير صحيح.");

        // إذن الصرف والمرتجع لجهة خارجية فقط
        RuleFor(x => x.Source)
            .Equal(VoucherSource.External)
            .When(x => x.Type == StockVoucherType.Outbound)
            .WithMessage("إذن الصرف يكون لجهة خارجية فقط.");

        // التاريخ مينفعش يبقى في المستقبل (استخدام IDateTime)
        RuleFor(x => x.Date)
            .Must(d => d!.Value <= DateOnly.FromDateTime(dateTime.Now))
            .When(x => x.Date.HasValue)
            .WithMessage("تاريخ الإذن لا يمكن أن يكون في المستقبل.");

        // اسم الجهة مطلوب لو خارجي أو مرتجع
        RuleFor(x => x.PartyName).MaximumLength(150).WithMessage("اسم الجهة طويل جداً.");
        RuleFor(x => x.PartyName)
            .NotEmpty()
            .When(x => x.Source == VoucherSource.External || x.Type == StockVoucherType.Return)
            .WithMessage("اسم الجهة مطلوب.");

        // سبب المرتجع مطلوب إذا كان إذن مرتجع
        RuleFor(x => x.ReturnReason)
            .NotEmpty()
            .When(x => x.Type == StockVoucherType.Return)
            .WithMessage("سبب الإرجاع مطلوب لإذن المرتجع.")
            .MaximumLength(250).WithMessage("سبب الإرجاع طويل جداً.");

        // سبب العجز مطلوب إذا كان إذن عجز
        RuleFor(x => x.ShortageReason)
            .NotEmpty()
            .When(x => x.Type == StockVoucherType.Shortage)
            .WithMessage("سبب العجز مطلوب لإذن العجز.")
            .MaximumLength(250).WithMessage("سبب وبيان العجز طويل جداً.");

        // اتجاه المرتجع
        RuleFor(x => x.ReturnDirection)
            .IsInEnum()
            .When(x => x.Type == StockVoucherType.Return && x.ReturnDirection.HasValue)
            .WithMessage("اتجاه حركة المرتجع غير صحيح.");

        // المستلم مطلوب دايماً
        RuleFor(x => x.ReceiverName)
            .NotEmpty().WithMessage("اسم المستلم مطلوب.")
            .MaximumLength(150).WithMessage("اسم المستلم طويل جداً.");

        // المُسلِّم مطلوب في إذن الوارد (صالة الإنتاج أو جهة خارجية)
        RuleFor(x => x.DelivererName).MaximumLength(150).WithMessage("اسم المُسلِّم طويل جداً.");
        RuleFor(x => x.DelivererName)
            .NotEmpty()
            .When(x => x.Type == StockVoucherType.Inbound)
            .WithMessage("اسم الشخص المُسلِّم مطلوب في إذن الوارد.");

        RuleFor(x => x.Notes).MaximumLength(500).WithMessage("الملاحظات طويلة جداً.");

        // الأصناف
        RuleFor(x => x.Items)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("يجب إضافة صنف واحد على الأقل.")
            .Must(items => items.Select(i => i.ProductId).Distinct().Count() == items.Count)
            .WithMessage("لا يمكن تكرار نفس الصنف في الإذن الواحد.");

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
internal sealed class CreateStockVoucherCommandHandler : ICommandHandler<CreateStockVoucherCommand, Guid>
{
    // الاتصال بالداتابيز
    private readonly IApplicationDbContext _context;
    private readonly IDateTime _dateTime;
    private readonly ICurrentUser _currentUser;

    // كونستركتور (تم حقن IDateTime هنا)
    public CreateStockVoucherCommandHandler(IApplicationDbContext context, IDateTime dateTime, ICurrentUser currentUser)
    {
        _context = context;
        _dateTime = dateTime;
        _currentUser = currentUser;
    }

    // تنفيذ إنشاء الإذن
    public async Task<Result<Guid>> Handle(CreateStockVoucherCommand request, CancellationToken cancellationToken)
    {
        // استخدام IDateTime بدلاً من CairoTime
        var voucherDate = request.Date ?? DateOnly.FromDateTime(_dateTime.Now);
        var isInbound = request.Type == StockVoucherType.Inbound;
        var isReturn = request.Type == StockVoucherType.Return;
        var isShortage = request.Type == StockVoucherType.Shortage;
        var isStockIncrease = isInbound || (isReturn && request.ReturnDirection != ReturnDirection.Outbound);

        // التحقق من الصلاحيات حسب نوع الإذن (وارد / منصرف / مرتجع / عجز)
        var requiredPermission = request.Type switch
        {
            StockVoucherType.Inbound => Permissions.Vouchers.CreateInbound,
            StockVoucherType.Outbound => Permissions.Vouchers.CreateOutbound,
            StockVoucherType.Return => Permissions.Vouchers.CreateReturn,
            StockVoucherType.Shortage => Permissions.Vouchers.CreateShortage,
            _ => Permissions.Vouchers.CreateInbound
        };

        if (!_currentUser.HasPermission(requiredPermission))
        {
            var actionTitle = request.Type switch
            {
                StockVoucherType.Inbound => "تسجيل إذن وارد",
                StockVoucherType.Outbound => "تسجيل إذن منصرف",
                StockVoucherType.Return => "تسجيل إذن مرتجع",
                StockVoucherType.Shortage => "تسجيل إذن عجز",
                _ => "تسجيل إذن مخزن"
            };
            return Result<Guid>.Failure(new Error("Auth.Forbidden", $"ليس لديك الصلاحية المطلوبة لـ {actionTitle}.", ErrorType.Forbidden));
        }

        // نجيب كل المنتجات مرة واحدة (متتبعة عشان نعدّل رصيدها)
        var productIds = request.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        if (products.Count != productIds.Count)
        {
            return Result<Guid>.Failure(ProductErrors.NotFound);
        }

        // صالة الإنتاج: كشاكيل وكراريس بس
        if (request.Source == VoucherSource.ProductionHall)
        {
            var invalid = products.Values.FirstOrDefault(p => p.EntryUnit != StockEntryUnit.SubUnit);
            if (invalid is not null)
            {
                return Result<Guid>.Failure(StockVoucherErrors.ProductionHallNotebooksOnly(invalid.Name));
            }
        }

        // توليد رقم الإذن (IN-2026-0001 / OUT-2026-0001 / RET-2026-0001 / SHT-2026-0001)
        var typePrefix = request.Type switch
        {
            StockVoucherType.Inbound => "IN",
            StockVoucherType.Outbound => "OUT",
            StockVoucherType.Return => "RET",
            StockVoucherType.Shortage => "SHT",
            _ => "VOU"
        };
        var prefix = $"{typePrefix}-{voucherDate.Year}-";
        var count = await _context.StockVouchers.CountAsync(v => v.VoucherNumber.StartsWith(prefix), cancellationToken);
        var voucherNumber = $"{prefix}{count + 1:D4}";

        var isExternal = request.Source == VoucherSource.External || isReturn;

        var voucher = new StockVoucher(
            voucherNumber,
            request.Type,
            voucherDate,
            request.Source,
            isExternal ? request.PartyName?.Trim() : (isShortage ? (!string.IsNullOrWhiteSpace(request.PartyName) ? request.PartyName.Trim() : "لجنة الجرد والمطابقة") : null),
            request.ReceiverName.Trim(),
            request.DelivererName?.Trim(),
            request.Notes?.Trim(),
            request.ReturnDirection,
            request.ReturnReason?.Trim(),
            request.ShortageReason?.Trim());

        // نعدّل الرصيد ونضيف البنود
        foreach (var line in request.Items)
        {
            var product = products[line.ProductId];
            var entryUnit = line.EntryUnit ?? product.EntryUnit;
            var isBase = entryUnit == StockEntryUnit.BaseUnit;
            var unitLabel = isBase ? product.BaseUnit : product.SubUnit;
            var quantitySubUnits = isBase
                ? checked(line.Quantity * product.UnitsPerBaseUnit)
                : line.Quantity;
            var balanceBefore = product.TotalSubUnitStock;

            if (isStockIncrease)
            {
                product.IncreaseStock(quantitySubUnits);
            }
            else
            {
                // الصرف مينفعش يعدّي الرصيد
                if (quantitySubUnits > balanceBefore)
                {
                    var availableInSelectedUnit = isBase && product.UnitsPerBaseUnit > 0
                        ? balanceBefore / product.UnitsPerBaseUnit
                        : balanceBefore;

                    return Result<Guid>.Failure(StockVoucherErrors.InsufficientStock(
                        product.Name,
                        availableInSelectedUnit,
                        line.Quantity,
                        unitLabel));
                }

                product.DecreaseStock(quantitySubUnits);
            }

            voucher.AddItem(new StockVoucherItem(
                product.Id,
                product.Name,
                unitLabel,
                entryUnit,
                line.Quantity,
                quantitySubUnits,
                balanceBefore,
                product.TotalSubUnitStock));
        }

        _context.StockVouchers.Add(voucher);

        // حفظ واحد = Transaction واحدة (الإذن + الأرصدة)
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result<Guid>.Failure(StockVoucherErrors.ConcurrencyConflict);
        }

        return Result<Guid>.Success(voucher.Id);
    }
}