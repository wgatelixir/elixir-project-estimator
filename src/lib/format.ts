const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const hoursFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatHours(value: number): string {
  return `${hoursFormatter.format(value)}h`;
}

/** Signed delta for complexity legends, e.g. "+2h", "-1h", "0h". */
export function formatHoursDelta(value: number): string {
  if (value === 0) return "0h";
  const formatted = hoursFormatter.format(value);
  return value > 0 ? `+${formatted}h` : `${formatted}h`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
