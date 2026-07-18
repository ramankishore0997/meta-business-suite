export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Resolve a stored object path (e.g. `/objects/uploads/uuid`) to a URL the
 * browser can load through the API server's storage route.
 */
export function mediaSrc(
  objectPath: string | null | undefined,
): string | undefined {
  if (!objectPath) return undefined;
  if (objectPath.startsWith("http")) return objectPath;
  return `/api/storage${objectPath}`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}
