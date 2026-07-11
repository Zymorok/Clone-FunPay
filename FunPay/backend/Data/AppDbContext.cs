using FunPay.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace FunPay.Backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<Game> Games => Set<Game>();

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Product> Products => Set<Product>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<Message> Messages => Set<Message>();

    public DbSet<ProfileContact> ProfileContacts => Set<ProfileContact>();

    public DbSet<UserSession> UserSessions => Set<UserSession>();

    public DbSet<PasswordRecoveryCode> PasswordRecoveryCodes => Set<PasswordRecoveryCode>();

    public DbSet<AccountSecurityChallenge> AccountSecurityChallenges => Set<AccountSecurityChallenge>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUsers(modelBuilder);
        ConfigureGames(modelBuilder);
        ConfigureCategories(modelBuilder);
        ConfigureProducts(modelBuilder);
        ConfigureOrders(modelBuilder);
        ConfigureMessages(modelBuilder);
        ConfigureProfileContacts(modelBuilder);
        ConfigureUserSessions(modelBuilder);
        ConfigurePasswordRecoveryCodes(modelBuilder);
        ConfigureAccountSecurityChallenges(modelBuilder);
    }

    private static void ConfigureUsers(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users", table =>
            {
                table.HasCheckConstraint("CK_Users_Nick_NotEmpty", "length(btrim(\"Nick\")) > 0");
                table.HasCheckConstraint("CK_Users_Email_NotEmpty", "length(btrim(\"Email\")) > 0");
                table.HasCheckConstraint("CK_Users_NormalizedNick_NotEmpty", "length(btrim(\"NormalizedNick\")) > 0");
                table.HasCheckConstraint("CK_Users_NormalizedNick_MatchesNick", "\"NormalizedNick\" = lower(btrim(\"Nick\"))");
                table.HasCheckConstraint("CK_Users_Email_Normalized", "\"Email\" = lower(btrim(\"Email\"))");
                table.HasCheckConstraint("CK_Users_PublicId_Format", "\"PublicId\" ~ '^[0-9]{9}$'");
            });

            entity.HasKey(user => user.Id);

            entity.Property(user => user.Nick)
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(user => user.PublicId)
                .HasMaxLength(9)
                .IsRequired();

            entity.Property(user => user.NormalizedNick)
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(user => user.Email)
                .HasMaxLength(254)
                .IsRequired();

            entity.Property(user => user.PasswordHash)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(user => user.GoogleSubject)
                .HasMaxLength(128);

            entity.Property(user => user.Description)
                .HasMaxLength(1000);

            entity.Property(user => user.Gender)
                .HasMaxLength(20);

            entity.Property(user => user.CountryCode)
                .HasMaxLength(2);

            entity.Property(user => user.AvatarUrl)
                .HasMaxLength(500);

            entity.Property(user => user.AvatarStyle)
                .HasMaxLength(30)
                .HasDefaultValue("gold");

            entity.Property(user => user.BannerStyle)
                .HasMaxLength(30)
                .HasDefaultValue("midnight");

            entity.Property(user => user.FrameStyle)
                .HasMaxLength(30)
                .HasDefaultValue("gold");

            entity.Property(user => user.SelectedAvatarAsset).HasMaxLength(500);
            entity.Property(user => user.SelectedBannerAsset).HasMaxLength(500);
            entity.Property(user => user.SelectedFrameAsset).HasMaxLength(500);
            entity.Property(user => user.SelectedWallpaperAsset).HasMaxLength(500);

            entity.Property(user => user.Role)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(user => user.CreatedAt)
                .HasDefaultValueSql("now()");

            entity.Property(user => user.UpdatedAt)
                .HasDefaultValueSql("now()");

            entity.HasIndex(user => user.LastSeenAt);

            entity.HasIndex(user => user.NormalizedNick)
                .IsUnique();

            entity.HasIndex(user => user.Email)
                .IsUnique();

            entity.HasIndex(user => user.GoogleSubject)
                .IsUnique();

            entity.HasIndex(user => user.PublicId)
                .IsUnique();

        });
    }

    private static void ConfigureProfileContacts(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProfileContact>(entity =>
        {
            entity.ToTable("ProfileContacts");
            entity.HasKey(contact => contact.Id);
            entity.Property(contact => contact.Service).HasMaxLength(32).IsRequired();
            entity.Property(contact => contact.Title).HasMaxLength(60).IsRequired();
            entity.Property(contact => contact.Url).HasMaxLength(500).IsRequired();
            entity.HasOne(contact => contact.User)
                .WithMany(user => user.ProfileContacts)
                .HasForeignKey(contact => contact.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(contact => new { contact.UserId, contact.Position }).IsUnique();
        });
    }

    private static void ConfigureUserSessions(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.ToTable("UserSessions");
            entity.HasKey(session => session.Id);
            entity.Property(session => session.RefreshTokenHash).HasMaxLength(128).IsRequired();
            entity.HasOne(session => session.User)
                .WithMany(user => user.Sessions)
                .HasForeignKey(session => session.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(session => session.RefreshTokenHash).IsUnique();
            entity.HasIndex(session => new { session.UserId, session.ExpiresAt });
        });
    }

    private static void ConfigurePasswordRecoveryCodes(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PasswordRecoveryCode>(entity =>
        {
            entity.ToTable("PasswordRecoveryCodes");
            entity.HasKey(recovery => recovery.Id);
            entity.Property(recovery => recovery.CodeHash).HasMaxLength(64).IsRequired();
            entity.Property(recovery => recovery.TicketHash).HasMaxLength(64);
            entity.HasOne(recovery => recovery.User)
                .WithMany(user => user.PasswordRecoveryCodes)
                .HasForeignKey(recovery => recovery.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(recovery => recovery.TicketHash).IsUnique();
            entity.HasIndex(recovery => new { recovery.UserId, recovery.ExpiresAt });
        });
    }

    private static void ConfigureAccountSecurityChallenges(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AccountSecurityChallenge>(entity =>
        {
            entity.ToTable("AccountSecurityChallenges");
            entity.HasKey(challenge => challenge.Id);
            entity.Property(challenge => challenge.Purpose).HasMaxLength(32).IsRequired();
            entity.Property(challenge => challenge.CodeHash).HasMaxLength(64).IsRequired();
            entity.Property(challenge => challenge.TokenHash).HasMaxLength(64).IsRequired();
            entity.Property(challenge => challenge.PendingEmail).HasMaxLength(254);
            entity.Property(challenge => challenge.PendingPasswordHash).HasMaxLength(500);
            entity.HasOne(challenge => challenge.User)
                .WithMany(user => user.AccountSecurityChallenges)
                .HasForeignKey(challenge => challenge.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(challenge => challenge.TokenHash).IsUnique();
            entity.HasIndex(challenge => new { challenge.UserId, challenge.Purpose, challenge.ExpiresAt });
        });
    }

    private static void ConfigureGames(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Game>(entity =>
        {
            entity.ToTable("Games");
            entity.HasKey(game => game.Id);

            entity.Property(game => game.Name)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(game => game.ImageUrl)
                .HasMaxLength(500);

            entity.Property(game => game.CreatedAt)
                .HasDefaultValueSql("now()");

            entity.HasIndex(game => game.Name)
                .IsUnique();
        });
    }

    private static void ConfigureCategories(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("Categories");
            entity.HasKey(category => category.Id);

            entity.Property(category => category.Name)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(category => category.CreatedAt)
                .HasDefaultValueSql("now()");

            entity.HasIndex(category => category.Name)
                .IsUnique();
        });
    }

    private static void ConfigureProducts(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("Products", table =>
            {
                table.HasCheckConstraint("CK_Products_Price_NotNegative", "\"Price\" >= 0");
            });

            entity.HasKey(product => product.Id);

            entity.Property(product => product.Title)
                .HasMaxLength(160)
                .IsRequired();

            entity.Property(product => product.Description)
                .HasMaxLength(4000)
                .IsRequired();

            entity.Property(product => product.Price)
                .HasColumnType("numeric(12,2)")
                .IsRequired();

            entity.Property(product => product.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(product => product.CreatedAt)
                .HasDefaultValueSql("now()");

            entity.Property(product => product.UpdatedAt)
                .HasDefaultValueSql("now()");

            entity.HasOne(product => product.Seller)
                .WithMany(user => user.Products)
                .HasForeignKey(product => product.SellerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(product => product.Game)
                .WithMany(game => game.Products)
                .HasForeignKey(product => product.GameId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(product => product.Category)
                .WithMany(category => category.Products)
                .HasForeignKey(product => product.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(product => product.SellerId);
            entity.HasIndex(product => product.GameId);
            entity.HasIndex(product => product.CategoryId);
            entity.HasIndex(product => product.Status);
        });
    }

    private static void ConfigureOrders(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders");
            entity.HasKey(order => order.Id);

            entity.Property(order => order.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(order => order.CreatedAt)
                .HasDefaultValueSql("now()");

            entity.Property(order => order.UpdatedAt)
                .HasDefaultValueSql("now()");

            entity.HasOne(order => order.Product)
                .WithMany(product => product.Orders)
                .HasForeignKey(order => order.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(order => order.Buyer)
                .WithMany(user => user.BuyerOrders)
                .HasForeignKey(order => order.BuyerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(order => order.Seller)
                .WithMany(user => user.SellerOrders)
                .HasForeignKey(order => order.SellerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(order => order.ProductId);
            entity.HasIndex(order => order.BuyerId);
            entity.HasIndex(order => order.SellerId);
            entity.HasIndex(order => order.Status);
        });
    }

    private static void ConfigureMessages(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("Messages");
            entity.HasKey(message => message.Id);

            entity.Property(message => message.Text)
                .HasMaxLength(3000)
                .IsRequired();

            entity.Property(message => message.CreatedAt)
                .HasDefaultValueSql("now()");

            entity.HasOne(message => message.Order)
                .WithMany(order => order.Messages)
                .HasForeignKey(message => message.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(message => message.Sender)
                .WithMany(user => user.Messages)
                .HasForeignKey(message => message.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(message => message.OrderId);
            entity.HasIndex(message => new { message.OrderId, message.Id });
            entity.HasIndex(message => message.SenderId);
            entity.HasIndex(message => message.CreatedAt);
        });
    }
}
