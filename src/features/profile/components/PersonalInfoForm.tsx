import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from '@/types';
import { ProfileFormState } from '../types';

interface PersonalInfoFormProps {
  userData: User;
  profileForm: ProfileFormState;
  setProfileForm: (state: ProfileFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  t: any;
}

export function PersonalInfoForm({ userData, profileForm, setProfileForm, onSubmit, t }: PersonalInfoFormProps) {
  return (
    <Card className="border-border-subtle shadow-card rounded-xl overflow-hidden glass-mica">
      <CardHeader className="bg-background-light/50 dark:bg-background-dark/50 border-b border-border-subtle py-4 px-6">
        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
          <span className="material-symbols-outlined text-lg text-primary">contact_page</span>
          {t('profile.personal_info', 'Información Personal')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark ml-1">{t('profile.first_name', 'Nombre')}</label>
              <Input 
                value={profileForm.first_name} 
                onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})} 
                className="h-10 text-sm focus-visible:ring-primary" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark ml-1">{t('profile.last_name', 'Apellido')}</label>
              <Input 
                value={profileForm.last_name} 
                onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})} 
                className="h-10 text-sm focus-visible:ring-primary" 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark ml-1">{t('profile.email', 'Correo Electrónico')}</label>
            <Input 
              value={userData.email} 
              disabled 
              className="h-10 bg-background-light dark:bg-background-dark/50 opacity-70 text-sm" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark ml-1">{t('profile.phone', 'Teléfono')}</label>
            <Input 
              value={profileForm.phone} 
              onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} 
              className="h-10 text-sm focus-visible:ring-primary" 
            />
          </div>
          <Button type="submit" className="w-full bg-surface-light dark:bg-surface-dark border border-border-subtle text-text-primary-light dark:text-text-primary-dark hover:bg-primary hover:text-white font-bold text-xs h-10 rounded-lg transition-all shadow-sm">
            {t('profile.update_profile', 'Actualizar Datos')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
