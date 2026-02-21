import { useState, useMemo } from 'react';
import { chartData, pendingPayments } from '../data/mockData';

/**
 * Custom hook to handle Cash Flow logic.
 * Avoids Effects for derived state (Best Practice).
 */
export const useCashFlow = () => {
  const [period, setPeriod] = useState('30D');

  // Logic to filter or calculate data based on period
  // In a real app, this would be an API call, but we simulate it with useMemo
  const filteredData = useMemo(() => {
    // Return mock data for now
    return chartData;
  }, [period]);

  const stats = useMemo(() => ({
    coverageRatio: 1.24,
    netFlow: 342850,
    totalInflows: 1284000,
    totalOutflows: 941150
  }), []);

  return {
    period,
    setPeriod,
    filteredData,
    stats,
    pendingPayments
  };
};
