/**
 * Pure reset + cash-flow snapshot logic.
 *
 * Kept free of React and localStorage so daily/monthly rollovers can be
 * reasoned about (and audited) as plain data transformations.
 */

export type Flow = { in: number; out: number };
export type FlowStore = { month: string; data: Record<string, Flow> };
export type DailyStore = { day: string; in: number; out: number };

export type WalletBase = { id: string; name: string; balance: number };

export type SnapshotRow = {
  id: string;
  name: string;
  base: number;
  in: number;
  out: number;
  balance: number;
};

export type CashSnapshot = {
  label: string;
  month: string;
  day: string;
  rows: SnapshotRow[];
  totalIn: number;
  totalOut: number;
  totalBalance: number;
  dailyIn: number;
  dailyOut: number;
  driverNet: number;
};

export const MAX_AMOUNT = 1_000_000_000;

export function emptyFlows(wallets: readonly WalletBase[]): Record<string, Flow> {
  return Object.fromEntries(wallets.map((w) => [w.id, { in: 0, out: 0 }]));
}

const safe = (n: unknown) => {
  const value = Number(n);
  return Number.isFinite(value) && value > 0 ? Math.min(value, MAX_AMOUNT) : 0;
};

export function snapshotCash(
  label: string,
  wallets: readonly WalletBase[],
  flows: FlowStore,
  daily: DailyStore,
): CashSnapshot {
  const rows: SnapshotRow[] = wallets.map((w) => {
    const f = flows.data[w.id] ?? { in: 0, out: 0 };
    const inAmount = safe(f.in);
    const outAmount = safe(f.out);
    return {
      id: w.id,
      name: w.name,
      base: w.balance,
      in: inAmount,
      out: outAmount,
      balance: w.balance + inAmount - outAmount,
    };
  });

  return {
    label,
    month: flows.month,
    day: daily.day,
    rows,
    totalIn: rows.reduce((s, r) => s + r.in, 0),
    totalOut: rows.reduce((s, r) => s + r.out, 0),
    totalBalance: rows.reduce((s, r) => s + r.balance, 0),
    dailyIn: safe(daily.in),
    dailyOut: safe(daily.out),
    driverNet: safe(daily.in) - safe(daily.out),
  };
}

/** Daily rollover: driver net starts from zero on the new zoned day. */
export function applyDailyReset(day: string): DailyStore {
  return { day, in: 0, out: 0 };
}

/** Monthly rollover: wallet in/out counters restart, base balances stay. */
export function applyMonthlyReset(month: string, wallets: readonly WalletBase[]): FlowStore {
  return { month, data: emptyFlows(wallets) };
}

/** Parse a user-typed rupiah amount with bank-grade strictness. */
export function parseAmount(raw: string): { ok: true; value: number } | { ok: false; error: string } {
  const cleaned = raw.replace(/[.\s]/g, "").replace(",", ".");
  if (!cleaned) return { ok: false, error: "Masukkan jumlah terlebih dahulu." };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return { ok: false, error: "Jumlah harus berupa angka." };
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return { ok: false, error: "Jumlah harus lebih dari 0." };
  if (value > MAX_AMOUNT) return { ok: false, error: "Jumlah terlalu besar." };
  return { ok: true, value: Math.round(value) };
}
