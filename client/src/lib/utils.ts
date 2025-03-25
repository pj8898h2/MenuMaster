import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getWeekDays(): string[] {
  return ["月", "火", "水", "木", "金", "土", "日"];
}

export function formatShortDate(date: Date): string {
  return format(date, 'MM/dd (E)', { locale: ja });
}
