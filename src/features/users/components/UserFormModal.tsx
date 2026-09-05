import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, ExternalLink, Lock, Mail, Phone, Shield, Star, User as UserIcon } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import useUserStore from '@/store/useUserStore';
import { branchService } from '@/features/branches/services/branchService';
import type { Branch, UserBranchAccess } from '@/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

import { emptyUserForm, getUserFormSchema } from '../schemas/userForm.schema';
import type { UserFormMode, UserFormValues } from '../schemas/userForm.schema';
import type { Role, TFn } from '../types';

interface UserFormModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

interface UsersStoreSlice {
  roles: Role[];
  fetchRoles: () => Promise<void>;
  createUser: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
}

const inputClass = 'h-11 rounded-input';

/** Create/edit user dialog, validated with Zod (DESIGN §6.4). */
export function UserFormModal({ user, open, onOpenChange, onSaved }: UserFormModalProps) {
  const { t } = useI18n() as unknown as { t: TFn };
  const { roles, fetchRoles, createUser, updateUser } = useUserStore() as UsersStoreSlice;
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const isEdit = Boolean(user);
  const mode: UserFormMode = isEdit ? 'edit' : 'create';

  const form = useForm<UserFormValues>({
    resolver: zodResolver(getUserFormSchema(mode)),
    defaultValues: emptyUserForm,
  });

  // D.2 (PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES): sección de solo lectura con
  // las sucursales asignadas. La asignación se administra únicamente desde
  // Configuración → Sucursales (fuente de verdad única); acá solo se informa.
  const { data: accessResponse, isLoading: loadingAccess } = useQuery({
    queryKey: ['user-branches', user?.id],
    queryFn: () => branchService.getUserBranches(user!.id),
    enabled: open && isEdit && Boolean(user?.id),
  });
  const userAccessList: UserBranchAccess[] =
    (accessResponse as { access?: UserBranchAccess[] })?.access ||
    (accessResponse as unknown as { data?: UserBranchAccess[] })?.data ||
    [];

  const { data: branchesResponse } = useQuery({
    queryKey: ['branches-names'],
    queryFn: () => branchService.getBranches({ page_size: 100 }),
    enabled: open && isEdit && Boolean(user?.id),
    staleTime: 1000 * 60 * 5,
  });
  const branchNameById = new Map<number, string>(
    ((branchesResponse as { branches?: Branch[] })?.branches || []).map((b) => [b.id, b.name]),
  );

  useEffect(() => {
    if (!open) return;
    fetchRoles();
    setShowPassword(false);
    form.reset(
      user
        ? {
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            username: user.username || '',
            email: user.email || '',
            phone: user.phone || '',
            password: '',
            role: user.roles?.[0]?.id || '',
          }
        : emptyUserForm,
    );
  }, [open, user, fetchRoles, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (isEdit && user) {
      const result = await updateUser(user.id, {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        phone: values.phone,
      });
      if (result.success) {
        toast.success(t('users.form.updateSuccess', 'Usuario actualizado correctamente'));
        onOpenChange(false);
        onSaved?.();
      } else {
        toast.error(result.error || t('users.form.updateError', 'Error al actualizar el usuario'));
      }
      return;
    }

    const result = await createUser({
      first_name: values.firstName,
      last_name: values.lastName,
      username: values.username,
      email: values.email,
      password: values.password,
      role_ids: values.role ? [values.role] : [],
    });
    if (result.success) {
      toast.success(t('users.form.createSuccess', 'Usuario creado correctamente'));
      onOpenChange(false);
      onSaved?.();
    } else {
      toast.error(result.error || t('users.form.createError', 'Error al crear el usuario'));
    }
  });

  const sectionTitle = 'flex items-center gap-sm pb-sm border-b border-divider text-label-caps uppercase text-on-surface-deep';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-0 shadow-fluent-16 rounded-xl bg-surface">
        <DialogHeader className="bg-surface-muted border-b border-divider p-lg space-y-xs">
          <div className="flex items-center gap-sm">
            <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <UserIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-title-md text-foreground">
                {isEdit
                  ? t('users.form.editTitle', 'Editar Usuario')
                  : t('users.form.createTitle', 'Crear Nuevo Usuario')}
              </DialogTitle>
              <DialogDescription className="text-body-md text-on-surface-deep">
                {isEdit
                  ? t('users.form.editDescription', 'Modifique los detalles del perfil y la configuración de acceso del usuario.')
                  : t('users.form.createDescription', 'Configure un nuevo perfil organizacional con roles específicos y credenciales de seguridad.')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="p-lg space-y-lg max-h-[70vh] overflow-y-auto">
            <section className="space-y-md">
              <h3 className={sectionTitle}>
                <UserIcon className="size-4 text-primary" />
                {t('users.form.personalInfo', 'Información Personal')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="space-y-xs">
                      <FormLabel className="text-body-md-bold text-foreground">{t('users.form.firstName', 'Nombre')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('users.form.firstNamePlaceholder', 'ej. Alex')} {...field} />
                      </FormControl>
                      <FormMessage className="text-body-sm text-error" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-xs">
                      <FormLabel className="text-body-md-bold text-foreground">{t('users.form.lastName', 'Apellido')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('users.form.lastNamePlaceholder', 'ej. Morgan')} {...field} />
                      </FormControl>
                      <FormMessage className="text-body-sm text-error" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-xs">
                      <FormLabel className="text-body-md-bold text-foreground">{t('users.form.username', 'Nombre de Usuario')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('users.form.usernamePlaceholder', 'ej. amorgan')}
                          disabled={isEdit}
                          className={isEdit ? 'opacity-70' : ''}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage className="text-body-sm text-error" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-xs">
                      <FormLabel className="text-body-md-bold text-foreground">{t('users.form.phone', 'Teléfono')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline" />
                          <Input placeholder="+595 9xx xxx xxx" className={`${inputClass} pl-10`} {...field} value={field.value ?? ''} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-body-sm text-error" />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="space-y-md">
              <h3 className={sectionTitle}>
                <Lock className="size-4 text-primary" />
                {t('users.form.credentials', 'Credenciales de Cuenta')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-xs">
                      <FormLabel className="text-body-md-bold text-foreground">{t('users.form.email', 'Correo Laboral')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline" />
                          <Input type="email" placeholder={t('users.form.emailPlaceholder', 'alex.morgan@company.com')} className={`${inputClass} pl-10`} {...field} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-body-sm text-error" />
                    </FormItem>
                  )}
                />

                {!isEdit && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-xs">
                        <FormLabel className="text-body-md-bold text-foreground">{t('users.form.password', 'Contraseña Inicial')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              className={`${inputClass} pr-10`}
                              {...field}
                              value={field.value ?? ''}
                            />
                            <button
                              type="button"
                              aria-label={showPassword ? t('users.form.hidePassword', 'Ocultar Contraseña') : t('users.form.showPassword', 'Mostrar Contraseña')}
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                            >
                              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-body-sm text-error" />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </section>

            {!isEdit && (
              <section className="space-y-md">
                <h3 className={sectionTitle}>
                  <Shield className="size-4 text-primary" />
                  {t('users.form.accessControl', 'Control de Acceso')}
                </h3>
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-xs">
                      <FormLabel className="text-body-md-bold text-foreground">{t('users.form.role', 'Rol Asignado')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger className={`${inputClass} w-full`}>
                            <SelectValue placeholder={t('users.form.rolePlaceholder', 'Seleccionar un rol organizacional')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-md shadow-fluent-8">
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-body-sm text-error" />
                    </FormItem>
                  )}
                />
                <p className="text-body-sm text-on-surface-deep">
                  {t(
                    'users.form.branches.createNote',
                    'Al crear el usuario se le otorga acceso automático a la sucursal principal. Los accesos se ajustan luego en Configuración → Sucursales.',
                  )}
                </p>
              </section>
            )}

            {isEdit && user && (
              <section className="space-y-md">
                <h3 className={sectionTitle}>
                  <Building2 className="size-4 text-primary" />
                  {t('users.form.branches.title', 'Sucursales Asignadas')}
                </h3>
                {loadingAccess ? (
                  <p className="text-body-sm text-on-surface-deep">
                    {t('users.form.branches.loading', 'Cargando sucursales...')}
                  </p>
                ) : userAccessList.length === 0 ? (
                  <p className="text-body-sm text-on-surface-deep">
                    {t('users.form.branches.empty', 'Sin sucursales asignadas.')}
                  </p>
                ) : (
                  <ul className="rounded-md border border-divider divide-y divide-divider overflow-hidden">
                    {userAccessList.map((acc) => (
                      <li
                        key={acc.id}
                        className="flex items-center justify-between gap-sm bg-surface px-md py-sm"
                      >
                        <span className="flex min-w-0 items-center gap-sm text-body-md text-foreground">
                          <Building2 className="size-4 shrink-0 text-on-surface-deep" />
                          <span className="truncate">
                            {branchNameById.get(acc.branch_id) ||
                              t('branches.withId', 'Sucursal {{id}}', { id: acc.branch_id })}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-xs">
                          {acc.is_default_branch && (
                            <span className="flex items-center gap-xs rounded-sm bg-primary/10 px-xs py-0.5 text-label-caps uppercase text-primary">
                              <Star className="size-3" />
                              {t('users.form.branches.default', 'Por defecto')}
                            </span>
                          )}
                          <span className="text-body-sm text-on-surface-deep">{acc.access_type}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/configuracion/sucursales')}
                  className="flex items-center gap-xs rounded-sm text-body-sm-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <ExternalLink className="size-4" />
                  {t('users.form.branches.manageLink', 'Administrar accesos en Configuración → Sucursales')}
                </button>
              </section>
            )}
          </form>
        </Form>

        <DialogFooter className="bg-surface-muted border-t border-divider p-md lg:p-lg flex items-center justify-end gap-sm">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('users.form.discard', 'Descartar Cambios')}
          </Button>
          <Button variant="primary" onClick={() => void handleSubmit()} loading={form.formState.isSubmitting}>
            {isEdit
              ? t('users.form.saveButton', 'Guardar Cambios')
              : t('users.form.createButton', 'Crear Perfil de Usuario')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
