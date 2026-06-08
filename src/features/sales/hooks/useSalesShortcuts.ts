import { useEffect, RefObject } from 'react';

interface UseSalesShortcutsProps {
  activeTab: string;
  productSearchInputRef: RefObject<HTMLElement>;
  clientSearchInputRef: RefObject<HTMLElement>;
}

export const useSalesShortcuts = ({
  activeTab,
  productSearchInputRef,
  clientSearchInputRef
}: UseSalesShortcutsProps) => {
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (activeTab !== 'new-sale') return;

      if (event.key === 'F2') {
        event.preventDefault();
        productSearchInputRef.current?.focus();
        return;
      }

      if (event.key === 'F3') {
        event.preventDefault();
        clientSearchInputRef.current?.focus();
        return;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTab, productSearchInputRef, clientSearchInputRef]);
};
