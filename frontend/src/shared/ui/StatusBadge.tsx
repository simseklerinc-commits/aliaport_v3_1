export type StatusBadgeKind =
  | 'aktifPasif'
  | 'tarifeDurum'
  | 'cariRol'
  | 'generic';

interface StatusBadgeProps {
  kind: StatusBadgeKind;
  value: string | boolean | number | undefined | null;
  className?: string;
  title?: string;
  /** Override label mapping */
  labelMap?: Record<string, string>;
}

// Tailwind style presets
const styles = {
  base: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border',
  green: 'bg-green-100 text-green-700 border-green-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-300',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
};

function renderAktifPasif(v: any) {
  const aktif = v !== false && v !== 0 && v !== '0';
  return { label: aktif ? 'Aktif' : 'Pasif', style: aktif ? styles.green : styles.gray };
}

function renderTarifeDurum(v: string) {
  switch (v) {
    case 'AKTIF':
      return { label: 'Aktif', style: styles.green };
    case 'TASLAK':
      return { label: 'Taslak', style: styles.yellow };
    case 'PASIF':
    default:
      return { label: 'Pasif', style: styles.gray };
  }
}

function renderCariRol(v: string) {
  switch (v) {
    case 'MUSTERI':
      return { label: 'Müşteri', style: styles.blue };
    case 'TEDARIKCI':
      return { label: 'Tedarikçi', style: styles.green };
    default:
      return { label: 'Diğer', style: styles.purple };
  }
}

export function StatusBadge({ kind, value, className = '', title, labelMap }: StatusBadgeProps) {
  let label = typeof value === 'string' ? value : String(value);
  let style = styles.gray;

  if (kind === 'aktifPasif') {
    const r = renderAktifPasif(value);
    label = r.label;
    style = r.style;
  } else if (kind === 'tarifeDurum' && typeof value === 'string') {
    const r = renderTarifeDurum(value);
    label = r.label;
    style = r.style;
  } else if (kind === 'cariRol' && typeof value === 'string') {
    const r = renderCariRol(value);
    label = r.label;
    style = r.style;
  } else if (kind === 'generic' && typeof value === 'string') {
    // generic mapping override
    if (labelMap && labelMap[value]) label = labelMap[value];
  }

  return (
    <span className={`${styles.base} ${style} ${className}`} title={title || label} aria-label={label}>
      {label}
    </span>
  );
}

export default StatusBadge;
