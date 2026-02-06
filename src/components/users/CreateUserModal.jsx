import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import useUserStore from '@/store/useUserStore';
import { useI18n } from '@/lib/i18n';
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

export function CreateUserModal({ open, onOpenChange, onSubmit }) {
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  
  const { roles, fetchRoles, createUser } = useUserStore();

  React.useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open, fetchRoles]);

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      role: '',
    },
  });

  const handleSubmit = async (data) => {
    // Prepare data for store/API
     const payload = {
        first_name: data.firstName,
        last_name: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
        role_ids: data.role ? [data.role] : []
    };

    if (onSubmit) {
      // Pass raw form data to parent handler
      await onSubmit(data);
    } else {
      // Default behavior: Use store
      await createUser(payload);
    }
    
    onOpenChange(false);
    form.reset();
  };

  const getPasswordStrength = (password) => {
    if (!password) return 0;
    
    // New Backend Requirements: min 4 chars
    if (password.length < 4) return 10; // Very weak
    if (password.length < 6) return 30; // Weak but valid
    if (password.length < 8) return 60; // Medium
    
    // Strong password: 8+ chars and some complexity
    let strength = 80;
    if (/[A-Z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 10;
    
    return Math.min(strength, 100);
  };

  const isPasswordValid = (password) => {
    return password.length >= 4;
  };

  const passwordValue = form.watch('password');
  const strength = getPasswordStrength(passwordValue);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="user-form sm:max-w-[900px] p-0 overflow-hidden border-none shadow-64"
      >
        <DialogHeader className="user-form__header">
          <DialogTitle className="user-form__title">
            {t('users.form.createTitle')}
          </DialogTitle>
          <DialogDescription className="user-form__description">
            {t('users.form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="user-form__body">
            {/* Personal Info Section */}
            <div className="user-form__section">
              <div className="user-form__section-header">
                <span className="material-symbols-outlined user-form__section-icon">person</span>
                <h3 className="user-form__section-title">
                  {t('users.form.personalInfo')}
                </h3>
              </div>
              <div className="user-form__grid">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="user-form__field">
                      <FormLabel className="user-form__label">
                        {t('users.form.firstName')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('users.form.firstNamePlaceholder')} 
                          className="user-form__input"
                          autoComplete="off"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="user-form__field">
                      <FormLabel className="user-form__label">
                        {t('users.form.lastName')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('users.form.lastNamePlaceholder')} 
                          className="user-form__input"
                          autoComplete="off"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="user-form__grid mt-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="user-form__field">
                      <FormLabel className="user-form__label">
                        {t('users.form.username')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('users.form.usernamePlaceholder')} 
                          className="user-form__input"
                          autoComplete="off"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Credentials Section */}
            <div className="user-form__section">
              <div className="user-form__section-header">
                <span className="material-symbols-outlined user-form__section-icon">lock_open</span>
                <h3 className="user-form__section-title">
                  {t('users.form.credentials')}
                </h3>
              </div>
              <div className="user-form__grid">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="user-form__field">
                      <div className="user-form__label-wrapper">
                        <FormLabel className="user-form__label">
                          {t('users.form.email')}
                        </FormLabel>
                        {field.value && field.value.includes('@') && (
                          <span className="user-form__status-badge user-form__status-badge--success">
                            <span className="material-symbols-outlined">check_circle</span> 
                            {t('users.form.emailAvailable')}
                          </span>
                        )}
                      </div>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder={t('users.form.emailPlaceholder')} 
                          className={cn(
                            "user-form__input",
                            field.value && field.value.includes('@') && "user-form__input--success"
                          )}
                          autoComplete="off"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="user-form__field">
                      <div className="user-form__label-wrapper">
                        <FormLabel className="user-form__label">
                          {t('users.form.password')}
                        </FormLabel>
                        <Button 
                          type="button" 
                          variant="ghost"
                          size="icon"
                          className="user-form__visibility-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </Button>
                      </div>
                      <FormControl>
                        <Input 
                          type={showPassword ? "text" : "password"}
                          className="user-form__input"
                          autoComplete="new-password"
                          {...field} 
                        />
                      </FormControl>
                      
                      {/* Strength Meter */}
                      <div className="user-form__strength">
                        <div className="user-form__strength-bar">
                          <div 
                            className={cn(
                              "user-form__strength-fill",
                              strength <= 25 ? "user-form__strength-fill--weak" : 
                              strength <= 75 ? "user-form__strength-fill--medium" : "user-form__strength-fill--strong"
                            )}
                            style={{ width: `${strength}%` }}
                          />
                        </div>
                        <div className="user-form__strength-info">
                          <p className="user-form__strength-text">
                            {t('users.form.strength')} <span className={cn(
                              "user-form__strength-label",
                              strength <= 35 ? "text-error" : strength <= 75 ? "text-warning" : "text-success"
                            )}>
                              {strength <= 35 ? t('users.form.strengthWeak') : strength <= 75 ? t('users.form.strengthMedium') : t('users.form.strengthStrong')}
                            </span>
                          </p>
                          <p className="user-form__strength-hint">{t('users.form.strengthMessage')}</p>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="user-form__section">
              <div className="user-form__section-header">
                <span className="material-symbols-outlined user-form__section-icon">shield_person</span>
                <h3 className="user-form__section-title">
                  {t('users.form.accessControl')}
                </h3>
              </div>
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="user-form__field">
                    <FormLabel className="user-form__label">
                      {t('users.form.role')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="user-form__select-trigger" style={{ pointerEvents: 'auto' }}>
                          <SelectValue placeholder={t('users.form.rolePlaceholder') || "Seleccionar un rol"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[10001]">
                        {roles.length > 0 ? (
                          roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            Cargando roles...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="user-form__hint">
                      {t('users.form.roleHelp')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <DialogFooter className="user-form__footer">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => onOpenChange(false)}
                className="user-form__cancel-btn"
              >
                {t('users.form.discard')}
              </Button>
              <Button 
                type="submit" 
                className="user-form__submit-btn"
                disabled={!form.watch('role') || !isPasswordValid(passwordValue) || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? t('common.loading') : t('users.form.createButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
