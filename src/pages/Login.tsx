/**
 * Login Page — acceso al sistema ERP.
 * Alineada al Design System (DESIGN.md): tokens semánticos (§2), componentes
 * de src/components/ui/ (§1.2: Button/Input/Label + PasswordInput compartido),
 * tipografía semántica (§3), espaciado por tokens (§4) y validación Zod en
 * src/domain/auth/ (§1.4, §6.4).
 */

import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CircleAlert, DraftingCompass, ShieldCheck } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { SystemVersionBadge } from '@/components/SystemVersionBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/features/profile/components/PasswordInput';
import { DEMO_CONFIG } from '@/config/demoAuth';
import {
  EMPTY_LOGIN_FORM,
  fieldErrorsFromZod,
  loginFormSchema,
  type LoginFormErrors,
  type LoginFormValues,
} from '@/domain/auth/loginForm';

const Login = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState<LoginFormValues>(EMPTY_LOGIN_FORM);
  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});

  useEffect(() => {
    // Limpiar errores previos al desmontar el componente
    return () => clearError();
  }, [clearError]);

  const setField = (field: 'username' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Feedback inmediato: el error del campo se limpia al tipear
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsed = loginFormSchema.safeParse(formData);
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }
    setFieldErrors({});

    try {
      const result = await login(parsed.data);
      if (result.success) {
        navigate('/select-branch');
      }
    } catch {
      // El error es manejado por el AuthContext y mostrado al usuario.
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-md">
      {DEMO_CONFIG.enabled && (
        <div className="fixed top-md right-md z-50 flex items-center gap-xs rounded-full bg-warning px-md py-xs text-body-sm-bold text-white shadow-fluent-8">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {t('login.demo_mode', 'Modo Demo Activo')}
        </div>
      )}

      <div className="w-full max-w-md animate-in fade-in duration-200">
        <section className="bg-surface rounded-md shadow-whisper border-0 overflow-hidden p-lg">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-sm pb-md">
            <div className="size-14 rounded-md bg-primary flex items-center justify-center text-on-primary">
              <DraftingCompass className="size-7" aria-hidden="true" />
            </div>
            <h1 className="text-headline-lg-mobile md:text-headline-lg text-foreground">
              {t('login.title', 'Acceso al Sistema')}
            </h1>
            <p className="text-body-md text-on-surface-deep">
              {t('login.subtitle', 'Ingresa tus credenciales para continuar')}
            </p>
          </div>

          {/* Form (§6.4) */}
          <form autoComplete="off" noValidate onSubmit={handleSubmit} className="space-y-md">
            <div className="space-y-sm">
              <Label htmlFor="username" className="text-body-md-bold text-foreground">
                {t('login.username_label', 'Email o Usuario')}
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={(e) => setField('username', e.target.value)}
                state={fieldErrors.username ? 'error' : ''}
                placeholder={t('login.username.placeholder', 'Ingresa tu usuario')}
              />
              {fieldErrors.username && (
                <p className="text-body-md text-error">
                  {t(fieldErrors.username, fieldErrors.username)}
                </p>
              )}
            </div>

            <div className="space-y-sm">
              <Label htmlFor="password" className="text-body-md-bold text-foreground">
                {t('login.password_label', 'Contraseña')}
              </Label>
              <PasswordInput
                id="password"
                value={formData.password}
                autoComplete="current-password"
                state={fieldErrors.password ? 'error' : ''}
                placeholder={t('login.password.placeholder', 'Ingresa tu contraseña')}
                onChange={(value) => setField('password', value)}
              />
              {fieldErrors.password && (
                <p className="text-body-md text-error">
                  {t(fieldErrors.password, fieldErrors.password)}
                </p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-sm rounded-xs bg-error-container p-md text-on-error-container animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                <p className="text-body-sm-bold">{t(error, error)}</p>
              </div>
            )}

            <Button type="submit" variant="primary" block size="lg" loading={loading} className="gap-xs">
              {loading ? (
                t('login.loading', 'Iniciando Sesión...')
              ) : (
                <>
                  {t('login.submit', 'Iniciar Sesión')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>
        </section>

        <p className="mt-lg text-center text-label-caps uppercase text-on-surface-deep">
          &copy; {new Date().getFullYear()} &bull; {t('login.footer.brand', 'ERP System')} &bull;{' '}
          {/* PLAN_VERSION_UI_FRONTEND: pre-auth también muestra la versión (/version es sin auth). */}
          <SystemVersionBadge />
        </p>
      </div>
    </div>
  );
};

export default Login;
