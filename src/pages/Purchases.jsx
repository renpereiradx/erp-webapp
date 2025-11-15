/**
 * Página de Compras - Historial de Órdenes de Compra
 * Implementa patrón MVP con Sass + Fluent Design System 2
 * Basado en especificaciones de GUIA_MVP_DESARROLLO.md y FLUENT_DESIGN_SYSTEM.md
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, X, User, Calendar, MoreVertical, Eye, Ban } from 'lucide-react';
import DataState from '@/components/ui/DataState';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { useI18n } from '@/lib/i18n';
import supplierService from '@/services/supplierService';
import { PaymentMethodService } from '@/services/paymentMethodService';
import { CurrencyService } from '@/services/currencyService';
import { productService } from '@/services/productService';
import purchaseService from '@/services/purchaseService';

const Purchases = () => {
  const { t } = useI18n();

  // Estados locales MVP (sin store por ahora)
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('nueva-compra');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchType, setSearchType] = useState('date'); // 'date' o 'supplier'

  // Estados para búsqueda de proveedores
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierResults, setSupplierResults] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [searchingSuppliers, setSearchingSuppliers] = useState(false);
  const supplierSearchRef = useRef(null);

  // Estados para detalles de pago
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('PYG');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);

  // Estados para el modal de agregar productos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null); // ID del item siendo editado
  const [modalProductSearch, setModalProductSearch] = useState('');
  const [modalProductResults, setModalProductResults] = useState([]);
  const [modalSelectedProduct, setModalSelectedProduct] = useState(null);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalUnitPrice, setModalUnitPrice] = useState(0);
  const [modalProfitPct, setModalProfitPct] = useState(30);
  const [modalSalePrice, setModalSalePrice] = useState(0); // Precio de venta final
  const [pricingMode, setPricingMode] = useState('margin'); // 'margin' o 'sale_price'
  const [purchaseItems, setPurchaseItems] = useState([]);
  const modalProductSearchRef = useRef(null);

  // Estados para el menú de acciones de la tabla
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const actionMenuRef = useRef(null);

  // Cargar datos al montar y configurar fechas por defecto
  useEffect(() => {
    const loadPurchases = async () => {
      setLoading(true);
      setError(null);

      try {
        // Cargar compras de los últimos 30 días y establecer las fechas por defecto
        const endDateVal = new Date().toISOString().split('T')[0];
        const startDateVal = new Date();
        startDateVal.setDate(startDateVal.getDate() - 30);
        const startDateStr = startDateVal.toISOString().split('T')[0];

        // Establecer fechas por defecto en los inputs
        setStartDate(startDateStr);
        setEndDate(endDateVal);

        const purchaseService = (await import('@/services/purchaseService')).default;
        const response = await purchaseService.getPurchasesByDateRange(startDateStr, endDateVal, 1, 50);

        if (response.success && response.data) {
          setPurchaseOrders(response.data);
        }
      } catch (err) {
        console.error('Error loading purchases:', err);
        setError(err.message || 'Error al cargar compras');
      } finally {
        setLoading(false);
      }
    };

    loadPurchases();
  }, []);

  // Cargar métodos de pago desde la API
  useEffect(() => {
    const loadPaymentMethods = async () => {
      setLoadingPaymentMethods(true);
      try {
        const methods = await PaymentMethodService.getAll();
        setPaymentMethods(methods || []);
      } catch (err) {
        console.error('Error loading payment methods:', err);
        // Si falla, dejamos el array vacío
        setPaymentMethods([]);
      } finally {
        setLoadingPaymentMethods(false);
      }
    };

    loadPaymentMethods();
  }, []);

  // Cargar monedas desde la API
  useEffect(() => {
    const loadCurrencies = async () => {
      setLoadingCurrencies(true);
      try {
        const currenciesData = await CurrencyService.getAll();
        setCurrencies(currenciesData || []);

        // Establecer la moneda base (PYG) como default si existe
        if (currenciesData && currenciesData.length > 0) {
          const baseCurrency = currenciesData.find(c => c.is_base_currency);
          if (baseCurrency) {
            setPaymentCurrency(baseCurrency.currency_code);
          }
        }
      } catch (err) {
        console.error('Error loading currencies:', err);
        // Si falla, dejamos el array vacío
        setCurrencies([]);
      } finally {
        setLoadingCurrencies(false);
      }
    };

    loadCurrencies();
  }, []);

  // Filtrar órdenes localmente (solo para filtrado adicional por estado)
  const filteredOrders = purchaseOrders.filter(orderData => {
    // Los datos vienen en formato { purchase: {...}, details: [...] }
    const order = orderData.purchase || orderData;

    // Filtro por estado (siempre aplica)
    const matchesStatus = selectedStatus === '' || order.status === selectedStatus;

    return matchesStatus;
  });

  // Búsqueda automática cuando cambian las fechas (solo en modo fecha)
  useEffect(() => {
    if (searchType !== 'date' || !startDate || !endDate || activeTab !== 'historial') {
      return;
    }

    const timeoutId = setTimeout(() => {
      handleFilter();
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [startDate, endDate, searchType, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Búsqueda de proveedores con debounce
  useEffect(() => {
    const searchSuppliers = async () => {
      if (!supplierSearch || supplierSearch.length < 2) {
        setSupplierResults([]);
        setShowSupplierDropdown(false);
        return;
      }

      setSearchingSuppliers(true);
      try {
        const response = await supplierService.searchByName(supplierSearch);

        // La API puede devolver directamente un array o un objeto con { success, data }
        let results = [];

        if (Array.isArray(response)) {
          results = response;
        } else if (response && response.success && response.data) {
          results = Array.isArray(response.data) ? response.data : [response.data];
        } else if (response && typeof response === 'object' && !response.success) {
          results = [response];
        }

        setSupplierResults(results);
      } catch (err) {
        console.error('Error searching suppliers:', err);
        setSupplierResults([]);
      } finally {
        setSearchingSuppliers(false);
      }
    };

    const timeoutId = setTimeout(searchSuppliers, 300);
    return () => clearTimeout(timeoutId);
  }, [supplierSearch]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (supplierSearchRef.current && !supplierSearchRef.current.contains(event.target)) {
        setShowSupplierDropdown(false);
      }
      if (modalProductSearchRef.current && !modalProductSearchRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setOpenActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Búsqueda de productos con debounce (para el modal)
  useEffect(() => {
    // Cancelar búsqueda anterior si existe
    let isCancelled = false;

    const searchProducts = async () => {
      const trimmedSearch = modalProductSearch.trim();

      // Limpiar resultados si no hay búsqueda o es muy corta
      if (!trimmedSearch || trimmedSearch.length < 2) {
        setModalProductResults([]);
        setShowProductDropdown(false);
        setSearchingProducts(false);
        return;
      }

      setSearchingProducts(true);
      setShowProductDropdown(true);

      try {
        // Usar searchProductsFinancial para obtener productos con precios
        const results = await productService.searchProductsFinancial(trimmedSearch, { limit: 10 });

        // Solo actualizar si no fue cancelado
        if (!isCancelled) {
          setModalProductResults(Array.isArray(results) ? results : []);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error searching products:', err);
          setModalProductResults([]);
        }
      } finally {
        if (!isCancelled) {
          setSearchingProducts(false);
        }
      }
    };

    // Debounce de 500ms
    const timeoutId = setTimeout(searchProducts, 500);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [modalProductSearch]);

  // Sincronizar precio de venta cuando cambia el margen o precio unitario (modo margen)
  useEffect(() => {
    if (pricingMode === 'margin') {
      // Calcular precio de venta: costo * (1 + margen/100)
      const calculatedSalePrice = modalUnitPrice * (1 + modalProfitPct / 100);
      setModalSalePrice(calculatedSalePrice);
    }
  }, [modalUnitPrice, modalProfitPct, pricingMode]);

  // Sincronizar margen cuando cambia el precio de venta (modo precio de venta)
  useEffect(() => {
    if (pricingMode === 'sale_price' && modalUnitPrice > 0) {
      // Calcular margen: ((precio_venta - costo) / costo) * 100
      const calculatedMargin = ((modalSalePrice - modalUnitPrice) / modalUnitPrice) * 100;
      setModalProfitPct(Math.max(0, calculatedMargin)); // No permitir márgenes negativos
    }
  }, [modalSalePrice, modalUnitPrice, pricingMode]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+A para abrir modal de agregar producto
      if ((event.ctrlKey || event.metaKey) && event.key === 'a' && activeTab === 'nueva-compra') {
        event.preventDefault();
        setIsModalOpen(true);
      }
      // ESC para cerrar modal
      if (event.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isModalOpen]);

  // Handlers
  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearch(supplier.name || '');
    setShowSupplierDropdown(false);
  };

  const handleClearSupplier = () => {
    setSelectedSupplier(null);
    setSupplierSearch('');
    setSupplierResults([]);
  };

  const handleProductSelect = (product) => {
    setModalSelectedProduct(product);
    setModalProductSearch(product.name || product.product_name || '');
    setShowProductDropdown(false);

    // Pre-llenar el precio de costo si está disponible
    const costPrice = product.cost_price || product.unit_cost || 0;
    setModalUnitPrice(costPrice);

    // Calcular precio de venta inicial con margen del 30%
    const initialSalePrice = costPrice * (1 + 30 / 100);
    setModalSalePrice(initialSalePrice);
  };

  const handleClearProductSelection = () => {
    setModalSelectedProduct(null);
    setModalProductSearch('');
    setModalProductResults([]);
    setModalUnitPrice(0);
  };

  const handleEditItem = (item) => {
    // Abrir modal en modo edición
    setEditingItemId(item.id);
    setModalSelectedProduct({
      id: item.product_id,
      product_id: item.product_id,
      name: item.name,
      sku: item.sku,
      unit: item.unit,
    });
    setModalProductSearch(item.name);
    setModalQuantity(item.quantity);
    setModalUnitPrice(item.unit_price);
    setModalProfitPct(item.profit_pct);

    // Calcular precio de venta desde el margen
    const salePrice = item.unit_price * (1 + item.profit_pct / 100);
    setModalSalePrice(salePrice);
    setPricingMode('margin');

    setIsModalOpen(true);
  };

  const handleConfirmAddProduct = () => {
    if (!modalSelectedProduct) {
      setIsModalOpen(false);
      return;
    }

    const productId = modalSelectedProduct.id || modalSelectedProduct.product_id;

    // Validar duplicados solo si estamos agregando (no editando)
    if (!editingItemId) {
      const isDuplicate = purchaseItems.some(item => item.product_id === productId);
      if (isDuplicate) {
        alert(t('purchases.form.errors.duplicate_product', 'Este producto ya ha sido agregado. Use doble click para editar.'));
        return;
      }
    }

    const itemData = {
      product_id: productId,
      name: modalSelectedProduct.name || modalSelectedProduct.product_name,
      sku: modalSelectedProduct.sku || modalSelectedProduct.product_sku || '-',
      quantity: Number(modalQuantity) || 1,
      unit_price: Number(modalUnitPrice) || 0,
      profit_pct: Number(modalProfitPct) || 30,
      unit: modalSelectedProduct.unit || 'unit',
    };

    if (editingItemId) {
      // Modo edición: actualizar item existente
      setPurchaseItems(prev => prev.map(item =>
        item.id === editingItemId ? { ...itemData, id: item.id } : item
      ));
    } else {
      // Modo agregar: crear nuevo item
      const newItem = {
        ...itemData,
        id: `item-${Date.now()}`,
      };
      setPurchaseItems(prev => [...prev, newItem]);
    }

    // Reset modal state
    setEditingItemId(null);
    setModalQuantity(1);
    setModalUnitPrice(0);
    setModalProfitPct(30);
    setModalSalePrice(0);
    setPricingMode('margin');
    setModalSelectedProduct(null);
    setModalProductSearch('');
    setModalProductResults([]);
    setIsModalOpen(false);
  };

  const handleRemoveItem = (itemId) => {
    setPurchaseItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSavePurchase = async () => {
    // Validar que tengamos proveedor y productos
    if (!selectedSupplier) {
      alert(t('purchases.form.errors.supplier_required') || 'Debe seleccionar un proveedor');
      return;
    }

    if (purchaseItems.length === 0) {
      alert(t('purchases.form.errors.products_required') || 'Debe agregar al menos un producto');
      return;
    }

    // Preparar datos según PURCHASE_API.md
    const orderData = {
      supplier_id: selectedSupplier.id,
      status: 'PENDING',
      order_details: purchaseItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit: item.unit || 'unit',
        profit_pct: item.profit_pct || 30,
        tax_rate_id: null, // TODO: Agregar selector de tasa de impuesto si es necesario
      })),
      auto_update_prices: true,
      default_profit_margin: 30.0,
      payment_method_id: paymentMethod ? parseInt(paymentMethod) : null,
      currency_id: paymentCurrency ? currencies.find(c => c.currency_code === paymentCurrency)?.id : null,
    };

    try {
      setLoading(true);
      const result = await purchaseService.createEnhancedPurchaseOrder(orderData);

      if (result.success) {
        alert(result.message || t('purchases.form.success') || 'Orden de compra creada exitosamente');

        // Limpiar formulario
        setSelectedSupplier(null);
        setSupplierSearch('');
        setPurchaseItems([]);
        setPaymentMethod('');

        // Recargar lista de órdenes
        handleRetry();
      } else {
        alert(result.error || t('purchases.form.error') || 'Error al crear orden de compra');
      }
    } catch (err) {
      console.error('Error saving purchase:', err);
      alert(err.message || t('purchases.form.error') || 'Error al guardar la orden de compra');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    console.log('Exportar órdenes de compra');
    // TODO: Implementar exportación en fase de Hardening
  };

  const handleFilter = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;

      if (searchType === 'supplier' && searchTerm.trim()) {
        // Búsqueda por nombre de proveedor
        response = await purchaseService.getPurchasesBySupplierName(searchTerm.trim());
      } else if (searchType === 'date' && startDate && endDate) {
        // Búsqueda por rango de fechas
        // WORKAROUND: Agregar 1 día al endDate para asegurar inclusividad del último día
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        const endDateAdjusted = adjustedEndDate.toISOString().split('T')[0];

        response = await purchaseService.getPurchasesByDateRange(startDate, endDateAdjusted, 1, 50);
      } else {
        // Si no hay criterios de búsqueda, cargar los últimos 30 días
        const endDateVal = new Date().toISOString().split('T')[0];
        const startDateVal = new Date();
        startDateVal.setDate(startDateVal.getDate() - 30);
        const startDateStr = startDateVal.toISOString().split('T')[0];
        response = await purchaseService.getPurchasesByDateRange(startDateStr, endDateVal, 1, 50);
      }

      if (response.success && response.data) {
        setPurchaseOrders(response.data);
      } else {
        setError(response.error || 'Error al cargar compras');
      }
    } catch (err) {
      console.error('Error applying filters:', err);
      setError(err.message || 'Error al aplicar filtros');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setError(null);
    setLoading(true);

    try {
      const endDateVal = new Date().toISOString().split('T')[0];
      const startDateVal = new Date();
      startDateVal.setDate(startDateVal.getDate() - 30);
      const startDateStr = startDateVal.toISOString().split('T')[0];

      const purchaseService = (await import('@/services/purchaseService')).default;
      const response = await purchaseService.getPurchasesByDateRange(startDateStr, endDateVal, 1, 50);

      if (response.success && response.data) {
        setPurchaseOrders(response.data);
      }
    } catch (err) {
      console.error('Error retrying purchases:', err);
      setError(err.message || 'Error al cargar compras');
    } finally {
      setLoading(false);
    }
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Calcular totales de la orden de compra
  const calculateOrderTotals = () => {
    const subtotal = purchaseItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const itemCount = purchaseItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      itemCount,
      total: subtotal, // Por ahora sin impuestos adicionales
    };
  };

  const orderTotals = calculateOrderTotals();

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  // Obtener clase de estado
  const getStatusBadgeClass = (status) => {
    const baseClass = 'badge';
    switch(status?.toUpperCase()) {
      case 'COMPLETED':
      case 'RECEIVED':
        return `${baseClass} badge--success`;
      case 'PENDING':
        return `${baseClass} badge--warning`;
      case 'CANCELLED':
        return `${baseClass} badge--error`;
      default:
        return `${baseClass} badge--default`;
    }
  };

  // Obtener texto de estado
  const getStatusText = (status) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED':
        return t('purchases.status.completed', 'Completada');
      case 'PENDING':
        return t('purchases.status.pending', 'Pendiente');
      case 'CANCELLED':
        return t('purchases.status.cancelled', 'Cancelada');
      case 'RECEIVED':
        return t('purchases.status.received', 'Recibida');
      default:
        return status || '-';
    }
  };

  // Manejar acción de Ver
  const handleViewPurchase = (order) => {
    console.log('Ver orden:', order);
    // TODO: Implementar navegación a página de detalle o modal
    alert(`Ver orden de compra #${order.id}\n\nProveedor: ${order.supplier_name}\nTotal: ${formatCurrency(order.total_amount)}`);
  };

  // Manejar acción de Cancelar
  const handleCancelPurchase = async (order) => {
    if (order.status?.toUpperCase() === 'CANCELLED') {
      alert('Esta orden ya está cancelada');
      return;
    }

    if (window.confirm(`¿Está seguro de cancelar la orden de compra #${order.id}?\n\nEsta acción no se puede deshacer.`)) {
      try {
        // TODO: Implementar llamada a la API para cancelar
        console.log('Cancelar orden:', order);

        // Simulación temporal - actualizar el estado localmente
        setPurchaseOrders(prevOrders =>
          prevOrders.map(o => {
            const currentOrder = o.purchase || o;
            if (currentOrder.id === order.id) {
              return {
                ...o,
                purchase: currentOrder,
                status: 'CANCELLED'
              };
            }
            return o;
          })
        );

        alert(`Orden #${order.id} cancelada exitosamente`);
      } catch (err) {
        console.error('Error cancelando orden:', err);
        alert('Error al cancelar la orden. Por favor, intente nuevamente.');
      }
    }
    setOpenActionMenu(null);
  };

  // Toggle menú de acciones
  const toggleActionMenu = (orderId) => {
    setOpenActionMenu(openActionMenu === orderId ? null : orderId);
  };

  // Estados de UI
  if (loading && purchaseOrders.length === 0) {
    return <DataState variant="loading" skeletonVariant="list" />;
  }

  if (error) {
    return (
      <DataState
        variant="error"
        title={t('purchases.error.title', 'Error al cargar compras')}
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  if (!loading && purchaseOrders.length === 0) {
    return (
      <DataState
        variant="empty"
        title={t('purchases.empty.title', 'Sin órdenes de compra')}
        message={t('purchases.empty.message', 'No hay órdenes de compra registradas')}
        actionLabel={t('purchases.action.create', 'Crear nueva orden')}
        onAction={() => setActiveTab('nueva-compra')}
      />
    );
  }

  return (
    <div className="purchases">
      {/* Tabs */}
      <div className="tabs purchases__tabs">
        <div className="tabs__list" role="tablist">
          <button
            type="button"
            className={`tabs__tab ${activeTab === 'nueva-compra' ? 'tabs__tab--active' : ''}`}
            onClick={() => setActiveTab('nueva-compra')}
            role="tab"
          >
            {t('purchases.tab.new', 'Nueva Compra')}
          </button>
          <button
            type="button"
            className={`tabs__tab ${activeTab === 'historial' ? 'tabs__tab--active' : ''}`}
            onClick={() => setActiveTab('historial')}
            role="tab"
          >
            {t('purchases.tab.history', 'Historial de Compras')}
          </button>
        </div>
      </div>

      {/* Nueva Compra Tab */}
      {activeTab === 'nueva-compra' && (
        <>


          <div className="purchases__form-layout">
            {/* Columna principal - Productos */}
            <div className="purchases__main-column">
              {/* Card: Productos Seleccionados */}
              <div className="purchases__card">
                <h3 className="purchases__card-title">
                  {t('purchases.form.products', 'Productos Seleccionados')}
                </h3>

                <div className="purchases__search-row">
                  <button
                    className="btn btn--primary"
                    onClick={() => setIsModalOpen(true)}
                    title="Ctrl+A"
                  >
                    {t('purchases.form.add_product', 'Agregar Producto')}
                  </button>
                </div>

                {/* Tabla de productos */}
                <div className="purchases__table-wrapper">
                  <table className="purchases__table">
                    <thead>
                      <tr>
                        <th>{t('purchases.table.product_id', 'ID')}</th>
                        <th>{t('purchases.form.product', 'Producto')}</th>
                        <th>{t('purchases.form.quantity', 'Cantidad')}</th>
                        <th className="text-right">{t('purchases.form.unit_price', 'Precio Unitario')}</th>
                        <th className="text-right">{t('purchases.table.margin', 'Margen (%)')}</th>
                        <th className="text-right">{t('purchases.form.total', 'Total')}</th>
                        <th className="text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseItems.length === 0 ? (
                        <tr className="purchases__empty-row">
                          <td colSpan="7">
                            {t('purchases.form.no_products', 'No hay productos agregados')}
                          </td>
                        </tr>
                      ) : (
                        purchaseItems.map((item) => {
                          const itemTotal = (item.unit_price * item.quantity);
                          return (
                            <tr
                              key={item.id}
                              onDoubleClick={() => handleEditItem(item)}
                              style={{ cursor: 'pointer' }}
                              title="Doble click para editar"
                            >
                              <td>
                                <code style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                  {item.product_id}
                                </code>
                              </td>
                              <td>
                                <div>
                                  <strong>{item.name}</strong>
                                </div>
                              </td>
                              <td>{item.quantity}</td>
                              <td className="text-right">{formatCurrency(item.unit_price)}</td>
                              <td className="text-right">
                                <span style={{ color: 'var(--state-success)' }}>
                                  {item.profit_pct.toFixed(2)}%
                                </span>
                              </td>
                              <td className="text-right">{formatCurrency(itemTotal)}</td>
                              <td className="text-right">
                                <button
                                  className="btn btn--icon btn--ghost"
                                  onClick={() => handleRemoveItem(item.id)}
                                  title={t('purchases.form.remove_item', 'Eliminar')}
                                >
                                  <X size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card: Resumen */}
              <div className="purchases__card">
                <h3 className="purchases__card-title">
                  {t('purchases.form.summary', 'Resumen de la Compra')}
                </h3>

                <div className="purchases__summary">
                  <div className="purchases__summary-details">
                    <div className="purchases__summary-row">
                      <span>{t('purchases.form.items', 'Artículos')}</span>
                      <span>{orderTotals.itemCount}</span>
                    </div>
                    <div className="purchases__summary-row">
                      <span>{t('purchases.form.subtotal', 'Subtotal')}</span>
                      <span>{formatCurrency(orderTotals.subtotal)}</span>
                    </div>
                    <div className="purchases__summary-row">
                      <span>{t('purchases.form.taxes', 'Impuestos')}</span>
                      <span>{formatCurrency(0)}</span>
                    </div>
                    <div className="purchases__summary-divider"></div>
                    <div className="purchases__summary-row purchases__summary-total">
                      <span>{t('purchases.form.total', 'Total')}</span>
                      <span>{formatCurrency(orderTotals.total)}</span>
                    </div>
                  </div>

                  <div className="purchases__summary-actions">
                    <button
                      type="button"
                      className="btn btn--secondary btn--block"
                      onClick={() => {
                        setSelectedSupplier(null);
                        setSupplierSearch('');
                        setPurchaseItems([]);
                        setPaymentMethod('');
                      }}
                    >
                      {t('action.cancel', 'Cancelar')}
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary btn--block"
                      onClick={handleSavePurchase}
                      disabled={loading || !selectedSupplier || purchaseItems.length === 0}
                    >
                      {loading ? t('common.saving', 'Guardando...') : t('purchases.form.save', 'Guardar Compra')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna lateral - Información */}
            <div className="purchases__side-column">
              {/* Card: Información del Proveedor */}
              <div className="purchases__card">
                <h3 className="purchases__card-title">
                  {t('purchases.form.supplier_info', 'Información del Proveedor')}
                </h3>

                <div className="form-field">
                  <label className="form-field__label">
                    {t('purchases.form.supplier_name', 'Proveedor')}
                  </label>
                  <div className="purchases__supplier-wrapper">
                    <div className="purchases__supplier-input">
                      <div className="input-search">
                        <Search className="input-search__icon" size={18} />
                        <input
                          type="text"
                          placeholder={t('purchases.form.search_supplier', 'Buscar proveedor por nombre...')}
                          className="input"
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                        />
                        {supplierSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setSupplierSearch('');
                              setSupplierResults([]);
                              setSelectedSupplier(null);
                            }}
                            className="input-search__clear"
                            aria-label={t('purchases.form.clear_supplier', 'Limpiar proveedor')}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Loading state */}
                    {searchingSuppliers && (
                      <div className="purchases__supplier-loading">
                        {t('purchases.form.searching_suppliers', 'Buscando proveedores...')}
                      </div>
                    )}
                  </div>

                  {/* Select SIEMPRE visible que se llena con los resultados */}
                  <select
                    className="input"
                    style={{ marginTop: '8px' }}
                    value={selectedSupplier?.id || ''}
                    onChange={(e) => {
                      const supplierId = e.target.value;
                      const supplier = supplierResults.find(s => String(s.id) === String(supplierId));
                      if (supplier) {
                        handleSupplierSelect(supplier);
                      }
                    }}
                    disabled={supplierResults.length === 0}
                  >
                    <option value="">
                      {supplierResults.length === 0
                        ? t('purchases.form.no_results', 'Busca para ver resultados...')
                        : t('purchases.form.choose_supplier', 'Elegir proveedor...')}
                    </option>
                    {supplierResults.map((supplier) => (
                      <option key={supplier.id} value={String(supplier.id)}>
                        {supplier.name} {supplier.email ? `- ${supplier.email}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Proveedor seleccionado */}
                {selectedSupplier && (
                  <div className="purchases__supplier-selected">
                    <div className="purchases__supplier-selected-name">
                      {selectedSupplier.name}
                    </div>
                    {selectedSupplier.email && (
                      <div className="purchases__supplier-selected-detail">
                        Email: {selectedSupplier.email}
                      </div>
                    )}
                    {selectedSupplier.phone && (
                      <div className="purchases__supplier-selected-detail">
                        Tel: {selectedSupplier.phone}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card: Detalles de Pago */}
              <div className="purchases__card">
                <h3 className="purchases__card-title">
                  {t('purchases.form.payment_details', 'Detalles de Pago')}
                </h3>

                <div className="form-field">
                  <label className="form-field__label">
                    {t('purchases.form.payment_method', 'Método de Pago')}
                  </label>
                  <select
                    className="input"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={loadingPaymentMethods}
                  >
                    <option value="">
                      {loadingPaymentMethods
                        ? t('purchases.form.loading_methods', 'Cargando métodos...')
                        : t('purchases.form.select_payment_method', 'Seleccionar método de pago...')}
                    </option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {PaymentMethodService.formatMethodDescription(method)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-field__label">
                    {t('purchases.form.payment_currency', 'Moneda de Pago')}
                  </label>
                  <select
                    className="input"
                    value={paymentCurrency}
                    onChange={(e) => setPaymentCurrency(e.target.value)}
                    disabled={loadingCurrencies}
                  >
                    {loadingCurrencies && (
                      <option value="">
                        {t('purchases.form.loading_currencies', 'Cargando monedas...')}
                      </option>
                    )}
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.currency_code}>
                        {CurrencyService.formatCurrencyName(currency)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Historial Tab */}
      {activeTab === 'historial' && (
        <div className="data-table">
          {/* Header fuera del card */}
          <div className="purchases__header">
            <h2 className="purchases__title">
              {t('purchases.title', 'Historial de Compras')}
            </h2>
            <button onClick={handleExport} className="btn btn--primary">
              <Download size={16} />
              <span>{t('action.export', 'Exportar')}</span>
            </button>
          </div>

          {/* Card con filtros y tabla */}
          <div className="purchases__card">
            {/* Selector de tipo de búsqueda */}
            <div className="purchases__search-type">
              <label className="purchases__search-type-label">
                {t('purchases.search.type', 'Tipo de búsqueda')}
              </label>
              <SegmentedControl
                options={[
                  {
                    value: 'supplier',
                    label: t('purchases.search.by_supplier', 'Proveedor'),
                    icon: <User size={16} />,
                    'aria-controls': 'search-panel'
                  },
                  {
                    value: 'date',
                    label: t('purchases.search.by_date', 'Fecha'),
                    icon: <Calendar size={16} />,
                    'aria-controls': 'search-panel'
                  }
                ]}
                value={searchType}
                onChange={setSearchType}
                aria-label={t('purchases.search.type_aria', 'Seleccionar tipo de búsqueda')}
              />
            </div>

            {/* Filtros dinámicos según tipo de búsqueda */}
            <div className="purchases__filters" id="search-panel" role="tabpanel">
              {searchType === 'supplier' ? (
                <>
                  <div className="input-search">
                    <Search className="input-search__icon" size={20} />
                    <input
                      type="search"
                      placeholder={t('purchases.search.supplier_placeholder', 'Buscar por nombre de proveedor o ID...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchTerm.trim()) {
                          handleFilter();
                        }
                      }}
                      className="input"
                    />
                  </div>
                  <button
                    onClick={handleFilter}
                    className="btn btn--primary"
                    disabled={!searchTerm.trim() || loading}
                  >
                    <Search size={16} />
                    <span>{loading ? t('common.searching', 'Buscando...') : t('action.search', 'Buscar')}</span>
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input"
                    placeholder={t('purchases.search.start_date', 'Fecha inicio')}
                    aria-label={t('purchases.search.start_date', 'Fecha inicio')}
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input"
                    placeholder={t('purchases.search.end_date', 'Fecha fin')}
                    aria-label={t('purchases.search.end_date', 'Fecha fin')}
                  />
                  {loading && (
                    <span className="purchases__loading-indicator">
                      {t('common.loading', 'Cargando...')}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Tabla */}
            <div className="data-table__wrapper">
              <table className="data-table__table">
                <thead>
                  <tr>
                    <th>{t('purchases.table.id', 'ID Compra')}</th>
                    <th>{t('purchases.table.date', 'Fecha')}</th>
                    <th>{t('purchases.table.supplier', 'Proveedor')}</th>
                    <th className="text-right">{t('purchases.table.total', 'Total')}</th>
                    <th className="text-center">{t('purchases.table.status', 'Estado')}</th>
                    <th className="text-center">{t('purchases.table.actions', 'Acciones')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((orderData) => {
                    const order = orderData.purchase || orderData;
                    return (
                      <tr key={order.id}>
                        <td className="id-cell">#{order.id}</td>
                        <td>{formatDate(order.order_date)}</td>
                        <td>{order.supplier_name || '-'}</td>
                        <td className="text-right">{formatCurrency(order.total_amount)}</td>
                        <td className="text-center">
                          <span className={getStatusBadgeClass(order.status)}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="action-menu" ref={actionMenuRef}>
                            <button
                              className="action-menu__trigger"
                              onClick={() => toggleActionMenu(order.id)}
                              aria-label={t('purchases.table.actions_aria', 'Abrir menú de acciones')}
                              aria-expanded={openActionMenu === order.id}
                            >
                              <MoreVertical size={18} />
                            </button>
                            {openActionMenu === order.id && (
                              <div className="action-menu__dropdown">
                                <button
                                  className="action-menu__item"
                                  onClick={() => handleViewPurchase(order)}
                                >
                                  <Eye size={16} />
                                  <span>{t('action.view', 'Ver')}</span>
                                </button>
                                <button
                                  className="action-menu__item action-menu__item--danger"
                                  onClick={() => handleCancelPurchase(order)}
                                  disabled={order.status?.toUpperCase() === 'CANCELLED'}
                                >
                                  <Ban size={16} />
                                  <span>{t('action.cancel', 'Cancelar')}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {filteredOrders.length === 0 && searchTerm && (
              <div className="purchases__empty">
                <p>{t('purchases.filter.empty', 'No se encontraron resultados para tu búsqueda')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Agregar Producto */}
      {isModalOpen && (
        <div
          className="sales-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="purchase-modal-title"
        >
          <div
            className="sales-modal__overlay"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
          <div className="sales-modal__dialog">
            <header className="sales-modal__header">
              <div className="sales-modal__header-content">
                <h3 id="purchase-modal-title" className="sales-modal__title">
                  {editingItemId
                    ? t('purchases.modal.edit_title', 'Editar producto en la compra')
                    : t('purchases.modal.title', 'Agregar producto a la compra')
                  }
                </h3>
                <p className="sales-modal__subtitle">
                  {t('purchases.modal.subtitle', 'Seleccione un artículo del catálogo, ajuste la cantidad y configure un descuento antes de añadirlo a la orden.')}
                </p>
              </div>
              <button
                type="button"
                className="sales-modal__close"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={16} aria-hidden="true" />
                <span className="sr-only">{t('action.close', 'Cerrar')}</span>
              </button>
            </header>
            <div className="sales-modal__body">
              <section className="sales-modal__section sales-modal__section--context">
                <div className="sales-modal__info-grid">
                  <div className="sales-modal__info-item">
                    <span className="sales-modal__label">
                      {t('purchases.modal.selected_product', 'Producto seleccionado')}
                    </span>
                    <span className="sales-modal__value">
                      {modalSelectedProduct ? (modalSelectedProduct.name || modalSelectedProduct.product_name) : t('purchases.modal.select_product', 'Selecciona un producto')}
                    </span>
                  </div>
                  <div className="sales-modal__info-item">
                    <span className="sales-modal__label">SKU</span>
                    <span className="sales-modal__value">
                      {modalSelectedProduct ? (modalSelectedProduct.sku || modalSelectedProduct.product_sku || '—') : '—'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="sales-modal__section">
                <div className="sales-modal__form-grid">
                  {/* Búsqueda de productos */}
                  <div className="sales-modal__field">
                    <label htmlFor="modal-product" className="sales-modal__field-label">
                      {t('purchases.form.product', 'Producto')}
                    </label>

                    <div className="purchases__supplier-wrapper" ref={modalProductSearchRef}>
                      <div className="purchases__supplier-input">
                        <div className="input-search">
                          <Search className="input-search__icon" size={18} />
                          <input
                            id="modal-product"
                            type="text"
                            className="input"
                            placeholder={t('purchases.modal.product_placeholder', 'Buscar producto...')}
                            value={modalProductSearch}
                            onChange={(e) => setModalProductSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const trimmed = modalProductSearch.trim();
                                if (trimmed.length >= 2 && modalProductResults.length > 0) {
                                  handleProductSelect(modalProductResults[0]);
                                }
                              }
                            }}
                            aria-label={t('purchases.modal.product_placeholder', 'Buscar producto...')}
                            aria-describedby="product-search-helper"
                            autoFocus
                          />
                          {modalProductSearch && (
                            <button
                              type="button"
                              className="input-search__clear"
                              onClick={handleClearProductSelection}
                              aria-label="Limpiar búsqueda"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Loading state */}
                      {searchingProducts && (
                        <div className="purchases__supplier-loading">
                          {t('common.searching', 'Buscando...')}
                        </div>
                      )}

                      {/* Dropdown de resultados */}
                      {showProductDropdown && modalProductResults.length > 0 && modalProductSearch.trim().length >= 2 && (
                        <div className="purchases__supplier-dropdown">
                          {modalProductResults.map((product) => (
                            <div
                              key={product.id || product.product_id}
                              className="purchases__supplier-item"
                              onClick={() => handleProductSelect(product)}
                            >
                              <div className="purchases__supplier-item-name">
                                {product.name || product.product_name}
                              </div>
                              <div className="purchases__supplier-item-email">
                                SKU: {product.sku || product.product_sku || '-'} | Costo: {formatCurrency(product.cost_price || product.unit_cost || 0)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Mensaje cuando no hay resultados */}
                      {!searchingProducts && modalProductSearch.trim().length >= 2 && modalProductResults.length === 0 && (
                        <div className="purchases__supplier-loading">
                          {t('purchases.modal.no_results', 'No se encontraron productos')}
                        </div>
                      )}
                    </div>

                    {/* Mensaje de ayuda */}
                    {modalProductSearch && modalProductSearch.trim().length > 0 && modalProductSearch.trim().length < 2 ? (
                      <span className="sales-modal__field-note">
                        {t('purchases.modal.search_min_chars', 'Escribe al menos 2 caracteres para buscar')} ({modalProductSearch.trim().length}/2)
                      </span>
                    ) : !modalProductSearch || modalProductSearch.trim().length < 2 ? (
                      <span className="sales-modal__field-note">
                        {t('purchases.modal.product_note', 'Escribe el nombre o código del producto')}
                      </span>
                    ) : null}
                  </div>

                  <label className="sales-modal__field" htmlFor="modal-quantity">
                    <span className="sales-modal__field-label">
                      {t('purchases.form.quantity', 'Cantidad')}
                    </span>
                    <input
                      id="modal-quantity"
                      type="number"
                      min="1"
                      step="1"
                      className="input"
                      value={modalQuantity}
                      onChange={(e) => setModalQuantity(e.target.value)}
                    />
                    <span className="sales-modal__field-note">
                      {t('purchases.modal.quantity_note', 'Cantidad de unidades a comprar')}
                    </span>
                  </label>

                  <label className="sales-modal__field" htmlFor="modal-unit-price">
                    <span className="sales-modal__field-label">
                      {t('purchases.form.unit_price', 'Precio Unitario (Costo)')}
                    </span>
                    <div className="sales-modal__input-wrapper">
                      <input
                        id="modal-unit-price"
                        type="number"
                        min="0"
                        step="0.01"
                        className="input sales-modal__input"
                        value={modalUnitPrice}
                        onChange={(e) => setModalUnitPrice(Number(e.target.value))}
                        placeholder="0.00"
                      />
                      <span className="sales-modal__input-affix">
                        {paymentCurrency}
                      </span>
                    </div>
                    <span className="sales-modal__field-note">
                      {t('purchases.modal.unit_price_note', 'Precio de compra del producto')}
                    </span>
                  </label>

                  {/* Selector de modo de pricing */}
                  <div className="sales-modal__field">
                    <span className="sales-modal__field-label">
                      {t('purchases.modal.pricing_mode', 'Método de Precio')}
                    </span>
                    <select
                      className="input"
                      value={pricingMode}
                      onChange={(e) => setPricingMode(e.target.value)}
                    >
                      <option value="margin">
                        {t('purchases.modal.pricing_mode.margin', 'Por margen de ganancia')}
                      </option>
                      <option value="sale_price">
                        {t('purchases.modal.pricing_mode.final_price', 'Por precio de venta')}
                      </option>
                    </select>
                  </div>

                  {/* Campo condicional según modo de pricing */}
                  {pricingMode === 'margin' ? (
                    <label className="sales-modal__field" htmlFor="modal-profit">
                      <span className="sales-modal__field-label">
                        {t('purchases.form.profit_margin', 'Margen de Ganancia (%)')}
                      </span>
                      <input
                        id="modal-profit"
                        type="number"
                        min="0"
                        step="1"
                        className="input"
                        value={modalProfitPct}
                        onChange={(e) => setModalProfitPct(Number(e.target.value))}
                        placeholder="30"
                      />
                      <span className="sales-modal__field-note">
                        {t('purchases.modal.profit_note', 'Porcentaje de ganancia sobre el costo')}
                      </span>
                    </label>
                  ) : (
                    <label className="sales-modal__field" htmlFor="modal-sale-price">
                      <span className="sales-modal__field-label">
                        {t('purchases.modal.sale_price', 'Precio de Venta Final')}
                      </span>
                      <div className="sales-modal__input-wrapper">
                        <input
                          id="modal-sale-price"
                          type="number"
                          min="0"
                          step="0.01"
                          className="input sales-modal__input"
                          value={modalSalePrice}
                          onChange={(e) => setModalSalePrice(Number(e.target.value))}
                          placeholder="0.00"
                        />
                        <span className="sales-modal__input-affix">
                          {paymentCurrency}
                        </span>
                      </div>
                      <span className="sales-modal__field-note">
                        {t('purchases.modal.sale_price_note', 'El margen se calculará automáticamente')}
                      </span>
                    </label>
                  )}
                </div>
              </section>

              <section className="sales-modal__section">
                <div className="sales-modal__totals">
                  <div className="sales-modal__totals-grid">
                    <div className="sales-modal__info-item">
                      <span className="sales-modal__label">
                        {t('purchases.form.unit_price', 'Precio unitario (costo)')}
                      </span>
                      <span className="sales-modal__value">
                        {formatCurrency(modalUnitPrice || 0)}
                      </span>
                    </div>
                    <div className="sales-modal__info-item">
                      <span className="sales-modal__label">
                        {pricingMode === 'margin'
                          ? t('purchases.modal.calculated_sale_price', 'Precio de venta calculado')
                          : t('purchases.modal.calculated_margin', 'Margen calculado')
                        }
                      </span>
                      <span className="sales-modal__value">
                        {pricingMode === 'margin'
                          ? formatCurrency(modalSalePrice || 0)
                          : `${modalProfitPct.toFixed(2)}%`
                        }
                      </span>
                    </div>
                    <div className="sales-modal__info-item">
                      <span className="sales-modal__label">
                        {t('purchases.modal.subtotal', 'Subtotal (costo x cant.)')}
                      </span>
                      <span className="sales-modal__value">
                        {formatCurrency((modalQuantity || 0) * (modalUnitPrice || 0))}
                      </span>
                    </div>
                    <div className="sales-modal__info-item">
                      <span className="sales-modal__label">
                        {t('purchases.modal.line_total', 'Total venta (cant. x precio venta)')}
                      </span>
                      <span className="sales-modal__value sales-modal__value--highlight">
                        {formatCurrency((modalQuantity || 0) * (modalSalePrice || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <footer className="sales-modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setIsModalOpen(false)}
              >
                {t('action.cancel', 'Cancelar')}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleConfirmAddProduct}
              >
                {t('action.confirm', 'Confirmar')}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
