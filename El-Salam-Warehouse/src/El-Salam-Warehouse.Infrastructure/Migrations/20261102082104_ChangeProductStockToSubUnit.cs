using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace El_Salam_Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangeProductStockToSubUnit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "BaseUnitStock",
                table: "Products",
                newName: "TotalSubUnitStock");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TotalSubUnitStock",
                table: "Products",
                newName: "BaseUnitStock");
        }
    }
}
