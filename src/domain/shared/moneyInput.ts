/**
 * moneyInput — thousands-separator formatting for numeric INPUTS (es-PY).
 *
 * Money inputs must show grouped digits as the operator types (10000 →
 * "10.000") while the code keeps parsing the plain number. Use the pair on
 * every controlled money input of the sales flow:
 *
 *   value={formatNumberInput(state)}
 *   onChange={e => setState(parseNumberInput(e.target.value))}
 *
 * Convention es-PY: DOT = thousands grouping, COMMA = decimal point
 * (1.234,5). Dots are ALWAYS grouping (stripped on parse), so backspacing a
 * formatted value ("12.345" → "12.34" → "12.3") removes digits monotonically
 * without ambiguity. Quantity inputs with real decimals keep plain number
 * inputs — this helper targets PYG money (integers).
 */

/**
 * Removes thousand separators and noise from an input value. Returns the
 * canonical numeric string (digits, optional leading minus, optional decimal
 * point from a typed comma).
 */
export function parseNumberInput(raw: string): string {
  if (!raw) return '';
  let s = raw.replace(/[^0-9.,-]/g, '');
  s = s.replace(/\./g, ''); // dots are ALWAYS grouping — strip
  s = s.replace(/,/g, '.'); // comma is the decimal point (es-PY)
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    // keep only the first dot as decimal
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }
  s = s.replace(/(?!^)-/g, ''); // minus only allowed leading
  s = s.replace(/\.+$/, ''); // no trailing dot
  return s;
}

/**
 * Formats a canonical numeric string with es-PY grouping for display in an
 * input: thousands with dots, decimals after a comma ("1234.5" → "1.234,5").
 * Empty/invalid yields '' (not '0') so a controlled input can be transiently
 * empty while typing.
 */
export function formatNumberInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (str === '') return '';

  // Canonical state values use the JS convention ('1234.5' = dot decimal):
  // group the integer part and render the decimal as a comma.
  const canonical = str.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (canonical) {
    const [, sign, intRaw, decPart] = canonical;
    const intPart = intRaw.replace(/^0+(?=\d)/, ''); // '01' → '1'
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const dec = decPart !== undefined ? `,${decPart}` : '';
    return `${sign}${grouped}${dec}`;
  }

  // Not canonical (e.g. a raw pasted/user-edited value): parse with the input
  // convention (dots = grouping) before formatting.
  const normalized = parseNumberInput(str);
  if (normalized === '' || normalized === '-' || normalized === '.') return '';
  const neg = normalized.startsWith('-');
  const unsigned = neg ? normalized.slice(1) : normalized;
  const [intPart, decPart] = unsigned.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = decPart !== undefined ? `,${decPart}` : '';
  return `${neg ? '-' : ''}${grouped}${dec}`;
}

/**
 * Convenience for onChange handlers: takes the raw input value and returns
 * the canonical (unformatted) string for state.
 */
export function onNumberInputChange(raw: string): string {
  return parseNumberInput(raw);
}
