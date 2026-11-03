const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function formatOrderNumber(seq: number, now = new Date()): string {
  const date = new Date(now.getTime() + WIB_OFFSET_MS)
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");
  return `INV-${date}-${String(seq).padStart(4, "0")}`;
}