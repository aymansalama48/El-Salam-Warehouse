using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Infrastructure.Persistence.IdentityModels;

/// <summary>
/// كيان Refresh Token لتخزين جلسات المستخدمين (خاص بالموظفين)
/// </summary>
public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }  // المفتاح الخارجي للمستخدم
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public bool IsRevoked { get; set; } = false;

    // Navigation Property (اختياري)
    public virtual ApplicationUser User { get; set; } = null!;
}