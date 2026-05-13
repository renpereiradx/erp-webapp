import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import userService from '@/services/userService';
import { User } from '@/types';
import { ProfileFormState, PasswordFormState } from '../types';

export function useProfile() {
  const { t } = useI18n();
  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<User | null>(null);
  
  const [profileForm, setProfileForm] = useState<ProfileFormState>({ 
    first_name: '', 
    last_name: '', 
    phone: '' 
  });
  
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({ 
    current_password: '', 
    new_password: '', 
    confirm_password: '' 
  });

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getMe();
      if (response.success && response.data) {
        setUserData(response.data);
        setProfileForm({ 
          first_name: response.data.first_name || '', 
          last_name: response.data.last_name || '', 
          phone: response.data.phone || '' 
        });
      }
    } catch (error) { 
      toast.error(t('profile.errors.fetch_failed')); 
    } finally { 
      setLoading(false); 
    }
  }, [t]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const updateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const response = await userService.updateMe(profileForm);
      if (response.success) { 
        toast.success(t('profile.success.update')); 
        fetchProfileData(); 
      }
    } catch (error) { 
      toast.error(t('profile.errors.update_failed')); 
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) { 
      toast.error(t('profile.errors.password_mismatch')); 
      return; 
    }
    try {
      const response = await userService.changeMyPassword({ 
        current_password: passwordForm.current_password, 
        new_password: passwordForm.new_password, 
        logout_other_sessions: passwordForm.logout_other_sessions ?? false
      });
      if (response.success) { 
        toast.success(t('profile.success.password_changed')); 
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' }); 
      }
    } catch (error: any) { 
      toast.error(error.response?.data?.error?.message || t('profile.errors.password_change_failed')); 
    }
  };

  return {
    loading,
    userData,
    profileForm,
    setProfileForm,
    passwordForm,
    setPasswordForm,
    updateProfile,
    changePassword,
    fetchProfileData
  };
}
