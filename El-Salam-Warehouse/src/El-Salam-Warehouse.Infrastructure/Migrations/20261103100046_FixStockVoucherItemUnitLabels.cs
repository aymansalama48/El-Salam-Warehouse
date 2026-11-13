using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace El_Salam_Warehouse.Infrastructure.Migrations
{
    // ميجريشن لتصحيح أسماء الوحدات (UnitLabel) في بنود أذونات المخزن القديمة
    public partial class FixStockVoucherItemUnitLabels : Migration
    {
        // بيعدل اسم الوحدة في بنود الإذونات القديمة عشان يطابق الوحدة المعتمدة للمنتج (كراس / كشكول / كرتونة)
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
UPDATE i
SET i.UnitLabel = CASE WHEN i.EntryUnit = 2 THEN p.BaseUnit ELSE p.SubUnit END
FROM StockVoucherItems i
JOIN Products p ON p.Id = i.ProductId;");
        }

        // التصحيح ده خاص بالداتا ومينفعش يتعكس عشان منرجعش أسماء غلط تاني
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // عملية تصحيح الداتا لا يمكن التراجع عنها (Irreversible data fix)
        }
    }
}
