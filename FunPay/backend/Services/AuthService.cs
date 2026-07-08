using System.Text.RegularExpressions;
using System.ComponentModel.DataAnnotations;
using FunPay.Backend.Data;
using FunPay.Backend.DTOs;
using FunPay.Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace FunPay.Backend.Services;

public class AuthService(
    AppDbContext dbContext,
    IPasswordHasher<User> passwordHasher)
{
    private static readonly EmailAddressAttribute EmailAddressValidator = new();

    public async Task<RegisterResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var nick = Normalize(request.Nick);
        var email = Normalize(request.Email);

        if (request.Password != request.ConfirmPassword)
        {
            return RegisterResult.Failure("Пароли не совпадают.");
        }

        if (!IsNickAllowed(nick))
        {
            return RegisterResult.Failure("Ник может содержать латинские буквы, цифры, точку, дефис и подчёркивание.");
        }

        if (await dbContext.Users.AnyAsync(user => user.Nick == nick, cancellationToken))
        {
            return RegisterResult.Failure("Такой ник уже занят.", StatusCodes.Status409Conflict);
        }

        if (await dbContext.Users.AnyAsync(user => user.Email == email, cancellationToken))
        {
            return RegisterResult.Failure("Такая почта уже занята.", StatusCodes.Status409Conflict);
        }

        var now = DateTimeOffset.UtcNow;
        var user = new User
        {
            Nick = nick,
            Email = email,
            Role = UserRole.User,
            CreatedAt = now,
            UpdatedAt = now
        };

        // Пароль не сохраняем как текст: сохраняем только его безопасный отпечаток.
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        dbContext.Users.Add(user);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueConflict(exception))
        {
            return RegisterResult.Failure("Ник или почта уже заняты.", StatusCodes.Status409Conflict);
        }

        return RegisterResult.Success(new RegisterResponse
        {
            Id = user.Id,
            Nick = user.Nick,
            Email = user.Email,
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt
        });
    }

    public async Task<AvailabilityResponse> CheckNickAvailabilityAsync(
        string? value,
        CancellationToken cancellationToken)
    {
        var nick = Normalize(value);

        if (nick.Length < 3 || nick.Length > 32 || !IsNickAllowed(nick))
        {
            return new AvailabilityResponse
            {
                Available = false,
                Message = "Ник пока не подходит."
            };
        }

        var isTaken = await dbContext.Users.AnyAsync(user => user.Nick == nick, cancellationToken);

        return new AvailabilityResponse
        {
            Available = !isTaken,
            Message = isTaken ? "Такой ник уже занят." : "Ник свободен."
        };
    }

    public async Task<AvailabilityResponse> CheckEmailAvailabilityAsync(
        string? value,
        CancellationToken cancellationToken)
    {
        var email = Normalize(value);

        if (email.Length > 254 || !EmailAddressValidator.IsValid(email))
        {
            return new AvailabilityResponse
            {
                Available = false,
                Message = "Почта пока не подходит."
            };
        }

        var isTaken = await dbContext.Users.AnyAsync(user => user.Email == email, cancellationToken);

        return new AvailabilityResponse
        {
            Available = !isTaken,
            Message = isTaken ? "Такая почта уже занята." : "Почта свободна."
        };
    }

    private static string Normalize(string? value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static bool IsNickAllowed(string nick)
    {
        return Regex.IsMatch(nick, "^[a-z0-9_.-]+$");
    }

    private static bool IsUniqueConflict(DbUpdateException exception)
    {
        return exception.InnerException is PostgresException postgresException
            && postgresException.SqlState == PostgresErrorCodes.UniqueViolation;
    }
}
