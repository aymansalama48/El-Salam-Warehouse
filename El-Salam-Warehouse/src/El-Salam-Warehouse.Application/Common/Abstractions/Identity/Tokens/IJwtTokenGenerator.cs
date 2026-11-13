using System;
using System.Collections.Generic;

namespace El_Salam_Warehouse.Application.Common.Abstractions.Identity.Tokens;

// واجهة مسؤولة عن توليد توكن الـ JWT للمستخدمين
public interface IJwtTokenGenerator
{
    // توليد توكن JWT للمستخدم يحتوي على بياناته وأدواره وصلاحياته
    string GenerateStaffToken(
        Guid userId,
        string email,
        string fullName,
        IEnumerable<string> roles,
        IEnumerable<string> permissions);
}
