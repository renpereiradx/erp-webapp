import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordFormState } from '../types';

interface SecuritySettingsFormProps {
  passwordForm: PasswordFormState;
  setPasswordForm: (state: PasswordFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  t: any;
}

/** Calcula fortaleza de contraseña 0-4 */
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const clamped = Math.min(score, 4);
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const colors = ['', 'bg-fluent-danger', 'bg-fluent-warning', 'bg-yellow-400', 'bg-fluent-success'];
  return { score: clamped, label: labels[clamped], color: colors[clamped] };
}

export function SecuritySettingsForm({ passwordForm, setPasswordForm, onSubmit, t }: SecuritySettingsFormProps) {
  const strength = getPasswordStrength(passwordForm.new_password);

  return (
    <Card className="border-border-subtle shadow-card rounded-xl overflow-hidden glass-mica">
      <CardHeader className="bg-background-light/50 dark:bg-background-dark/50 border-b border-border-subtle py-4 px-6">
        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
          <span className="material-symbols-outlined text-lg text-primary">lock</span>
          {t('profile.security_settings', 'Seguridad')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">

          {/* Contraseña actual */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark ml-1">
              {t('profile.current_password', 'Contraseña Actual')}
            </label>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              className="h-10 font-mono text-sm focus-visible:ring-primary"
              autoComplete="current-password"
            />
          </div>

          {/* Nueva contraseña + indicador de fortaleza */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark ml-1">
              {t('profile.new_password', 'Nueva Contraseña')}
            </label>
            <Input
              type="password"
              placeholder={t('profile.min_chars', 'Mínimo 8 caracteres')}
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              className="h-10 font-mono text-sm focus-visible:ring-primary"
              autoComplete="new-password"
            />
            {/* Barra de fortaleza */}
            {passwordForm.new_password && (
              <div className="pt-1 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        step <= strength.score ? strength.color : 'bg-background-light dark:bg-background-dark'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-semibold text-text-secondary-light dark:text-text-secondary-dark ml-0.5">
                  Seguridad: <span className={`${
                    strength.score <= 1 ? 'text-fluent-danger' :
                    strength.score === 2 ? 'text-fluent-warning' :
                    strength.score === 3 ? 'text-yellow-500' : 'text-fluent-success'
                  } font-bold`}>{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark ml-1">
              {t('profile.confirm_password', 'Confirmar Contraseña')}
            </label>
            <Input
              type="password"
              placeholder="Repite la nueva contraseña"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              className={`h-10 font-mono text-sm focus-visible:ring-primary ${
                passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password
                  ? 'border-fluent-danger focus-visible:ring-fluent-danger'
                  : ''
              }`}
              autoComplete="new-password"
            />
            {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
              <p className="text-[10px] text-fluent-danger font-semibold ml-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                Las contraseñas no coinciden
              </p>
            )}
          </div>

          {/* Toggle: cerrar otras sesiones */}
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-border-subtle hover:bg-primary/5 transition-colors group">
            <div className="mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={passwordForm.logout_other_sessions ?? false}
                onChange={(e) => setPasswordForm({ ...passwordForm, logout_other_sessions: e.target.checked })}
                className="w-4 h-4 accent-primary rounded"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary-light dark:text-text-primary-dark group-hover:text-primary transition-colors">
                Cerrar todas las demás sesiones activas
              </p>
              <p className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark mt-0.5 leading-relaxed">
                Al cambiar tu contraseña, todas las sesiones en otros dispositivos serán invalidadas por seguridad.
              </p>
            </div>
          </label>

          <Button
            type="submit"
            disabled={
              !passwordForm.current_password ||
              !passwordForm.new_password ||
              passwordForm.new_password !== passwordForm.confirm_password
            }
            className="w-full bg-surface-dark dark:bg-surface-light text-text-primary-dark dark:text-text-primary-light hover:bg-primary disabled:opacity-40 font-bold text-xs h-10 rounded-lg transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-base mr-1.5">lock_reset</span>
            {t('profile.update_password', 'Actualizar Contraseña')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
