using FunPay.Backend.DTOs;
using FunPay.Backend.Models;

namespace FunPay.Backend.Services;

public sealed record PasswordChangeOutcome(
    User? User,
    SecurityChallengeResponse? Challenge);
