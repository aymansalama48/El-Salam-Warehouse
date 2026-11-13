using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace El_Salam_Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductUnitType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // إضافة عمود نوع المنتج الجديد
            migrationBuilder.AddColumn<int>(
                name: "UnitType",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // تصحيح المنتجات القديمة المسجلة في الداتابيز وتسكين نوعها ووحداتها تلقائياً
            migrationBuilder.Sql(@"
UPDATE p
SET p.UnitType = CASE WHEN p.BaseUnit LIKE N'%كرتونة%' THEN 3 WHEN c.Name = N'كراس' THEN 2 ELSE 1 END,
    p.SubUnit  = CASE WHEN p.BaseUnit LIKE N'%كرتونة%' THEN N'رزمة' WHEN c.Name = N'كراس' THEN N'كراس' ELSE N'كشكول' END,
    p.BaseUnit = CASE WHEN p.BaseUnit LIKE N'%كرتونة%' THEN N'كرتونة' ELSE N'باكو' END,
    p.EntryUnit = CASE WHEN p.BaseUnit LIKE N'%كرتونة%' THEN 2 ELSE 1 END
FROM Products p JOIN Categories c ON c.Id = p.CategoryId;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UnitType",
                table: "Products");
        }
    }
}





