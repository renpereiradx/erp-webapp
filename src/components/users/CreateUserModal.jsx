import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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

export function CreateUserModal({ open, onOpenChange, onSubmit }) {
  const { t } = useTranslation();
  
  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Editor',
    },
  });

  const handleSubmit = (data) => {
    onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="user-form-modal__content sm:max-w-[800px] p-0">
        <DialogHeader className="user-form-modal__header">
          <DialogTitle className="user-form-modal__title">
            {t('users.form.createTitle')}
          </DialogTitle>
          <DialogDescription className="user-form-modal__description">
            {t('users.form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="user-form-modal__form">
            {/* Personal Info Section */}
            <div className="user-form-modal__section">
              <div className="user-form-modal__section-header">
                <span className="material-symbols-outlined">person</span>
                <h3 className="user-form-modal__section-title">
                  {t('users.form.personalInfo')}
                </h3>
              </div>
              <div className="user-form-modal__row">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="user-form-modal__field-group">
                      <FormLabel className="user-form-modal__label">
                        {t('users.form.firstName')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('users.form.firstNamePlaceholder')} 
                          className="user-form-modal__input"
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
                    <FormItem className="user-form-modal__field-group">
                      <FormLabel className="user-form-modal__label">
                        {t('users.form.lastName')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('users.form.lastNamePlaceholder')} 
                          className="user-form-modal__input"
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
            <div className="user-form-modal__section">
              <div className="user-form-modal__section-header">
                <span className="material-symbols-outlined">lock_open</span>
                <h3 className="user-form-modal__section-title">
                  {t('users.form.credentials')}
                </h3>
              </div>
              <div className="user-form-modal__section">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="user-form-modal__field-group">
                      <div className="user-form-modal__label-row">
                        <FormLabel className="user-form-modal__label">
                          {t('users.form.email')}
                        </FormLabel>
                        {field.value && field.value.includes('@') && (
                          <span className="user-form-modal__available-badge">
                            <span className="material-symbols-outlined">check_circle</span> 
                            {t('users.form.emailAvailable')}
                          </span>
                        )}
                      </div>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder={t('users.form.emailPlaceholder')} 
                          className={`user-form-modal__input ${field.value && field.value.includes('@') ? 'user-form-modal__input--valid' : ''}`}
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
                    <FormItem className="user-form-modal__field-group">
                      <div className="user-form-modal__label-row">
                        <FormLabel className="user-form-modal__label">
                          {t('users.form.password')}
                        </FormLabel>
                        <button type="button" className="user-form-modal__show-password">
                          {t('users.form.showPassword')}
                        </button>
                      </div>
                      <FormControl>
                        <Input 
                          type="password"
                          className="user-form-modal__input"
                          {...field} 
                        />
                      </FormControl>
                      {/* Strength Meter */}
                      {field.value && (
                        <div className="user-form-modal__strength-meter">
                          <div className="user-form-modal__strength-bar-bg">
                            <div 
                              className={`user-form-modal__strength-bar-fill ${
                                field.value.length > 8 ? 'user-form-modal__strength-bar-fill--strong' : 'user-form-modal__strength-bar-fill--weak'
                              }`}
                            ></div>
                          </div>
                          <div className="user-form-modal__strength-text">
                            <p>
                              {t('users.form.strength')} <span className={field.value.length > 8 ? 'strong' : 'weak'}>
                                {field.value.length > 8 ? t('users.form.strengthStrong') : 'Weak'}
                              </span>
                            </p>
                            <p>{t('users.form.strengthMessage')}</p>
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="user-form-modal__section">
              <div className="user-form-modal__section-header">
                <span className="material-symbols-outlined">shield_person</span>
                <h3 className="user-form-modal__section-title">
                  {t('users.form.accessControl')}
                </h3>
              </div>
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="user-form-modal__field-group">
                    <FormLabel className="user-form-modal__label">
                      {t('users.form.role')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="user-form-modal__input">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Editor">{t('users.roles.editor')}</SelectItem>
                        <SelectItem value="Administrator">{t('users.roles.admin')}</SelectItem>
                        <SelectItem value="Viewer">{t('users.roles.viewer')}</SelectItem>
                        <SelectItem value="Billing Manager">{t('users.roles.billingManager')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="user-form-modal__helper-text">
                      {t('users.form.roleHelp')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="user-form-modal__footer">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="px-6 h-11"
              >
                {t('users.form.discard')}
              </Button>
              <Button 
                type="submit" 
                className="px-8 h-11"
              >
                {t('users.form.createButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        
        {/* Subtle Help Footer */}
        <div className="user-form-modal__help-footer">
          <a href="#">
            <span className="material-symbols-outlined">help</span> {t('users.form.helpCenter')}
          </a>
          <a href="#">
            <span className="material-symbols-outlined">policy</span> {t('users.form.permissionGuidelines')}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
