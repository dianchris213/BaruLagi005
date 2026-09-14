/**
 * Pure savings-plan math. No React, no storage — easy to audit and test.
 *
 * All money values are whole currency units; months are whole months.
 */

import { clampInflation, type SavingsMethod } from "@/lib/prefs";

export const MAX_TARGET = 10_000_000_000;
export const MAX_MONTHLY = 1_000_000_000;
export const MAX_MONTHS = 600;

export type SavingsInput = {
  target: number;
  saved: number;
  income: number;
  expense: number;
  months: number;
  /** Inflasi tahunan dalam persen (0–50). */
  inflation?: number;
  method?: SavingsMethod;
};

export type SavingsPoint = {
  /** Bulan ke-1..n. */
  month: number;
  /** Saldo tabungan pada akhir bulan itu (mengikuti rekomendasi). */
  balance: number;
  /** Target yang sudah disesuaikan inflasi pada bulan itu. */
  target: number;
};

export type SavingsPlan = {
  /** Target setelah disesuaikan inflasi pada akhir jangka waktu. */
  adjustedTarget: number;
  /** Tambahan biaya akibat inflasi. */
  inflationCost: number;
  remaining: number;
  cashflow: number;
  /** Amount that must be saved every month to hit the adjusted target in `months`. */
  required: number;
  /** Rekomendasi bulanan sesuai metode yang dipilih. */
  recommended: number;
  /** Months needed at the recommended rate; null when cash flow is not positive. */
  monthsAtRecommended: number | null;
  feasible: boolean;
  progress: number;
  /** Proyeksi per bulan untuk grafik. */
  schedule: SavingsPoint[];
};

/** Strict numeric field parser for money / month inputs. */
export function parseNumberField(
  raw: string,
  { label, max, allowZero = true }: { label: string; max: number; allowZero?: boolean },
): { ok: true; value: number } | { ok: false; error: string } {
  const cleaned = raw.replace(/[.\s]/g, "").replace(",", ".");
  if (!cleaned) return { ok: false, error: `${label} wajib diisi.` };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return { ok: false, error: `${label} harus berupa angka.` };
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return { ok: false, error: `${label} tidak valid.` };
  if (!allowZero && value <= 0) return { ok: false, error: `${label} harus lebih dari 0.` };
  if (value < 0) return { ok: false, error: `${label} tidak boleh negatif.` };
  if (value > max) return { ok: false, error: `${label} terlalu besar.` };
  return { ok: true, value: Math.round(value) };
}

/** Porsi arus kas bebas yang dipakai tiap metode. */
function cashflowShare(method: SavingsMethod): number {
  if (method === "aggressive") return 0.95;
  if (method === "linear") return 1;
  return 0.8;
}

const MAX_CHART_POINTS = 60;

export function calculateSavings(input: SavingsInput): SavingsPlan {
  const baseTarget = Math.max(0, input.target);
  const saved = Math.min(Math.max(0, input.saved), baseTarget);
  const months = Math.min(MAX_MONTHS, Math.max(1, Math.round(input.months)));
  const method: SavingsMethod = input.method ?? "cashflow";
  const inflation = clampInflation(input.inflation ?? 0);
  const monthlyRate = Math.pow(1 + inflation / 100, 1 / 12);

  const adjustedTarget = Math.round(baseTarget * Math.pow(monthlyRate, months));
  const inflationCost = Math.max(0, adjustedTarget - baseTarget);
  const remaining = Math.max(0, adjustedTarget - saved);
  const cashflow = Math.round(input.income - input.expense);
  const required = Math.ceil(remaining / months);

  let recommended: number;
  if (remaining === 0) {
    recommended = 0;
  } else if (method === "linear") {
    recommended = required;
  } else if (cashflow > 0) {
    recommended = Math.max(1, Math.min(Math.round(cashflow * cashflowShare(method)), remaining));
  } else {
    recommended = 0;
  }

  const monthsAtRecommended =
    remaining === 0 ? 0 : recommended > 0 ? Math.ceil(remaining / recommended) : null;

  const schedule: SavingsPoint[] = [];
  const horizon = Math.min(
    MAX_CHART_POINTS,
    Math.max(months, monthsAtRecommended && monthsAtRecommended > 0 ? monthsAtRecommended : months),
  );
  for (let m = 1; m <= horizon; m++) {
    const targetAtMonth = Math.round(baseTarget * Math.pow(monthlyRate, m));
    schedule.push({
      month: m,
      balance: Math.min(saved + recommended * m, Math.max(targetAtMonth, adjustedTarget)),
      target: targetAtMonth,
    });
  }

  return {
    adjustedTarget,
    inflationCost,
    remaining,
    cashflow,
    required,
    recommended,
    monthsAtRecommended,
    feasible: remaining === 0 || (cashflow > 0 && required <= cashflow),
    progress: adjustedTarget > 0 ? Math.min(100, Math.round((saved / adjustedTarget) * 100)) : 0,
    schedule,
  };
}
