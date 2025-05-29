// lib/utils/date.ts
import { format, parseISO, isValid, parse } from "date-fns";

// Helper: turn a Date|string into a valid Date, or return null
const toDate = (d: Date | string | null | undefined): Date | null => {
  if (!d) return null;
  let dt: Date;
  if (typeof d === "string") {
    // Try ISO first
    dt = parseISO(d);
    if (!isValid(dt)) {
      // If that fails, try parsing a "MMM yyyy" format
      dt = parse(d, "MMM yyyy", new Date());
    }
  } else {
    dt = d;
  }
  return isValid(dt) ? dt : null;
};

export const formatDate = (date: Date | string | null | undefined): string => {
  const dt = toDate(date);
  return dt ? format(dt, "MMM dd, yyyy") : "";
};

export const formatDateTime = (date: Date | string | null | undefined): string => {
  const dt = toDate(date);
  return dt ? format(dt, "MMM dd, yyyy HH:mm") : "";
};

export const formatDateForInput = (date: Date | string | null | undefined): string => {
  const dt = toDate(date);
  return dt ? format(dt, "yyyy-MM-dd") : "";
};

export const getMonthsArray = (): string[] => [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const groupDataByMonth = (
  data: { date: string; value: number }[]
): { date: string; value: number }[] => {
  const monthlyData: Record<string, number> = {};

  data.forEach(item => {
    const dt = toDate(item.date);
    if (!dt) return;
    const monthYear = format(dt, "MMM yyyy");   // e.g. "May 2025"
    monthlyData[monthYear] = (monthlyData[monthYear] || 0) + item.value;
  });

  return Object.entries(monthlyData).map(([date, value]) => ({ date, value }));
};
