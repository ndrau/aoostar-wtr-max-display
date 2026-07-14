export function formatTime(value: string): string {
  return new Date(value).toLocaleString("de-DE");
}

export function formatBannerClock(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}
