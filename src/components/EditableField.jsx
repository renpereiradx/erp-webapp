import React from 'react';

/**
 * Accessible inline editable field with optimistic save support.
 * Props:
 * - value
 * - label (aria label)
 * - type: 'text' | 'number'
 * - name (form field key)
 * - onSave(newValue) => Promise<boolean>|boolean (return false to rollback UI)
 * - validate(value) => string|undefined (error message)
 * - disabled
 */
export default function EditableField({ value, label, type='text', name, onSave, validate, disabled }) {
  const [editing, setEditing] = React.useState(false);
  const [local, setLocal] = React.useState(value ?? '');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => { if (!editing) setLocal(value ?? ''); }, [value, editing]);

  const start = () => { if (!disabled) { setError(''); setEditing(true); } };
  const cancel = () => { setEditing(false); setLocal(value ?? ''); setError(''); };

  const commit = async () => {
    const msg = validate ? validate(local) : '';
    if (msg) { setError(msg); return; }
    if (local === value) { setEditing(false); return; }
    setSaving(true);
    const res = await Promise.resolve(onSave?.(local));
    setSaving(false);
    if (res === false) { // rollback signaled
      setError('Error al guardar');
      setLocal(value ?? '');
      return;
    }
    setEditing(false);
  };

  return (
    <div className="inline-flex items-center gap-1 text-xs" aria-live="polite">
      {!editing && (
        <>
          <span>{value === null || value === undefined || value === '' ? '—' : value}</span>
          <button type="button" onClick={start} disabled={disabled} className="underline text-primary focus:outline-none focus:ring-2 focus:ring-ring/50">Editar</button>
        </>
      )}
      {editing && (
        <form onSubmit={(e) => { e.preventDefault(); commit(); }} className="flex items-center gap-1">
          <input
            aria-label={label}
            name={name}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            type={type}
            className="px-1 py-0.5 border rounded focus:outline-none focus:ring w-24"
            disabled={saving}
            autoFocus
          />
          <button type="submit" disabled={saving} className="text-green-600 font-medium">{saving ? '...' : 'OK'}</button>
          <button type="button" onClick={cancel} disabled={saving} className="text-red-500 font-medium">X</button>
          {error && <span role="alert" className="text-red-500 ml-1">{error}</span>}
        </form>
      )}
    </div>
  );
}
