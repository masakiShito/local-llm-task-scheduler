/**
 * Converts a datetime-local input value to ISO8601 format with timezone
 * @param datetimeLocal - The datetime-local value (e.g., "2026-01-11T10:00")
 * @param timezone - The timezone offset (default: "+09:00" for Asia/Tokyo)
 * @returns ISO8601 formatted datetime string (e.g., "2026-01-11T10:00:00+09:00")
 */
export function datetimeLocalToISO(datetimeLocal: string, timezone: string = "+09:00"): string {
  // datetime-local format: "2026-01-11T10:00"
  // Add seconds and timezone: "2026-01-11T10:00:00+09:00"
  return `${datetimeLocal}:00${timezone}`;
}

/**
 * Converts an ISO8601 datetime string to datetime-local format
 * @param isoDatetime - The ISO8601 datetime string (e.g., "2026-01-11T10:00:00+09:00")
 * @returns datetime-local formatted string (e.g., "2026-01-11T10:00")
 */
export function isoToDatetimeLocal(isoDatetime: string): string {
  // Parse the ISO datetime and convert to local time
  const date = new Date(isoDatetime);

  // Format as YYYY-MM-DDTHH:mm
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Gets current datetime in datetime-local format
 * @returns Current datetime in datetime-local format
 */
export function getCurrentDatetimeLocal(): string {
  const now = new Date();
  return isoToDatetimeLocal(now.toISOString());
}

/**
 * Formats a YYYY-MM-DD date string into "yyyy年MM月dd日（曜日）" in Japan timezone.
 */
export function formatJapaneseDate(
  dateString: string,
  timeZone: string = "Asia/Tokyo"
): string {
  const date = new Date(`${dateString}T00:00:00+09:00`);
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const get = (type: "year" | "month" | "day" | "weekday") =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}年${get("month")}月${get("day")}日（${get("weekday")}）`;
}
