// Date & time helper functions (UTC ISO8601 ↔ localized display & form inputs)

// =====================
// Format: ISO8601 → Display
// =====================

export function formatDateTime(iso?: string | null, locale = 'tr-TR') {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(locale);
}

export function formatDate(iso?: string | null, locale = 'tr-TR') {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale);
}

export function relativeTime(iso?: string | null, locale: string = 'tr') {
  if (!iso) return '-';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (absSec < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
  const diffMonth = Math.round(diffDay / 30);
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
  const diffYear = Math.round(diffMonth / 12);
  return rtf.format(diffYear, 'year');
}

// =====================
// Parse: ISO8601 → Form Input Values
// =====================

/**
 * ISO8601 datetime → HTML date input value (YYYY-MM-DD)
 * 
 * @example
 * parseISODate('2025-01-20T14:30:00Z') → '2025-01-20'
 * parseISODate('2025-01-20') → '2025-01-20'
 */
export function parseISODate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  
  // YYYY-MM-DD formatı (local timezone)
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ISO8601 datetime → HTML datetime-local input value (YYYY-MM-DDTHH:mm)
 * 
 * @example
 * parseISODateTime('2025-01-20T14:30:00Z') → '2025-01-20T14:30'
 */
export function parseISODateTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  
  // YYYY-MM-DDTHH:mm formatı (local timezone)
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * ISO8601 datetime → HTML time input value (HH:mm)
 * 
 * @example
 * parseISOTime('2025-01-20T14:30:00Z') → '14:30'
 */
export function parseISOTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// =====================
// Parse: Form Input Values → ISO8601
// =====================

/**
 * HTML date input value (YYYY-MM-DD) → ISO8601 date string
 * 
 * @example
 * toISODate('2025-01-20') → '2025-01-20'
 */
export function toISODate(dateValue: string): string {
  if (!dateValue) return '';
  // Date input zaten YYYY-MM-DD formatında, direkt döndür
  return dateValue;
}

/**
 * HTML datetime-local input value (YYYY-MM-DDTHH:mm) → ISO8601 datetime string
 * 
 * @example
 * toISODateTime('2025-01-20T14:30') → '2025-01-20T14:30:00Z' (UTC)
 */
export function toISODateTime(datetimeValue: string): string {
  if (!datetimeValue) return '';
  const d = new Date(datetimeValue);
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
}

/**
 * Date input + Time input → ISO8601 datetime string
 * 
 * @example
 * combineDateAndTime('2025-01-20', '14:30') → '2025-01-20T14:30:00Z'
 */
export function combineDateAndTime(dateValue: string, timeValue: string): string {
  if (!dateValue || !timeValue) return '';
  const d = new Date(`${dateValue}T${timeValue}`);
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
}

// =====================
// Validation Helpers
// =====================

/**
 * Validate ISO8601 date string
 */
export function isValidISODate(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return !isNaN(d.getTime());
}

/**
 * Today's date as ISO8601 date string (YYYY-MM-DD)
 */
export function todayISODate(): string {
  const d = new Date();
  return parseISODate(d.toISOString());
}

/**
 * Now as ISO8601 datetime string
 */
export function nowISODateTime(): string {
  return new Date().toISOString();
}
