import type { MyRequestListItem } from '@/api';

/** Approved REQ-DEC-009 vocabulary. Unknown values fall back to raw data. */
export const CHANNEL_LABELS: Record<string, string> = {
  app: 'App',
  whatsapp: 'WhatsApp',
  phone: 'Phone',
};

export const STATUS_LABELS: Record<string, string> = {
  contact_initiated: 'Contact initiated',
  pending: 'Pending',
  accepted: 'Accepted',
  completed: 'Completed',
  not_completed: 'Not completed',
  cancelled: 'Cancelled',
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function labelFor(value: string, labels: Record<string, string>): string {
  return labels[value] ?? value.replace(/_/g, ' ');
}

/**
 * Backend `createdAt` uses `optional()->toJSON()` with microseconds, e.g.
 * `2026-11-18T09:12:33.000000Z`. Normalise to a Date-parsable UTC string before
 * formatting instead of assuming strict ISO-8601 parsing.
 */
export function formatCreatedAt(value: string | null): string {
  if (value === null || value.length === 0) {
    return '—';
  }

  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ? `${value.slice(0, 19)}Z`
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = MONTHS[date.getUTCMonth()] ?? '';
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes} UTC`;
}

export function vehicleSummary(item: MyRequestListItem): string {
  const summary = item.vehicle_summary;
  const parts = [summary?.labelNumber, summary?.modelName].filter(
    (part): part is string => typeof part === 'string' && part.length > 0,
  );
  return parts.length > 0 ? parts.join(' · ') : 'Vehicle unavailable';
}

export function serviceNames(item: MyRequestListItem): string[] {
  return item.services_summary.map(
    (service) => service.name?.en || service.name?.ar || `Service #${service.id}`,
  );
}

export function servicesSummary(item: MyRequestListItem): string {
  const names = serviceNames(item);
  return names.length > 0 ? names.join(', ') : 'No services listed';
}
