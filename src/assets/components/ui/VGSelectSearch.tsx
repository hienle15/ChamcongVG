// src/components/ui/VGSelectSearch.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaSearch } from "react-icons/fa";

export type VGOption = {
  value: string | number;
  label: string;
  raw?: any;
};

type Props = {
  value?: string | number | null;
  onChange?: (value: VGOption | null) => void;
  loadOptions?: (keyword: string) => Promise<VGOption[]> | VGOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;

  /** dùng để hiển thị label khi value được set từ code */
  getOptionByValue?: (value: string | number) => VGOption | null;

  /** NEW: custom render cho dropdown list */
  renderOption?: (opt: VGOption) => React.ReactNode;

  /** NEW: render dropdown ra ngoài container để không bị overflow cắt */
  portal?: boolean; // default true
};

type DropdownPos = {
  top: number;
  left: number;
  width: number;
};

export default function VGSelectSearch({
  value,
  onChange,
  loadOptions,
  placeholder = "Chọn...",
  disabled = false,
  className = "",
  getOptionByValue,
  renderOption,
  portal = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [options, setOptions] = useState<VGOption[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedOption, setSelectedOption] = useState<VGOption | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [pos, setPos] = useState<DropdownPos | null>(null);

  /* ================= SYNC LABEL THEO VALUE (VÀ CLEAR KHI value NULL/"") ================= */
  useEffect(() => {
    if (value === null || value === undefined || String(value) === "") {
      if (selectedOption !== null) setSelectedOption(null);
      return;
    }

    if (selectedOption && String(selectedOption.value) === String(value)) return;

    if (!getOptionByValue) return;
    const opt = getOptionByValue(value);
    if (opt) setSelectedOption(opt);
  }, [value, getOptionByValue, selectedOption]);

  /* ================= LOAD OPTIONS ================= */
  useEffect(() => {
    if (!open) return;
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const result = loadOptions ? await loadOptions(keyword) : [];
        if (!mounted) return;

        const list = Array.isArray(result) ? result : [];
        setOptions(list);

        const matched = list.find((o) => String(o.value) === String(value));
        if (matched) setSelectedOption(matched);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [open, keyword, loadOptions, value]);

  /* ================= POSITION (PORTAL) ================= */
  const computePos = () => {
    const btn = buttonRef.current;
    if (!btn) return;

    const r = btn.getBoundingClientRect();
    setPos({
      top: r.bottom + window.scrollY,
      left: r.left + window.scrollX,
      width: r.width,
    });
  };

  useEffect(() => {
    if (!open) return;
    computePos();

    const onWin = () => computePos();
    window.addEventListener("scroll", onWin, true);
    window.addEventListener("resize", onWin);

    return () => {
      window.removeEventListener("scroll", onWin, true);
      window.removeEventListener("resize", onWin);
    };
  }, [open]);

  /* ================= CLICK OUTSIDE (CLOSE) ================= */
  useEffect(() => {
    if (!open) return;

    const handler = (e: MouseEvent) => {
      const w = wrapperRef.current;
      if (w && w.contains(e.target as Node)) return;

      // nếu portal, dropdown nằm ngoài wrapper => cần check thêm vùng dropdown (id)
      const dropdownEl = document.getElementById("vg-selectsearch-dropdown");
      if (dropdownEl && dropdownEl.contains(e.target as Node)) return;

      setOpen(false);
    };

    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const selectOption = (opt: VGOption) => {
    if (String(opt.value) === "") {
      setSelectedOption(null);
      onChange?.(null);
      setOpen(false);
      setKeyword("");
      return;
    }

    setSelectedOption(opt);
    onChange?.(opt);
    setOpen(false);
    setKeyword("");
  };

  const dropdown = useMemo(() => {
    const body = (
      <div
        id="vg-selectsearch-dropdown"
        className="rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-2 px-2 py-2 border-b border-slate-200 bg-slate-50">
          <FaSearch className="text-slate-500 text-xs" />
          <input
            autoFocus
            type="text"
            placeholder="Tìm kiếm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>

        <div className="max-h-60 overflow-auto">
          {loading && (
            <div className="px-3 py-2 text-sm text-slate-500">Đang tải...</div>
          )}

          {!loading && options.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">
              Không có dữ liệu
            </div>
          )}

          {options.map((o, idx) => (
            <button
              key={`${o.value}-${idx}`}
              type="button"
              onMouseDown={() => selectOption(o)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center
                ${selectedOption &&
                  String(selectedOption.value) === String(o.value)
                  ? "bg-slate-100 font-medium"
                  : ""
                }`}
            >
              {renderOption ? renderOption(o) : o.label}
            </button>
          ))}
        </div>
      </div>
    );

    if (!portal) {
      return (
        <div className="absolute left-0 right-0 z-50 mt-1">{body}</div>
      );
    }

    if (!pos) return null;

    return createPortal(
      <div
        style={{
          position: "absolute",
          top: pos.top + 4,
          left: pos.left,
          width: pos.width,
          zIndex: 99999,
        }}
      >
        {body}
      </div>,
      document.body
    );
  }, [portal, pos, keyword, loading, options, selectedOption]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* BUTTON */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          setKeyword("");
        }}
        className={`h-[38px] w-full rounded-lg border border-slate-200 bg-[#f8fafc] px-[10px] text-left text-[13px] flex items-center justify-between transition-all outline-none
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-slate-300"}
          ${open ? "ring-2 ring-blue-100 border-[#0052CC]" : ""}
        `}
      >
        <span className={selectedOption ? "text-slate-900 font-medium" : "text-slate-400"}>
          {selectedOption?.label ?? placeholder}
        </span>
        <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {/* DROPDOWN */}
      {open && dropdown}
    </div>
  );
}
