using El_Salam_Warehouse.Infrastructure.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Text;

namespace El_Salam_Warehouse.Infrastructure.DependencyInjection
{
    public static partial class DependencyInjection
    {
        /// <summary>
        /// تسجيل إعدادات التطبيق العامة (App Settings Options).
        /// </summary>
        public static IServiceCollection AddBaseUrl(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // تسجيل الـ Options Pattern الخاص بإعدادات التطبيق العامة (مثل الـ BaseUrl)
            services.Configure<BaseUrlOptions>(configuration.GetSection(BaseUrlOptions.SectionName));

            return services;
        }
    }
}
