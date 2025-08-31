import React from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { useThemeStyles } from '../../hooks/useThemeStyles';

const Pagination = ({ page, totalPages, setPage }) => {
  const { styles } = useThemeStyles();
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button
        variant="outline"
        className={styles.button('secondary')}
        onClick={() => setPage(1)}
        disabled={page === 1}
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        className={styles.button('secondary')}
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className={`text-sm font-bold ${styles.label()}`}>
        Página {page} de {totalPages}
      </span>
      <Button
        variant="outline"
        className={styles.button('secondary')}
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        className={styles.button('secondary')}
        onClick={() => setPage(totalPages)}
        disabled={page === totalPages}
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination;
