// Map a clock time to a Traditional Chinese phrase using only the baked glyph set.
// Every character produced here MUST exist in data/strokeData.ts.

const DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

/** Render 0..59 the way times are spoken (十, 二十, 二十一 ...). */
export function numberToChinese(n: number): string {
  if (n < 0) n = 0;
  if (n < 10) return DIGITS[n];
  if (n === 10) return "十";
  if (n < 20) return "十" + DIGITS[n - 10];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return DIGITS[tens] + "十" + (ones ? DIGITS[ones] : "");
}

/** Hours read 1..12; two o'clock colloquially uses 兩 rather than 二. */
export function hourToChinese(h12: number): string {
  if (h12 === 2) return "兩";
  return numberToChinese(h12);
}

/** Day-part prefix, chosen to exercise the calligraphic glyph set naturally. */
export function periodChars(hour24: number): string {
  if (hour24 === 0) return "午夜";
  if (hour24 < 6) return "早上";
  if (hour24 < 12) return "上午";
  if (hour24 === 12) return "中午";
  if (hour24 < 18) return "下午";
  return "晚上";
}

export interface TimePhrase {
  /** Full phrase, e.g. 上午九點二十八分. */
  text: string;
  /** Component segments for optional styling. */
  segments: { period: string; hour: string; minute: string };
}

export function timeToPhrase(date: Date): TimePhrase {
  const h24 = date.getHours();
  const m = date.getMinutes();
  const h12 = ((h24 + 11) % 12) + 1;

  const period = periodChars(h24);
  const hour = hourToChinese(h12) + "點";
  let minute: string;
  if (m === 0) minute = "整";
  else if (m === 30) minute = "半";
  else minute = numberToChinese(m) + "分";

  return { text: period + hour + minute, segments: { period, hour, minute } };
}
