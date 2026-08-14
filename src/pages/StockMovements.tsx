/**
 * Página Stock Movements — delegado fino que ensambla el feature.
 * (docs/guides/typescript-migration.md: pages/ actúan como orchestrators delegados;
 * la lógica y UI viven en src/features/stock-movements/)
 */

import { StockMovementsPage } from '@/features/stock-movements';

const StockMovements = () => <StockMovementsPage />;

export default StockMovements;
