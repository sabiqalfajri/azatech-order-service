const DAY_MS = 86_400_000;

export function startOfDay(date: string): Date {
  return new Date(`${date}T00:00:00+07:00`);
}

export function startOfNextDay(date: string): Date {
  return new Date(startOfDay(date).getTime() + DAY_MS);
}