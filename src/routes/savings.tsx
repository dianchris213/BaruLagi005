import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PiggyBank, Target, TrendingUp } from "lucide-react";

import { BottomNav } from "@/components/BottomNav";
import {
  MAX_MONTHLY,
  MAX_MONTHS,
  MAX_TARGET,
  calculateSavings,
  parseNumberField,
} from "@/lib/savings";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [
      { title: "Kalkulator Tabungan — Catatan Keuangan Dian" },
      {
        name: "description",
        content:
          "Hitung target tabungan, arus kas bulanan, dan rekomendasi jumlah menabung per bulan secara realistis.",
      },
      { property: "og:title", content: "Kalkulator Tabungan — Catatan Keuangan Dian" },
      {
        property: "og:description",
        content: "Target tabungan, arus kas bulanan, dan rekomendasi tabungan per bulan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SavingsPage,
});

type FieldKey = "target" | "saved" | "income" | "expense" | "months";

const FIELDS: {
  key: FieldKey;
  label: string;
  hint: string;
  max: number;
  allowZero: boolean;
  suffix: string;
}[] = [
  { key: "target", label: "Target tabungan", hint: "Jumlah yang ingin dikumpulkan", max: MAX_TARGET, allowZero: false, suffix: "Rp" },
  { key: "saved", label: "Sudah terkumpul", hint: "Saldo tabungan saat ini", max: MAX_TARGET, allowZero: true, suffix: "Rp" },
  { key: "income", label: "Pemasukan per bulan", hint: "Rata-rata pemasukan bulanan", max: MAX_MONTHLY, allowZero: true, suffix: "Rp" },
  { key: "expense", label: "Pengeluaran per bulan", hint: "Rata-rata pengeluaran bulanan", max: MAX_MONTHLY, allowZero: true, suffix: "Rp" },
  { key: "months", label: "Jangka waktu", hint: "Berapa bulan ingin tercapai", max: MAX_MONTHS, allowZero: false, suffix: "bln" },
];

const rupiah = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

function SavingsPage() {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    target: "10000000",
    saved: "1500000",
    income: "4500000",
    expense: "3200000",
    months: "12",
  });

  const parsed = useMemo(() => {
    const errors: Partial<Record<FieldKey, string>> = {};
    const numbers: Record<FieldKey, number> = {
      target: 0,
      saved: 0,
      income: 0,
      expense: 0,
      months: 1,
    };
    for (const f of FIELDS) {
      const res = parseNumberField(values[f.key], {
        label: f.label,
        max: f.max,
        allowZero: f.allowZero,
      });
      if (res.ok) numbers[f.key] = res.value;
      else errors[f.key] = res.error;
    }
    if (!errors.saved && !errors.target && numbers.saved > numbers.target) {
      errors.saved = "Tabungan terkumpul tidak boleh melebihi target.";
    }
    return { errors, numbers, valid: Object.keys(errors).length === 0 };
  }, [values]);

  const plan = useMemo(() => calculateSavings(parsed.numbers), [parsed.numbers]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="mx-auto min-h-screen w-full max-w-[480px] pb-28">
        <header className="rounded-b-2xl bg-white px-5 py-6 shadow-sm">
          <p className="text-xs text-slate-500">Perencanaan</p>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <PiggyBank className="size-5" aria-hidden="true" /> Kalkulator Tabungan
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Hitung target, arus kas bulanan, dan rekomendasi menabung per bulan.
          </p>
        </header>

        <main className="space-y-4 px-4 pt-4">
          <form
            noValidate
            onSubmit={(e) => e.preventDefault()}
            aria-label="Data tabungan"
            className="rounded-2xl bg-white p-4 shadow-sm"
          >
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <Target className="size-4" aria-hidden="true" /> Data kamu
            </h2>
            <div className="mt-3 space-y-3">
              {FIELDS.map((f) => {
                const error = parsed.errors[f.key];
                return (
                  <div key={f.key}>
                    <label htmlFor={`sv-${f.key}`} className="text-xs font-semibold text-slate-800">
                      {f.label}{" "}
                      <span className="font-normal text-slate-400">({f.suffix})</span>
                    </label>
                    <input
                      id={`sv-${f.key}`}
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={13}
                      value={values[f.key]}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [f.key]: e.target.value.slice(0, 13) }))
                      }
                      aria-invalid={!!error}
                      aria-describedby={error ? `sv-${f.key}-error` : `sv-${f.key}-hint`}
                      className={`mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none ${
                        error
                          ? "border-rose-400 focus:border-rose-500"
                          : "border-slate-200 focus:border-slate-800"
                      }`}
                    />
                    {error ? (
                      <p
                        id={`sv-${f.key}-error`}
                        role="alert"
                        className="mt-1 text-[11px] font-semibold text-rose-500"
                      >
                        {error}
                      </p>
                    ) : (
                      <p id={`sv-${f.key}-hint`} className="mt-1 text-[11px] text-slate-500">
                        {f.hint}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </form>

          <section
            aria-label="Hasil perhitungan"
            aria-live="polite"
            className="rounded-2xl bg-white p-4 shadow-sm"
          >
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <TrendingUp className="size-4" aria-hidden="true" /> Hasil
            </h2>

            {!parsed.valid ? (
              <p className="mt-3 text-sm text-slate-500">
                Lengkapi data di atas dengan angka yang valid untuk melihat rekomendasi.
              </p>
            ) : (
              <>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between text-xs text-slate-500">
                    <span>Progres target</span>
                    <span className="font-bold text-slate-800">{plan.progress}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={plan.progress}
                    aria-label="Progres target tabungan"
                    className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100"
                  >
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${plan.progress}%` }}
                    />
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-[11px] text-slate-500">Sisa kebutuhan</dt>
                    <dd className="mt-0.5 text-sm font-bold text-slate-800">
                      {rupiah(plan.remaining)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-[11px] text-slate-500">Arus kas bulanan</dt>
                    <dd
                      className={`mt-0.5 text-sm font-bold ${
                        plan.cashflow < 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {rupiah(plan.cashflow)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-[11px] text-slate-500">Wajib ditabung / bulan</dt>
                    <dd className="mt-0.5 text-sm font-bold text-slate-800">
                      {rupiah(plan.required)}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-[11px] text-slate-500">Rekomendasi / bulan</dt>
                    <dd className="mt-0.5 text-sm font-bold text-slate-800">
                      {rupiah(plan.recommended)}
                    </dd>
                  </div>
                </dl>

                <p
                  className={`mt-3 rounded-xl p-3 text-xs leading-relaxed ${
                    plan.feasible ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {plan.remaining === 0
                    ? "Target tabungan kamu sudah tercapai. Sisihkan kelebihan arus kas untuk dana darurat."
                    : plan.cashflow <= 0
                      ? "Arus kas bulanan belum positif, jadi target belum bisa dikejar. Kurangi pengeluaran atau tambah pemasukan lebih dulu."
                      : plan.feasible
                        ? `Target realistis: sisihkan ${rupiah(plan.required)} per bulan, masih di bawah arus kas ${rupiah(plan.cashflow)}. Rekomendasi aman ${rupiah(plan.recommended)} per bulan.`
                        : `Dengan arus kas ${rupiah(plan.cashflow)}, menabung ${rupiah(plan.recommended)} per bulan membuat target tercapai sekitar ${plan.monthsAtRecommended} bulan — lebih lama dari rencana kamu.`}
                </p>
              </>
            )}
          </section>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
