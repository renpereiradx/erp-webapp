/**
 * Componente ClientCardSelector
 * Selector de clientes usando cards en grid con búsqueda inteligente
 * Búsqueda explícita por ID o nombre, similar a la página de clientes
 */

import React, { useState, useEffect } from 'react';
import { Search, User, Phone, Mail, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import useClientStore from '@/store/useClientStore';

const ClientCardSelector = ({
  selectedClient,
  onClientChange,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { clients, loading, searchClients } = useClientStore();

  // Detectar tipo de búsqueda (ID o nombre)
  const detectSearchType = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return null;

    // Si es solo números, buscar por ID
    if (/^\d+$/.test(trimmed)) {
      return { type: 'id', value: parseInt(trimmed) };
    }

    // Si contiene letras, buscar por nombre
    if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmed)) {
      return { type: 'name', value: trimmed };
    }

    return { type: 'name', value: trimmed };
  };

  // Manejar búsqueda explícita
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const searchType = detectSearchType(searchTerm);
      console.log('🔍 Búsqueda de cliente:', { term: searchTerm, type: searchType });

      let results = [];

      if (searchType.type === 'id') {
        // Buscar por ID específico
        const client = clients.find(c => c.id === searchType.value);
        results = client ? [client] : [];

        // Si no se encuentra en cache, buscar en API
        if (results.length === 0) {
          const apiResults = await searchClients(searchTerm);
          results = apiResults.filter(c => c.id === searchType.value);
        }
      } else {
        // Buscar por nombre en API
        results = await searchClients(searchTerm);
      }

      setSearchResults(results);
      console.log('📋 Resultados encontrados:', results.length);
    } catch (error) {
      console.error('Error buscando clientes:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // Seleccionar cliente
  const selectClient = (client) => {
    onClientChange(client.id);
    console.log('✅ Cliente seleccionado:', { id: client.id, name: client.name });
  };

  // Obtener cliente seleccionado actual
  const getSelectedClientData = () => {
    if (!selectedClient) return null;

    // Buscar en resultados de búsqueda primero
    let client = searchResults.find(c => c.id === selectedClient);

    // Si no está en resultados, buscar en todos los clientes
    if (!client) {
      client = clients.find(c => c.id === selectedClient);
    }

    return client;
  };

  const selectedClientData = getSelectedClientData();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de búsqueda */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Cliente</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por ID (ej: 123) o nombre (ej: Juan)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Button
            type="button"
            onClick={handleSearch}
            disabled={!searchTerm.trim() || isSearching}
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          💡 Tip: Escribe un número para buscar por ID, o texto para buscar por nombre
        </p>
      </div>

      {/* Cliente seleccionado actual */}
      {selectedClientData && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Cliente seleccionado:</span>
              <span className="text-blue-700">{selectedClientData.name}</span>
              <span className="text-xs text-blue-500">(ID: {selectedClientData.id})</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onClientChange(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Resultados de búsqueda */}
      {hasSearched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              Resultados de búsqueda ({searchResults.length})
            </h4>
            {searchResults.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSearch}
              >
                Limpiar
              </Button>
            )}
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-2">No se encontraron clientes</p>
              <p className="text-sm">
                Intenta con otro término de búsqueda o verifica la información
              </p>
            </div>
          ) : (
            /* Grid responsivo de cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map((client) => (
                <Card
                  key={client.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedClient === client.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => selectClient(client)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {/* Header con nombre e ID */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm truncate">
                            {client.name}
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            ID: {client.id}
                          </p>
                        </div>
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>

                      {/* Información de contacto */}
                      <div className="space-y-1">
                        {client.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{client.phone}</span>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {typeof client.address === 'string'
                                ? client.address
                                : `${client.address.street || ''}, ${client.address.city || ''}, ${client.address.country || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Indicador de selección */}
                      {selectedClient === client.id && (
                        <div className="text-xs text-blue-600 font-medium text-center pt-2 border-t">
                          ✓ Seleccionado
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mensaje inicial */}
      {!hasSearched && !selectedClient && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium mb-2">Busca un cliente para continuar</p>
          <p className="text-sm">
            Escribe el ID del cliente o su nombre en el campo de búsqueda
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientCardSelector;