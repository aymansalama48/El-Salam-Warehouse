using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Tokens;
using El_Salam_Warehouse.Application.Common.Constants;
using El_Salam_Warehouse.Infrastructure.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace El_Salam_Warehouse.Infrastructure.Identity.Tokens;

// مولد توكنات JWT للموظفين في السيستم
public class JwtTokenGenerator(
    IOptions<JwtOptions> options,
    IDateTime dateTime) : IJwtTokenGenerator
{
    // توليد توكن JWT للموظف يشمل المعرف والاسم والرولات والصلاحيات
    public string GenerateStaffToken(
        Guid userId,
        string email,
        string fullName,
        IEnumerable<string> roles,
        IEnumerable<string> permissions)
    {
        // 1. تجهيز الـ Claims الأساسية للمستخدم
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(CustomClaims.UserId, userId.ToString()),
            new("id", userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, fullName)
        };

        // 2. إضافة أدوار المستخدم
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // 3. إضافة صلاحيات المستخدم
        foreach (var permission in permissions)
        {
            claims.Add(new Claim(CustomClaims.Permission, permission));
        }

        // 4. بناء التوكن وتوقيعه
        return BuildToken(claims, options.Value.ExpiryMinutes);
    }

    // بناء وتشفير التوكن النهائي
    private string BuildToken(List<Claim> claims, int expiryMinutes)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Value.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: options.Value.Issuer,
            audience: options.Value.Audience,
            claims: claims,
            expires: dateTime.Now.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
