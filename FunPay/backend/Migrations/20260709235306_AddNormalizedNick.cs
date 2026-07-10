using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FunPay.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddNormalizedNick : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Nick",
                table: "Users");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_Nick_Normalized",
                table: "Users");

            migrationBuilder.AddColumn<string>(
                name: "NormalizedNick",
                table: "Users",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE \"Users\" SET \"NormalizedNick\" = lower(btrim(\"Nick\"));");

            migrationBuilder.AlterColumn<string>(
                name: "NormalizedNick",
                table: "Users",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_NormalizedNick",
                table: "Users",
                column: "NormalizedNick",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_NormalizedNick_MatchesNick",
                table: "Users",
                sql: "\"NormalizedNick\" = lower(btrim(\"Nick\"))");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_NormalizedNick_NotEmpty",
                table: "Users",
                sql: "length(btrim(\"NormalizedNick\")) > 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_NormalizedNick",
                table: "Users");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_NormalizedNick_MatchesNick",
                table: "Users");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_NormalizedNick_NotEmpty",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "NormalizedNick",
                table: "Users");

            migrationBuilder.Sql(
                "UPDATE \"Users\" SET \"Nick\" = lower(btrim(\"Nick\"));");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Nick",
                table: "Users",
                column: "Nick",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_Nick_Normalized",
                table: "Users",
                sql: "\"Nick\" = lower(btrim(\"Nick\"))");
        }
    }
}
