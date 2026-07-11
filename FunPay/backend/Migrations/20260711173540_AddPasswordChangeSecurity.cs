using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FunPay.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordChangeSecurity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PendingPasswordHash",
                table: "AccountSecurityChallenges",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PendingPasswordHash",
                table: "AccountSecurityChallenges");
        }
    }
}
