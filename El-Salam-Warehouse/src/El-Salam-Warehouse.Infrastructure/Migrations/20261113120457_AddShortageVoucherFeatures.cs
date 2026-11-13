using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace El_Salam_Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddShortageVoucherFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ShortageReason",
                table: "StockVouchers",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShortageReason",
                table: "StockVouchers");
        }
    }
}
