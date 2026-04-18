import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import useUserStore from '@/store/useUserStore';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
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
import { cn } from '@/lib/utils';
import { User } from '@/types';
import { Eye, EyeOff, Shield, Lock, User as UserIcon, Mail, Phone } from 'lucide-react';

interface UserModalProps {
  user?: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserModal({ user, open, onOpenChange }: UserModalProps) {
  const { t } = useI18n();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const isEdit = !!user;
  
  const { roles, fetchRoles, createUser, updateUser } = useUserStore() as any;

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      role: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchRoles();
      if (user) {
        form.reset({
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.roles?.[0]?.id || '',
          password: '', // Password is not loaded for editing
        });
      } else {
        form.reset({
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          password: '',
          role: '',
          phone: '',
        });
      }
    }
  }, [open, user, fetchRoles, form]);

  const handleSubmit = async (data: any) => {
    try {
      if (isEdit && user) {
        // According to API: PUT /api/v1/users/{id}
        const payload = {
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
        };
        const result = await updateUser(user.id, payload);
        if (result.success) {
          toast.success(t('users.form.updateSuccess') || 'Usuario actualizado correctamente');
          onOpenChange(false);
        } else {
          toast.error(result.error || t('users.form.updateError') || 'Error al actualizar usuario');
        }
      } else {
        // According to API: POST /api/v1/users
        const payload = {
          first_name: data.firstName,
          last_name: data.lastName,
          username: data.username,
          email: data.email,
          password: data.password,
          role_ids: data.role ? [data.role] : []
        };
        const result = await createUser(payload);
        if (result.success) {
          toast.success(t('users.form.createSuccess') || 'Usuario creado correctamente');
          onOpenChange(false);
        } else {
          toast.error(result.error || t('users.form.createError') || 'Error al crear usuario');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Error de conexión');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-fluent-64 rounded-2xl bg-white animate-in zoom-in-95 duration-200">
        <DialogHeader className="bg-slate-50/80 border-b border-border-subtle p-8 space-y-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <UserIcon size={22} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-text-main tracking-tight uppercase leading-none">
                {isEdit ? t('users.form.editTitle') || 'Editar Usuario' : t('users.form.createTitle')}
              </DialogTitle>
              <DialogDescription className="text-text-secondary text-sm font-medium mt-1">
                {isEdit ? t('users.form.editDescription') : t('users.form.createDescription')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
            
            {/* Personal Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <UserIcon size={16} className="text-primary" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('users.form.personalInfo')}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-bold text-text-secondary ml-1">{t('users.form.firstName')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('users.form.firstNamePlaceholder')} 
                          className="h-11 rounded-xl border-border-subtle bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-bold text-text-secondary ml-1">{t('users.form.lastName')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('users.form.lastNamePlaceholder')} 
                          className="h-11 rounded-xl border-border-subtle bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-bold text-text-secondary ml-1">{t('users.form.username')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('users.form.usernamePlaceholder')} 
                          className="h-11 rounded-xl border-border-subtle bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-bold text-text-secondary ml-1">{t('users.form.phone') || 'Teléfono'}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <Input 
                            placeholder="+595 9xx xxx xxx" 
                            className="h-11 pl-10 rounded-xl border-border-subtle bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Credentials Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Lock size={16} className="text-primary" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('users.form.credentials')}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-bold text-text-secondary ml-1">{t('users.form.email')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <Input 
                            type="email"
                            placeholder={t('users.form.emailPlaceholder')} 
                            className="h-11 pl-10 rounded-xl border-border-subtle bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider" />
                    </FormItem>
                  )}
                />
                
                {!isEdit && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-bold text-text-secondary ml-1">{t('users.form.password')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"}
                              className="h-11 pr-12 rounded-xl border-border-subtle bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
                              {...field} 
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold uppercase tracking-wider" />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Role & Permissions (Create only in this simplified version as per backend requirements) */}
            {!isEdit && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Shield size={16} className="text-primary" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {t('users.form.accessControl')}
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-bold text-text-secondary ml-1">{t('users.form.role')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl border-border-subtle bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm">
                            <SelectValue placeholder={t('users.form.rolePlaceholder') || "Seleccionar un rol"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl shadow-fluent-16 border-border-subtle">
                          {roles.map((role: any) => (
                            <SelectItem key={role.id} value={role.id} className="text-xs font-bold uppercase tracking-wider py-2">
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider" />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </form>
        </Form>

        <DialogFooter className="bg-slate-50/50 border-t border-border-subtle p-6 px-8 flex items-center justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="h-11 px-6 rounded-xl border-border-subtle bg-white font-black uppercase text-[10px] tracking-[0.15em] hover:bg-slate-50 transition-all"
          >
            {t('users.form.discard')}
          </Button>
          <Button 
            onClick={form.handleSubmit(handleSubmit)}
            className="h-11 px-8 rounded-xl bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-[0.15em] shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? t('common.loading') : isEdit ? (t('users.form.saveButton') || 'Guardar Cambios') : t('users.form.createButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
