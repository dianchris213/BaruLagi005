/**
 * Pure savings-plan math. No React, no storage — easy to audit and test.
 *
 * All money values are whole rupiah; months are whole months.
 */

export const MAX_TARGET = 10_000_000_000;
export const MAX_MONTHLY = 1_000_000_000;
export const MAX_MONTHS = 600;

export type SavingsInput = {
  target: number;
  saved: number;
  income: number;
  expense: number;
  months: number;
};

export type SavingsPlan = {
  remaining: number;
  cashflow: number;
  /** Amount that must be saved every month to hit the target in `months`. */
  required: number;
  /** Safe recommendation: 80% of free cash flow, capped by what is needed. */
  recommended: number;
  /** Months needed at the recommended rate; null when cash flow is not positive. */
  monthsAtRecommended: number | null;
  feasible: boolean;
  progress: number;
};

/** Strict numeric field parser for rupiah / month inputs. */
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

export function calculateSavings(input: SavingsInput): SavingsPlan {
  const target = Math.max(0, input.target);
  const saved = Math.min(Math.max(0, input.saved), target);
  const months = Math.max(1, Math.round(input.months));

  const remaining = Math.max(0, target - saved);
  const cashflow = Math.round(input.income - input.expense);
  const required = Math.ceil(remaining / months);
  const recommended = cashflow > 0 ? Math.min(Math.round(cashflow * 0.8), remaining) : 0;
  const monthsAtRecommended =
    recommended > 0 ? Math.ceil(remaining / recommended) : remaining === 0 ? 0 : null;

  return {
    remaining,
    cashflow,
    required,
    recommended,
    monthsAtRecommended,
    feasible: cashflow > 0 && required <= cashflow,
    progress: target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0,
  };
}
