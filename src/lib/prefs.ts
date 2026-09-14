/**
 * Pengaturan lanjutan (mata uang, inflasi, metode hitung tabungan).
 *
 * Disimpan di localStorage dan selalu divalidasi saat dibaca, sehingga data
 * rusak atau hasil edit manual tidak pernah masuk ke perhitungan.
 */

export const CURRENCIES = [
  { code: "IDR", label: "Rupiah (Rp)", locale: "id-ID" },
  { code: "USD", label: "Dolar AS ($)", locale: "en-US" },
  { code: "EUR", label: "Euro (€)", locale: "de-DE" },
  { code: "SGD", label: "Dolar Singapura (S$)", locale: "en-SG" },
  { code: "JPY", label: "Yen Jepang (¥)", locale: "ja-JP" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const SAVINGS_METHODS = [
  {
    id: "linear",
    label: "Bagi rata",
    hint: "Sisa target dibagi rata ke jangka waktu yang kamu pilih.",
  },
  {
    id: "cashflow",
    label: "Aman (80% arus kas)",
    hint: "Menabung maksimal 80% arus kas bebas agar tetap ada penyangga.",
  },
  {
    id: "aggressive",
    label: "Agresif (95% arus kas)",
    hint: "Mengejar target secepat mungkin dengan hampir seluruh arus kas.",
  },
] as const;

export type SavingsMethod = (typeof SAVINGS_METHODS)[number]["id"];

export const MAX_INFLATION = 50;

export type AppPrefs = {
  currency: CurrencyCode;
  /** Inflasi tahunan dalam persen, 0–50. */
  inflation: number;
  method: SavingsMethod;
};

export const DEFAULT_PREFS: AppPrefs = {
  currency: "IDR",
  inflation: 3,
  method: "cashflow",
};

export const LS_PREFS = "miniapp.prefs";

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && CURRENCIES.some((c) => c.code === value);
}

export function isSavingsMethod(value: unknown): value is SavingsMethod {
  return typeof value === "string" && SAVINGS_METHODS.some((m) => m.id === value);
}

export function clampInflation(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_PREFS.inflation;
  return Math.min(MAX_INFLATION, Math.max(0, Math.round(n * 10) / 10));
}

/** Never throws; unknown shapes fall back to defaults field by field. */
export function normalizePrefs(raw: unknown): AppPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFS };
  const value = raw as Partial<AppPrefs>;
  return {
    currency: isCurrencyCode(value.currency) ? value.currency : DEFAULT_PREFS.currency,
    inflation: clampInflation(value.inflation),
    method: isSavingsMethod(value.method) ? value.method : DEFAULT_PREFS.method,
  };
}

export function loadPrefs(): AppPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = window.localStorage.getItem(LS_PREFS);
    return raw ? normalizePrefs(JSON.parse(raw)) : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: AppPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_PREFS, JSON.stringify(normalizePrefs(prefs)));
  } catch {
    /* storage penuh atau diblokir: pengaturan tetap berlaku di sesi ini */
  }
}

export function currencyMeta(code: CurrencyCode) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function methodMeta(id: SavingsMethod) {
  return SAVINGS_METHODS.find((m) => m.id === id) ?? SAVINGS_METHODS[1];
}

/** Format uang bulat sesuai mata uang pilihan pengguna. */
export function formatMoney(value: number, currency: CurrencyCode): string {
  const meta = currencyMeta(currency);
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: meta.code,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  } catch {
    return `${meta.code} ${Math.round(value).toLocaleString("id-ID")}`;
  }
}
