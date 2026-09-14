import { useState } from "react";
import { CalendarDays, RotateCcw, Sunrise } from "lucide-react";

import { snapshotCash, type CashSnapshot, type DailyStore, type FlowStore, type WalletBase } from "@/lib/reset";
import { monthLabel, nextDayKey, nextMonthKey, type TimezoneId } from "@/lib/timezone";

type Props = {
  wallets: readonly WalletBase[];
  flows: FlowStore;
  daily: DailyStore;
  timezone: TimezoneId;
  disabled?: boolean;
  onDailyReset: (day: string) => void;
  onMonthlyReset: (month: string) => void;
};

type Comparison = { kind: "harian" | "bulanan"; before: CashSnapshot; after: CashSnapshot };

const rupiah = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

export function ResetTester({
  wallets,
  flows,
  daily,
  timezone,
  disabled = false,
  onDailyReset,
  onMonthlyReset,
}: Props) {
  const [result, setResult] = useState<Comparison | null>(null);

  const runDaily = () => {
    const before = snapshotCash("Sebelum reset", wallets, flows, daily);
    const day = nextDayKey(timezone);
    const after = snapshotCash("Setelah reset", wallets, flows, { day, in: 0, out: 0 });
    onDailyReset(day);
    setResult({ kind: "harian", before, after });
  };

  const runMonthly = () => {
    const before = snapshotCash("Sebelum reset", wallets, flows, daily);
    const month = nextMonthKey(timezone);
    const emptied: FlowStore = {
      month,
      data: Object.fromEntries(wallets.map((w) => [w.id, { in: 0, out: 0 }])),
    };
    const after = snapshotCash("Setelah reset", wallets, emptied, daily);
    onMonthlyReset(month);
    setResult({ kind: "bulanan", before, after });
  };

  return (
    <section aria-label="Uji Reset" className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
        <RotateCcw className="size-4" aria-hidden="true" /> Uji Reset
      </h2>
      <p className="mt-1 text-[11px] text-slate-500">
        Jalankan rollover memakai zona waktu aktif, lalu bandingkan arus kas dompet sebelum dan
        sesudah reset.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={runDaily}
          disabled={disabled}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-3 text-xs font-bold text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sunrise className="size-4" aria-hidden="true" /> Reset harian
        </button>
        <button
          type="button"
          onClick={runMonthly}
          disabled={disabled}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarDays className="size-4" aria-hidden="true" /> Reset bulanan
        </button>
      </div>

      <div aria-live="polite" className="mt-3">
        {result && (
          <>
            <p className="text-[11px] font-semibold text-slate-600">
              Hasil uji reset {result.kind}: hari {result.before.day} → {result.after.day} • bulan{" "}
              {monthLabel(result.before.month)} → {monthLabel(result.after.month)}
            </p>

            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-left text-[11px]">
                <caption className="sr-only">
                  Perbandingan arus kas dompet sebelum dan sesudah reset {result.kind}
                </caption>
                <thead>
                  <tr className="text-slate-500">
                    <th scope="col" className="py-1 pr-2 font-semibold">
                      Dompet
                    </th>
                    <th scope="col" className="py-1 pr-2 text-right font-semibold">
                      Masuk
                    </th>
                    <th scope="col" className="py-1 pr-2 text-right font-semibold">
                      Keluar
                    </th>
                    <th scope="col" className="py-1 text-right font-semibold">
                      Saldo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.before.rows.map((row, i) => {
                    const after = result.after.rows[i]!;
                    return (
                      <tr key={row.id} className="border-t border-slate-100 align-top">
                        <th scope="row" className="py-1.5 pr-2 font-semibold text-slate-800">
                          {row.name}
                        </th>
                        <td className="py-1.5 pr-2 text-right text-slate-600">
                          {rupiah(row.in)}
                          <span className="block font-semibold text-emerald-600">
                            → {rupiah(after.in)}
                          </span>
                        </td>
                        <td className="py-1.5 pr-2 text-right text-slate-600">
                          {rupiah(row.out)}
                          <span className="block font-semibold text-rose-600">
                            → {rupiah(after.out)}
                          </span>
                        </td>
                        <td className="py-1.5 text-right text-slate-600">
                          {rupiah(row.balance)}
                          <span className="block font-semibold text-slate-800">
                            → {rupiah(after.balance)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-slate-200">
                    <th scope="row" className="py-1.5 pr-2 font-bold text-slate-800">
                      Total
                    </th>
                    <td className="py-1.5 pr-2 text-right text-slate-600">
                      {rupiah(result.before.totalIn)}
                      <span className="block font-bold text-emerald-600">
                        → {rupiah(result.after.totalIn)}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 text-right text-slate-600">
                      {rupiah(result.before.totalOut)}
                      <span className="block font-bold text-rose-600">
                        → {rupiah(result.after.totalOut)}
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-slate-600">
                      {rupiah(result.before.totalBalance)}
                      <span className="block font-bold text-slate-800">
                        → {rupiah(result.after.totalBalance)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
              Pendapatan bersih driver: {rupiah(result.before.driverNet)} →{" "}
              {rupiah(result.after.driverNet)}. Reset {result.kind} hanya menihilkan penghitung{" "}
              {result.kind === "harian" ? "harian" : "arus kas bulanan"}; saldo dasar dompet tetap
              utuh.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
