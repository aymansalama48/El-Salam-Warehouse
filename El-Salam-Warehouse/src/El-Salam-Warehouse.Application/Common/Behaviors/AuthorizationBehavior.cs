using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization;
using El_Salam_Warehouse.Application.Common.Abstractions.Identity.CurrentUser;
using El_Salam_Warehouse.Application.Common.Helpers;
using El_Salam_Warehouse.Domain.Common.Results;
using El_Salam_Warehouse.Domain.Constants;
using MediatR;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace El_Salam_Warehouse.Application.Common.Behaviors;

/// <summary>
/// سلوك التحقق من الصلاحيات (Authorization Behavior).
/// يفحص وجود [PermissionAttribute] للطلب ويتحقق من صلاحيات المستخدم الحالية في قاعدة البيانات بلحظية تامة،
/// بحيث يسري أي سحب أو إضافة للصلاحيات على الفور حتى للمستخدمين المسجلين حالياً.
/// </summary>
public sealed class AuthorizationBehavior<TRequest, TResponse>(
    ICurrentUser currentUser,
    IPermissionService permissionService)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var permissionAttribute = request.GetType()
            .GetCustomAttributes(typeof(PermissionAttribute), true)
            .FirstOrDefault() as PermissionAttribute;

        if (permissionAttribute is null)
            return await next();

        if (!currentUser.IsAuthenticated)
        {
            var error = new Error("Auth.Unauthorized", "غير مصرح لك، يرجى تسجيل الدخول أولاً.", ErrorType.Unauthorized);
            return ResultFactory.CreateFailure<TResponse>(error);
        }

        if (!currentUser.UserId.HasValue)
        {
            var error = new Error("Auth.MissingIdentifier", "بيانات هوية المستخدم غير متوفرة.", ErrorType.Unauthorized);
            return ResultFactory.CreateFailure<TResponse>(error);
        }

        // 1. فحص خاص لمدير النظام (Admin)
        if (currentUser.IsInRole(Roles.Admin))
        {
            // استثناءات الحماية الأساسية: شاشات إدارة الأدوار والمستخدمين لا يمكن قفلها عن الأدمن إطلاقاً
            if (permissionAttribute.Name == Permissions.Roles.Manage ||
                permissionAttribute.Name == Permissions.Roles.View ||
                permissionAttribute.Name == Permissions.Users.Manage ||
                permissionAttribute.Name == Permissions.Users.View)
            {
                return await next();
            }

            // فحص الصلاحية في قاعدة البيانات للأدمن (بسرعة الذاكرة عبر الكاش)
            var hasPermission = await permissionService.HasPermissionAsync(
                currentUser.UserId.Value,
                permissionAttribute.Name,
                cancellationToken);

            if (hasPermission)
            {
                return await next();
            }

            // إذا لم يجد الصلاحية في قاعدة البيانات للأدمن:
            // نتأكد هل الصلاحية مسجلة أصلاً في جدول TbPermission بقاعدة البيانات؟
            // إذا لم تكن مسجلة في قاعدة البيانات بعد (كأن تكون قاعدة البيانات السحابية لم تكتمل فيها الـ Seeding)،
            // يُسمح لمدير النظام فوراً لضمان عدم توقف العمل.
            var isDefinedInDb = await permissionService.IsPermissionDefinedInDbAsync(
                permissionAttribute.Name,
                cancellationToken);

            if (!isDefinedInDb)
            {
                // الصلاحية غير موجودة بقاعدة البيانات بعد - نسمح للأدمن بتشغيلها تلقائياً
                return await next();
            }

            // إذا كانت الصلاحية مسجلة بالداتابيز ولكن تم سحبها صراحة من دور الأدمن، نمنع التنفيذ
            var error = new Error("Auth.Forbidden", $"ليس لديك الصلاحية المطلوبة لتنفيذ هذا الإجراء ({permissionAttribute.Name}).", ErrorType.Forbidden);
            return ResultFactory.CreateFailure<TResponse>(error);
        }

        // 2. لباقي الموظفين والأدوار (أمين المخزن وغيره): فحص الصلاحيات الممنوحة بدقة
        var userHasPermission = await permissionService.HasPermissionAsync(
            currentUser.UserId.Value,
            permissionAttribute.Name,
            cancellationToken);

        if (!userHasPermission)
        {
            var error = new Error("Auth.Forbidden", $"ليس لديك الصلاحية المطلوبة لتنفيذ هذا الإجراء ({permissionAttribute.Name}).", ErrorType.Forbidden);
            return ResultFactory.CreateFailure<TResponse>(error);
        }

        return await next();
    }
}
