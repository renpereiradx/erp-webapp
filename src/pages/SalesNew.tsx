import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  DollarSign,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Search,
  ShoppingCart,
  User,
  X,
  History,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SearchableDropdown, SearchableDropdownItem } from '@/components/ui/SearchableDropdown';
import useClientStore from '@/store/useClientStore';
import useSaleStore from '@/store/useSaleStore';
import useDashboardStore from '@/store/useDashboardStore';
import { useToast } from '@/hooks/useToast';
import saleService from '@/services/saleService';
import { PaymentMethodService } from '@/services/paymentMethodService';
import { CurrencyService } from '@/services/currencyService';
import { productService } from '@/services/productService';
import InstantPaymentDialog from '@/components/ui/InstantPaymentDialog';
import { salePaymentService } from '@/services/salePaymentService';
import ToastContainer from '@/components/ui/ToastContainer';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  discount: number;
  discountType: 'amount' | 'percent';
  discountInput: number;
  discountReason: string;
  taxRate: number;
  unit: string;
  isFromPendingSale?: boolean;
  detailId?: string;
}

interface Client extends SearchableDropdownItem {
  id: string;
  name: string;
  document_id?: string;
  email?: string;
}

interface ProductDisplay {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  base_unit: string;
  taxRate: number;
}

interface SaleMetadata {
  sale_id: string;
  total_amount: number;
  status: string;
}

const STATUS_STYLES: Record<string, { label: string; badge: string }> = {
  completed: { label: 'Completada', badge: 'badge--subtle-success' },
  cancelled: { label: 'Cancelada', badge: 'badge--subtle-error' },
  pending: { label: 'Pendiente', badge: 'badge--subtle-warning' },
  paid: { label: 'Pagada', badge: 'badge--subtle-success' },
};

const formatCurrency = (value: number, currencyCode = 'PYG'): string => {
  const isPYG = currencyCode === 'PYG';
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: isPYG ? 0 : 2,
    maximumFractionDigits: isPYG ? 0 : 2,
  }).format(value || 0);
};

const formatDateTime = (value: string | Date | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return String(value).split('T')[0] || '—';
  }
  return date.toLocaleString('es-PY', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const toDateInputValue = (date: Date): string => {
  const local = new Date(date);
  local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return local.toISOString().split('T')[0];
};

const getProductDisplay = (product: Record<string, unknown>): ProductDisplay => {
  const rawTaxRateCandidates = [
    product.tax_rate,
    product.tax_rate_value,
    product.tax_percentage,
    product.vat_rate,
    product.iva,
  ];

  let normalizedTaxRate = 0;
  const rawTaxRate = rawTaxRateCandidates.find(candidate => candidate !== undefined && candidate !== null);
  if (rawTaxRate !== undefined) {
    const parsedRate = Number(rawTaxRate);
    if (Number.isFinite(parsedRate) && parsedRate > 0) {
      normalizedTaxRate = parsedRate >= 1 ? parsedRate / 100 : parsedRate;
    }
  }

  const price = 
    product.sale_price ||
    product.price ||
    product.unit_price ||
    0;

  return {
    id: String(product.id || product.product_id || ''),
    name: String(product.name || product.product_name || ''),
    sku: String(product.sku || product.barcode || product.code || '-'),
    barcode: product.barcode ? String(product.barcode) : undefined,
    price: Number(price) || 0,
    stock: Number(product.stock_quantity || product.stock || product.quantity || 0),
    base_unit: String(product.base_unit || product.unit || 'unit'),
    taxRate: normalizedTaxRate,
  };
};

const SalesNew: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  const clientSearchInputRef = useRef<HTMLInputElement>(null);

  const { searchClients } = useClientStore();
  const {
    createSale,
    sales,
    fetchSalesByDateRange,
    fetchSalesByClientName,
    clearSales,
    cancelSale,
    loading: saleLoading,
  } = useSaleStore();

  const [activeTab, setActiveTab] = useState<'new-sale' | 'history'>('new-sale');
  const { fetchDashboardData } = useDashboardStore();

  const [items, setItems] = useState<CartItem[]>([]);
  const [searchTerm] = useState('');
  const [generalDiscount] = useState(0);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [paymentMethodId, setPaymentMethodId] = useState(1);
  const [currencyId, setCurrencyId] = useState(1);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: number; name: string }>>([]);
  const [currencies, setCurrencies] = useState<Array<{ id: number; code: string }>>([]);

  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterMode, setHistoryFilterMode] = useState<'date' | 'name'>('date');
  
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return toDateInputValue(d);
  });
  const [dateTo, setDateTo] = useState(toDateInputValue(new Date()));
  
  const [selectedHistorySale, setSelectedHistorySale] = useState<Record<string, unknown> | null>(null);
  const [showCancelSaleModal, setShowCancelSaleModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelPreview, setCancelPreview] = useState<Record<string, unknown> | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModalProduct, setSelectedModalProduct] = useState<Record<string, unknown> | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalDiscount, setModalDiscount] = useState(0);
  const [modalDiscountType, setModalDiscountType] = useState<'amount' | 'percent'>('amount');
  const [modalDiscountReason, setModalDiscountReason] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [showInstantCollection, setShowInstantCollection] = useState(false);
  const [createdSaleData, setCreatedSaleData] = useState<SaleMetadata | null>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);

  const [productSearchResults, setProductSearchResults] = useState<ProductDisplay[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productHighlightedIndex, setProductHighlightedIndex] = useState(-1);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductQuantity, setSelectedProductQuantity] = useState(1);

  const saleTotals = useMemo(() => saleService.calculateLocalTotals(items), [items]);
  const subtotal = saleTotals.subtotal;
  const lineDiscounts = saleTotals.discount_total;
  const taxes = saleTotals.tax_amount;
  const total = useMemo(() => Math.max(0, saleTotals.total - generalDiscount), [saleTotals.total, generalDiscount]);

  const filteredItems = useMemo(() => 
    items.filter(item => (item.name || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [items, searchTerm]
  );

  const taxSummaryLabel = useMemo(() => {
    const rates = Array.from(
      new Set(
        items
          .map(item => Number(item.taxRate ?? 0))
          .filter(rate => Number.isFinite(rate) && rate > 0)
          .map(rate => (rate > 1 ? rate / 100 : rate))
          .map(rate => Number((rate * 100).toFixed(2))),
      ),
    );
    if (rates.length === 1) return `Impuestos (IVA ${rates[0]}%)`;
    if (rates.length > 1) return 'Impuestos (tasas mixtas)';
    return 'Impuestos (según tasa de producto)';
  }, [items]);

  const filteredHistory = useMemo(() => {
    return (sales || [])
      .map((entry, idx) => {
        const s = (entry as Record<string, unknown>).sale || entry;
        const saleId = (s as Record<string, unknown>).sale_id || (s as Record<string, unknown>).id || (entry as Record<string, unknown>).saleId || (entry as Record<string, unknown>).id;
        
        return {
          ...(s as Record<string, unknown>),
          internalKey: saleId ? `sale-${saleId}-${idx}` : `sale-index-${idx}`,
          id: saleId,
          displayId: saleId || 'N/A',
          client_name: (s as Record<string, unknown>).client_name || ((s as Record<string, unknown>).client as Record<string, unknown>)?.name || 'Cliente Ocasional',
          total_amount: (s as Record<string, unknown>).total_amount || (s as Record<string, unknown>).total || 0,
          date: (s as Record<string, unknown>).sale_date || (s as Record<string, unknown>).order_date || (s as Record<string, unknown>).date,
          status: String(((s as Record<string, unknown>).status || (entry as Record<string, unknown>).status || 'PENDING')).toUpperCase(),
        };
      })
      .filter(entry => {
        if (!historySearch) return true;
        const searchLower = historySearch.toLowerCase().replace('#', '');
        const saleIdStr = String(entry.id || '').toLowerCase();
        const clientNameStr = (entry.client_name || '').toLowerCase();
        return clientNameStr.includes(searchLower) || saleIdStr.includes(searchLower);
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });
  }, [sales, historySearch]);

  useEffect(() => {
    if (activeTab === 'history' && sales.length === 0 && !saleLoading) {
      handleHistoryFilter();
    }
  }, [activeTab]);

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        const methods = await PaymentMethodService.getAll();
        const methodsArray = Array.isArray(methods) ? methods : [];
        setPaymentMethods(methodsArray);
        if (methodsArray.length > 0) setPaymentMethodId(methodsArray[0].id);
      } catch (error) {
        console.error('Error loading payment methods:', error);
      }

      try {
        const currencyList = await CurrencyService.getAll();
        setCurrencies(currencyList);
        if (currencyList.length > 0) setCurrencyId(currencyList[0].id);
      } catch (error) {
        console.error('Error loading currencies:', error);
      }
    };
    loadPaymentData();
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      const term = productSearchTerm.trim();
      if (term.length >= 3) {
        setIsSearchingProducts(true);
        try {
          const results = await productService.searchProducts(term);
          const allResults = Array.isArray(results) ? results : results ? [results] : [];
          const activeResults = (allResults as Record<string, unknown>[]).filter(p => {
            if (typeof p.status === 'boolean') return p.status;
            return p.state !== false && p.is_active !== false;
          });
          const displayResults = activeResults.slice(0, 15).map(p => getProductDisplay(p));
          setProductSearchResults(displayResults);
          setShowProductDropdown(true);
          setProductHighlightedIndex(displayResults.length > 0 ? 0 : -1);
        } catch (error) {
          console.error('Error searching products:', error);
          setProductSearchResults([]);
        } finally {
          setIsSearchingProducts(false);
        }
      } else {
        setProductSearchResults([]);
        setShowProductDropdown(false);
        setProductHighlightedIndex(-1);
      }
    }, 300);
    return () => clearTimeout(searchTimeout);
  }, [productSearchTerm]);

  useEffect(() => {
    if (activeTab === 'new-sale' && productSearchInputRef.current) {
      productSearchInputRef.current.focus();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeTab !== 'new-sale') return;

      if (event.key === 'F2') {
        event.preventDefault();
        productSearchInputRef.current?.focus();
        return;
      }

      if (event.key === 'F3') {
        event.preventDefault();
        clientSearchInputRef.current?.focus();
        return;
      }

      if (document.activeElement === productSearchInputRef.current) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setProductHighlightedIndex(prev =>
            prev < productSearchResults.length - 1 ? prev + 1 : prev
          );
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setProductHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (event.key === 'Enter' && productHighlightedIndex >= 0) {
          event.preventDefault();
          const selectedProduct = productSearchResults[productHighlightedIndex];
          if (selectedProduct) {
            addProductToCart(selectedProduct, selectedProductQuantity);
            setProductSearchTerm('');
            setProductHighlightedIndex(-1);
            setSelectedProductQuantity(1);
            setShowProductDropdown(false);
            productSearchInputRef.current?.focus();
          }
        } else if (event.key === 'Escape') {
          setShowProductDropdown(false);
          setProductHighlightedIndex(-1);
        }
      }

    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, productSearchResults, productHighlightedIndex, selectedProductQuantity]);

  const handleHistoryFilter = async () => {
    const term = historySearch.trim();
    if (term && (historyFilterMode === 'name' || term.startsWith('#'))) {
      try {
        await fetchSalesByClientName(term.replace('#', ''), { page: 1, page_size: 100 });
        return;
      } catch (error) {
        console.error('Error fetching by name:', error);
      }
    }

    if (!dateFrom || !dateTo) {
      toast.error('Selecciona un rango de fechas');
      return;
    }

    try {
      await fetchSalesByDateRange({
        start_date: dateFrom,
        end_date: dateTo,
        page: 1,
        page_size: 100,
      });
    } catch (error) {
      toast.errorFrom(error as Error, { fallback: 'No se pudo obtener el historial de ventas' });
    }
  };

  const handleLoadLatest = async () => {
    setHistorySearch('');
    setHistoryFilterMode('date');
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 90);
    const startStr = toDateInputValue(start);
    const endStr = toDateInputValue(end);
    setDateFrom(startStr);
    setDateTo(endStr);
    try {
      await fetchSalesByDateRange({
        start_date: startStr,
        end_date: endStr,
        page: 1,
        page_size: 100,
      });
    } catch (error) {
      toast.error('Error al cargar últimos registros');
    }
  };

  const addProductToCart = useCallback((product: ProductDisplay, quantity: number = 1) => {
    const newItem: CartItem = {
      id: `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: product.id,
      name: product.name,
      quantity,
      price: product.price,
      discount: 0,
      discountType: 'amount',
      discountInput: 0,
      discountReason: '',
      taxRate: product.taxRate,
      unit: product.base_unit,
    };

    setItems(prev => {
      const existingItem = prev.find(item => item.productId === product.id && !item.isFromPendingSale);
      if (existingItem) {
        if (window.confirm(`El producto "${product.name}" ya está en el carrito.\n¿Deseas sumar las cantidades?`)) {
          return prev.map(item => item.id === existingItem.id ? { ...item, quantity: item.quantity + quantity } : item);
        }
        return prev;
      }
      return [...prev, newItem];
    });
  }, []);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
  };

  const handleClearClient = () => {
    setSelectedClient(null);
  };

  const handleOpenEditModal = (item: CartItem) => {
    setEditingItemId(item.id);
    setSelectedModalProduct({
      id: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      discount: item.discountInput,
      discountType: item.discountType,
      discountReason: item.discountReason,
      taxRate: item.taxRate,
    });
    setModalQuantity(item.quantity);
    setModalDiscount(item.discountInput);
    setModalDiscountType(item.discountType);
    setModalDiscountReason(item.discountReason);
    setIsModalOpen(true);
  };

  const handleConfirmAdd = () => {
    if (!selectedModalProduct) {
      setIsModalOpen(false);
      return;
    }
    if (modalDiscount > 0 && !modalDiscountReason.trim()) {
      toast.error('Debes ingresar una razón para el descuento');
      return;
    }

    const productDisplay = getProductDisplay(selectedModalProduct);
    const parsedModalQuantity = Math.max(1, Number(modalQuantity) || 1);
    const parsedModalDiscount = Math.max(0, Number(modalDiscount) || 0);

    let discountValue = 0;
    if (modalDiscountType === 'percent') {
      discountValue = productDisplay.price * (parsedModalDiscount / 100) * parsedModalQuantity;
    } else {
      discountValue = parsedModalDiscount * parsedModalQuantity;
    }

    const newItem: CartItem = {
      id: editingItemId || `${productDisplay.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: productDisplay.id,
      name: productDisplay.name,
      quantity: parsedModalQuantity,
      price: productDisplay.price,
      discount: discountValue,
      discountType: modalDiscountType,
      discountInput: parsedModalDiscount,
      discountReason: modalDiscountReason,
      taxRate: productDisplay.taxRate,
      unit: productDisplay.base_unit,
    };

    setItems(prev => {
      if (editingItemId) {
        return prev.map(item => (item.id === editingItemId ? newItem : item));
      }
      return [...prev, newItem];
    });

    setModalQuantity(1);
    setModalDiscount(0);
    setEditingItemId(null);
    setIsModalOpen(false);
  };

  const handleHistoryClear = () => {
    setHistorySearch('');
    setDateFrom(toDateInputValue(new Date()));
    setDateTo(toDateInputValue(new Date()));
    setHistoryFilterMode('date');
    clearSales();
  };

  const handleViewSale = (sale: Record<string, unknown>) => {
    const saleId = sale.sale_id || sale.id;
    if (saleId) {
      navigate(`/cobros-ventas/${saleId}`);
    }
  };

  const handleCancelSale = async (sale: Record<string, unknown>) => {
    const saleId = sale?.sale_id || sale?.id;
    if (!saleId) return;
    setCancelPreview(null);
    setSelectedHistorySale(sale);
    setCancelReason('');
    try {
      const preview = await saleService.previewSaleCancellation(saleId as string);
      setCancelPreview(preview as Record<string, unknown>);
      setShowCancelSaleModal(true);
    } catch (error) {
      toast.errorFrom(error as Error, { fallback: 'No se pudo previsualizar la anulación' });
    }
  };

  const handleConfirmCancelSale = async () => {
    if (!selectedHistorySale) return;
    const saleId = (selectedHistorySale as Record<string, unknown>).sale_id || selectedHistorySale.id;
    setCancelSubmitting(true);
    try {
      await cancelSale(saleId as string, cancelReason || 'Cancelada por el usuario');
      toast.success('Venta anulada exitosamente');
      setShowCancelSaleModal(false);
      setCancelPreview(null);
      handleHistoryFilter();
    } catch (error) {
      toast.errorFrom(error as Error, { fallback: 'No se pudo cancelar la venta' });
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleSaveSale = async () => {
    if (!selectedClient) {
      toast.error('Por favor selecciona un cliente');
      clientSearchInputRef.current?.focus();
      return;
    }
    if (items.length === 0) {
      toast.error('Por favor agrega al menos un producto');
      productSearchInputRef.current?.focus();
      return;
    }
    
    setIsProcessingSale(true);
    try {
      if (currentSaleId) {
        const newItems = items.filter(item => !item.isFromPendingSale);
        if (newItems.length === 0) { 
          toast.error('No hay productos nuevos para agregar'); 
          setIsProcessingSale(false);
          return;
        }
        const payload = {
          allow_price_modifications: newItems.some(item => item.discount > 0),
          product_details: newItems.map(item => ({
            product_id: item.productId,
            quantity: item.quantity,
            unit: item.unit || 'unit',
            ...(item.discount > 0 && {
              [item.discountType === 'percent' ? 'discount_percent' : 'discount_amount']: Number(item.discountInput),
              discount_reason: item.discountReason || 'Descuento aplicado en venta',
            }),
          })),
        };
        const response = await saleService.addProductsToSale(currentSaleId, payload);
        if (response?.success) {
          toast.success(`Venta actualizada exitosamente.`); 
          setItems([]); 
          setCurrentSaleId(null); 
          setSelectedClient(null);
          fetchDashboardData();
          handleHistoryFilter();
        }
      } else {
        const saleData = {
          client_id: selectedClient.id,
          allow_price_modifications: items.some(item => item.discount > 0),
          product_details: items.map(item => ({
            product_id: item.productId,
            quantity: item.quantity,
            unit: item.unit || 'unit',
            ...(item.discount > 0 && {
              [item.discountType === 'percent' ? 'discount_percent' : 'discount_amount']: Number(item.discountInput),
              discount_reason: item.discountReason || 'Descuento aplicado en venta',
            }),
          })),
        };
        const response = await createSale(saleData);
        if (response?.sale_id) {
          setCreatedSaleData({ id: response.sale_id, total: response.total_amount, status: 'pending' }); 
          setShowInstantCollection(true);
        }
      }
    } catch (error) { 
      toast.error('Error al procesar la venta');
    } finally {
      setIsProcessingSale(false);
    }
  };

  const modalDisplay = selectedModalProduct ? getProductDisplay(selectedModalProduct) : null;
  const modalUnitPrice = modalDisplay?.price || 0;
  const parsedModalQuantity = Math.max(1, Number(modalQuantity) || 1);
  const parsedModalDiscount = Math.max(0, Number(modalDiscount) || 0);
  const modalSubtotal = modalUnitPrice * parsedModalQuantity;
  const modalDiscountValue = useMemo(() => {
    let td = 0;
    if (modalDiscountType === 'percent') {
      td = modalUnitPrice * (parsedModalDiscount / 100) * parsedModalQuantity;
    } else {
      td = parsedModalDiscount * parsedModalQuantity;
    }
    return Math.min(td, modalSubtotal);
  }, [parsedModalDiscount, modalSubtotal, modalDiscountType, modalUnitPrice, parsedModalQuantity]);
  const modalLineTotal = Math.max(0, modalSubtotal - modalDiscountValue);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-display">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-fluent-8">
            <ShoppingCart size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">Punto de Venta</h1>
            <p className="text-text-secondary text-sm font-medium mt-1">Facturación y registro de operaciones</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
          {[
            { id: 'new-sale' as const, label: 'Nueva Venta', icon: <Plus size={16} /> },
            { id: 'history' as const, label: 'Historial', icon: <History size={16} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all',
              activeTab === tab.id ? 'bg-white dark:bg-surface-dark text-primary shadow-fluent-2' : 'text-text-secondary hover:text-text-main'
            )}>
              {tab.icon} <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="w-full">
        {activeTab === 'new-sale' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              <article className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <header className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={18} className="text-primary" />
                    <h3 className="font-semibold">Productos Seleccionados</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="hidden sm:inline">Ctrl+Shift+P para buscar</span>
                  </div>
                </header>

                <div className="p-4">
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        ref={productSearchInputRef}
                        type="text"
                        placeholder="Buscar producto por nombre, SKU o código... (F2)"
                        value={productSearchTerm}
                        onChange={(e) => {
                          setProductSearchTerm(e.target.value);
                          setSelectedProductQuantity(1);
                        }}
                        className="pl-10 h-12 text-base"
                      />
                    </div>

                    {showProductDropdown && productSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-border-subtle rounded-xl shadow-fluent-16 overflow-hidden max-h-80 overflow-y-auto">
                        <div className="py-2">
                          {productSearchResults.map((product, index) => {
                            const isHighlighted = index === productHighlightedIndex;
                            return (
                              <div key={product.id} className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    addProductToCart(product, selectedProductQuantity);
                                    setProductSearchTerm('');
                                    setShowProductDropdown(false);
                                    setProductHighlightedIndex(-1);
                                    productSearchInputRef.current?.focus();
                                  }}
                                  onMouseEnter={() => setProductHighlightedIndex(index)}
                                  className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                                    isHighlighted
                                      ? 'bg-primary/5 border-l-4 border-primary'
                                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                                  )}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{product.name}</p>
                                    <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-black text-primary">
                                      {formatCurrency(product.price)}
                                    </p>
                                    <p className={cn(
                                      'text-[10px] font-bold uppercase',
                                      product.stock > 0 ? 'text-success' : 'text-error'
                                    )}>
                                      Stock: {product.stock}
                                    </p>
                                  </div>
                                </button>

                                {isHighlighted && (
                                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-t border-slate-100">
                                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                      Cant:
                                    </span>
                                    <input
                                      type="number"
                                      min="1"
                                      value={selectedProductQuantity}
                                      onChange={(e) => setSelectedProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          addProductToCart(product, selectedProductQuantity);
                                          setProductSearchTerm('');
                                          setShowProductDropdown(false);
                                          setProductHighlightedIndex(-1);
                                          setSelectedProductQuantity(1);
                                          productSearchInputRef.current?.focus();
                                        } else if (e.key === 'Escape') {
                                          setShowProductDropdown(false);
                                          setProductHighlightedIndex(-1);
                                        } else if (e.key === 'ArrowUp') {
                                          e.preventDefault();
                                          setProductHighlightedIndex(prev => Math.max(0, prev - 1));
                                        } else if (e.key === 'ArrowDown') {
                                          e.preventDefault();
                                          setProductHighlightedIndex(prev =>
                                            Math.min(productSearchResults.length - 1, prev + 1)
                                          );
                                        }
                                        e.stopPropagation();
                                      }}
                                      className="w-16 h-8 px-2 text-sm font-bold text-center border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="text-xs text-slate-400">
                                      ↑↓ navegar • Enter agregar
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs uppercase text-slate-500">
                          <th className="text-left py-2 px-3">ID</th>
                          <th className="text-left py-2 px-3">Producto</th>
                          <th className="text-right py-2 px-3">Cant.</th>
                          <th className="text-right py-2 px-3">Precio</th>
                          <th className="text-right py-2 px-3">Desc.</th>
                          <th className="text-right py-2 px-3">Total</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-8 text-slate-400">Carrito vacío - Busca un producto arriba</td></tr>
                        ) : (
                          filteredItems.map(item => (
                            <tr key={item.id} className="border-b hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-500">{item.productId || '-'}</td>
                              <td className="py-2 px-3 font-medium">
                                {item.isFromPendingSale && <Badge className="mr-2 bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[9px] uppercase">Persistido</Badge>}
                                {item.name}
                              </td>
                              <td className="py-2 px-3 text-right">{item.quantity}</td>
                              <td className="py-2 px-3 text-right">{formatCurrency(item.price)}</td>
                              <td className="py-2 px-3 text-right text-red-500">-{formatCurrency(item.discount)}</td>
                              <td className="py-2 px-3 text-right font-bold">{formatCurrency(item.price * item.quantity - item.discount)}</td>
                              <td className="py-2 px-3 text-right">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenEditModal(item)}
                                    className="size-8 text-slate-400 hover:text-primary"
                                  >
                                    <MoreVertical size={14} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                                    className="size-8 text-slate-400 hover:text-red-500"
                                  >
                                    <X size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </article>

              <article className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <header className="flex items-center gap-2 px-4 py-3 border-b">
                  <DollarSign size={18} className="text-primary" />
                  <h3 className="font-semibold">Resumen</h3>
                </header>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                    <div className="flex justify-between text-sm"><span>{taxSummaryLabel}</span><span className="font-medium">{formatCurrency(taxes)}</span></div>
                    <div className="flex justify-between text-sm text-red-500"><span>Descuentos</span><span className="font-medium">-{formatCurrency(lineDiscounts + generalDiscount)}</span></div>
                    <div className="pt-2 border-t flex justify-between items-end">
                      <span className="text-base font-bold">Total</span>
                      <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-end gap-2">
                    <Button
                      onClick={handleSaveSale}
                      disabled={isProcessingSale || items.length === 0}
                      className="w-full h-12 text-base font-bold uppercase tracking-widest"
                    >
                      {isProcessingSale ? 'Guardando...' : 'Confirmar Venta'}
                    </Button>
                    <Button variant="outline" onClick={() => setItems([])} className="w-full">Limpiar Carrito</Button>
                  </div>
                </div>
              </article>
            </div>

            <aside className="lg:col-span-4 space-y-4">
              <article className="bg-white rounded-lg shadow-sm border overflow-hidden p-4 space-y-4">
                <div className="flex items-center gap-2 border-b pb-2 mb-2">
                  <User size={18} className="text-primary" />
                  <h3 className="font-semibold">Cliente</h3>
                </div>
                <SearchableDropdown<Client>
                  onSelect={handleSelectClient}
                  onSearch={async (term: string): Promise<Client[]> => {
                    if (term.trim().length < 3) return [];
                    await searchClients(term);
                    return useClientStore.getState().searchResults as Client[];
                  }}
                  placeholder="Buscar cliente... (F3)"
                  autoFocus={false}
                  renderItem={(item, _index, _isHighlighted) => (
                    <div className="flex items-center gap-3">
                      <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        {item.document_id && (
                          <p className="text-xs text-slate-500">CI: {item.document_id}</p>
                        )}
                      </div>
                    </div>
                  )}
                  emptyMessage="No se encontraron clientes"
                  className="w-full"
                />
                {selectedClient && (
                  <div className="p-3 bg-primary/5 rounded border border-primary/10 flex items-center justify-between">
                    <div>
                      <p className="font-black text-primary uppercase text-xs">Cliente Seleccionado</p>
                      <p className="font-bold text-sm">{selectedClient.name}</p>
                      <p className="text-xs text-slate-500">{selectedClient.document_id}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClearClient} className="size-8 text-slate-400 hover:text-red-500">
                      <X size={14} />
                    </Button>
                  </div>
                )}
              </article>

              <article className="bg-white rounded-lg shadow-sm border overflow-hidden p-4 space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <CreditCard size={18} className="text-primary" />
                  <h3 className="font-semibold">Método de Pago</h3>
                </div>
                <Select value={String(paymentMethodId)} onValueChange={(v) => setPaymentMethodId(Number(v))}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.id} value={String(method.id)}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </article>

              <article className="bg-white rounded-lg shadow-sm border overflow-hidden p-4 space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <DollarSign size={18} className="text-primary" />
                  <h3 className="font-semibold">Moneda</h3>
                </div>
                <Select value={String(currencyId)} onValueChange={(v) => setCurrencyId(Number(v))}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency.id} value={String(currency.id)}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </article>
            </aside>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <article className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[260px] space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500">Búsqueda rápida</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input placeholder="Cliente o #Venta" value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500">Desde</label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500">Hasta</label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleHistoryFilter} className="gap-2"><Filter size={16} /> Filtrar</Button>
                  <Button variant="outline" onClick={handleLoadLatest} className="gap-2"><History size={16} /> Ver Últimos</Button>
                  <Button variant="ghost" onClick={handleHistoryClear}><X size={16} /></Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-slate-50 text-slate-600 font-black uppercase text-[10px] tracking-widest">{sales.length} Registros</Badge>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr className="text-xs uppercase text-slate-500">
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Fecha</th>
                      <th className="text-left py-3 px-4">Cliente</th>
                      <th className="text-right py-3 px-4">Total</th>
                      <th className="text-center py-3 px-4">Estado</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleLoading ? (
                      <tr><td colSpan={6} className="py-12 text-center text-slate-400">Cargando historial...</td></tr>
                    ) : filteredHistory.length === 0 ? (
                      <tr><td colSpan={6} className="py-12 text-center text-slate-400">No se encontraron resultados</td></tr>
                    ) : (
                      filteredHistory.map((sale) => (
                        <tr key={sale.internalKey} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-primary">#{sale.displayId}</td>
                          <td className="py-3 px-4 text-slate-600">{formatDateTime(sale.date)}</td>
                          <td className="py-3 px-4 font-medium">{sale.client_name}</td>
                          <td className="py-3 px-4 text-right font-bold">{formatCurrency(sale.total_amount)}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={cn('uppercase text-[9px] font-black', STATUS_STYLES[sale.status.toLowerCase()]?.badge || 'bg-slate-100')}>
                              {STATUS_STYLES[sale.status.toLowerCase()]?.label || sale.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8"><MoreVertical size={16} /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleViewSale(sale)} className="gap-2"><Eye size={14} /> Ver Detalle</DropdownMenuItem>
                                {sale.status !== 'CANCELLED' && (
                                  <DropdownMenuItem onClick={() => handleCancelSale(sale)} className="gap-2 text-red-600 focus:text-red-600"><Ban size={14} /> Anular Venta</DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        )}
      </main>

      {isModalOpen && selectedModalProduct && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60" 
          onClick={() => setIsModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <Card className="relative w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 bg-white" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between border-b bg-primary/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart size={20} className="text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">{editingItemId ? 'Editar Producto' : 'Producto'}</CardTitle>
                  {modalDisplay && (
                    <p className="text-sm text-slate-500 font-medium">{modalDisplay.name}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {modalDisplay && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Cantidad</label>
                      <Input
                        type="number"
                        value={modalQuantity}
                        onChange={(e) => setModalQuantity(e.target.value)}
                        min="1"
                        className="h-12 text-lg font-bold text-center border-2 border-slate-200 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Precio Unit.</label>
                      <div className="h-12 flex items-center justify-center border-2 border-slate-200 rounded-md bg-slate-50">
                        <span className="text-lg font-bold text-primary">{formatCurrency(modalUnitPrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Descuento</label>
                      <Select value={modalDiscountType} onValueChange={(v) => setModalDiscountType(v as 'amount' | 'percent')}>
                        <SelectTrigger className="w-28 h-9 text-xs font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amount">Guaraníes</SelectItem>
                          <SelectItem value="percent">Porcentaje</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      value={modalDiscount}
                      onChange={(e) => setModalDiscount(e.target.value)}
                      placeholder={modalDiscountType === 'percent' ? '0' : '0'}
                      className="h-11 text-center font-bold border-2 border-slate-200 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Razón del descuento</label>
                    <Input
                      value={modalDiscountReason}
                      onChange={(e) => setModalDiscountReason(e.target.value)}
                      placeholder="Ej: Promo, descuento por cantidad..."
                      className="h-10 border-slate-200"
                    />
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-medium">{formatCurrency(modalUnitPrice * modalQuantity)}</span>
                    </div>
                    {modalDiscountValue > 0 && (
                      <div className="flex justify-between text-sm text-red-500">
                        <span>Descuento</span>
                        <span className="font-medium">-{formatCurrency(modalDiscountValue)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="font-bold">Total</span>
                      <span className="text-xl font-black text-primary">{formatCurrency(modalLineTotal)}</span>
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 h-11 font-semibold"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmAdd} 
                  className="flex-1 h-11 font-bold"
                >
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showCancelSaleModal && selectedHistorySale && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b bg-red-50">
              <CardTitle className="text-red-600 flex items-center gap-2"><Ban size={20} /> Anular Venta #{(selectedHistorySale as Record<string, unknown>).sale_id || selectedHistorySale.id}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-slate-600">¿Estás seguro de anular esta venta? Esta acción revertirá el stock y los cobros realizados.</p>
              {cancelPreview && (
                <div className="p-3 bg-slate-50 rounded border text-xs space-y-1">
                  <p className="font-bold uppercase text-[10px] text-slate-400">Impacto Estimado</p>
                  <div className="flex justify-between"><span>Cobros a revertir:</span><span className="font-bold">{((cancelPreview as Record<string, unknown>).impact_analysis as Record<string, number>)?.payments_to_cancel || 0}</span></div>
                  <div className="flex justify-between"><span>Monto total:</span><span className="font-bold">{formatCurrency(((cancelPreview as Record<string, unknown>).impact_analysis as Record<string, number>)?.total_to_reverse || 0)}</span></div>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500">Motivo de anulación</label>
                <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Ej: Error en facturación, devolución..." />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowCancelSaleModal(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleConfirmCancelSale} disabled={cancelSubmitting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold">{cancelSubmitting ? 'Anulando...' : 'Sí, Anular'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showInstantCollection && createdSaleData && (
        <InstantPaymentDialog
          open={showInstantCollection}
          onOpenChange={setShowInstantCollection}
          isSale={true}
          totalAmount={createdSaleData.total}
          currency="PYG"
          paymentMethods={paymentMethods}
          onSubmit={async (data) => {
            try {
              await salePaymentService.processSalePaymentWithCashRegister({
                sales_order_id: createdSaleData.id,
                amount_received: data.amount_received || data.amount,
                payment_method_id: data.paymentMethodId,
                payment_notes: data.notes || null,
              });
              setShowInstantCollection(false);
              setCreatedSaleData(null);
              setItems([]);
              setSelectedClient(null);
              toast.success('Cobro registrado exitosamente');
            } catch (e) {
              toast.error('Error al registrar cobro');
            }
          }}
          onLeavePending={() => {
            setShowInstantCollection(false);
            setCreatedSaleData(null);
            setItems([]);
            setSelectedClient(null);
            toast.success('Venta guardada como pendiente');
          }}
        />
      )}

      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  );
};

export default SalesNew;
