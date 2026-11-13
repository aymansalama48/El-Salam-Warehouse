using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authorization
{
    /// <summary>
    /// تحديد الصلاحية المطلوبة لتنفيذ Command/Query معين
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public sealed class PermissionAttribute : Attribute
    {
        public string Name { get; }

        public PermissionAttribute(string name)
        {
            Name = name;
        }
    }
}
