import { useState, useEffect, useMemo } from 'react';
import { agingData as mockData } from '../data/agingMockData';

/**
 * Custom hook to manage aging report logic and calculations.
 * Separates data fetching from UI concerns.
 */
export const useAgingReport = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Filtered providers list based on search term
  const filteredProviders = useMemo(() => {
    if (!data) return [];
    if (!searchTerm.trim()) return data.providers;
    
    const term = searchTerm.toLowerCase();
    return data.providers.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.risk.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Totals for the footer
  const totals = useMemo(() => {
    if (!filteredProviders.length) return {
      corriente: 0, v31_60: 0, v61_90: 0, v91plus: 0, total: 0
    };

    return filteredProviders.reduce((acc, curr) => ({
      corriente: acc.corriente + curr.corriente,
      v31_60: acc.v31_60 + curr.v31_60,
      v61_90: acc.v61_90 + curr.v61_90,
      v91plus: acc.v91plus + curr.v91plus,
      total: acc.total + curr.total
    }), { corriente: 0, v31_60: 0, v61_90: 0, v91plus: 0, total: 0 });
  }, [filteredProviders]);

  return {
    loading,
    summary: data?.summary,
    kpis: data?.kpis,
    providers: filteredProviders,
    totals,
    searchTerm,
    setSearchTerm
  };
};
