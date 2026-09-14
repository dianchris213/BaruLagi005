/**
 * Timezone-aware calendar helpers.
 *
 * Every daily/monthly reset in the app is computed against an explicit IANA
 * timezone chosen by the user (Pengaturan), never the device clock, so the
 * same data never rolls over twice on different devices.
 */

export const TIMEZONES = [
  { id: "Asia/Jakarta", label: "WIB — Jakarta (UTC+7)" },
  { id: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh (UTC+7)" },
  { id: "Asia/Makassar", label: "WITA — Makassar (UTC+8)" },
  { id: "Asia/Jayapura", label: "WIT — Jayapura (UTC+9)" },
  { id: "Asia/Singapore", label: "Singapura (UTC+8)" },
  { id: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (UTC+8)" },
  { id: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
  { id: "Asia/Dubai", label: "Dubai (UTC+4)" },
  { id: "Europe/Amsterdam", label: "Amsterdam (UTC+1/+2)" },
  { id: "UTC", label: "UTC (UTC+0)" },
] as const;

export type TimezoneId = (typeof TIMEZONES)[number]["id"];

export const DEFAULT_TIMEZONE: TimezoneId = "Asia/Jakarta";

export const LS_TIMEZONE = "miniapp.timezone";

export function isTimezoneId(value: unknown): value is TimezoneId {
  return typeof value === "string" && TIMEZONES.some((t) => t.id === value);
}

/** Best-effort suggestion based on the device, validated against the list. */
export function detectTimezone(): TimezoneId {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isTimezoneId(zone) ? zone : DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function timezoneLabel(zone: TimezoneId): string {
  return TIMEZONES.find((t) => t.id === zone)?.label ?? zone;
}

/** Calendar parts (numbers) of `date` as seen inside `zone`. */
export function zonedParts(zone: TimezoneId, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-09-14" in `zone`. */
export function dayKey(zone: TimezoneId, date = new Date()): string {
  const { year, month, day } = zonedParts(zone, date);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** "2026-09" in `zone`. */
export function monthKey(zone: TimezoneId, date = new Date()): string {
  const { year, month } = zonedParts(zone, date);
  return `${year}-${pad(month)}`;
}

/** "September 2026" from a month key. */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const year = Number(y);
  const month = Number(m);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return key;
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

/**
 * Milliseconds until the next midnight *in `zone`*.
 * Clamped to [1s, 1h] so long-lived tabs re-check regularly and clock/DST
 * drift can never schedule a timer far past the actual rollover.
 */
export function msUntilZonedMidnight(zone: TimezoneId, date = new Date()): number {
  const { hour, minute, second } = zonedParts(zone, date);
  const elapsed = (hour * 3600 + minute * 60 + second) * 1000 + date.getMilliseconds() % 1000;
  const remaining = 86_400_000 - elapsed;
  return Math.min(Math.max(remaining, 1_000), 3_600_000);
}

/** Day key of the calendar day after "today in `zone`". */
export function nextDayKey(zone: TimezoneId, date = new Date()): string {
  const { year, month, day } = zonedParts(zone, date);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

/** Month key of the calendar month after "this month in `zone`". */
export function nextMonthKey(zone: TimezoneId, date = new Date()): string {
  const { year, month } = zonedParts(zone, date);
  const next = new Date(Date.UTC(year, month, 1));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}`;
}

/** Current wall-clock time inside `zone`, e.g. "14 September 2026, 17.29". */
export function zonedNowLabel(zone: TimezoneId, date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: zone,
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

/** Current UTC offset of `zone`, e.g. "UTC+7". */
export function zoneOffsetLabel(zone: TimezoneId, date = new Date()): string {
  const part = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName")?.value;
  return part ? part.replace("GMT", "UTC").replace(/^UTC$/, "UTC+0") : "UTC";
}

/** Strict "YYYY-MM-DD" validator that also rejects impossible calendar dates. */
export function isDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m! < 1 || m! > 12 || d! < 1) return false;
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  return (
    date.getUTCFullYear() === y && date.getUTCMonth() === m! - 1 && date.getUTCDate() === d
  );
}

/** Month key ("YYYY-MM") of a day key. */
export function monthOfDayKey(day: string): string {
  return day.slice(0, 7);
}
