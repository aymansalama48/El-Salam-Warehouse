using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.Messaging;
using El_Salam_Warehouse.Application.Common.Abstractions.Persistence.Data;
using El_Salam_Warehouse.Application.Features.StockVouchers.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace El_Salam_Warehouse.Application.Features.StockVouchers.Commands.CancelStockVoucher;

// 1. الـ Command
[El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Permission(El_Salam_Warehouse.Domain.Constants.Permissions.Vouchers.Cancel)]
public record CancelStockVoucherCommand(Guid Id, string Reason) : ICommand;

// 2. الـ Validator
public class CancelStockVoucherCommandValidator : AbstractValidator<CancelStockVoucherCommand>
{
    public CancelStockVoucherCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("سبب الإلغاء مطلوب.")
            .MaximumLength(300).WithMessage("سبب الإلغاء طويل جداً.");
    }
}

// 3. الـ Handler
internal sealed class CancelStockVoucherCommandHandler : ICommandHandler<CancelStockVoucherCommand>
{
    // الاتصال بالداتابيز وتثبيت التاريخ والوقت
    private readonly IApplicationDbContext _context;
    private readonly IDateTime _dateTime;

    // كونستركتور
    public CancelStockVoucherCommandHandler(IApplicationDbContext context, IDateTime dateTime)
    {
        _context = context;
        _dateTime = dateTime;
    }

    // تنفيذ الإلغاء (بيعكس الرصيد)
    public async Task<Result> Handle(CancelStockVoucherCommand request, CancellationToken cancellationToken)
    {
        var voucher = await _context.StockVouchers
            .Include(v => v.Items)
            .FirstOrDefaultAsync(v => v.Id == request.Id, cancellationToken);

        if (voucher is null)
        {
            return Result.Failure(StockVoucherErrors.NotFound);
        }

        if (voucher.Status == StockVoucherStatus.Cancelled)
        {
            return Result.Failure(StockVoucherErrors.AlreadyCancelled);
        }

        var productIds = voucher.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        var isStockIncrease = voucher.Type == StockVoucherType.Inbound ||
            (voucher.Type == StockVoucherType.Return && voucher.ReturnDirection != ReturnDirection.Outbound);

        foreach (var item in voucher.Items)
        {
            var product = products[item.ProductId];

            if (isStockIncrease)
            {
                // إلغاء إذن زوّد الرصيد (وارد أو مرتجع وارد) = نشيل الكمية، بس لازم الرصيد يكفي
                if (product.TotalSubUnitStock < item.QuantitySubUnits)
                {
                    return Result.Failure(StockVoucherErrors.CannotCancelInbound(product.Name));
                }

                product.DecreaseStock(item.QuantitySubUnits);
            }
            else
            {
                // إلغاء صرف أو مرتجع منصرف = نرجّع الكمية للرصيد
                product.IncreaseStock(item.QuantitySubUnits);
            }
        }

        voucher.Cancel(request.Reason.Trim(), _dateTime.UtcNow);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Failure(StockVoucherErrors.ConcurrencyConflict);
        }

        return Result.Success();
    }
}