import React, { createContext, useContext, useMemo } from 'react';
import { useLiveRegionSafe } from '@/hooks/useLiveRegionSafe';

/**
 * Announcement / Live Region Context
 * Provee funciones de announce global y una única región aria-live.
 */
const AnnouncementContext = createContext(null);

export const AnnouncementProvider = ({ children }) => {
  const live = useLiveRegionSafe({ politeness: 'polite', atomic: true, relevant: 'additions text', clearDelay: 4000 });

  const value = useMemo(() => ({
    announce: live.announce,
    announceSuccess: live.announceSuccess,
    announceError: live.announceError,
    announceWarning: live.announceWarning,
    announceLoading: live.announceLoading,
    announceFormValidation: live.announceFormValidation,
    announceFormSaved: live.announceFormSaved,
  }), [live]);

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
      {/* Región aria-live global oculta */}
      <div id="global-live-region" {...live.liveRegionProps} />
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncement = () => {
  const ctx = useContext(AnnouncementContext);
  if (!ctx) {
    // Fallback silencioso para evitar errores en pruebas si el provider no está montado
    return {
      announce: () => {},
      announceSuccess: () => {},
      announceError: () => {},
      announceWarning: () => {},
      announceLoading: () => {},
      announceFormValidation: () => {},
      announceFormSaved: () => {},
    };
  }
  return ctx;
};

export default AnnouncementContext;
