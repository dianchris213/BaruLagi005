import { useId, useState } from "react";
import { CalendarClock } from "lucide-react";

import { applyDateReset, type DailyStore, type FlowStore, type WalletBase } from "@/lib/reset";
import { dayKey, isDayKey, monthLabel, type TimezoneId } from "@/lib/timezone";

type Props = {
  wallets: readonly WalletBase[];
  timezone: TimezoneId;
  disabled?: boolean;
  onReset: (next: { daily: DailyStore; flows: FlowStore }) => void;
};

/** Manual rollover to an explicit date, independent of the daily/monthly cycle. */
export function ManualDateReset({ wallets, timezone, disabled = false, onReset }: Props) {
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDayKey(value)) {
      setDone("");
      setError("Pilih tanggal yang valid (format YYYY-MM-DD).");
      return;
    }
    if (value > dayKey(timezone)) {
      setDone("");
      setError("Tanggal tidak boleh melewati hari aktif zona waktu kamu.");
      return;
    }
    setError("");
    onReset(applyDateReset(value, wallets));
    setDone(
      `Saldo dikembalikan ke ${value}. Penghitung harian dan arus kas ${monthLabel(value.slice(0, 7))} dinihilkan; saldo dasar dompet tetap utuh.`,
    );
  };

  return (
    <form onSubmit={submit} noValidate className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
        <CalendarClock className="size-4" aria-hidden="true" /> Reset Manual ke Tanggal
      </h2>
      <p className="mt-1 text-[11px] text-slate-500">
        Bukan sekadar harian atau bulanan — pilih tanggal tertentu, lalu kembalikan saldo dan
        penghitung arus kas ke titik itu.
      </p>

      <label htmlFor={id} className="mt-3 block text-xs font-semibold text-slate-800">
        Tanggal acuan
      </label>
      <input
        id={id}
        type="date"
        max={dayKey(timezone)}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          setValue(e.target.value);
          setError("");
          setDone("");
        }}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none ${
          error ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-slate-800"
        }`}
      />

      <button
        type="submit"
        disabled={disabled}
        className="mt-3 min-h-11 w-full rounded-xl bg-slate-800 text-xs font-bold text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reset ke tanggal ini
      </button>

      <div aria-live="polite" className="mt-2">
        {error && (
          <p id={`${id}-error`} role="alert" className="text-[11px] font-semibold text-rose-500">
            {error}
          </p>
        )}
        {!error && done && <p className="text-[11px] font-semibold text-emerald-600">{done}</p>}
      </div>
    </form>
  );
}
