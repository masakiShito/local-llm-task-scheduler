export function formatTime(value: string) {
  if (!value) return "";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export function timeToMinutes(value: string) {
  if (!value) return null;
  if (/^\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() * 60 + date.getMinutes();
}

export function durationMinutes(start: string, end: string) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes === null || endMinutes === null) return null;
  return Math.max(endMinutes - startMinutes, 0);
}

export function formatDuration(start: string, end: string) {
  const minutes = durationMinutes(start, end);
  if (minutes === null) return "";
  return `${minutes}分`;
}

export function formatWarningMessage(message: string) {
  const cleaned = message.replace(/W-\d+/g, "").trim();
  if (!cleaned) {
    return "説明文の生成に失敗しました。計画自体は作成できています。";
  }
  return cleaned;
}

export function kindLabel(kind: string) {
  if (kind === "work") return "作業";
  if (kind === "break") return "休憩";
  if (kind === "buffer") return "調整時間";
  return "";
}
