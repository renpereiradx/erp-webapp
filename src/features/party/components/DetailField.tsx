import type { ReactNode } from 'react';

interface DetailFieldProps {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  children?: ReactNode;
}

/** Campo de solo-lectura para modales de detalle (label caps + valor). */
const DetailField = ({ label, value, mono = false, children }: DetailFieldProps) => (
  <div className="space-y-xs">
    <span className="text-label-caps uppercase text-on-surface-deep block">
      {label}
    </span>
    {children ?? (
      <span
        className={`${
          mono ? 'text-data-mono font-data-mono' : 'text-body-md font-medium'
        } text-foreground`}
      >
        {value ?? '-'}
      </span>
    )}
  </div>
);

export default DetailField;
