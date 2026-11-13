using El_Salam_Warehouse.Application.Common.Abstractions.Reports;
using El_Salam_Warehouse.Domain.Entities.Products;
using El_Salam_Warehouse.Domain.Entities.StockVouchers;
using El_Salam_Warehouse.Domain.Enums;
using Microsoft.Extensions.Configuration;
using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;

namespace El_Salam_Warehouse.Infrastructure.Reports;

// بيرسم التقارير كـ PDF بمكتبة QuestPDF (عربي RTL)
public sealed class QuestPdfReportGenerator : IReportGenerator
{
    // اسم الخط
    private const string FontFamily = "Cairo";

    // أسماء الأيام بالعربي (الأحد = 0)
    private static readonly string[] ArabicDays =
        { "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت" };

    // اسم المصنع في رأس التقرير
    private readonly El_Salam_Warehouse.Application.Common.Abstractions.Settings.ISettingsService _settingsService;

    // تسجيل الترخيص والخطوط مرة واحدة
    static QuestPdfReportGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var fontsDir = Path.Combine(AppContext.BaseDirectory, "Reports", "Fonts");
        if (!Directory.Exists(fontsDir)) return;

        foreach (var file in Directory.GetFiles(fontsDir, "*.ttf"))
        {
            using var stream = File.OpenRead(file);
            FontManager.RegisterFontFromStream(stream);   // <-- الاسم الجديد
        }
    }

    // كونستركتور
    public QuestPdfReportGenerator(El_Salam_Warehouse.Application.Common.Abstractions.Settings.ISettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    // ===================== تقرير دفتر اليومية =====================

    public byte[] GenerateDaybookReport(DaybookReportModel model)
    {
        var subtitle = $"{model.ReportTypeTitle} - ";
        if (!string.IsNullOrWhiteSpace(model.FilterDetails))
        {
            subtitle += $"{model.FilterDetails} - ";
        }

        subtitle += model.FromDate == model.ToDate
            ? $"عن يوم {FormatDate(model.FromDate)}"
            : $"عن الفترة من {FormatDate(model.FromDate)} إلى {FormatDate(model.ToDate)}";

        return Build("تقرير دفتر اليومية", subtitle, model.PrintedAtCairo, landscape: false, content =>
        {
            content.Column(col =>
            {
                col.Spacing(12);

                // لو مفيش حركات
                if (model.Days.Count == 0)
                {
                    col.Item().PaddingVertical(30).AlignCenter()
                        .Text("لا توجد حركات مسجلة مطابقة لشروط الفلترة المحددة في هذه الفترة.").FontSize(11);
                }

                // جدول لكل يوم
                foreach (var day in model.Days)
                {
                    col.Item().Element(c => DayTable(c, day));
                }

                col.Item().Element(Signatures);
            });
        });
    }

    // جدول يوم واحد
    private static void DayTable(IContainer container, DaybookReportDay day)
    {
        container.Column(col =>
        {
            col.Item().Background(Colors.Blue.Lighten5).Padding(5)
                .Text($"{ArabicDays[(int)day.Date.DayOfWeek]}  {FormatDate(day.Date)}").Bold();

            col.Item().Table(table =>
            {
                table.ColumnsDefinition(c =>
                {
                    c.ConstantColumn(26);    // م
                    c.ConstantColumn(85);    // رقم الإذن
                    c.RelativeColumn(1.3f);  // الصنف
                    c.RelativeColumn(1f);    // الجهة / المصدر
                    c.ConstantColumn(120);   // الكمية
                    c.ConstantColumn(45);    // النوع
                });

                table.Header(h =>
                {
                    foreach (var title in new[] { "م", "رقم الإذن", "الصنف", "الجهة / المصدر", "الكمية", "النوع" })
                        h.Cell().Element(HeaderCell).Text(title);
                });

                var index = 1;
                foreach (var r in day.Rows)
                {
                    var isInbound = r.Type == StockVoucherType.Inbound;
                    var isReturn = r.Type == StockVoucherType.Return;

                    string qtyDisplay = $"{Num(r.Quantity)} {r.UnitLabel}";

                    table.Cell().Element(BodyCell).Text(index++.ToString());
                    table.Cell().Element(BodyCell).Text(r.VoucherNumber).FontSize(8);
                    table.Cell().Element(TextCell).Text(r.ProductName);
                    table.Cell().Element(TextCell).Text(string.IsNullOrWhiteSpace(r.Party) ? "-" : r.Party);
                    table.Cell().Element(BodyCell).Text(qtyDisplay);
                    table.Cell().Element(BodyCell)
                        .Text(isReturn ? "مرتجع" : (isInbound ? "وارد" : "صرف"))
                        .Bold()
                        .FontColor(isReturn ? Colors.Orange.Darken2 : (isInbound ? Colors.Green.Darken2 : Colors.Red.Darken2));
                }
            });
        });
    }

    // ===================== تقرير جرد المنتجات =====================

    public byte[] GenerateProductsReport(ProductsReportModel model)
    {
        var allRows = model.Groups.SelectMany(g => g.Rows).ToList();

        return Build("تقرير جرد المنتجات التامة", $"الفئة: {model.CategoryTitle}", model.PrintedAtCairo,
            landscape: false, content =>
            {
                content.Column(col =>
                {
                    col.Spacing(12);

                    if (allRows.Count == 0)
                    {
                        col.Item().PaddingVertical(30).AlignCenter()
                            .Text("لا توجد أصناف مسجلة.").FontSize(11);
                    }
                    else
                    {
                        // جدول كامل وموحد لجميع الأصناف دون فصل بالفئات
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.ConstantColumn(28);    // م
                                c.RelativeColumn();      // اسم المنتج أو الصنف
                                c.ConstantColumn(200);   // إجمالي الرصيد
                                c.ConstantColumn(60);    // الحالة
                            });

                            table.Header(h =>
                            {
                                foreach (var title in new[]
                                {
                                    "م",
                                    "اسم المنتج أو الصنف",
                                    "إجمالي الرصيد",
                                    "الحالة"
                                })
                                    h.Cell().Element(HeaderCell).Text(title);
                            });

                            var index = 1;
                            foreach (var r in allRows)
                            {
                                var statusColor = r.StatusLabel switch
                                {
                                    "نفد" => Colors.Red.Darken2,
                                    "منخفض" => Colors.Orange.Darken2,
                                    _ => Colors.Green.Darken2
                                };

                                string stockDisplay;
                                if (r.SubUnit == "رزمة" || r.BaseUnit == "كرتونة")
                                {
                                    if (r.RemainingSubUnits > 0)
                                        stockDisplay = $"{Num(r.FullBaseUnits)} كرتونة و {Num(r.RemainingSubUnits)} رزمة";
                                    else
                                        stockDisplay = $"{Num(r.FullBaseUnits)} كرتونة";
                                }
                                else
                                {
                                    stockDisplay = $"{Num(r.TotalSubUnitStock)} {r.SubUnit}";
                                }

                                table.Cell().Element(BodyCell).Text(index++.ToString());
                                table.Cell().Element(TextCell).Text(r.Name);
                                table.Cell().Element(BodyCell).Text(stockDisplay);
                                table.Cell().Element(BodyCell).Text(r.StatusLabel).Bold().FontColor(statusColor);
                            }
                        });
                    }

                    col.Item().Element(Signatures);
                });
            });
    }

    // ===================== طباعة بطاقة تعريف صنف / منتج تام =====================

    public byte[] GenerateProductCardPdf(ProductCardPdfModel model)
    {
        var title = "بطاقة تعريف ومواصفات صنف تام الصنع";
        var subtitle = $"كود الصنف: #{model.ProductId.ToString().Substring(0, 8).ToUpper(CultureInfo.InvariantCulture)} | فئة: {model.CategoryName}";

        return Build(title, subtitle, model.PrintedAtCairo, landscape: false, content =>
        {
            content.Column(col =>
            {
                col.Spacing(12);

                // 1. عنوان الصنف والفئة
                col.Item().Border(1.2f).BorderColor(Colors.Blue.Darken2).Background(Colors.Blue.Lighten5).Padding(12).Row(r =>
                {
                    r.RelativeItem().Column(c =>
                    {
                        c.Item().Text("اسم المنتج أو الصنف التام:").FontSize(9).FontColor(Colors.Grey.Darken2);
                        c.Item().Text(model.Name).FontSize(16).Bold().FontColor(Colors.Blue.Darken3);
                    });

                    r.ConstantItem(140).AlignLeft().Column(c =>
                    {
                        c.Item().Text("فئة وتصنيف المنتج:").FontSize(9).FontColor(Colors.Grey.Darken2);
                        c.Item().Text(model.CategoryName).FontSize(12).Bold().FontColor(Colors.Grey.Darken3);
                    });
                });

                // 2. شبكة المواصفات والأرصدة الحالية
                col.Item().Column(specCol =>
                {
                    specCol.Spacing(8);

                    // الصف الأول: محتوى التعبئة ورصيد الوحدة الكبرى
                    specCol.Item().Row(r =>
                    {
                        r.Spacing(8);
                        r.RelativeItem().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten5).Padding(8).Column(c =>
                        {
                            c.Item().Text("محتوى الباكو / الكرتونة (الوحدة الكبرى):").FontSize(8).FontColor(Colors.Grey.Darken2);
                            c.Item().PaddingTop(2).Text($"{model.UnitsPerBaseUnit} {model.SubUnit} بال{model.BaseUnit}").FontSize(11).Bold();
                        });

                        r.RelativeItem().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten5).Padding(8).Column(c =>
                        {
                            c.Item().Text($"الرصيد الحالي بال{model.BaseUnit}:").FontSize(8).FontColor(Colors.Grey.Darken2);
                            c.Item().PaddingTop(2).Text($"{Num(model.FullBaseUnits)} {model.BaseUnit}" + (model.RemainingSubUnits > 0 ? $" و {model.RemainingSubUnits} {model.SubUnit}" : "")).FontSize(11).Bold();
                        });
                    });

                    // الصف الثاني: إجمالي الرصيد وحالة المخزون
                    specCol.Item().Row(r =>
                    {
                        r.Spacing(8);
                        r.RelativeItem().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten5).Padding(8).Column(c =>
                        {
                            c.Item().Text($"إجمالي الرصيد بال{model.SubUnit}:").FontSize(8).FontColor(Colors.Grey.Darken2);
                            var totalStockText = model.SubUnit == "رزمة" || model.BaseUnit == "كرتونة"
                                ? $"{Num(model.TotalSubUnits)} رزمة ({Num(model.FullBaseUnits)} كرتونة)"
                                : $"{Num(model.TotalSubUnits)} {model.SubUnit}";
                            c.Item().PaddingTop(2).Text(totalStockText).FontSize(11).Bold().FontColor(Colors.Green.Darken3);
                        });

                        var statusColor = model.StatusLabel switch
                        {
                            "نفد" => Colors.Red.Darken2,
                            "منخفض" => Colors.Orange.Darken2,
                            _ => Colors.Green.Darken2
                        };

                        r.RelativeItem().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten5).Padding(8).Column(c =>
                        {
                            c.Item().Text("حالة وفرة المخزون:").FontSize(8).FontColor(Colors.Grey.Darken2);
                            c.Item().PaddingTop(2).Text(model.StatusLabel).FontSize(11).Bold().FontColor(statusColor);
                        });
                    });

                    // الصف الثالث: مكان التخزين ومسجل الصنف
                    specCol.Item().Row(r =>
                    {
                        r.Spacing(8);
                        r.RelativeItem().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten5).Padding(8).Column(c =>
                        {
                            c.Item().Text("مكان التخزين المعتمد بالمستودع:").FontSize(8).FontColor(Colors.Grey.Darken2);
                            c.Item().PaddingTop(2).Text(string.IsNullOrWhiteSpace(model.StorageLocation) ? "المستودع الرئيسي" : model.StorageLocation).FontSize(10).Bold();
                        });

                        r.RelativeItem().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten5).Padding(8).Column(c =>
                        {
                            c.Item().Text("أضيف بواسطة المسؤول:").FontSize(8).FontColor(Colors.Grey.Darken2);
                            c.Item().PaddingTop(2).Text(model.CreatedByName).FontSize(10).Bold();
                        });
                    });
                });

                // 3. صندوق التواريخ وتفاصيل الاعتماد
                col.Item().Border(0.8f).BorderColor(Colors.Grey.Lighten2).Padding(8).Row(r =>
                {
                    r.RelativeItem().Text($"تاريخ الإضافة والاعتماد: {model.CreatedAtCairo?.ToString("yyyy/MM/dd HH:mm", CultureInfo.InvariantCulture) ?? "-"}").FontSize(8.5f).FontColor(Colors.Grey.Darken2);
                    if (model.UpdatedAtCairo.HasValue)
                    {
                        r.RelativeItem().AlignLeft().Text($"آخر تحديث للبيانات: {model.UpdatedAtCairo.Value.ToString("yyyy/MM/dd HH:mm", CultureInfo.InvariantCulture)} بواسطة {model.UpdatedByName ?? "-"}").FontSize(8.5f).FontColor(Colors.Grey.Darken2);
                    }
                });

                // 4. ملاحظة المواصفات الفنية المعتمدة
                col.Item().Background(Colors.Grey.Lighten4).Border(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(8).Text(
                    "ملاحظة الجودة والتعبئة: مواصفات التعبئة والتغليف معتمدة رسمياً من صالة الإنتاج والتجليد (الباكو يحتوي على العدد المحدد من الفئة المسجلة) ومطابقة لمعايير المستودع المركزي.")
                    .FontSize(8.5f).FontColor(Colors.Grey.Darken3);

                // 5. التوقيعات الرسمية
                Signatures(col.Item());
            });
        });
    }

    // ===================== طباعة سند إذن المخزن =====================

    public byte[] GenerateStockVoucherPdf(StockVoucherPdfModel model)
    {
        var isInbound = model.Type == StockVoucherType.Inbound;
        var isReturn = model.Type == StockVoucherType.Return;
        var isCancelled = model.Status == StockVoucherStatus.Cancelled;

        var title = isReturn
            ? (model.ReturnDirection == ReturnDirection.Outbound ? "إذن رد بضاعة مرتجعة (منصرف)" : "إذن استلام بضاعة مرتجعة (وارد)")
            : (isInbound ? "إذن استلام وارد مخزني" : "إذن صرف بضاعة من المخزن");
        var subtitle = $"رقم الإذن: {model.VoucherNumber} | تاريخ الإذن: {FormatDate(model.VoucherDate)}";

        return Build(title, subtitle, model.OccurredAtCairo, landscape: false, content =>
        {
            content.Column(col =>
            {
                col.Spacing(10);

                // 1. شارة حالة الإذن وشارة الإلغاء إذا وجد
                if (isCancelled)
                {
                    col.Item().Border(1.2f).BorderColor(Colors.Red.Medium).Background(Colors.Red.Lighten5).Padding(8).Column(c =>
                    {
                        c.Item().Text($"تنبيه: هذا الإذن ملغي رسمياً بتاريخ {model.CancelledAtCairo?.ToString("yyyy/MM/dd HH:mm", CultureInfo.InvariantCulture) ?? "-"} بواسطة {model.CancelledByName ?? "-"}")
                            .Bold().FontColor(Colors.Red.Darken2).FontSize(10);
                        if (!string.IsNullOrWhiteSpace(model.CancellationReason))
                        {
                            c.Item().PaddingTop(2).Text($"سبب الإلغاء: {model.CancellationReason}").FontSize(9).FontColor(Colors.Red.Darken3);
                        }
                    });
                }

                // شارة سبب المرتجع إذا كان إذن مرتجع
                if (isReturn && !string.IsNullOrWhiteSpace(model.ReturnReason))
                {
                    col.Item().Border(1.2f).BorderColor(Colors.Orange.Medium).Background(Colors.Orange.Lighten5).Padding(7).Row(r =>
                    {
                        r.RelativeItem().Text($"بيان وسبب المرتجع: {model.ReturnReason}").Bold().FontSize(9.5f).FontColor(Colors.Orange.Darken3);
                    });
                }

                // 2. بطاقات بيانات أطراف الإذن
                col.Item().Row(row =>
                {
                    row.Spacing(8);

                    // الطرف الأول (الجهة)
                    row.RelativeItem().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten5).Padding(6).Column(c =>
                    {
                        var partyLabel = isReturn
                            ? (model.ReturnDirection == ReturnDirection.Outbound ? "الجهة المرتجع إليها (المورّد)" : "الجهة المرتجع منها (العميل)")
                            : (isInbound ? "جهة التوريد / المصدر" : "الجهة المستلمة (العميل)");
                        c.Item().Text(partyLabel).FontSize(8).FontColor(Colors.Grey.Darken2);
                        c.Item().Text(model.PartyName).Bold().FontSize(10);
                    });

                    // الطرف الثاني (المستلم والمورّد)
                    row.RelativeItem().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten5).Padding(6).Column(c =>
                    {
                        var receiverLabel = isReturn
                            ? (model.ReturnDirection == ReturnDirection.Outbound ? "القائم بالصرف (أمين المخزن)" : "المستلم (أمين المخزن)")
                            : (isInbound ? "المستلم (أمين المخزن)" : "المستلم الفعلي");
                        c.Item().Text(receiverLabel).FontSize(8).FontColor(Colors.Grey.Darken2);
                        c.Item().Text(model.ReceiverName).Bold().FontSize(10);

                        if (!string.IsNullOrWhiteSpace(model.DelivererName))
                        {
                            var delivererLabel = isReturn ? "مندوب الإرجاع / السائق: " : "المسلّم: ";
                            c.Item().PaddingTop(2).Text($"{delivererLabel}{model.DelivererName}").FontSize(8).FontColor(Colors.Grey.Darken3);
                        }
                    });

                    // الطرف الثالث (التوثيق والاعتماد)
                    row.RelativeItem().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten5).Padding(6).Column(c =>
                    {
                        c.Item().Text("أنشئ واعتمد بواسطة").FontSize(8).FontColor(Colors.Grey.Darken2);
                        c.Item().Text(model.CreatedByName).Bold().FontSize(10);
                        c.Item().PaddingTop(2).Text(isCancelled ? "الحالة: ملغي ومستبعد" : "الحالة: معتمد وفعال")
                            .Bold().FontSize(8).FontColor(isCancelled ? Colors.Red.Darken2 : Colors.Green.Darken2);
                    });
                });

                // 3. الملاحظات إذا وجدت
                if (!string.IsNullOrWhiteSpace(model.Notes))
                {
                    col.Item().Border(0.6f).BorderColor(Colors.Blue.Lighten3).Background(Colors.Blue.Lighten5).Padding(6).Row(r =>
                    {
                        r.RelativeItem().Text($"ملاحظات وبيان الإذن: {model.Notes}").FontSize(8.5f).FontColor(Colors.Blue.Darken3);
                    });
                }

                // 4. جدول الأصناف والبنود
                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.ConstantColumn(24);   // م
                        cols.RelativeColumn(3);    // اسم الصنف
                        cols.RelativeColumn(1.5f); // الفئة
                        cols.RelativeColumn(2);    // الكمية بالإذن
                        cols.RelativeColumn(2.5f); // بالباكو / الكرتونة
                        cols.RelativeColumn(2);    // إجمالي بالقطعة/الرزمة
                    });

                    table.Header(h =>
                    {
                        h.Cell().Element(HeaderCell).Text("#");
                        h.Cell().Element(HeaderCell).Text("اسم الصنف أو المنتج");
                        h.Cell().Element(HeaderCell).Text("فئة المنتج");
                        h.Cell().Element(HeaderCell).Text("الكمية بالإذن");
                        h.Cell().Element(HeaderCell).Text("بالباكو / الكرتونة");
                        h.Cell().Element(HeaderCell).Text("إجمالي بالقطعة/الرزمة");
                    });

                    foreach (var it in model.Items)
                    {
                        table.Cell().Element(BodyCell).Text(it.Index.ToString());
                        table.Cell().Element(TextCell).Text(it.ProductName).Bold();
                        table.Cell().Element(BodyCell).Text(it.CategoryName);
                        table.Cell().Element(BodyCell).Text($"{Num(it.Quantity)} {it.UnitLabel}").Bold();

                        var baseStockText = it.RemainingSubUnits > 0
                            ? $"{Num(it.FullBaseUnits)} {it.BaseUnit} و {it.RemainingSubUnits} {it.SubUnit}"
                            : $"{Num(it.FullBaseUnits)} {it.BaseUnit}";
                        table.Cell().Element(BodyCell).Text(baseStockText);

                        var totalSubText = it.SubUnit == "رزمة" || it.BaseUnit == "كرتونة"
                            ? $"{Num(it.TotalSubUnits)} رزمة ({Num(it.FullBaseUnits)} كرتونة)"
                            : $"{Num(it.TotalSubUnits)} {it.SubUnit}";
                        table.Cell().Element(BodyCell).Text(totalSubText);
                    }
                });

                // 5. التوقيعات الرسمية في أسفل السند
                col.Item().ShowEntire().PaddingTop(25).Row(row =>
                {
                    row.Spacing(24);

                    var sig1 = isReturn
                        ? (model.ReturnDirection == ReturnDirection.Outbound ? "توقيع أمين المخزن المنصرف" : "توقيع أمين المخزن المستلم")
                        : (isInbound ? "توقيع أمين المخزن المستلم" : "توقيع أمين المخزن المنصرف");
                    var sig2 = isReturn
                        ? (model.ReturnDirection == ReturnDirection.Outbound ? "توقيع مندوب الاستلام (المورّد)" : "توقيع مندوب الإرجاع / العميل")
                        : (isInbound ? "توقيع مندوب صالة الإنتاج / المورّد" : "توقيع المستلم / العميل");
                    var sig3 = "اعتماد مدير المخازن والتشغيل";

                    foreach (var sigTitle in new[] { sig1, sig2, sig3 })
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().AlignCenter().Text(sigTitle).Bold().FontSize(9);
                            c.Item().PaddingTop(24).LineHorizontal(0.6f).LineColor(Colors.Grey.Darken1);
                        });
                    }
                });
            });
        });
    }

    // ===================== مشترك =====================

    // هيكل الصفحة (رأس + محتوى + رقم الصفحة)
    private byte[] Build(string title, string subtitle, DateTime printedAt, bool landscape, Action<IContainer> content)
    {
        return Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(landscape ? PageSizes.A4.Landscape() : PageSizes.A4);
                page.Margin(28);
                page.ContentFromRightToLeft();
                page.DefaultTextStyle(x => x.FontFamily(FontFamily).FontSize(10));

                page.Header().Element(h => ComposeHeader(h, title, subtitle, printedAt));
                page.Content().PaddingVertical(10).Element(content);

                page.Footer().AlignCenter().Text(t =>
                {
                    t.DefaultTextStyle(x => x.FontSize(9).FontColor(Colors.Grey.Darken1));
                    t.Span("صفحة ");
                    t.CurrentPageNumber();
                    t.Span(" من ");
                    t.TotalPages();
                });
            });
        }).GeneratePdf();
    }

    // رأس التقرير: اسم المصنع + العنوان + تاريخ الطباعة
    private void ComposeHeader(IContainer container, string title, string subtitle, DateTime printedAt)
    {
        var settings = _settingsService.GetCachedSettings();
        var companyName = !string.IsNullOrWhiteSpace(settings?.WarehouseName) ? settings.WarehouseName : "مصنع السلام";
        var companySubtitle = !string.IsNullOrWhiteSpace(settings?.Subtitle) ? settings.Subtitle : null;
        var logoBytes = _settingsService.GetCachedLogoBytes();

        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                if (logoBytes != null && logoBytes.Length > 0)
                {
                    row.ConstantItem(50).Height(50).Image(logoBytes).FitArea();
                    row.ConstantItem(12);
                }

                row.RelativeItem().Column(c =>
                {
                    c.Item().Text(companyName).FontSize(16).Bold();
                    if (!string.IsNullOrWhiteSpace(companySubtitle))
                    {
                        c.Item().Text(companySubtitle).FontSize(9).FontColor(Colors.Grey.Darken1);
                    }
                    c.Item().Text(title).FontSize(13).Bold().FontColor(Colors.Blue.Darken3);
                    c.Item().Text(subtitle).FontSize(10).FontColor(Colors.Grey.Darken2);
                });

                row.ConstantItem(130).AlignLeft().Text(
                    $"تاريخ الطباعة\n{printedAt.ToString("yyyy/MM/dd HH:mm", CultureInfo.InvariantCulture)}")
                    .FontSize(8).FontColor(Colors.Grey.Darken2);
            });

            col.Item().PaddingTop(6).LineHorizontal(1.2f).LineColor(Colors.Blue.Darken3);
        });
    }

    // مربع رقم في الملخص
    private static void SummaryBox(IContainer container, string label, string value)
    {
        container
            .Border(0.8f).BorderColor(Colors.Grey.Lighten1)
            .Background(Colors.Grey.Lighten5)
            .Padding(6)
            .Column(c =>
            {
                c.Item().AlignCenter().Text(label).FontSize(8).FontColor(Colors.Grey.Darken2);
                c.Item().AlignCenter().Text(value).FontSize(12).Bold();
            });
    }

    // خانات التوقيعات في آخر التقرير
    private static void Signatures(IContainer container)
    {
        container.ShowEntire().PaddingTop(30).Row(row =>
        {
            row.Spacing(30);

            foreach (var title in new[] { "أمين المخزن", "المراجع", "المدير" })
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().AlignCenter().Text(title).Bold();
                    c.Item().PaddingTop(28).LineHorizontal(0.6f).LineColor(Colors.Grey.Darken1);
                });
            }
        });
    }

    // خلية عنوان الجدول
    private static IContainer HeaderCell(IContainer c) => c
        .Border(0.5f).BorderColor(Colors.Grey.Medium)
        .Background(Colors.Grey.Lighten3)
        .Padding(4).AlignCenter().AlignMiddle()
        .DefaultTextStyle(x => x.Bold().FontSize(9));

    // خلية بيانات (في النص)
    private static IContainer BodyCell(IContainer c) => c
        .Border(0.5f).BorderColor(Colors.Grey.Lighten1)
        .Padding(4).AlignCenter().AlignMiddle()
        .DefaultTextStyle(x => x.FontSize(9));

    // خلية نص (على اليمين)
    private static IContainer TextCell(IContainer c) => c
        .Border(0.5f).BorderColor(Colors.Grey.Lighten1)
        .Padding(4).AlignRight().AlignMiddle()
        .DefaultTextStyle(x => x.FontSize(9));

    // رقم بفاصلة الآلاف (1,200)
    private static string Num(int value) => value.ToString("N0", CultureInfo.InvariantCulture);

    // تاريخ بصيغة 2026/11/02
    private static string FormatDate(DateOnly date) => date.ToString("yyyy/MM/dd", CultureInfo.InvariantCulture);
}