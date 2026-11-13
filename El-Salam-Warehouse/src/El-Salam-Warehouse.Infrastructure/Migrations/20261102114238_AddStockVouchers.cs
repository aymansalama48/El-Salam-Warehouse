using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace El_Salam_Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStockVouchers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EntryUnit",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Products",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.CreateTable(
                name: "StockVouchers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VoucherNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    VoucherDate = table.Column<DateOnly>(type: "date", nullable: false),
                    OccurredAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Source = table.Column<int>(type: "int", nullable: false),
                    PartyName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    ReceiverName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    DelivererName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CancelReason = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CancelledAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockVouchers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StockVoucherItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VoucherId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    UnitLabel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EntryUnit = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    QuantitySubUnits = table.Column<int>(type: "int", nullable: false),
                    BalanceBeforeSubUnits = table.Column<int>(type: "int", nullable: false),
                    BalanceAfterSubUnits = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockVoucherItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StockVoucherItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockVoucherItems_StockVouchers_VoucherId",
                        column: x => x.VoucherId,
                        principalTable: "StockVouchers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StockVoucherItems_ProductId",
                table: "StockVoucherItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_StockVoucherItems_VoucherId",
                table: "StockVoucherItems",
                column: "VoucherId");

            migrationBuilder.CreateIndex(
                name: "IX_StockVouchers_Type_VoucherDate",
                table: "StockVouchers",
                columns: new[] { "Type", "VoucherDate" });

            migrationBuilder.CreateIndex(
                name: "IX_StockVouchers_VoucherNumber",
                table: "StockVouchers",
                column: "VoucherNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StockVoucherItems");

            migrationBuilder.DropTable(
                name: "StockVouchers");

            migrationBuilder.DropColumn(
                name: "EntryUnit",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Products");
        }
    }
}
