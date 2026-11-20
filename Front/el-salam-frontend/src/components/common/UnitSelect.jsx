import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * مكون قائمة منسدلة مخصصة فائقة الأناقة لاختيار وحدات القياس (كرتونة / رزمة / إلخ)
 * بديل احترافي لقوائم المتصفح الافتراضية
 */
export function UnitSelect({
  value,
  onChange,
  options = [
    { value: 2, label: "كرتونة" },
    { value: 1, label: "رزمة" },
  ],
  theme = "emerald", // "emerald" | "amber" | "blue" | "slate"
  disabled = false,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const themeStyles = {
    emerald: {
      button:
        "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 focus:ring-emerald-400/30",
      activeItem: "bg-emerald-50/80 text-emerald-800 font-extrabold",
      checkIcon: "text-emerald-600",
    },
    amber: {
      button:
        "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-300 focus:ring-amber-400/30",
      activeItem: "bg-amber-50/80 text-amber-900 font-extrabold",
      checkIcon: "text-amber-600",
    },
    blue: {
      button:
        "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 hover:border-blue-300 focus:ring-blue-400/30",
      activeItem: "bg-blue-50/80 text-blue-800 font-extrabold",
      checkIcon: "text-blue-600",
    },
    slate: {
      button:
        "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 hover:border-slate-300 focus:ring-slate-400/30",
      activeItem: "bg-slate-100 text-slate-900 font-extrabold",
      checkIcon: "text-slate-700",
    },
  }[theme] || {
    button: "bg-slate-100 text-slate-800 border-slate-200",
    activeItem: "bg-slate-100 text-slate-900 font-bold",
    checkIcon: "text-slate-700",
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-right ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`h-full flex items-center justify-between gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs select-none focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${themeStyles.button}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate leading-none">{selectedOption?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-70 transition-transform duration-150 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1.5 min-w-[105px] bg-white rounded-xl shadow-xl border border-slate-200/90 py-1 z-[70] animate-in fade-in zoom-in-95 duration-100 text-right backdrop-blur-md"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer text-right ${
                  isSelected
                    ? themeStyles.activeItem
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className={`w-3.5 h-3.5 shrink-0 ${themeStyles.checkIcon}`} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UnitSelect;
