using El_Salam_Warehouse.Application.Common.Pagination;
using El_Salam_Warehouse.Domain.Common.Results;

namespace El_Salam_Warehouse.Application.Common.Abstractions.Identity.UserManagement;

/// <summary>
/// إدارة سجل ApplicationUser الأساسي
/// </summary>
public interface IUserManagementService
{
    Task<Result<UserDto>> GetByIdAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<List<UserDto>> GetUsersByIdsAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken);

    Task<PagedResult<UserDto>> GetAllUsersAsync(
        int pageNumber,
        int pageSize,
        string? role,
        string? searchTerm,
        CancellationToken cancellationToken);

    Task<Result> EnsureUserExistsAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<Result> DeactivateUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<Result> ActivateUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<Result> UpdateProfileAsync(
        Guid userId,
        string fullName,
        string phoneNumber,
        CancellationToken cancellationToken);

    Task<Result> UpdateProfilePictureAsync(
        Guid userId,
        string avatarUrl,
        CancellationToken cancellationToken);

    Task<Result> AssignRoleAsync(
        Guid userId,
        string roleName,
        CancellationToken cancellationToken);

    Task<Result> RemoveRoleAsync(
        Guid userId,
        string roleName,
        CancellationToken cancellationToken);

    /// <summary>
    /// إنشاء وإضافة حساب مستخدم / موظف جديد في النظام
    /// </summary>
    Task<Result<Guid>> CreateUserAsync(
        string email,
        string password,
        string firstName,
        string? middleName,
        string lastName,
        string? phoneNumber,
        string role,
        CancellationToken cancellationToken);
}

/// <summary>
/// بيانات المستخدم الأساسية
/// </summary>
public record UserDto
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string? MiddleName { get; init; }
    public string LastName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? PhoneNumber { get; init; }
    public string? AvatarUrl { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? LastLoginAt { get; init; }
    public List<string> Roles { get; init; } = new();
}
