import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from '@/types';

interface ProfileHeaderProps {
  userData: User;
  onUpdateClick: () => void;
  t: any;
}

export function ProfileHeader({ userData, onUpdateClick, t }: ProfileHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-fluent-shadow border border-border-subtle">
      {/* The Hero Banner */}
      <div className="relative w-full bg-gradient-to-r from-primary to-primary/80 dark:from-primary/90 dark:to-primary/60 px-6 sm:px-10 py-8 sm:py-10 overflow-hidden">
        
        {/* Decorative background effects */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-center justify-between gap-8">
          
          {/* Left: Avatar + Info */}
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
            
            {/* Avatar */}
            <div className="relative shrink-0 group/avatar">
              <div className="relative rounded-full border-4 border-white/20 bg-white/10 overflow-hidden shadow-lg transition-transform duration-300 group-hover/avatar:scale-105">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 !rounded-full">
                  {userData.avatar_url && <AvatarImage src={userData.avatar_url} className="object-cover" />}
                <AvatarFallback className="bg-white !text-primary font-display text-4xl sm:text-5xl font-bold tracking-tight shadow-inner">
                  {userData.first_name?.[0] || ''}{userData.last_name?.[0] || ''}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <button 
              className="absolute bottom-1 right-1 size-8 rounded-full bg-white text-primary shadow-md flex items-center justify-center hover:bg-slate-50 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50 z-20"
              title="Cambiar foto de perfil"
            >
              <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
            </button>
          </div>

          {/* Text Info */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              {userData.first_name} {userData.last_name}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <div className="flex items-center gap-1.5 text-sm font-medium text-white/90">
                <span className="material-symbols-outlined text-[18px] opacity-80">alternate_email</span>
                <span>{userData.username}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-white/90">
                <span className="material-symbols-outlined text-[18px] opacity-80">mail</span>
                <span>{userData.email}</span>
              </div>
            </div>
            
            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <Badge variant="outline" className="bg-white/20 !text-white hover:bg-white/30 transition-colors border-white/30 font-semibold px-3 py-1 text-xs backdrop-blur-sm">
                {userData.roles?.[0]?.name || 'USER'}
              </Badge>
              <Badge variant="outline" className="bg-emerald-400/20 !text-white hover:bg-emerald-400/30 transition-colors border-emerald-400/30 font-semibold px-3 py-1 text-xs flex items-center gap-1.5 backdrop-blur-sm">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Activo
              </Badge>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex shrink-0 w-full md:w-auto justify-center">
          <Button 
            onClick={onUpdateClick} 
            variant="outline"
            className="w-full md:w-auto bg-white !text-primary border-none hover:bg-slate-50 shadow-md font-bold text-sm h-11 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
            {t('profile.update_profile_btn', 'Actualizar Perfil')}
          </Button>
        </div>

        </div>
      </div>
    </div>
  );
}
