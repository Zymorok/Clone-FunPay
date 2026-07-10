using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FunPay.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileCosmetics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SelectedAvatarAsset",
                table: "Users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedBannerAsset",
                table: "Users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedFrameAsset",
                table: "Users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedWallpaperAsset",
                table: "Users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SelectedAvatarAsset",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SelectedBannerAsset",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SelectedFrameAsset",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SelectedWallpaperAsset",
                table: "Users");
        }
    }
}
