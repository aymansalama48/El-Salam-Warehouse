using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace El_Salam_Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductLowStockThreshold : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LowStockThreshold",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LowStockThresholdUnit",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 1);

            // تسكين القيم الافتراضية للمنتجات الحالية
            // ورق التصوير (UnitType == 3): 50 كرتونة (LowStockThreshold = 50, Unit = 2)
            // الكشاكيل والكراريس (UnitType == 1 || 2): 1000 كشكول/كراس (LowStockThreshold = 1000, Unit = 1)
            migrationBuilder.Sql(@"
UPDATE Products
SET LowStockThreshold = CASE WHEN UnitType = 3 THEN 50 ELSE 1000 END,
    LowStockThresholdUnit = CASE WHEN UnitType = 3 THEN 2 ELSE 1 END;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LowStockThreshold",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "LowStockThresholdUnit",
                table: "Products");
        }
    }
}

