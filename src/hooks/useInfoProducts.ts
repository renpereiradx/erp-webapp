/**
 * DEPRECATED: This hook was used for local financial logic.
 * It's being phased out in favor of backend profitability APIs.
 */
export const useInfoProducts = () => {
  return {
    isAnalyzing: false,
    analysisError: null,
    searchInfo: async () => ({ data: [], total: 0 }),
    getByBarcodeInfo: async () => null,
    getByIdInfo: async () => null,
    analyzeProfitability: () => null,
    compareProducts: () => [],
    getFinancialSummary: () => null,
    clearError: () => {}
  };
};
