import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import userService from '@/services/userService';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function MyProfileAndSecurity() {
  const { t } = useI18n();
  
  // State for user data
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone: '',
    avatar_url: '',
    created_at: '',
    roles: [],
    sessions_count: 0
  });

  // State for forms
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Fetch user data on mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
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
      console.error('Error fetching profile:', error);
      toast.error(t('profile.errors.fetch_failed', 'Failed to load profile data'));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await userService.updateMe(profileForm);
      if (response.success) {
        toast.success(t('profile.success.update', 'Profile updated successfully'));
        fetchProfileData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('profile.errors.update_failed', 'Failed to update profile'));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error(t('profile.errors.password_mismatch', 'Passwords do not match'));
      return;
    }

    try {
      const response = await userService.changeMyPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        logout_other_sessions: false // Default behavior from spec
      });

      if (response.success) {
        toast.success(t('profile.success.password_changed', 'Password changed successfully'));
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      // Construct error message based on backend code if available
      const msg = error.response?.data?.error?.message || t('profile.errors.password_change_failed', 'Failed to change password');
      toast.error(msg);
    }
  };

  const getUserInitials = () => {
    const first = userData.first_name?.charAt(0) || '';
    const last = userData.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
    );
  }

  return (
    <main className="my-profile">
      {/* Page Heading */}
      <div className="my-profile__header">
        <h1 className="my-profile__title">{t('profile.title', 'My Profile & Security Settings')}</h1>
        <p className="my-profile__subtitle">{t('profile.subtitle', 'Manage your personal information, security credentials, and active device sessions.')}</p>
      </div>

      {/* Profile Header Card */}
      <Card className="my-profile__profile-card">
        <CardContent className="my-profile__profile-card-content">
          <div className="my-profile__user-info">
             <div className="my-profile__avatar-wrapper">
                <Avatar className="w-28 h-28 border-4 border-white shadow-lg">
                  <AvatarImage src={userData.avatar_url} alt={`${userData.first_name} ${userData.last_name}`} />
                  <AvatarFallback className="text-3xl font-bold bg-neutral-100 text-neutral-500">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                
                <button className="my-profile__avatar-edit">
                  <span className="material-symbols-outlined">photo_camera</span>
                </button>
             </div>

             <div className="my-profile__details">
                <h3 className="my-profile__name">{userData.first_name} {userData.last_name}</h3>
                <p className="my-profile__email">{userData.email}</p>
                <div className="my-profile__badges">
                    {userData.roles.map(role => (
                        <Badge key={role.id} variant="primary">
                            {role.name}
                        </Badge>
                    ))}
                    <Badge variant={userData.status === 'active' ? 'success' : 'warning'}>
                        {userData.status}
                    </Badge>
                </div>
             </div>
          </div>

          <div className="my-profile__actions">
             <Button variant="primary" className="w-auto min-w-[140px]">
                {t('profile.update_profile_btn', 'Update Profile')}
             </Button>
          </div>
        </CardContent>
      </Card>

      <div className="my-profile__grid">
        {/* Personal Info Card */}
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">contact_page</span>
                    {t('profile.personal_info', 'Personal Information')}
                </CardTitle>
             </CardHeader>

             <CardContent>
                 <form onSubmit={handleProfileUpdate} className="my-profile__form">
                    <div className="my-profile__form-row-2">
                        <div className="my-profile__form-group">
                            <label className="my-profile__label">{t('profile.first_name', 'First Name')}</label>
                            <Input 
                                type="text" 
                                value={profileForm.first_name}
                                onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                            />
                        </div>
                        <div className="my-profile__form-group">
                            <label className="my-profile__label">{t('profile.last_name', 'Last Name')}</label>
                            <Input 
                                type="text" 
                                value={profileForm.last_name}
                                onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="my-profile__form-group">
                        <label className="my-profile__label">{t('profile.email', 'Email Address')}</label>
                        <Input 
                            type="email" 
                            value={userData.email}
                            disabled
                        />
                    </div>

                    <div className="my-profile__form-group">
                        <label className="my-profile__label">{t('profile.phone', 'Phone Number')}</label>
                        <Input 
                            type="tel" 
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        />
                    </div>
                    
                    <div className="my-profile__form-group">
                        <label className="my-profile__label">{t('profile.department', 'Department')}</label>
                         <select className="my-profile__input h-11 px-4 rounded-lg bg-[#f0f2f4] border-none text-sm outline-none focus:ring-2 focus:ring-primary transition-shadow">
                            <option>Executive Management</option>
                            <option>Engineering</option>
                            <option>Product Design</option>
                        </select>
                    </div>

                    <div className="my-profile__form-actions">
                        <Button type="submit" variant="primary">
                            {t('profile.update_profile', 'Update Profile')}
                        </Button>
                    </div>
                 </form>
             </CardContent>
        </Card>

        {/* Security & Password Card */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">lock</span>
                    {t('profile.security_settings', 'Security Settings')}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={handlePasswordChange} className="my-profile__form">
                    <div className="my-profile__form-group">
                        <label className="my-profile__label">{t('profile.current_password', 'Current Password')}</label>
                        <Input 
                            type="password" 
                            placeholder="••••••••••••"
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                        />
                    </div>

                    <div className="my-profile__form-group">
                        <label className="my-profile__label">{t('profile.new_password', 'New Password')}</label>
                        <Input 
                            type="password" 
                            placeholder={t('profile.min_chars', 'Min. 12 characters')}
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                        />
                        {/* Password Strength Visual */}
                        <div className="my-profile__password-strength">
                            <div className="my-profile__strength-bar my-profile__strength-bar--filled"></div>
                            <div className="my-profile__strength-bar my-profile__strength-bar--filled"></div>
                            <div className="my-profile__strength-bar my-profile__strength-bar--filled"></div>
                            <div className="my-profile__strength-bar"></div>
                        </div>
                        <p className="my-profile__strength-text">{t('profile.strong_password', 'Strong Password')}</p>
                    </div>

                    <div className="my-profile__form-group">
                        <label className="my-profile__label">{t('profile.confirm_password', 'Confirm New Password')}</label>
                        <Input 
                            type="password" 
                            value={passwordForm.confirm_password}
                            onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                        />
                    </div>

                    <div className="my-profile__2fa-card">
                        <div className="my-profile__2fa-content">
                            <span className="material-symbols-outlined">vibration</span>
                            <div>
                                <p className="my-profile__2fa-title">{t('profile.2fa', 'Two-Factor Auth')}</p>
                                <p className="my-profile__2fa-subtitle">{t('profile.authenticator_app', 'Authenticator App enabled')}</p>
                            </div>
                        </div>
                        <button type="button" className="my-profile__link-button">{t('profile.manage', 'Manage')}</button>
                    </div>

                    <div className="my-profile__form-actions">
                        <Button type="submit" variant="primary">
                             {t('profile.update_password', 'Update Password')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
      </div>

      {/* Session Management */}
      <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-6">
                <CardTitle className="flex items-center gap-2 m-0">
                    <span className="material-symbols-outlined text-primary">devices</span>
                    {t('profile.active_sessions', 'Active Sessions')}
                </CardTitle>
                <button className="my-profile__signout-all-btn">
                     {t('profile.sign_out_all', 'Sign out of all other sessions')}
                </button>
          </CardHeader>
          
          <CardContent className="p-0">
              <div className="my-profile__sessions-list">
                 {/* Mock Session 1 - Current */}
                 <div className="my-profile__session-item px-6">
                     <div className="my-profile__session-info-group">
                         <div className="my-profile__session-icon my-profile__session-icon--current">
                            <span className="material-symbols-outlined">laptop_mac</span>
                         </div>
                         <div>
                             <div className="my-profile__session-details-row">
                                 <span className="my-profile__session-device">Chrome on macOS Monterey</span>
                                 <span className="my-profile__session-badge">Current</span>
                             </div>
                             <p className="my-profile__session-location">San Francisco, USA • 192.168.1.1</p>
                         </div>
                     </div>
                 </div>

                 {/* Mock Session 2 */}
                 <div className="my-profile__session-item px-6">
                     <div className="my-profile__session-info-group">
                         <div className="my-profile__session-icon">
                            <span className="material-symbols-outlined">smartphone</span>
                         </div>
                         <div>
                             <span className="my-profile__session-device">Safari on iPhone 15 Pro</span>
                             <p className="my-profile__session-location">San Francisco, USA • 2 hours ago</p>
                         </div>
                     </div>
                     <button className="my-profile__session-close">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                 </div>

                 {/* Mock Session 3 */}
                 <div className="my-profile__session-item px-6">
                     <div className="my-profile__session-info-group">
                         <div className="my-profile__session-icon">
                            <span className="material-symbols-outlined">desktop_windows</span>
                         </div>
                         <div>
                             <span className="my-profile__session-device">Firefox on Windows 11</span>
                             <p className="my-profile__session-location">Seattle, USA • 3 days ago</p>
                         </div>
                     </div>
                     <button className="my-profile__session-close">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                 </div>
              </div>
          </CardContent>
      </Card>

    </main>
  );
}
