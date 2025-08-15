import React from 'react';
import { useI18n } from '@/lib/i18n';

export default function EditableField({ value, label, type='text', name, onSave, validate, disabled, editing: editingProp, allowEnterSubmit = false }) {
  const { t } = useI18n();
  const resolvedLabel = label || (name === 'price' ? (t('field.price') || 'Precio') : name === 'stock' ? (t('field.stock') || 'Stock') : (t(`field.${name}`) || label || name));
  const [editingState, setEditingState] = React.useState(false);
  const isControlled = typeof editingProp === 'boolean';
  const isEditing = isControlled ? editingProp : editingState;
  const [local, setLocal] = React.useState(value ?? '');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef(null);
  const lastKeyWasEnterRef = React.useRef(false);

  React.useEffect(() => { if (!isEditing) setLocal(value ?? ''); }, [value, isEditing]);

  const start = () => { if (!disabled && !isControlled) { setError(''); setEditingState(true); } };
  const cancel = () => { if (!isControlled) setEditingState(false); setLocal(value ?? ''); setError(''); };

  const commit = async () => {
    const msg = validate ? validate(local) : '';
    // If validation message exists, normally block; but if commit was triggered via Enter key and allowEnterSubmit is true, allow handler to run
    if (msg && !(allowEnterSubmit && lastKeyWasEnterRef.current)) { setError(msg); return false; }
    if (local === value) { if (!isControlled) setEditingState(false); return true; }
    setSaving(true);
    // reset Enter flag before calling onSave
    lastKeyWasEnterRef.current = false;
    const res = await Promise.resolve(onSave?.(local));
    setSaving(false);
    if (res === false) { // rollback signaled
      setError(t('products.error.save') || 'Error al guardar');
      setLocal(value ?? '');
      return false;
    }
    if (!isControlled) setEditingState(false);
    return true;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      lastKeyWasEnterRef.current = true;
      commit();
    }
  };

  const handleEditButtonClick = () => {
    if (!isEditing) start(); else if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="inline-flex items-center gap-1 text-xs" aria-live="polite">
      {!isEditing && (
        <>
          <span>{value === null || value === undefined || value === '' ? '—' : value}</span>
          <button type="button" onClick={start} disabled={disabled} className="underline text-primary focus:outline-none focus:ring-2 focus:ring-ring/50">{t('action.edit') || 'Editar'}</button>
        </>
      )}
      {isEditing && (
        <div className="flex items-center gap-1">
          <form onSubmit={(e) => { e.preventDefault(); commit(); }} className="flex items-center gap-1">
            <input
              ref={inputRef}
              aria-label={resolvedLabel}
              name={name}
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              onKeyDown={handleKeyDown}
              type={type}
              className="px-1 py-0.5 border rounded focus:outline-none focus:ring w-24"
              disabled={saving}
              autoFocus
            />
            <button type="submit" disabled={saving} className="text-green-600 font-medium">{saving ? '...' : (t('products.inline.save') || 'OK')}</button>
            <button type="button" onClick={cancel} disabled={saving} className="text-red-500 font-medium">{t('products.inline.cancel') || 'X'}</button>
            {error && <span role="alert" className="text-red-500 ml-1">{error}</span>}
          </form>
          <button type="button" onClick={handleEditButtonClick} className="underline text-primary focus:outline-none focus:ring-2 focus:ring-ring/50">{t('action.edit') || 'Editar'}</button>
        </div>
      )}
    </div>
  );
}
