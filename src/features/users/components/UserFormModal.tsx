import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock, Mail, Phone, Shield, User as UserIcon } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import useUserStore from '@/store/useUserStore';
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
  const [showPassword, setShowPassword] = useState(false);

  const isEdit = Boolean(user);
  const mode: UserFormMode = isEdit ? 'edit' : 'create';

  const form = useForm<UserFormValues>({
    resolver: zodResolver(getUserFormSchema(mode)),
    defaultValues: emptyUserForm,
  });

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
