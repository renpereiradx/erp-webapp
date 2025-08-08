/**
 * Página unificada de Reservas y Ventas con diseño minimalista
 * Permite gestionar reservas de servicios y ventas de productos de forma integrada
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ShoppingCart, Plus, Minus, X, Check, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BrutalistBadge } from '@/components/ui/Card';
import CalendarReservation from '@/components/CalendarReservation';
import SaleItemsManager from '@/components/SaleItemsManager';
import useClientStore from '@/store/useClientStore';
import useProductStore from '@/store/useProductStore';

const BookingSales = () => {
  const [activeTab, setActiveTab] = useState('reservas');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [saleItems, setSaleItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);

  // Datos de simulación mejorados
  const [clients] = useState([
    { id: '1', name: 'Juan Pérez', email: 'juan@email.com', phone: '+52 555 0101' },
    { id: '2', name: 'María García', email: 'maria@email.com', phone: '+52 555 0102' },
    { id: '3', name: 'Carlos López', email: 'carlos@email.com', phone: '+52 555 0103' },
    { id: '4', name: 'Ana Martínez', email: 'ana@email.com', phone: '+52 555 0104' },
    { id: '5', name: 'Luis Rodríguez', email: 'luis@email.com', phone: '+52 555 0105' },
  ]);

  const [services] = useState([
    { id: '1', name: 'Consulta General', price: 500, duration: 30, category: 'Medicina General' },
    { id: '2', name: 'Consulta Especializada', price: 800, duration: 45, category: 'Especialidades' },
    { id: '3', name: 'Terapia Física', price: 600, duration: 60, category: 'Rehabilitación' },
    { id: '4', name: 'Masaje Terapéutico', price: 700, duration: 90, category: 'Terapias' },
    { id: '5', name: 'Electrocardiograma', price: 300, duration: 15, category: 'Estudios' },
  ]);

  const [products] = useState([
    { id: '1', name: 'Paracetamol 500mg', price: 25, stock: 100, category: 'Analgésicos' },
    { id: '2', name: 'Ibuprofeno 400mg', price: 35, stock: 50, category: 'Antiinflamatorios' },
    { id: '3', name: 'Vitamina C', price: 45, stock: 30, category: 'Suplementos' },
    { id: '4', name: 'Omeprazol 20mg', price: 55, stock: 25, category: 'Gastroprotectores' },
    { id: '5', name: 'Loratadina 10mg', price: 30, stock: 40, category: 'Antihistamínicos' },
    { id: '6', name: 'Amoxicilina 500mg', price: 85, stock: 15, category: 'Antibióticos' },
  ]);

  // Reservas simuladas para el calendario
  const [mockReservations] = useState([
    {
      id: '1',
      clientId: '1',
      serviceId: '1',
      startTime: new Date().toISOString(),
      duration: 30,
      status: 'confirmed'
    },
    {
      id: '2',
      clientId: '2',
      serviceId: '2',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: 45,
      status: 'pending'
    }
  ]);

  // Calcular totales de la venta
  useEffect(() => {
    const newSubtotal = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newTax = newSubtotal * 0.16; // IVA 16%
    const newTotal = newSubtotal + newTax;
    
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newTotal);
  }, [saleItems]);

  // Manejar selección de fecha en el calendario
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
  };

  // Manejar selección de hora
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  // Agregar ítem a la venta
  const addSaleItem = (product, quantity = 1) => {
    const existingItem = saleItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setSaleItems(saleItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setSaleItems([...saleItems, {
        ...product,
        quantity
      }]);
    }
  };

  // Actualizar cantidad de ítem
  const updateQuantity = (itemId, change) => {
    setSaleItems(saleItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + change);
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  // Remover ítem
  const removeItem = (itemId) => {
    setSaleItems(saleItems.filter(item => item.id !== itemId));
  };

  // Manejar envío de reserva
  const handleReservationSubmit = () => {
    if (!selectedClient || !selectedService || !selectedDate || !selectedTime) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const reservationData = {
      action: 'create',
      clientId: selectedClient,
      productId: selectedService,
      startTime: `${selectedDate.toISOString().split('T')[0]}T${selectedTime}:00`,
      duration: duration
    };
    
    console.log('Reserva creada:', reservationData);
    alert('¡Reserva creada exitosamente!');
    
    // Reset form
    setSelectedClient('');
    setSelectedService('');
    setSelectedDate(null);
    setSelectedTime('');
    setDuration(60);
  };

  // Manejar envío de venta
  const handleSaleSubmit = () => {
    if (!selectedClient || saleItems.length === 0) {
      alert('Por favor selecciona un cliente y agrega productos');
      return;
    }

    const saleData = {
      clientId: selectedClient,
      details: JSON.stringify({
        items: saleItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        timestamp: new Date().toISOString()
      })
    };
    
    console.log('Venta creada:', saleData);
    alert(`¡Venta creada exitosamente! Total: $${total.toFixed(2)}`);
    
    // Reset form
    setSelectedClient('');
    setSaleItems([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservas y Ventas</h1>
          <p className="text-muted-foreground">
            Sistema unificado para gestionar reservas de servicios y ventas de productos
          </p>
        </div>
        <div className="flex space-x-2">
          <BrutalistBadge color="blue">
            {saleItems.length} productos
          </BrutalistBadge>
          <BrutalistBadge color="green">
            ${total.toFixed(2)}
          </BrutalistBadge>
        </div>
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-white border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <TabsTrigger 
            value="reservas" 
            className="data-[state=active]:bg-brutalist-blue data-[state=active]:text-white font-black uppercase"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Reservas
          </TabsTrigger>
          <TabsTrigger 
            value="ventas"
            className="data-[state=active]:bg-brutalist-green data-[state=active]:text-white font-black uppercase"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Ventas
          </TabsTrigger>
        </TabsList>

        {/* Contenido de Reservas */}
        <TabsContent value="reservas" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Formulario de Reserva */}
            <Card className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader className="border-b-4 border-black">
                <CardTitle className="flex items-center text-xl font-black uppercase">
                  <Calendar className="w-5 h-5 mr-2" />
                  Nueva Reserva
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selección de Cliente */}
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-wide">Cliente *</label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex flex-col">
                            <span className="font-semibold">{client.name}</span>
                            <span className="text-xs text-gray-500">{client.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selección de Servicio */}
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-wide">Servicio *</label>
                  <Select value={selectedService} onValueChange={(value) => {
                    setSelectedService(value);
                    const service = services.find(s => s.id === value);
                    if (service) {
                      setDuration(service.duration);
                    }
                  }}>
                    <SelectTrigger className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <SelectValue placeholder="Selecciona un servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-semibold">{service.name}</span>
                              <span className="text-xs text-gray-500">{service.category}</span>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <BrutalistBadge color="green">${service.price}</BrutalistBadge>
                              <BrutalistBadge color="blue">{service.duration}min</BrutalistBadge>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duración personalizada */}
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase tracking-wide">Duración (minutos)</label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDuration(Math.max(15, duration - 15))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                      className="text-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      min="15"
                      step="15"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDuration(duration + 15)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Botón de Crear Reserva */}
                <Button
                  variant="blue"
                  onClick={handleReservationSubmit}
                  disabled={!selectedClient || !selectedService || !selectedDate || !selectedTime}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Crear Reserva
                </Button>
              </CardContent>
            </Card>

            {/* Calendario de Reservas */}
            <div className="space-y-4">
              <CalendarReservation
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                reservations={mockReservations}
              />
            </div>
          </div>
        </TabsContent>

        {/* Contenido de Ventas */}
        <TabsContent value="ventas" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Selector de Cliente */}
            <Card className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader className="border-b-4 border-black">
                <CardTitle className="flex items-center text-xl font-black uppercase">
                  <Users className="w-5 h-5 mr-2" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex flex-col">
                          <span className="font-semibold">{client.name}</span>
                          <span className="text-xs text-gray-500">{client.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedClient && (
                  <div className="p-3 bg-brutalist-lime border-2 border-black">
                    <div className="text-sm">
                      <p className="font-black uppercase">Cliente Seleccionado:</p>
                      <p className="font-bold">
                        {clients.find(c => c.id === selectedClient)?.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {clients.find(c => c.id === selectedClient)?.email}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  variant="green"
                  onClick={handleSaleSubmit}
                  disabled={!selectedClient || saleItems.length === 0}
                  className="w-full"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar Venta - ${total.toFixed(2)}
                </Button>
              </CardContent>
            </Card>

            {/* Gestor de Ítems de Venta */}
            <div className="xl:col-span-2">
              <SaleItemsManager
                items={saleItems}
                products={products}
                onAddItem={addSaleItem}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                total={total}
                subtotal={subtotal}
                tax={tax}
                discount={0}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingSales;
