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
    if (msg && !(allowEnterSubmit && lastKeyWasEnterRef.current)) { setError(msg); return false; }
    if (local === value) { if (!isControlled) setEditingState(false); return true; }
    setSaving(true);
    lastKeyWasEnterRef.current = false;
    const res = await Promise.resolve(onSave?.(local));
    setSaving(false);
    if (res === false) {
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
    <div className="inline-flex items-center gap-1 text-xs" aria-live="polite" data-testid={isEditing ? `editable-${name}-editing` : `editable-${name}-display`}>
      {!isEditing && (
        <>
          <span>{value === null || value === undefined || value === '' ? '—' : value}</span>
          <button type="button" onClick={start} disabled={disabled} className="underline text-primary focus:outline-none focus:ring-2 focus:ring-ring/50" data-testid={`editable-${name}-edit`}>{t('action.edit') || 'Editar'}</button>
        </>
      )}
      {isEditing && (
        <div className="flex items-center gap-1">
          <form onSubmit={(e) => { e.preventDefault(); commit(); }} className="flex items-center gap-1" data-testid={`editable-${name}-form`}>
            <input
              ref={inputRef}
              aria-label={resolvedLabel}
              name={name}
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              onKeyDown={handleKeyDown}
              type={type}
              className="w-24 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving}
              autoFocus
              data-testid={`editable-${name}-input`}
            />
            <button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors" data-testid={`editable-${name}-save`} style={{ fontSize: '0.85em', padding: '0.25em 0.5em' }}>{saving ? '...' : (t('products.inline.save') || 'OK')}</button>
            <button type="button" onClick={cancel} disabled={saving} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border px-4 py-2 rounded-md font-medium transition-colors" data-testid={`editable-${name}-cancel`} style={{ fontSize: '0.85em', padding: '0.25em 0.5em' }}>{t('products.inline.cancel') || 'X'}</button>
            {error && <span role="alert" className="text-red-500 ml-1" data-testid={`editable-${name}-error`}>{error}</span>}
          </form>
          <button type="button" onClick={handleEditButtonClick} className="underline text-primary focus:outline-none focus:ring-2 focus:ring-ring/50" data-testid={`editable-${name}-focus`}>{t('action.edit') || 'Editar'}</button>
        </div>
      )}
    </div>
  );
}
