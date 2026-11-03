const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("id-ID");

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatRupiah = (value: number) => rupiah.format(value);
export const formatNumber = (value: number) => number.format(value);