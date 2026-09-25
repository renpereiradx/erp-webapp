import type { ReactNode } from 'react';

interface DetailFieldProps {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  children?: ReactNode;
}

/** Campo de solo-lectura para modales de detalle (label caps + valor). */
const DetailField = ({ label, value, mono = false, children }: DetailFieldProps) => (
  // min-w-0: sin él, un valor mono sin espacios (ID largo) expande la columna
  // del grid y desborda el modal en vez de cortar dentro de la celda.
  <div className="space-y-xs min-w-0">
    <span className="text-label-caps uppercase text-on-surface-deep block">
      {label}
    </span>
    {children ?? (
      <span
        className={`${
          mono ? 'text-data-mono font-data-mono break-all' : 'text-body-md font-medium break-words'
        } text-foreground`}
      >
        {value ?? '-'}
      </span>
    )}
  </div>
);

export default DetailField;
