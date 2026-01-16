export function isoDate(date = new Date()): string {
  return date.toISOString();
}

export function dayStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
