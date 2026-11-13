# مصنع السلام للكراسات والحلول الورقية 📦
### El-Salam Warehouse Management System (WMS)

[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2022-CC292B?logo=microsoftsqlserver)](https://www.microsoft.com/sql-server)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20%2B%20CQRS-blue)](#-معمارية-النظام-system-architecture)

نظام إدارة مخازن رقمي متكامل ومخصص لمصانع الورق والكراريس ومستلزمات الطباعة والتصوير. تم تطوير النظام لضبط وتتبع حركة المخزون الخام والمنتجات التامة، وإصدار أذونات الصرف والتوريد، وتوليد تقارير الجرد ودفتر اليومية المعتمدة رسمياً بصيغة PDF.

---

## 📑 جدول المحتويات
1. [الميزات والوظائف الأساسية](#-الميزات-والوظائف-الأساسية)
2. [معمارية النظام](#-معمارية-النظام-system-architecture)
3. [التقنيات المستخدمة](#-التقنيات-المستخدمة-tech-stack)
4. [هيكل المشروع](#-هيكل-المشروع-project-structure)
5. [متطلبات التشغيل والبدء السريع](#-متطلبات-التشغيل-والبدء-السريع)
6. [بيانات تسجيل الدخول الافتراضية](#-بيانات-تسجيل-الدخول-الافتراضية)
7. [الترخيص](#-الترخيص)

---

## ✨ الميزات والوظائف الأساسية

### 📦 1. إدارة المنتجات والأصناف ووحدات التعبئة الذكية
- دعم التعبئة المزدوجة المخصصة لطبيعة الصناعة الورقية:
  - **الكشاكيل والكراريس:** الحساب التلقائي للقطع، البواكي، والكراتين (مثلاً: 20 باكو، بكل باكو 10 كشاكيل).
  - **ورق التصوير (A4 / A3):** الحساب الدقيق بالكرتونة والرزم (مثلاً: 5 رزم بالكرتونة).
- تتبع ومراقبة **حد النفاذ (الرصيد الحرج)** مع تنبيهات فورية للأصناف التي أوشكت على النفاد.
- بطاقة صنف شاملة تعرض تاريخ الإضافة، آخر تعديل، مكان التخزين، ومحتوى التعبئة مع إمكانية طباعة بطاقة السند والباركود.

### 🗂️ 2. إدارة الفئات والترتيب المتقدم
- تصنيف مرن للمنتجات حسب الأقسام (ورق تصوير، كشاكيل وكراريس، خامات إنتاج، إلخ).
- إمكانية إعادة الترتيب اليدوي للفئات سحباً وإفلاتاً (Drag & Drop Reordering) لحفظ طريقة العرض المفضلة للمستخدم عبر الشاشات.

### 📥📤 3. أذونات الوارد والصرف (Stock Transactions)
- تسجيل حركات التوريد (وارد من صالة الإنتاج، مرتجع، أو مورد خارجي).
- تسجيل حركات الصرف (صرف لصالة الإنتاج، صرف لعميل، تالف/هالك، أو تسوية مخزنية).
- نافذة إضافة بنود متقدمة مزودة بمحرك بحث فوري وقوائم ذكية تمنع التكرار وتسهل إدخال كميات البنود المتعددة بضغطة زر.
- التحقق اللحظي التلقائي من توافر الرصيد الكافي قبل اعتماد أي إذن صرف.

### 📊 4. دفتر اليومية والتقارير الرسمية المعتمدة (QuestPDF)
- توليد تقارير PDF فائقة الجودة تدعم الطباعة الرسمية بمقاس A4 وتضم الترويسة المعتمدة لمصنع السلام.
- فلاتر متقدمة لدفتر اليومية:
  - **نوع الحركة:** وارد فقط، صرف فقط، أو جميع الحركات.
  - **الجهة:** صالة الإنتاج، الجهات الخارجية، أو الكل.
  - **الفئة:** ورق تصوير، كشاكيل، فئات محددة، أو جميع الأصناف.
  - **فترات مرنة:** اليوم، أمس، آخر 7 أيام، هذا الشهر، أو فترة مخصصة من وإلى تاريخ محدد.
- تقرير جرد رسمي للمنتجات التامة مع إحصاءات دقيقة وتوقيعات ثلاثية معتمدة (أمين المخزن - المراجع - المدير العام).

### 🔐 5. الأمان وإدارة الصلاحيات (RBAC)
- مصادقة محمية باستخدام **JWT (JSON Web Tokens)** و **ASP.NET Identity**.
- أدوار مستخدمين محددة:
  - **مدير النظام (Admin):** صلاحيات كاملة لإدارة المستخدمين، الفئات، المنتجات، التقارير والإعدادات.
  - **أمين المخزن (WarehouseKeeper):** إدخال أذونات الصرف والوارد، متابعة الحركات اليومية، وطباعة السندات.
- حماية ضد هجمات الـ XSS و CSRF، وتطبيق Rate Limiting وتسجيل تدقيق تفصيلي للأحداث عبر Serilog.

---

## 🏗️ معمارية النظام (System Architecture)

تم بناء النظام بالكامل وفق مبادئ **Clean Architecture** ونمط **CQRS (Command Query Responsibility Segregation)** لتحقيق أعلى درجات الاستقرار وقابلية التوسع:

```
                  ┌─────────────────────────────────────────┐
                  │       React 19 + Vite Frontend          │
                  │  (Tailwind CSS / Lucide / Axios / UI)   │
                  └────────────────────┬────────────────────┘
                                       │ REST API (HTTPS / JSON)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ASP.NET Core 10 API                             │
│  [Middlewares: Security Headers, Rate Limiting, Exception Handling, Auth]    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Application Layer (CQRS with MediatR & FluentValidation Pipelines)         │
│  - Commands & Handlers (CreateProduct, AddVoucher, UpdateThreshold...)      │
│  - Queries & Handlers (GetDaybookReport, GetProducts, GetCategories...)     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Domain Layer                                                               │
│  - Entities (Product, Category, StockVoucher, StockVoucherItem, User...)    │
│  - Value Objects & Domain Enums (VoucherType, TransactionParty, Units...)   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                                       │
│  - EF Core 10 (SQL Server Persistence & Migrations)                         │
│  - Identity & Token Service (JWT)                                           │
│  - PDF Report Engine (QuestPDF Native Generation)                           │
│  - Local File Storage & Serilog Structured Logging                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 التقنيات المستخدمة (Tech Stack)

### Backend
- **Framework:** .NET 10 (C# 13)
- **Architecture:** Clean Architecture + CQRS + MediatR
- **Database:** Microsoft SQL Server عبر Entity Framework Core 10
- **Validation:** FluentValidation
- **Reporting Engine:** QuestPDF
- **Logging:** Serilog (Console & Rolling File Sinks)
- **Security:** ASP.NET Core Identity + JWT Bearer Tokens

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS + PostCSS
- **Icons:** Lucide React
- **HTTP Client:** Axios (مع Interceptors لإدارة الـ JWT والـ Errors)
- **Routing:** React Router DOM v7
- **Alerts & Modals:** SweetAlert2 + Headless UI Patterns

---

## 📁 هيكل المشروع (Project Structure)

```bash
El-Salam-Warehouse/
├── El-Salam-Warehouse/                 # الباك إند (.NET Clean Architecture)
│   ├── src/
│   │   ├── El-Salam-Warehouse.Domain/          # الكيانات، الثوابت، وقواعد العمل الأساسية
│   │   ├── El-Salam-Warehouse.Application/     # CQRS، الأوامر، الاستعلامات، والـ Validation
│   │   ├── El-Salam-Warehouse.Infrastructure/  # EF Core، Identity، التقارير PDF، والتخزين
│   │   └── El-Salam-Warehouse.Api/             # الـ Controllers، الإعدادات، والـ Middlewares
│   ├── tests/                                  # اختبارات الوحدة والتكامل
│   ├── docs/                                   # وثائق وتصاميم النظام
│   └── El-Salam-Warehouse.slnx                 # ملف Solution للباك إند
│
├── Front/
│   └── el-salam-frontend/              # الفرونت إند (React + Vite)
│       ├── public/                             # الأيقونات والأصول العامة
│       ├── src/
│       │   ├── api/                            # إعدادات الـ Axios وخدمات استدعاء الـ Endpoints
│       │   ├── components/                     # المكونات المشتركة (الجداول، البطاقات، المودالز)
│       │   ├── context/                        # الـ Contexts لإدارة الحالة والمصادقة
│       │   ├── pages/                          # شاشات التطبيق (الرئيسية، المخزون، الحركات، التقارير)
│       │   └── schemas/                        # نماذج التحقق وقواعد الإدخال
│       ├── package.json
│       ├── tailwind.config.js
│       └── vite.config.js
│
├── .gitignore                          # استبعاد ملفات البناء والمخرجات
└── README.md                           # التوثيق الشامل للمشروع
```

---

## 🚀 متطلبات التشغيل والبدء السريع

### المتطلبات المسبقة:
- تثبيت [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- تثبيت [Node.js](https://nodejs.org/) (الإصدار 18 فما فوق) و `npm`
- تثبيت [Microsoft SQL Server](https://www.microsoft.com/sql-server) أو SQL Server Express / LocalDB

---

### 1. تشغيل الباك إند (Backend Setup)

1. ادخل إلى مجلد الباك إند:
   ```bash
   cd El-Salam-Warehouse
   ```

2. تحقق من إعداد سلسلة الاتصال بقاعدة البيانات في ملف `src/El-Salam-Warehouse.Api/appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost;Database=El_Salam_Warehouse;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
   }
   ```

3. بناء وتشغيل المشروع وتطبيق الـ Migrations تلقائياً:
   ```bash
   dotnet restore
   dotnet run --project src/El-Salam-Warehouse.Api
   ```
   *سيعمل الـ API افتراضياً على المنفذ `http://localhost:5271` أو `https://localhost:7052` ويقوم بزراعة الحساب الافتراضي تلقائياً.*

---

### 2. تشغيل الفرونت إند (Frontend Setup)

1. ادخل إلى مجلد الفرونت إند:
   ```bash
   cd Front/el-salam-frontend
   ```

2. تثبيت الحزم والمكتبات:
   ```bash
   npm install
   ```

3. ضبط متغيرات البيئة في ملف `.env` (اختياري، متاح `.env.example` كمرجع):
   ```env
   VITE_API_URL=http://localhost:5271/api/v1
   ```

4. تشغيل خادم التطوير:
   ```bash
   npm run dev
   ```
   *افتح المتصفح على: `http://localhost:5173`*

---

## 🔑 بيانات تسجيل الدخول الافتراضية

عند تشغيل النظام لأول مرة، يقوم الـ Database Seeder بإنشاء حساب المدير الافتراضي التالي:

- **البريد الإلكتروني:** `admin@elsalamwarehouse.com`
- **كلمة المرور:** `Admin@123456`
- **الدور:** `Admin` (كامل الصلاحيات)

> 💡 *يمكن تخصيص بيانات المدير من قسم `InitialAdmin` داخل ملف `appsettings.json` قبل أول تشغيل.*

---

## 📄 الترخيص
تم تطوير هذا المشروع لصالح **مصنع السلام للكراسات والحلول الورقية** © 2026. جميع الحقوق محفوظة.
