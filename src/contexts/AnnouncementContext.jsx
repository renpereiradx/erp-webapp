import React, { createContext, useContext, useMemo } from 'react';
import { useLiveRegionSafe } from '@/hooks/useLiveRegionSafe';

/**
 * Announcement / Live Region Context
 * Provee funciones de announce global y una única región aria-live.
 */
const AnnouncementContext = createContext(null);

export const AnnouncementProvider = ({ children }) => {
  const live = useLiveRegionSafe({ 
    politeness: 'polite', 
    atomic: true, 
    relevant: 'additions text', 
    clearDelay: 4000,
    enableTelemetry: false // Disable telemetry to avoid potential issues in StrictMode
  });

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
  // Always return fallback functions since AnnouncementProvider is temporarily disabled
  return {
    announce: () => {},
    announceSuccess: () => {},
    announceError: () => {},
    announceWarning: () => {},
    announceLoading: () => {},
    announceFormValidation: () => {},
    announceFormSaved: () => {},
  };
};

export default AnnouncementContext;
