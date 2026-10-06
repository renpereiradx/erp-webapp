import React from 'react';
import { cn } from '@/lib/utils';

interface HighlightTextProps {
  text: string | undefined | null;
  /** Término de búsqueda a resaltar; vacío ⇒ texto íntegro sin marcas. */
  term: string | undefined | null;
  className?: string;
  /** Override de las clases del <mark> (p. ej. contraste sobre fila resaltada). */
  markClassName?: string;
}

/**
 * HighlightText — resalta las ocurrencias de `term` dentro de `text`
 * (convención DESIGN.md §13: el usuario debe VER por qué un resultado
 * apareció). Partición por índices con indexOf case-insensitive: sin regex
 * sobre el input del usuario (los caracteres especiales se tratan literal)
 * y sin dangerouslySetInnerHTML.
 */
const HighlightTextComponent = ({ text, term, className, markClassName }: HighlightTextProps) => {
  const safeText = text ?? '';
  const needle = (term ?? '').trim();

  if (!needle) {
    return <span className={className}>{safeText}</span>;
  }

  const lowerText = safeText.toLowerCase();
  const lowerNeedle = needle.toLowerCase();

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let idx = lowerText.indexOf(lowerNeedle);
  let key = 0;
  while (idx !== -1) {
    if (idx > cursor) {
      parts.push(<span key={key++}>{safeText.slice(cursor, idx)}</span>);
    }
    parts.push(
      <mark
        key={key++}
        className={cn('rounded-xs bg-primary/15 px-0.5 text-inherit', markClassName)}
      >
        {safeText.slice(idx, idx + needle.length)}
      </mark>,
    );
    cursor = idx + needle.length;
    idx = lowerText.indexOf(lowerNeedle, cursor);
  }
  if (cursor < safeText.length) {
    parts.push(<span key={key++}>{safeText.slice(cursor)}</span>);
  }

  return <span className={className}>{parts}</span>;
};

export const HighlightText = React.memo(HighlightTextComponent);
export default HighlightText;
