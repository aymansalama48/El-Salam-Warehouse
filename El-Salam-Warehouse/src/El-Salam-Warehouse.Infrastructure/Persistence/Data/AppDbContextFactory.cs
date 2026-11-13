using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace El_Salam_Warehouse.Infrastructure.Persistence.Data
{
    /// <summary>
    /// مصنع لإنشاء DbContext في وقت التصميم (لأوامر Migration)
    /// </summary>
    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();

            optionsBuilder.UseSqlServer(
"Data Source=AYMAN\\MSSQLSERVER01;Database=El_Salam_Warehouse;Integrated Security=True;Persist Security Info=False;Pooling=False;MultipleActiveResultSets=False;Connect Timeout=30;Encrypt=True;TrustServerCertificate=True;Packet Size=4096;Command Timeout=0");
            return new AppDbContext(optionsBuilder.Options);
        }
    }
}