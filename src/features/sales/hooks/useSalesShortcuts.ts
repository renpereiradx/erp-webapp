import { useEffect, RefObject } from 'react';

interface UseSalesShortcutsProps {
  activeTab: string;
  productSearchInputRef: RefObject<HTMLElement | null>;
}

export const useSalesShortcuts = ({
  activeTab,
  productSearchInputRef
}: UseSalesShortcutsProps) => {
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (activeTab !== 'new-sale') return;

      if (event.key === 'F2') {
        event.preventDefault();
        productSearchInputRef.current?.focus();
        return;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTab, productSearchInputRef]);
};
