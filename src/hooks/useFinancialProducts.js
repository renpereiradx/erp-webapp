import { useState, useCallback } from 'react';
import useProductStore from '@/store/useProductStore';

/**
 * Hook for working with financial enriched products
 * Provides easy access to financial product search and analysis functions
 */
export const useFinancialProducts = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Store methods
  const fetchProductByIdFinancial = useProductStore(state => state.fetchProductByIdFinancial);
  const searchProductByBarcodeFinancial = useProductStore(state => state.searchProductByBarcodeFinancial);
  const searchProductsFinancial = useProductStore(state => state.searchProductsFinancial);

  /**
   * Search for products with financial information
   */
  const searchFinancial = useCallback(async (searchTerm, options = {}) => {
    if (!searchTerm?.trim()) {
      return { data: [], total: 0 };
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      const result = await searchProductsFinancial(searchTerm.trim(), {
        limit: options.limit || 20,
        signal: options.signal
      });
      
      return result;
    } catch (error) {
      setAnalysisError(error.message || 'Error al buscar productos financieros');
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [searchProductsFinancial]);

  /**
   * Get financial product by barcode
   */
  const getByBarcodeFinancial = useCallback(async (barcode) => {
    if (!barcode?.trim()) {
      throw new Error('Código de barras requerido');
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      const product = await searchProductByBarcodeFinancial(barcode.trim());
      return product;
    } catch (error) {
      setAnalysisError(error.message || 'Error al buscar producto por código de barras');
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [searchProductByBarcodeFinancial]);

  /**
   * Get financial product by ID
   */
  const getByIdFinancial = useCallback(async (productId) => {
    if (!productId?.trim()) {
      throw new Error('ID de producto requerido');
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      const product = await fetchProductByIdFinancial(productId.trim());
      return product;
    } catch (error) {
      setAnalysisError(error.message || 'Error al cargar producto financiero');
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [fetchProductByIdFinancial]);

  /**
   * Analyze product profitability
   */
  const analyzeProfitability = useCallback((product) => {
    if (!product) return null;

    const analysis = {
      productId: product.product_id,
      productName: product.product_name,
      hasCompleteData: product.financial_health?.has_prices && product.financial_health?.has_costs,
      profitabilityScore: 0,
      recommendations: [],
      alerts: []
    };

    // Calculate profitability score
    let score = 0;
    
    if (product.financial_health?.has_prices) score += 30;
    if (product.financial_health?.has_costs) score += 30;
    if (product.financial_health?.has_stock) score += 20;
    if (product.best_margin_percent && product.best_margin_percent > 20) score += 20;

    analysis.profitabilityScore = score;

    // Generate recommendations
    if (!product.financial_health?.has_prices) {
      analysis.recommendations.push('Configurar precios de venta');
      analysis.alerts.push({ type: 'error', message: 'Sin precios configurados' });
    }

    if (!product.financial_health?.has_costs) {
      analysis.recommendations.push('Registrar costos de compra');
      analysis.alerts.push({ type: 'error', message: 'Sin costos registrados' });
    }

    if (!product.financial_health?.has_stock) {
      analysis.recommendations.push('Actualizar información de stock');
      analysis.alerts.push({ type: 'warning', message: 'Sin stock disponible' });
    }

    if (product.best_margin_percent !== null && product.best_margin_percent < 20) {
      analysis.recommendations.push('Considerar ajuste de precios - margen bajo');
      analysis.alerts.push({ type: 'warning', message: `Margen bajo: ${product.best_margin_percent.toFixed(1)}%` });
    }

    if (product.best_margin_percent !== null && product.best_margin_percent > 60) {
      analysis.recommendations.push('Precio muy competitivo - verificar competencia');
    }

    // Calculate inventory value
    if (product.stock_quantity && product.unit_costs_summary?.length > 0) {
      const totalValue = product.unit_costs_summary.reduce((total, cost) => {
        return total + (cost.last_cost * (product.stock_quantity || 0));
      }, 0);
      
      analysis.inventoryValue = totalValue;
    }

    // Calculate potential revenue
    if (product.stock_quantity && product.unit_prices?.length > 0) {
      const totalRevenue = product.unit_prices.reduce((total, price) => {
        return total + (price.price_per_unit * (product.stock_quantity || 0));
      }, 0);
      
      analysis.potentialRevenue = totalRevenue;
    }

    return analysis;
  }, []);

  /**
   * Compare products by profitability
   */
  const compareProducts = useCallback((products) => {
    if (!Array.isArray(products) || products.length === 0) {
      return [];
    }

    return products
      .map(product => ({
        ...product,
        analysis: analyzeProfitability(product)
      }))
      .sort((a, b) => {
        // Sort by profitability score descending
        const scoreA = a.analysis?.profitabilityScore || 0;
        const scoreB = b.analysis?.profitabilityScore || 0;
        return scoreB - scoreA;
      });
  }, [analyzeProfitability]);

  /**
   * Get financial summary for a list of products
   */
  const getFinancialSummary = useCallback((products) => {
    if (!Array.isArray(products) || products.length === 0) {
      return null;
    }

    const summary = {
      totalProducts: products.length,
      withPrices: 0,
      withCosts: 0,
      withStock: 0,
      completeProducts: 0,
      totalInventoryValue: 0,
      totalPotentialRevenue: 0,
      averageMargin: 0,
      bestMarginProduct: null,
      worstMarginProduct: null
    };

    let totalMargin = 0;
    let productsWithMargin = 0;
    let bestMargin = -Infinity;
    let worstMargin = Infinity;

    products.forEach(product => {
      if (product.financial_health?.has_prices) summary.withPrices++;
      if (product.financial_health?.has_costs) summary.withCosts++;
      if (product.financial_health?.has_stock) summary.withStock++;
      
      if (product.financial_health?.has_prices && 
          product.financial_health?.has_costs && 
          product.financial_health?.has_stock) {
        summary.completeProducts++;
      }

      // Calculate inventory value
      if (product.stock_quantity && product.unit_costs_summary?.length > 0) {
        const productValue = product.unit_costs_summary.reduce((total, cost) => {
          return total + (cost.last_cost * (product.stock_quantity || 0));
        }, 0);
        summary.totalInventoryValue += productValue;
      }

      // Calculate potential revenue
      if (product.stock_quantity && product.unit_prices?.length > 0) {
        const productRevenue = product.unit_prices.reduce((total, price) => {
          return total + (price.price_per_unit * (product.stock_quantity || 0));
        }, 0);
        summary.totalPotentialRevenue += productRevenue;
      }

      // Track margins
      if (product.best_margin_percent !== null && product.best_margin_percent !== undefined) {
        totalMargin += product.best_margin_percent;
        productsWithMargin++;

        if (product.best_margin_percent > bestMargin) {
          bestMargin = product.best_margin_percent;
          summary.bestMarginProduct = product;
        }

        if (product.best_margin_percent < worstMargin) {
          worstMargin = product.best_margin_percent;
          summary.worstMarginProduct = product;
        }
      }
    });

    if (productsWithMargin > 0) {
      summary.averageMargin = totalMargin / productsWithMargin;
    }

    return summary;
  }, []);

  return {
    // State
    isAnalyzing,
    analysisError,

    // Search methods
    searchFinancial,
    getByBarcodeFinancial,
    getByIdFinancial,

    // Analysis methods
    analyzeProfitability,
    compareProducts,
    getFinancialSummary,

    // Utilities
    clearError: () => setAnalysisError(null)
  };
};