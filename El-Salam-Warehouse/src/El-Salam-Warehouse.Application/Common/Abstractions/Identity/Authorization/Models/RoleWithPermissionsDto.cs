using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization.Models
{
    //  DTO لتمثيل الدور مع صلاحياته الحالية
    public record RoleWithPermissionsDto(
        Guid RoleId,
        string RoleName,
        string? Description,
        bool IsSystemRole,
        List<PermissionDto> Permissions);
}
