using El_Salam_Warehouse.Api.Controllers.Base;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Domain.Constants;
using El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Commands.AssignPermissionToRole;
using El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Commands.RemovePermissionFromRole;
using El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Commands.UpdateRolePermissions;
using El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Queries.GetAllPermissions;
using El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Queries.GetAllRolesWithPermissions;
using El_Salam_Warehouse.Application.Features.Accounts.PermissionManagement.Queries.GetRolePermissions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Api.Controllers;

// Controller مسؤول عن إدارة الصلاحيات والأدوار (RBAC) في النظام
[Route("api/permissions")]
[Authorize]
public class PermissionManagementController : BaseApiController
{
    // استرجاع كافة الصلاحيات المعرفة في السيستم
    [HttpGet]
    [Permission(Permissions.Roles.View)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IResult> GetAllPermissions(CancellationToken cancellationToken)
    {
        var query = new GetAllPermissionsQuery();
        var result = await Sender.Send(query, cancellationToken);
        return HandleResult(result);
    }

    // استرجاع جميع الأدوار مع قائمة الصلاحيات الخاصة بكل دور
    [HttpGet("roles")]
    [Permission(Permissions.Roles.View)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IResult> GetAllRolesWithPermissions(CancellationToken cancellationToken)
    {
        var query = new GetAllRolesWithPermissionsQuery();
        var result = await Sender.Send(query, cancellationToken);
        return HandleResult(result);
    }

    // استرجاع صلاحيات دور معين عبر معرفه
    [HttpGet("roles/{roleId:guid}")]
    [Permission(Permissions.Roles.View)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IResult> GetRolePermissions([FromRoute] Guid roleId, CancellationToken cancellationToken)
    {
        var query = new GetRolePermissionsQuery(roleId);
        var result = await Sender.Send(query, cancellationToken);
        return HandleResult(result);
    }

    // إسناد صلاحية معينة لدور محدد
    [HttpPost("roles/{roleId:guid}/permissions/{permissionId:guid}")]
    [Permission(Permissions.Roles.Manage)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IResult> AssignPermissionToRole(
        [FromRoute] Guid roleId,
        [FromRoute] Guid permissionId,
        CancellationToken cancellationToken)
    {
        var command = new AssignPermissionToRoleCommand(roleId, permissionId);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // حذف صلاحية معينة من دور محدد
    [HttpDelete("roles/{roleId:guid}/permissions/{permissionId:guid}")]
    [Permission(Permissions.Roles.Manage)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IResult> RemovePermissionFromRole(
        [FromRoute] Guid roleId,
        [FromRoute] Guid permissionId,
        CancellationToken cancellationToken)
    {
        var command = new RemovePermissionFromRoleCommand(roleId, permissionId);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    // تحديث وتعيين مجموعة كاملة من الصلاحيات لدور محدد
    [HttpPut("roles/{roleId:guid}/permissions")]
    [Permission(Permissions.Roles.Manage)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IResult> UpdateRolePermissions(
        [FromRoute] Guid roleId,
        [FromBody] List<Guid> permissionIds,
        CancellationToken cancellationToken)
    {
        var command = new UpdateRolePermissionsCommand(roleId, permissionIds);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }
}
