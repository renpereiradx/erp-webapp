import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';

interface PasswordInputProps {
  id: string;
  value: string;
  placeholder?: string;
  autoComplete?: string;
  state?: '' | 'error' | 'success' | 'warning';
  onChange: (value: string) => void;
}

/** Password input with a show/hide toggle (DESIGN §11.2: icon-only button carries aria-label). */
export function PasswordInput({
  id,
  value,
  placeholder,
  autoComplete,
  state,
  onChange,
}: PasswordInputProps) {
  const { t } = useI18n() as unknown as { t: (key: string, fallback?: string) => string };
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        state={state}
        onChange={(event) => onChange(event.target.value)}
        className="pr-10"
      />
      <button
        type="button"
        aria-label={
          visible
            ? t('profile.password.hide', 'Ocultar contraseña')
            : t('profile.password.show', 'Mostrar contraseña')
        }
        title={
          visible
            ? t('profile.password.hide', 'Ocultar contraseña')
            : t('profile.password.show', 'Mostrar contraseña')
        }
        onClick={() => setVisible((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors duration-150"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
