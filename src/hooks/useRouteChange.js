/**
 * Hook personalizado para detectar cambios de ruta y ejecutar cleanup
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const useRouteChange = (callback, dependencies = []) => {
  const location = useLocation();
  const previousLocation = useRef(location);

  useEffect(() => {
    // Si cambió la ruta (pathname diferente)
    if (previousLocation.current.pathname !== location.pathname) {
      if (typeof callback === 'function') {
        callback(previousLocation.current, location);
      }
      previousLocation.current = location;
    }
  }, [location, callback, ...dependencies]);

  return location;
};

export default useRouteChange;