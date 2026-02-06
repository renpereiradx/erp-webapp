import React, { useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function EditUserModal({ user, open, onOpenChange }) {
  const { t } = useI18n();
  const { updateUser } = useUserStore();

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, open, form]);

  const handleSubmit = async (data) => {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      username: data.username,
      email: data.email,
      phone: data.phone,
    };

    const result = await updateUser(user.id, payload);
    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="user-form sm:max-w-[600px] p-0 overflow-hidden border-none shadow-64"
      >
        <DialogHeader className="user-form__header">
          <DialogTitle className="user-form__title">
            {t('users.form.editTitle') || 'Editar Usuario'}
          </DialogTitle>
          <DialogDescription className="user-form__description">
            {t('users.form.editDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="user-form__body">
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

            <div className="user-form__section">
              <div className="user-form__section-header">
                <span className="material-symbols-outlined user-form__section-icon">contact_mail</span>
                <h3 className="user-form__section-title">
                  {t('users.form.contactInfo') || 'Información de Contacto'}
                </h3>
              </div>
              <div className="user-form__grid">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="user-form__field">
                      <FormLabel className="user-form__label">
                        {t('users.form.email')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder={t('users.form.emailPlaceholder')} 
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="user-form__field">
                      <FormLabel className="user-form__label">
                        {t('users.form.phone') || 'Teléfono'}
                      </FormLabel>
                      <FormControl>
                        <Input 
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
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? t('common.loading') : (t('users.form.saveButton') || 'Guardar Cambios')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
