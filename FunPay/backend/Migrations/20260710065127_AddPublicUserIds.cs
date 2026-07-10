using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FunPay.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicUserIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublicId",
                table: "Users",
                type: "character varying(9)",
                maxLength: 9,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "Users"
                SET "PublicId" = lpad(("Id" + 100000000)::text, 9, '0')
                WHERE "PublicId" IS NULL OR "PublicId" = '';
                """);

            migrationBuilder.AlterColumn<string>(
                name: "PublicId",
                table: "Users",
                type: "character varying(9)",
                maxLength: 9,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(9)",
                oldMaxLength: 9,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_PublicId",
                table: "Users",
                column: "PublicId",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_PublicId_Format",
                table: "Users",
                sql: "\"PublicId\" ~ '^[0-9]{9}$'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_PublicId",
                table: "Users");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_PublicId_Format",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Users");
        }
    }
}
