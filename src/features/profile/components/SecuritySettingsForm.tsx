import { KeyRound } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { scorePassword, strengthTone } from '@/domain/profile/passwordStrength';

import type { PasswordFormState } from '../types';
import { PasswordInput } from './PasswordInput';

interface SecuritySettingsFormProps {
  passwordForm: PasswordFormState;
  setPasswordForm: (state: PasswordFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const STRENGTH_LABEL_KEYS: Record<number, [string, string]> = {
  0: ['profile.password.strength.weak', 'Débil'],
  1: ['profile.password.strength.weak', 'Débil'],
  2: ['profile.password.strength.fair', 'Regular'],
  3: ['profile.password.strength.good', 'Buena'],
  4: ['profile.password.strength.strong', 'Fuerte'],
};

const TONE_CLASS: Record<string, { bar: string; text: string }> = {
  error: { bar: 'bg-error', text: 'text-error' },
  warning: { bar: 'bg-warning', text: 'text-warning' },
  success: { bar: 'bg-success', text: 'text-success' },
  none: { bar: 'bg-surface-subtle', text: 'text-on-surface-deep' },
};

/** Password change of the logged user, with live strength meter (semantic tones only). */
export function SecuritySettingsForm({ passwordForm, setPasswordForm, onSubmit }: SecuritySettingsFormProps) {
  const { t } = useI18n() as unknown as { t: (key: string, fallback?: string) => string };
  const strength = scorePassword(passwordForm.new_password);
  const tone = strengthTone(strength.level);
  const toneClass = TONE_CLASS[tone];
  const [strengthKey, strengthFallback] = STRENGTH_LABEL_KEYS[strength.score];
  const mismatch =
    Boolean(passwordForm.confirm_password) && passwordForm.new_password !== passwordForm.confirm_password;

  return (
    <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
      <h3 className="text-label-caps uppercase text-on-surface-deep flex items-center gap-sm mb-md">
        <KeyRound className="size-4 text-primary" />
        {t('profile.security_settings', 'Configuración de Seguridad')}
      </h3>
      <form onSubmit={onSubmit} className="space-y-md">
        <div className="space-y-xs">
          <Label htmlFor="profile-current-password" className="text-body-md-bold text-foreground">
            {t('profile.current_password', 'Contraseña Actual')}
          </Label>
          <PasswordInput
            id="profile-current-password"
            value={passwordForm.current_password}
            placeholder="••••••••••••"
            autoComplete="current-password"
            onChange={(value) => setPasswordForm({ ...passwordForm, current_password: value })}
          />
        </div>

        <div className="space-y-xs">
          <Label htmlFor="profile-new-password" className="text-body-md-bold text-foreground">
            {t('profile.new_password', 'Nueva Contraseña')}
          </Label>
          <PasswordInput
            id="profile-new-password"
            value={passwordForm.new_password}
            placeholder={t('profile.min_chars', 'Mín. 12 caracteres')}
            autoComplete="new-password"
            onChange={(value) => setPasswordForm({ ...passwordForm, new_password: value })}
          />
          {passwordForm.new_password && (
            <div className="pt-xs space-y-xs">
              <div className="flex gap-xs">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-colors duration-150 ${
                      step <= strength.score ? toneClass.bar : 'bg-surface-subtle'
                    }`}
                  />
                ))}
              </div>
              <p className="text-body-sm text-on-surface-deep">
                {t('profile.password.strength.label', 'Seguridad:')}{' '}
                <span className={`${toneClass.text} text-body-md-bold`}>{t(strengthKey, strengthFallback)}</span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-xs">
          <Label htmlFor="profile-confirm-password" className="text-body-md-bold text-foreground">
            {t('profile.confirm_password', 'Confirmar Nueva Contraseña')}
          </Label>
          <PasswordInput
            id="profile-confirm-password"
            value={passwordForm.confirm_password}
            placeholder={t('profile.password.placeholder.repeat', 'Repite la nueva contraseña')}
            state={mismatch ? 'error' : ''}
            autoComplete="new-password"
            onChange={(value) => setPasswordForm({ ...passwordForm, confirm_password: value })}
          />
          {mismatch && (
            <p className="text-body-md text-error" role="alert">
              {t('profile.password.mismatch', 'Las contraseñas no coinciden')}
            </p>
          )}
        </div>

        <div className="flex items-start gap-sm p-md rounded-md border border-border-subtle transition-colors duration-150 hover:bg-surface-muted">
          <Switch
            id="profile-logout-others"
            checked={passwordForm.logout_other_sessions ?? false}
            onCheckedChange={(checked) => setPasswordForm({ ...passwordForm, logout_other_sessions: checked })}
          />
          <div className="space-y-xs">
            <Label htmlFor="profile-logout-others" className="text-body-md-bold text-foreground">
              {t('profile.password.logout_others', 'Cerrar todas las demás sesiones activas')}
            </Label>
            <p className="text-body-sm text-on-surface-deep">
              {t(
                'profile.password.logout_others_hint',
                'Al cambiar tu contraseña, todas las sesiones en otros dispositivos serán invalidadas por seguridad.',
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-sm">
          <Button
            type="submit"
            variant="secondary"
            disabled={
              !passwordForm.current_password ||
              !passwordForm.new_password ||
              passwordForm.new_password !== passwordForm.confirm_password
            }
          >
            {t('profile.update_password', 'Actualizar Contraseña')}
          </Button>
        </div>
      </form>
    </div>
  );
}
