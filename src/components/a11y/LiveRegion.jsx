import React, { useEffect, useState } from 'react';

/**
 * Componente para anuncios de accesibilidad usando live regions
 * Comunica cambios importantes a usuarios de screen readers
 */
const LiveRegion = ({ 
  message, 
  priority = 'polite',
  clearDelay = 5000,
  className = 'sr-only' 
}) => {
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      console.log(`[a11y] Live region announced (${priority}):`, message);

      // Limpiar mensaje después del delay
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearDelay);

      return () => clearTimeout(timer);
    }
  }, [message, clearDelay, priority]);

  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={className}
      role="status"
    >
      {currentMessage}
    </div>
  );
};

/**
 * Hook para gestionar múltiples live regions
 */
export const useLiveRegion = () => {
  const [announcements, setAnnouncements] = useState([]);

  const announce = (message, priority = 'polite') => {
    const id = Date.now();
    const announcement = { id, message, priority };
    
    setAnnouncements(prev => [...prev, announcement]);

    // Auto-remove después de 5 segundos
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  const LiveRegions = () => (
    <>
      {announcements.map(({ id, message, priority }) => (
        <LiveRegion
          key={id}
          message={message}
          priority={priority}
        />
      ))}
    </>
  );

  return { announce, LiveRegions };
};

export default LiveRegion;
