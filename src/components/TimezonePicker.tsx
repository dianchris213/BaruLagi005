import { useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import {
  TIMEZONES,
  detectTimezone,
  isTimezoneId,
  timezoneLabel,
  zoneOffsetLabel,
  zonedNowLabel,
  type TimezoneId,
} from "@/lib/timezone";

type Props = {
  timezone: TimezoneId;
  now: Date;
  dayKeyLabel: string;
  monthKeyLabel: string;
  disabled?: boolean;
  onChange: (zone: TimezoneId) => void;
};

const CUSTOM = "__custom__";

const isPreset = (zone: string) => TIMEZONES.some((t) => t.id === zone);

/**
 * Pengaturan zona waktu: pilih preset, ketik zona IANA manual, atau ikuti
 * perangkat. Zona hanya disimpan setelah divalidasi oleh runtime.
 */
export function TimezonePicker({
  timezone,
  now,
  dayKeyLabel,
  monthKeyLabel,
  disabled = false,
  onChange,
}: Props) {
  const [mode, setMode] = useState<string>(() => (isPreset(timezone) ? timezone : CUSTOM));
  const [draft, setDraft] = useState(timezone);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(isPreset(timezone) ? timezone : CUSTOM);
    setDraft(timezone);
  }, [timezone]);

  const applyCustom = () => {
    const value = draft.trim();
    if (!value) {
      setError("Isi nama zona waktu, contoh: Asia/Jakarta.");
      return;
    }
    if (!isTimezoneId(value)) {
      setError("Zona waktu tidak dikenal. Gunakan format IANA, contoh: Europe/Madrid.");
      return;
    }
    setError(null);
    onChange(value);
  };

  return (
    <section aria-label="Zona Waktu" className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
        <Globe2 className="size-4" aria-hidden="true" /> Zona Waktu
      </h2>

      <label htmlFor="timezone" className="mt-3 block text-xs font-semibold text-slate-800">
        Zona waktu perhitungan
      </label>
      <select
        id="timezone"
        value={mode}
        disabled={disabled}
        onChange={(e) => {
          const value = e.target.value;
          setMode(value);
          setError(null);
          if (value !== CUSTOM && isTimezoneId(value)) onChange(value);
        }}
        aria-describedby="timezone-help"
        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-800 focus-visible:ring-2 focus-visible:ring-slate-800/20 disabled:opacity-60"
      >
        {TIMEZONES.map((tz) => (
          <option key={tz.id} value={tz.id}>
            {tz.label}
          </option>
        ))}
        <option value={CUSTOM}>Zona lain (ketik manual)…</option>
      </select>

      {mode === CUSTOM && (
        <div className="mt-3">
          <label htmlFor="timezone-custom" className="block text-xs font-semibold text-slate-800">
            Nama zona IANA
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="timezone-custom"
              value={draft}
              disabled={disabled}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyCustom();
                }
              }}
              placeholder="Europe/Madrid"
              maxLength={64}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "timezone-custom-error" : "timezone-help"}
              className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-800 focus-visible:ring-2 focus-visible:ring-slate-800/20"
            />
            <button
              type="button"
              onClick={applyCustom}
              disabled={disabled}
              className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-slate-800/30 disabled:opacity-60"
            >
              Terapkan
            </button>
          </div>
          {error && (
            <p id="timezone-custom-error" role="alert" className="mt-1.5 text-[11px] text-red-600">
              {error}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setError(null);
          onChange(detectTimezone());
        }}
        className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-800/20 disabled:opacity-60"
      >
        Gunakan zona perangkat
      </button>

      <p id="timezone-help" className="mt-2 text-[11px] text-slate-500">
        Reset pendapatan harian dan ringkasan bulanan mengikuti zona ini, bukan jam perangkat, jadi
        datamu tidak rollover dua kali di perangkat berbeda.
      </p>

      <div
        role="status"
        aria-live="polite"
        className="mt-3 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600"
      >
        <p className="font-bold text-slate-800">
          Zona saat ini: {timezoneLabel(timezone)} ({zoneOffsetLabel(timezone)})
        </p>
        <p className="mt-0.5">Waktu setempat: {zonedNowLabel(timezone, now)}</p>
        <p className="mt-0.5">
          Hari aktif: {dayKeyLabel} • Bulan aktif: {monthKeyLabel}
        </p>
      </div>
    </section>
  );
}

export default TimezonePicker;
