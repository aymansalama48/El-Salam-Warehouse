using El_Salam_Warehouse.Application.Common.Abstractions.Core;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Tokens;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;
using El_Salam_Warehouse.Application.Common.Errors.Users;
using El_Salam_Warehouse.Application.Common.Pagination;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Infrastructure.Persistence.Data;
using El_Salam_Warehouse.Infrastructure.Persistence.IdentityModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Infrastructure.Identity.UserManagement;

// خدمة إدارة المستخدمين وحسابات الموظفين
public class UserManagementService(
    UserManager<ApplicationUser> userManager,
    RoleManager<ApplicationRole> roleManager,
    AppDbContext context,
    IRefreshTokenService refreshTokenService,
    IDateTime dateTime,
    ILogger<UserManagementService> logger) : IUserManagementService
{
    // جلب مستخدم بالمعرف
    public async Task<Result<UserDto>> GetByIdAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<UserDto>.Failure(UserErrors.NotFound);

        var roles = await userManager.GetRolesAsync(user);

        return Result<UserDto>.Success(new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            MiddleName = user.MiddleName,
            LastName = user.LastName,
            FullName = user.FullName,
            Email = user.Email!,
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = user.AvatarUrl,
            Roles = roles.ToList(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        });
    }

    public async Task<List<UserDto>> GetUsersByIdsAsync(IEnumerable<Guid> userIds, CancellationToken cancellationToken)
    {
        var rawUsers = await userManager.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.MiddleName,
                u.LastName,
                u.AvatarUrl,
                Email = u.Email ?? string.Empty,
                u.IsActive
            })
            .ToListAsync(cancellationToken);

        return rawUsers.Select(u => new UserDto
        {
            Id = u.Id,
            FirstName = u.FirstName,
            MiddleName = u.MiddleName,
            LastName = u.LastName,
            FullName = string.IsNullOrWhiteSpace(u.MiddleName)
                ? $"{u.FirstName} {u.LastName}".Trim()
                : $"{u.FirstName} {u.MiddleName} {u.LastName}".Trim(),
            AvatarUrl = u.AvatarUrl,
            Email = u.Email,
            IsActive = u.IsActive
        }).ToList();
    }

    // التحقق من وجود المستخدم
    public async Task<Result> EnsureUserExistsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result.Failure(UserErrors.NotFound);

        return Result.Success();
    }

    // تعطيل حساب مستخدم
    public async Task<Result> DeactivateUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result.Failure(UserErrors.NotFound);

        if (!user.IsActive)
            return Result.Success("الحساب معطل بالفعل");

        user.IsActive = false;
        var result = await userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            logger.LogWarning("فشل تعطيل المستخدم {UserId}: {Errors}", userId, errors);
            return Result.Failure(UserErrors.UpdateFailed(errors));
        }

        await refreshTokenService.RevokeAllUserTokensAsync(userId, cancellationToken);

        logger.LogInformation("تم تعطيل المستخدم {UserId} وإلغاء توكنات جلسته بنجاح", userId);
        return Result.Success("تم تعطيل الحساب بنجاح");
    }

    // تفعيل حساب مستخدم
    public async Task<Result> ActivateUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result.Failure(UserErrors.NotFound);

        if (user.IsActive)
            return Result.Success("الحساب نشط بالفعل");

        user.IsActive = true;
        var result = await userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            logger.LogWarning("فشل تفعيل المستخدم {UserId}: {Errors}", userId, errors);
            return Result.Failure(UserErrors.UpdateFailed(errors));
        }

        logger.LogInformation("تم تفعيل المستخدم {UserId} بنجاح", userId);
        return Result.Success("تم تفعيل الحساب بنجاح");
    }

    // تعديل بيانات الملف الشخصي
    public async Task<Result> UpdateProfileAsync(
        Guid userId,
        string fullName,
        string phoneNumber,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result.Failure(UserErrors.NotFound);

        if (string.IsNullOrWhiteSpace(fullName))
            return Result.Failure(UserErrors.ValidationFailed("الاسم مطلوب"));

        var nameParts = fullName.Trim().Split(' ', 2);
        user.FirstName = nameParts[0];
        user.LastName = nameParts.Length > 1 ? nameParts[1] : string.Empty;

        if (!string.IsNullOrWhiteSpace(phoneNumber))
        {
            var existingUser = await userManager.Users
                .FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber && u.Id != userId, cancellationToken);

            if (existingUser is not null)
                return Result.Failure(UserErrors.PhoneAlreadyExists);

            user.PhoneNumber = phoneNumber;
        }

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            logger.LogWarning("فشل تحديث بيانات المستخدم {UserId}: {Errors}", userId, errors);
            return Result.Failure(UserErrors.UpdateFailed(errors));
        }

        logger.LogInformation("تم تحديث بيانات المستخدم {UserId} بنجاح", userId);
        return Result.Success("تم تحديث البيانات بنجاح");
    }

    // تحديث الصورة الشخصية
    public async Task<Result> UpdateProfilePictureAsync(
        Guid userId,
        string avatarUrl,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result.Failure(UserErrors.NotFound);

        if (!string.IsNullOrWhiteSpace(avatarUrl) && !Uri.IsWellFormedUriString(avatarUrl, UriKind.Absolute))
            return Result.Failure(UserErrors.ValidationFailed("رابط الصورة غير صالح"));

        user.AvatarUrl = avatarUrl;
        var result = await userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            logger.LogWarning("فشل تحديث صورة المستخدم {UserId}: {Errors}", userId, errors);
            return Result.Failure(UserErrors.UpdateFailed(errors));
        }

        logger.LogInformation("تم تحديث صورة المستخدم {UserId} بنجاح", userId);
        return Result.Success("تم تحديث الصورة بنجاح");
    }

    // جلب قائمة المستخدمين مع الترقيم والفلترة
    public async Task<PagedResult<UserDto>> GetAllUsersAsync(
        int pageNumber,
        int pageSize,
        string? role,
        string? searchTerm,
        CancellationToken cancellationToken)
    {
        var usersQuery = context.Users.AsNoTracking();

        // 1. الفلترة بالدور
        if (!string.IsNullOrWhiteSpace(role) &&
            !role.Equals("all", StringComparison.OrdinalIgnoreCase) &&
            !role.Equals("الجميع", StringComparison.OrdinalIgnoreCase))
        {
            var cleanRole = role.Trim();
            // البحث عن الدور باسمه أو الاسم المعياري
            var targetRole = await context.Roles
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Name == cleanRole || (r.NormalizedName != null && r.NormalizedName == cleanRole.ToUpper()), cancellationToken);

            if (targetRole != null)
            {
                var userIdsWithRole = context.UserRoles
                    .Where(ur => ur.RoleId == targetRole.Id)
                    .Select(ur => ur.UserId);

                usersQuery = usersQuery.Where(u => userIdsWithRole.Contains(u.Id));
            }
            else
            {
                var usersInRole = await userManager.GetUsersInRoleAsync(cleanRole);
                var userIdsInRole = usersInRole.Select(u => u.Id).ToList();
                usersQuery = usersQuery.Where(u => userIdsInRole.Contains(u.Id));
            }
        }

        // 2. البحث بالاسم أو البريد أو الهاتف
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim().ToLower();
            usersQuery = usersQuery.Where(u =>
                (u.FirstName != null && u.FirstName.ToLower().Contains(term)) ||
                (u.MiddleName != null && u.MiddleName.ToLower().Contains(term)) ||
                (u.LastName != null && u.LastName.ToLower().Contains(term)) ||
                (u.Email != null && u.Email.ToLower().Contains(term)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(term))
            );
        }

        // 3. حساب العدد الإجمالي
        var totalCount = await usersQuery.CountAsync(cancellationToken);

        // 4. جلب صفحة البيانات
        var users = await usersQuery
            .OrderByDescending(u => u.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        // 5. جلب كافة أدوار المستخدمين المعروضين دفعة واحدة بكويري سريع
        var pagedUserIds = users.Select(u => u.Id).ToList();
        var userRolesList = await (
            from ur in context.UserRoles
            join r in context.Roles on ur.RoleId equals r.Id
            where pagedUserIds.Contains(ur.UserId)
            select new { ur.UserId, RoleName = r.Name }
        ).ToListAsync(cancellationToken);

        var rolesByUser = userRolesList
            .GroupBy(x => x.UserId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.RoleName!).ToList());

        // 6. التحويل إلى DTO
        var userDtos = users.Select(user => new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            MiddleName = user.MiddleName,
            LastName = user.LastName,
            FullName = user.FullName,
            Email = user.Email!,
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = user.AvatarUrl,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            Roles = rolesByUser.GetValueOrDefault(user.Id, new List<string>())
        }).ToList();

        return new PagedResult<UserDto>
        {
            Items = userDtos,
            Pagination = new PaginationMetadata
            {
                CurrentPage = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            }
        };
    }

    // إسناد دور لمستخدم
    public async Task<Result> AssignRoleAsync(Guid userId, string roleName, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result.Failure(UserErrors.NotFound);

        if (await userManager.IsInRoleAsync(user, roleName))
            return Result.Success();

        var result = await userManager.AddToRoleAsync(user, roleName);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            logger.LogWarning("فشل إسناد دور {RoleName} للمستخدم {UserId}: {Errors}", roleName, userId, errors);
            return Result.Failure(UserErrors.UpdateFailed(errors));
        }

        logger.LogInformation("تم إسناد دور {RoleName} للمستخدم {UserId} بنجاح", roleName, userId);
        return Result.Success();
    }

    // إزالة دور من مستخدم
    public async Task<Result> RemoveRoleAsync(Guid userId, string roleName, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result.Failure(UserErrors.NotFound);

        if (!await userManager.IsInRoleAsync(user, roleName))
            return Result.Success();

        var result = await userManager.RemoveFromRoleAsync(user, roleName);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            logger.LogWarning("فشل إزالة دور {RoleName} من المستخدم {UserId}: {Errors}", roleName, userId, errors);
            return Result.Failure(UserErrors.UpdateFailed(errors));
        }

        logger.LogInformation("تم إزالة دور {RoleName} من المستخدم {UserId} بنجاح", roleName, userId);
        return Result.Success();
    }

    // إنشاء وإضافة حساب مستخدم / موظف جديد
    public async Task<Result<Guid>> CreateUserAsync(
        string email,
        string password,
        string firstName,
        string? middleName,
        string lastName,
        string? phoneNumber,
        string role,
        CancellationToken cancellationToken)
    {
        var cleanEmail = email.Trim().ToLower();
        var existingUser = await userManager.FindByEmailAsync(cleanEmail);
        if (existingUser != null)
        {
            return Result<Guid>.Failure(UserErrors.EmailAlreadyExists);
        }

        var user = new ApplicationUser
        {
            UserName = cleanEmail,
            Email = cleanEmail,
            FirstName = firstName.Trim(),
            MiddleName = string.IsNullOrWhiteSpace(middleName) ? null : middleName.Trim(),
            LastName = lastName.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim(),
            IsActive = true,
            CreatedAt = dateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            logger.LogWarning("فشل إنشاء المستخدم {Email}: {Errors}", cleanEmail, errors);
            return Result<Guid>.Failure(new Error("USER_CREATION_FAILED", errors, ErrorType.Validation));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            var cleanRole = role.Trim();
            var targetRole = await roleManager.FindByNameAsync(cleanRole);
            if (targetRole == null)
            {
                var allRoles = await roleManager.Roles.ToListAsync(cancellationToken);
                targetRole = allRoles.FirstOrDefault(r => r.Name.Equals(cleanRole, StringComparison.OrdinalIgnoreCase));
            }

            if (targetRole != null)
            {
                var roleResult = await userManager.AddToRoleAsync(user, targetRole.Name!);
                if (!roleResult.Succeeded)
                {
                    logger.LogWarning("تم إنشاء المستخدم ولكن فشل إسناد الدور {Role}", targetRole.Name);
                }
            }
            else
            {
                logger.LogWarning("الدور {Role} غير موجود في النظام للمستخدم {Email}", cleanRole, cleanEmail);
            }
        }

        logger.LogInformation("تم إنشاء حساب المستخدم {Email} بنجاح", cleanEmail);
        return Result<Guid>.Success(user.Id);
    }
}
