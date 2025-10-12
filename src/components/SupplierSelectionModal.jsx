/**
 * Compact Supplier Selection Modal
 * Modal component for searching and selecting suppliers
 */

import React, { useState } from 'react';
import { Search, User, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useSupplierStore from '@/store/useSupplierStore';

const SupplierSelectionModal = ({ isOpen, onClose, onSelectSupplier, selectedSupplier, activeOnly = true }) => {
  const { searchResults: suppliers, searchSuppliers, loading } = useSupplierStore();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      await searchSuppliers(searchTerm.trim());
    } catch (error) {
      console.error('Error searching suppliers:', error);
      alert(`Error al buscar proveedores: ${error.message}`);
    }
  };

  const handleSelectAndClose = (supplier) => {
    onSelectSupplier(supplier);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Seleccionar Proveedor
              </CardTitle>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Input */}
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Buscar por ID o nombre del proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
                size="sm"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {(() => {
                // Filter suppliers based on activeOnly prop
                const filteredSuppliers = activeOnly
                  ? suppliers.filter(supplier =>
                      supplier.status === true || supplier.status === 'true' || supplier.active === true
                    )
                  : suppliers;

                return filteredSuppliers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">
                      {activeOnly ? 'No hay proveedores activos' : 'No hay proveedores'}
                    </p>
                    <p className="text-sm">
                      Busca proveedores {activeOnly ? 'activos ' : ''}por ID o nombre usando el campo de arriba
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      onClick={() => handleSelectAndClose(supplier)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedSupplier?.id === supplier.id
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {supplier.id} • {supplier.email || 'Sin email'}
                          </div>
                        </div>
                        {selectedSupplier?.id === supplier.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                );
              })()}
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

export default SupplierSelectionModal;
