import { useEffect, useId, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import {
  CURRENCIES,
  MAX_INFLATION,
  SAVINGS_METHODS,
  clampInflation,
  formatMoney,
  isCurrencyCode,
  isSavingsMethod,
  methodMeta,
  type AppPrefs,
} from "@/lib/prefs";

type Props = {
  prefs: AppPrefs;
  disabled?: boolean;
  onChange: (next: AppPrefs) => void;
};

/** Pengaturan lanjutan yang dipakai Kalkulator Tabungan. */
export function AdvancedSettings({ prefs, disabled = false, onChange }: Props) {
  const id = useId();
  const [inflationDraft, setInflationDraft] = useState(String(prefs.inflation));
  const [error, setError] = useState("");

  useEffect(() => {
    setInflationDraft(String(prefs.inflation));
  }, [prefs.inflation]);

  const commitInflation = (raw: string) => {
    const cleaned = raw.trim().replace(",", ".");
    if (!cleaned) {
      setError("Tingkat inflasi wajib diisi.");
      return;
    }
    if (!/^\d{1,3}(\.\d{1,1})?$/.test(cleaned)) {
      setError("Gunakan angka, maksimal satu desimal. Contoh: 3.5");
      return;
    }
    const value = Number(cleaned);
    if (value > MAX_INFLATION) {
      setError(`Maksimal ${MAX_INFLATION}% per tahun.`);
      return;
    }
    setError("");
    onChange({ ...prefs, inflation: clampInflation(value) });
  };

  return (
    <section aria-label="Pengaturan lanjutan" className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
        <SlidersHorizontal className="size-4" aria-hidden="true" /> Pengaturan Lanjutan
      </h2>
      <p className="mt-1 text-[11px] text-slate-500">
        Mata uang, inflasi, dan metode hitung ini langsung dipakai di Kalkulator Tabungan.
      </p>

      <label htmlFor={`${id}-currency`} className="mt-4 block text-xs font-semibold text-slate-800">
        Mata uang
      </label>
      <select
        id={`${id}-currency`}
        value={prefs.currency}
        disabled={disabled}
        onChange={(e) => {
          const value = e.target.value;
          if (isCurrencyCode(value)) onChange({ ...prefs, currency: value });
        }}
        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-slate-800 focus-visible:ring-2 focus-visible:ring-slate-800/20 disabled:opacity-60"
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>

      <label
        htmlFor={`${id}-inflation`}
        className="mt-4 block text-xs font-semibold text-slate-800"
      >
        Tingkat inflasi tahunan (%)
      </label>
      <input
        id={`${id}-inflation`}
        inputMode="decimal"
        autoComplete="off"
        maxLength={5}
        value={inflationDraft}
        disabled={disabled}
        onChange={(e) => {
          setInflationDraft(e.target.value.slice(0, 5));
          setError("");
        }}
        onBlur={(e) => commitInflation(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitInflation(inflationDraft);
          }
        }}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-inflation-error` : `${id}-inflation-hint`}
        className={`mt-1 min-h-11 w-full rounded-xl border bg-slate-50 px-3 text-sm text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-slate-800/20 disabled:opacity-60 ${
          error ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-slate-800"
        }`}
      />
      {error ? (
        <p
          id={`${id}-inflation-error`}
          role="alert"
          className="mt-1 text-[11px] font-semibold text-rose-500"
        >
          {error}
        </p>
      ) : (
        <p id={`${id}-inflation-hint`} className="mt-1 text-[11px] text-slate-500">
          Target tabungan dinaikkan mengikuti inflasi ini, jadi nilainya tetap realistis.
        </p>
      )}

      <fieldset className="mt-4" disabled={disabled}>
        <legend className="text-xs font-semibold text-slate-800">Metode hitung tabungan</legend>
        <div className="mt-2 space-y-2">
          {SAVINGS_METHODS.map((m) => (
            <label
              key={m.id}
              className="flex cursor-pointer items-start gap-2 rounded-xl bg-slate-50 p-3 focus-within:ring-2 focus-within:ring-slate-800/20"
            >
              <input
                type="radio"
                name={`${id}-method`}
                value={m.id}
                checked={prefs.method === m.id}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isSavingsMethod(value)) onChange({ ...prefs, method: value });
                }}
                className="mt-0.5 size-4 accent-slate-800"
              />
              <span>
                <span className="block text-xs font-bold text-slate-800">{m.label}</span>
                <span className="block text-[11px] text-slate-500">{m.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p role="status" className="mt-3 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600">
        Aktif: {formatMoney(1000000, prefs.currency)} • inflasi {prefs.inflation}% • metode{" "}
        {methodMeta(prefs.method).label}
      </p>
    </section>
  );
}

export default AdvancedSettings;
