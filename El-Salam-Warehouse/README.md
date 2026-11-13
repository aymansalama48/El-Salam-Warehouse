# El-Salam-Warehouse 📦

نظام إدارة مخازن لمصنع كراريس مبني باستخدام **.NET 10** على معمارية **Clean Architecture** ونمط **CQRS** باستخدام مكتبة **MediatR**.

---

## 🏗️ هيكل المشروع (Project Architecture)

المشروع يتبع معمارية الـ Clean Architecture المقسمة إلى 4 طبقات:
- **`El-Salam-Warehouse.Domain`**: الكيانات الأساسية (Entities)، الثوابت (Constants مثل Roles و Permissions)، والأنواع العامة (Results).
- **`El-Salam-Warehouse.Application`**: منطق العمل (CQRS Commands & Queries)، الـ Validators (FluentValidation)، والـ Behaviors (Logging, Validation, Caching).
- **`El-Salam-Warehouse.Infrastructure`**: الاتصال بقاعدة البيانات (EF Core SQL Server)، خدمات الهوية (ASP.NET Identity + JWT)، التخزين المحلي (Local File Storage)، والـ In-Memory Caching.
- **`El-Salam-Warehouse.Api`**: الـ Controllers، الـ Middlewares (Correlation ID, Security Headers, Rate Limiting, Global Exception Handler)، وتوثيق الـ API عبر Scalar/OpenAPI.

---

## 👥 الأدوار والصلاحيات (Roles & RBAC)

يحتوي النظام حالياً على دورين أساسيين:
1. **`Admin`**: يمتلك كامل الصلاحيات في النظام (إدارة المستخدمين، إدارة الأدوار والصلاحيات، إعدادات النظام، وتعديل البروفايل).
2. **`WarehouseKeeper`** (أمين المخزن): يمتلك صلاحيات إدارة حسابه الشخصي فقط حالياً (عرض وتعديل البروفايل، الصورة الشخصية، تغيير كلمة المرور).
   > *ملاحظة:* صلاحيات المخزن (الأصناف، المخزون، أذونات الصرف والاستلام) ستتم إضافتها لاحقاً مع بدء بناء ميزات المخزن.

---

## 🚀 كيفية تشغيل المشروع (How to Run)

### المتطلبات الأساسية
- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [SQL Server](https://www.microsoft.com/sql-server) أو LocalDB

### خطوات التشغيل
1. **استنساخ المستودع (Clone Repository):**
   ```bash
   git clone <repo-url>
   cd El-Salam-Warehouse
   ```

2. **تعديل إعدادات الاتصال (Connection String):**
   افتح ملف `src/El-Salam-Warehouse.Api/appsettings.json` وعدّل مسار قاعدة البيانات إذا لزم الأمر:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost;Database=El_Salam_Warehouse;Trusted_Connection=True;TrustServerCertificate=True"
   }
   ```

3. **بناء المشروع (Build Solution):**
   ```bash
   dotnet build
   ```

4. **تشغيل الاختبارات (Run Tests):**
   ```bash
   dotnet test
   ```

5. **تشغيل الـ API:**
   ```bash
   dotnet run --project src/El-Salam-Warehouse.Api
   ```
   عند أول تشغيل، سيقوم النظام تلقائياً بتطبيق الـ Migrations وعملية الـ Seeding للرولات وحساب الأدمن الافتراضي.

6. **استعراض الـ API:**
   افتح المتصفح على:
   - Scalar Documentation: `https://localhost:7000/scalar/v1` أو الرابط الموضح في التيرمينال.

---

## 🔑 الحساب الافتراضي (Default Admin Seed)

- **البريد الإلكتروني:** `admin@elsalamwarehouse.com`
- **كلمة المرور:** `Admin@123456`
*(يمكن تغيير بيانات الأدمن الافتراضية من قسم `InitialAdmin` في `appsettings.json`)*

