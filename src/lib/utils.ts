export function randomStr() {
  return Math.random().toString(36).slice(2);
}

export function formatName(name: string) {
  return (name || '').replace('栋', '-');
}

export function formatTime(ts: number | string) {
  if (!ts) return '-';

  const date = new Date(ts);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day} ${hours}:${minutes}`;
}

export function formatLiters(outMl: number) {
  return `${(outMl / 1000).toFixed(2)} L`;
}

export function duration(start: number, end: number) {
  if (!end) return '-';

  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}秒`;

  return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
}
