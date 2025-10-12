/**
 * Compact Tax Selection Modal
 * Modal component for selecting tax rates in purchase orders
 */

import React, { useState, useEffect } from 'react';
import { Search, Percent, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import usePurchaseStore from '@/store/usePurchaseStore';

const TaxSelectionModal = ({ isOpen, onClose, onSelectTaxRate, selectedTaxRate }) => {
  const { taxRates, fetchTaxRates, loading } = usePurchaseStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTaxRates, setFilteredTaxRates] = useState([]);

  useEffect(() => {
    if (isOpen && taxRates.length === 0) {
      fetchTaxRates();
    }
  }, [isOpen, taxRates.length, fetchTaxRates]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTaxRates(taxRates);
    } else {
      const filtered = taxRates.filter(tax =>
        tax.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tax.tax_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tax.rate?.toString().includes(searchTerm) ||
        tax.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTaxRates(filtered);
    }
  }, [searchTerm, taxRates]);

  const handleSelectAndClose = (taxRate) => {
    onSelectTaxRate(taxRate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[70vh] overflow-hidden">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Seleccionar Impuesto
              </CardTitle>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Input */}
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Buscar por nombre o tasa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
                disabled={loading}
              />
              <div className="w-10 h-10 flex items-center justify-center">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Search className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {filteredTaxRates.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Percent className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">
                    {loading ? 'Cargando impuestos...' : 'No hay impuestos'}
                  </p>
                  <p className="text-sm">
                    {!loading && 'Intenta ajustar tu búsqueda'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTaxRates.map((taxRate) => (
                    <div
                      key={taxRate.id || taxRate.tax_rate_id}
                      onClick={() => handleSelectAndClose(taxRate)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedTaxRate?.id === taxRate.id || selectedTaxRate?.tax_rate_id === taxRate.tax_rate_id
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {taxRate.tax_name || taxRate.name || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Tasa: {taxRate.rate || taxRate.tax_rate || 0}%
                            {taxRate.description && (
                              <> • {taxRate.description}</>
                            )}
                            {taxRate.country && (
                              <> • {taxRate.country}</>
                            )}
                          </div>
                        </div>
                        {(selectedTaxRate?.id === taxRate.id || selectedTaxRate?.tax_rate_id === taxRate.tax_rate_id) && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button onClick={onClose} variant="outline">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaxSelectionModal;
