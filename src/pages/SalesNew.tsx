import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBarcodeScanner } from '@/features/sales/hooks/useBarcodeScanner';
import { useSalesShortcuts } from '@/features/sales/hooks/useSalesShortcuts';
import { SalesCartGrid } from '@/features/sales/components/SalesCartGrid';
import { ReservationModal } from '@/features/sales/components/ReservationModal';
import { MessageBar } from '@/components/ui/MessageBar';
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
  Percent,
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
import SegmentedControl from '@/components/ui/SegmentedControl';
import useClientStore from '@/store/useClientStore';
import useSaleStore from '@/store/useSaleStore';
import useDashboardStore from '@/store/useDashboardStore';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import saleService from '@/services/saleService';
import clientService from '@/services/clientService';
import apiService from '@/services/api.ts';
import { PaymentMethodService } from '@/services/paymentMethodService';
import { CurrencyService } from '@/services/currencyService';
import { productService } from '@/services/productService';
import InstantPaymentDialog from '@/components/ui/InstantPaymentDialog';
import { VariantSelectorModal } from '@/features/sales/components/VariantSelectorModal';
import { salePaymentService } from '@/services/salePaymentService';
import { useI18n } from '@/lib/i18n';
import { formatCurrency, formatNumber } from '@/utils/currencyUtils';
import { isDecimalUnit } from '@/constants/units';
import ToastContainer from '@/components/ui/ToastContainer';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  stock?: number;
  discount: number;
  discountType: 'amount' | 'percent';
  discountInput: number;
  discountReason: string;
  taxRate: number;
  unit: string;
  isFromPendingSale?: boolean;
  detailId?: string;
  reserve_id?: number;  // ID numerico de la reserva si aplica
  variantId?: string;
  variantName?: string;
}

interface Client extends SearchableDropdownItem {
  id: string;
  name: string;
  lastName?: string;
  displayName?: string;
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
  has_valid_price: boolean;
  has_variants?: boolean;
}

interface SaleMetadata {
  id: string;
  total: number;
  status: string;
  paymentMethodId?: number;
  paymentMethodLabel?: string;
  currencyCode?: string;
}

const STATUS_STYLES: Record<string, { label: string; badge: string }> = {
  completed: { label: 'Completada', badge: 'badge--subtle-success' },
  cancelled: { label: 'Cancelada', badge: 'badge--subtle-error' },
  pending: { label: 'Pendiente', badge: 'badge--subtle-warning' },
  paid: { label: 'Pagada', badge: 'badge--subtle-success' },
};

export const PRICE_CHANGE_REASONS = [
  { id: 'bulk_discount', label: '🔻 Descuento por volumen', type: 'discount' },
  { id: 'loyalty_discount', label: '🔻 Descuento por fidelidad', type: 'discount' },
  { id: 'promotional_offer', label: '🔻 Oferta promocional', type: 'discount' },
  { id: 'damaged_product', label: '🔻 Producto con daño menor', type: 'discount' },
  { id: 'clearance_sale', label: '🔻 Liquidación de inventario', type: 'discount' },
  { id: 'price_match', label: '🔻 Igualación de precio', type: 'discount' },
  { id: 'tournament_price', label: '🔺 Precio de torneo/evento', type: 'increase' },
  { id: 'peak_hours', label: '🔺 Tarifa por hora pico', type: 'increase' },
  { id: 'holiday_surcharge', label: '🔺 Recargo por feriado', type: 'increase' },
];

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
  // Jerarquía según API v3.1.0: applicable_tax_rate > category.default_tax_rate > fallback
  const applicableTaxRate = (product.applicable_tax_rate as any)?.rate;
  const categoryTaxRate = (product.category as any)?.default_tax_rate?.rate;
  
  const rawTaxRateCandidates = [
    applicableTaxRate,
    categoryTaxRate,
    product.tax_rate,
    product.tax_rate_value,
    product.tax_percentage,
    product.vat_rate,
    product.iva,
  ];

  let normalizedTaxRate = 0.10; // Fallback sistema (IVA 10% según doc)
  const rawTaxRate = rawTaxRateCandidates.find(candidate => candidate !== undefined && candidate !== null);
  
  if (rawTaxRate !== undefined) {
    const parsedRate = Number(rawTaxRate);
    if (Number.isFinite(parsedRate)) {
      // Si viene como 10.0 -> 0.10, si viene como 0.10 -> 0.10
      normalizedTaxRate = parsedRate >= 1 ? parsedRate / 100 : parsedRate;
    }
  }

  // Búsqueda exhaustiva de precio en el objeto de la API
  const unitPrices = product.unit_prices as any[];
  const price = 
    product.sale_price ||
    product.price ||
    product.unit_price ||
    (Array.isArray(unitPrices) && (unitPrices[0]?.price_per_unit || unitPrices[0]?.price || unitPrices[0]?.selling_price)) ||
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
    has_valid_price: product.has_valid_price !== undefined ? Boolean(product.has_valid_price) : Number(price) > 0,
    has_variants: Boolean(product.has_variant || product.has_variants),
  };
};

const getItemBaseUnitPrice = (item: CartItem): number => {
  const original = Number(item.originalPrice || 0)
  const current = Number(item.price || 0)
  const hasExplicitDiscount = Number(item.discountInput || 0) > 0
  const hasDerivedDiscount = original > 0 && current < original

  if ((hasExplicitDiscount || hasDerivedDiscount) && original > 0) {
    return original
  }

  return current
}

const getItemDiscountPerUnit = (item: CartItem): number => {
  const basePrice = getItemBaseUnitPrice(item)
  const explicitInput = Math.max(0, Number(item.discountInput || 0))

  if (explicitInput > 0) {
    if (item.discountType === 'percent') {
      return Number((basePrice * (explicitInput / 100)).toFixed(2))
    }
    return explicitInput
  }

  const derived = Number((basePrice - Number(item.price || 0)).toFixed(2))
  return Math.max(0, derived)
}

const getItemLineDiscount = (item: CartItem): number => {
  const quantity = Math.max(0, Number(item.quantity ?? 1))
  return Number((getItemDiscountPerUnit(item) * quantity).toFixed(2))
}

const getItemLineTotal = (item: CartItem): number => {
  const quantity = Math.max(0, Number(item.quantity ?? 1))
  const baseTotal = getItemBaseUnitPrice(item) * quantity
  const discountTotal = getItemLineDiscount(item)
  return Math.max(0, Number((baseTotal - discountTotal).toFixed(2)))
}

const SalesNew: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const { currentBranchId } = useBranch();
  const canWrite = hasPermission('sales:write');
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  const clientSearchInputRef = useRef<HTMLInputElement>(null);
  const dropdownQuantityInputRef = useRef<HTMLInputElement>(null);

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

  const [items, setItems] = useState<CartItem[]>([]);
  const [variantSelectorProduct, setVariantSelectorProduct] = useState<ProductDisplay | null>(null);
  const [variantSelectorQuantity, setVariantSelectorQuantity] = useState<number>(1);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useSalesShortcuts({
    activeTab,
    productSearchInputRef,
    clientSearchInputRef
  });
  const { fetchDashboardData } = useDashboardStore();

  const [searchTerm] = useState('');
  const [generalDiscount] = useState(0);


  const [paymentMethodId, setPaymentMethodId] = useState(1);
  const [currencyId, setCurrencyId] = useState(1);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

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
  const [modalQuantity, setModalQuantity] = useState<number | string>(1);
  const [modalUnit, setModalUnit] = useState<string>('unit');
  const [modalPrice, setModalPrice] = useState(0);
  const [modalDiscount, setModalDiscount] = useState(0);
  const [modalDiscountType, setModalDiscountType] = useState<'amount' | 'percent'>('amount');
  const [modalDiscountReason, setModalDiscountReason] = useState('');
  const [modalCustomReasonText, setModalCustomReasonText] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [showInstantCollection, setShowInstantCollection] = useState(false);
  const [createdSaleData, setCreatedSaleData] = useState<SaleMetadata | null>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);
  const [activeSales, setActiveSales] = useState<any[]>([]);
  const [activeSale, setActiveSale] = useState<any | null>(null);
  const [activeSaleIndex, setActiveSaleIndex] = useState(0);
  const [showActiveSaleModal, setShowActiveSaleModal] = useState(false);

  const [pendingReservations, setPendingReservations] = useState<any[]>([]);
  const [selectedResIds, setSelectedResIds] = useState<Set<number>>(new Set());
  const [showReservationModal, setShowReservationModal] = useState(false);

  const [productSearchResults, setProductSearchResults] = useState<ProductDisplay[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productHighlightedIndex, setProductHighlightedIndex] = useState(-1);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductQuantity, setSelectedProductQuantity] = useState<number | string>(1);

  const { isScanningBarcode, handleBarcodeScan } = useBarcodeScanner({
    currentBranchId,
    toast,
    setItems,
    onSuccess: () => {
      setProductSearchTerm('');
      setShowProductDropdown(false);
      setProductHighlightedIndex(-1);
    }
  });

  // Efecto para manejar navegación desde el Dashboard de Reservas
  useEffect(() => {
    const navState = location.state as { reserve_id?: number, client_id?: string, product_id?: string };
    if (navState?.reserve_id) {
      handleLoadSpecificReservation(navState.reserve_id, navState.client_id, navState.product_id);
      // Limpiar estado para evitar recargas infinitas
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleLoadSpecificReservation = async (reserveId: number, clientId?: string, productId?: string) => {
    try {
      // Obtener detalle de la reserva desde la API primero
      const resData = await apiService.get(`/reserve/${reserveId}`);
      const reservation = resData?.data || resData;

      // 1. Intentar cargar el cliente si viene el ID
      let clientSet = false;
      if (clientId) {
        try {
          const clientData = await clientService.getById(clientId);
          if (clientData) {
            setSelectedClient(clientData);
            clientSet = true;
          }
        } catch (e) {
          console.warn('Could not fetch exact client via party api, trying legacy endpoint', e);
          try {
             // Fallback al endpoint legacy
             const legacyData = await apiService.get(`/client/${clientId}`);
             if (legacyData?.data) {
                setSelectedClient(legacyData.data);
                clientSet = true;
             }
          } catch (e2) {
             console.warn('Could not fetch legacy client either', e2);
          }
        }
      }

      // Fallback incondicional si no se pudo cargar desde la API pero tenemos la reserva
      if (!clientSet && reservation && (reservation.client_name || reservation.client_id)) {
         setSelectedClient({
            id: reservation.client_id || clientId || `temp-${Date.now()}`,
            name: reservation.client_name || 'Cliente de Reserva',
            displayName: reservation.client_name || 'Cliente de Reserva',
            document_id: reservation.client_document_id || ''
         } as any);
      }

      if (reservation) {
        // Añadir al carrito
        const item: CartItem = {
          id: `RES-${reserveId}-${Date.now()}`,
          productId: reservation.product_id || productId || '',
          name: reservation.product_name || 'Servicio de reserva',
          quantity: 1,
          price: reservation.total_amount || 0,
          originalPrice: reservation.total_amount || 0,
          discount: 0,
          discountType: 'amount',
          discountInput: 0,
          discountReason: '',
          taxRate: reservation.tax_rate || 0.10,
          unit: reservation.unit || 'hour',
          reserve_id: reserveId,
        };

        setItems(prev => {
          // Evitar duplicados
          if (prev.some(i => i.reserve_id === reserveId)) return prev;
          return [...prev, item];
        });

        toast.success(`Reserva #${reserveId} cargada correctamente`);
      }
    } catch (error) {
      console.error('Error cargando reserva específica:', error);
      toast.error('No se pudo cargar el detalle de la reserva');
    }
  };

  const pendingItems = useMemo(() => items.filter(i => i.isFromPendingSale), [items]);
  const newItems = useMemo(() => items.filter(i => !i.isFromPendingSale), [items]);
  const pendingTotals = useMemo(() => saleService.calculateLocalTotals(pendingItems), [pendingItems]);
  const newTotals = useMemo(() => saleService.calculateLocalTotals(newItems), [newItems]);

  const saleTotals = useMemo(() => saleService.calculateLocalTotals(items), [items]);
  const subtotal = saleTotals.subtotal;
  const lineDiscounts = saleTotals.discount_total;
  const iva10 = saleTotals.iva10;
  const iva5 = saleTotals.iva5;
  const exento = saleTotals.exento;
  const total = useMemo(() => Math.max(0, saleTotals.total - generalDiscount), [saleTotals.total, generalDiscount]);

  const filteredItems = useMemo(() => 
    items.filter(item => (item.name || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [items, searchTerm]
  );

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
        const response = await PaymentMethodService.getAll();
        const rawArray = Array.isArray(response) ? response : (response as any)?.data || [];
        // Filter duplicates by ID to avoid React key errors
        const uniqueMethods = Array.from(new Map(rawArray.map((m: any) => [m.id, m])).values());
        setPaymentMethods(uniqueMethods);
        if (uniqueMethods.length > 0) setPaymentMethodId(uniqueMethods[0].id);
      } catch (error) {
        console.error('Error loading payment methods:', error);
      }

      try {
        const response = await CurrencyService.getAll();
        const rawList = Array.isArray(response) ? response : (response as any)?.data || [];
        // Filter duplicates by ID to avoid React key errors
        const uniqueCurrencies = Array.from(new Map(rawList.map((c: any) => [c.id, c])).values());
        setCurrencies(uniqueCurrencies);
        if (uniqueCurrencies.length > 0) setCurrencyId(uniqueCurrencies[0].id);
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
          const results = await productService.search(term);
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

      if (document.activeElement === productSearchInputRef.current) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setProductHighlightedIndex(prev =>
            prev < productSearchResults.length - 1 ? prev + 1 : prev
          );
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setProductHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (event.key === 'Enter') {
          const term = productSearchTerm.trim();
          const isBarcode = /^\d{8,14}$/.test(term);
          
          if (isBarcode) {
            event.preventDefault();
            handleBarcodeScan(term);
            return;
          }

          if (productHighlightedIndex >= 0) {
            event.preventDefault();
            const selectedProduct = productSearchResults[productHighlightedIndex];
            if (selectedProduct) {
              if (document.activeElement !== dropdownQuantityInputRef.current) {
                dropdownQuantityInputRef.current?.focus();
                dropdownQuantityInputRef.current?.select();
              } else {
                let qty = parseFloat(String(selectedProductQuantity));
                if (isNaN(qty) || qty <= 0) qty = 1;
                addProductToCart(selectedProduct, qty);
                setProductSearchTerm('');
                setProductHighlightedIndex(-1);
                setSelectedProductQuantity(1);
                setShowProductDropdown(false);
                productSearchInputRef.current?.focus();
              }
            }
          }
        } else if (event.key === 'Escape') {
          setShowProductDropdown(false);
          setProductHighlightedIndex(-1);
        }
      }

    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, productSearchResults, productHighlightedIndex, selectedProductQuantity, productSearchTerm, handleBarcodeScan]);

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

  const addProductToCart = useCallback((product: ProductDisplay, quantity: number = 1, variantId?: string | null, variantName?: string) => {
    // Si tiene variantes y el variantId es undefined (no se pasó), abre el selector.
    // Si variantId es null, significa que el usuario explícitamente eligió el producto padre sin variante.
    if (product.has_variants && variantId === undefined) {
      setVariantSelectorProduct(product);
      setVariantSelectorQuantity(quantity);
      return;
    }

    if (!product.has_valid_price) {
      toast.error(`El producto "${product.name}" no tiene un precio configurado. Establezca un precio antes de venderlo.`);
      return;
    }

    const finalVariantId = variantId === null ? undefined : variantId;
    const finalVariantName = variantId === null ? undefined : variantName;

    const newItem: CartItem = {
      id: finalVariantId ? `${product.id}-${finalVariantId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: product.id,
      name: finalVariantName ? `${product.name} - ${finalVariantName}` : product.name,
      variantId: finalVariantId,
      variantName: finalVariantName,
      quantity,
      price: product.price,
      originalPrice: product.price,
      stock: product.stock,
      discount: 0,
      discountType: 'amount',
      discountInput: 0,
      discountReason: '',
      taxRate: product.taxRate,
      unit: product.base_unit,
    };

    setItems(prev => {
      const existingItem = prev.find(item => item.productId === product.id && item.variantId === finalVariantId && !item.isFromPendingSale);
      
      if (existingItem) {
        if (existingItem.reserve_id) {
          toast.error(`Este producto ya está en el carrito como parte de una reserva.`);
          return prev;
        }
        
        // Agrupar automáticamente (como en compras)
        return prev.map(item => item.id === existingItem.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, newItem];
    });
  }, []);

  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client);

    let hasPendingSales = false;

    // Buscar ventas pendientes del cliente
    try {
      const response = await saleService.getPendingSalesByClient(client.id, client.name);
      if (response?.success && Array.isArray(response.data) && response.data.length > 0) {
        setActiveSales(response.data);
        setActiveSale(response.data[0]);
        setActiveSaleIndex(0);
        setShowActiveSaleModal(true);
        hasPendingSales = true;
      }
    } catch (error) {
      console.error('Error buscando ventas pendientes:', error);
    }
    
    // Buscar reservas confirmadas del cliente - SIEMPRE cargar, se mostrarán después
    try {
      const reservations = await apiService.getReservationReport({
        client_id: client.id,
        status: 'CONFIRMED',
      });
      if (reservations && reservations.length > 0) {
        setPendingReservations(reservations);
        // Pre-seleccionar todas las reservas por defecto (Set de IDs numéricos)
        const allIds = new Set(reservations.map((r: any) => Number(r.reserve_id || r.id)).filter(Boolean));
        setSelectedResIds(allIds);
        
        // Si no hay ventas pendientes, mostrar reservas directamente
        // Si hay ventas pendientes, el modal de reservas se mostrará después de cerrar el de ventas
        if (!hasPendingSales) {
          setShowReservationModal(true);
        }
      }
    } catch (error) {
      console.error('Error buscando reservas del cliente:', error);
    }
  };

  const handleContinueSale = useCallback(async () => {
    if (!activeSale) return;
    
    let saleDetails = activeSale.details || [];
    const saleId = activeSale.sale_id || activeSale.id;

    if (saleDetails.length === 0 && saleId) {
      try {
        const fullSale = await saleService.getSaleById(saleId);
        if (fullSale?.success && fullSale.data?.details) {
          saleDetails = fullSale.data.details;
        }
      } catch (error) {
        console.error('Error fetching sale details:', error);
      }
    }

    const loadedItems: CartItem[] = saleDetails.map((detail: any, index: number) => {
      const quantity = Math.max(0, Number(detail.quantity ?? 1))
      const rawFinalUnit = Number(detail.unit_price || detail.price || 0)
      const rawBaseUnit = Number(
        detail.base_price ||
          detail.original_unit_price ||
          detail.list_price ||
          detail.unit_price ||
          detail.price ||
          0,
      )

      const discountPercent = Number(detail.discount_percent || 0)
      const lineDiscountAmount = Number(detail.discount_amount || 0)
      const inferredDiscountPerUnit =
        rawBaseUnit > rawFinalUnit ? rawBaseUnit - rawFinalUnit : 0
      const explicitDiscountPerUnit =
        lineDiscountAmount > 0 ? lineDiscountAmount / quantity : 0
      const finalDiscountPerUnit =
        explicitDiscountPerUnit > 0 ? explicitDiscountPerUnit : inferredDiscountPerUnit

      const originalPrice =
        rawBaseUnit > 0
          ? rawBaseUnit
          : Number((rawFinalUnit + finalDiscountPerUnit).toFixed(2))

      const finalUnitPrice = Math.max(
        0,
        Number((originalPrice - finalDiscountPerUnit).toFixed(2)),
      )

      return {
        id: `SALE-${saleId}-${detail.product_id}-${detail.variant_id || 'base'}-${Date.now()}-${index}`,
        productId: detail.product_id,
        variantId: detail.variant_id || undefined,
        variantName: detail.variant_name || undefined,
        name: detail.product_name || 'Producto existente',
        quantity,
        price: finalUnitPrice,
        originalPrice,
        discount: Number((finalDiscountPerUnit * quantity).toFixed(2)),
        discountType: discountPercent > 0 ? 'percent' : 'amount',
        discountInput:
          discountPercent > 0
            ? discountPercent
            : Number(finalDiscountPerUnit.toFixed(2)),
        discountReason: detail.discount_reason || 'Venta persistida',
        taxRate: detail.tax_rate || 0,
        unit: detail.unit || 'unit',
        isFromPendingSale: true,
        detailId: detail.id,
      }
    });

    setItems(prev => {
      const existingPendingDetailIds = new Set(
        prev.filter(item => item.isFromPendingSale && item.detailId).map(item => item.detailId)
      );
      const newItems = loadedItems.filter(item => !existingPendingDetailIds.has(item.detailId));
      
      if (newItems.length === 0 && loadedItems.length > 0) {
        toast.info('Los productos de esta venta ya están cargados en el carrito');
      }
      return [...prev, ...newItems];
    });

    setCurrentSaleId(saleId);
    setShowActiveSaleModal(false);
    toast.success(`Cargada venta #${saleId} para continuar`);
    
    // Cola secuencial: Mostrar reservas solo tras manejar ventas pendientes
    if (pendingReservations.length > 0) {
      setTimeout(() => setShowReservationModal(true), 300);
    }
  }, [activeSale, saleService, setItems, toast, pendingReservations]);

  useEffect(() => {
    if (!showActiveSaleModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSaleIndex(prev => {
          const next = prev < activeSales.length - 1 ? prev + 1 : prev;
          setActiveSale(activeSales[next]);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSaleIndex(prev => {
          const next = prev > 0 ? prev - 1 : prev;
          setActiveSale(activeSales[next]);
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleContinueSale();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowActiveSaleModal(false);
        if (pendingReservations.length > 0) {
          setTimeout(() => setShowReservationModal(true), 300);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showActiveSaleModal, activeSales, handleContinueSale, pendingReservations]);

  const handleAddReservations = () => {
    if (pendingReservations.length === 0 || selectedResIds.size === 0) return;

    // Filtrar la lista completa basándose en el Set de IDs seleccionados
    const selectedReservations = pendingReservations.filter(res => 
      selectedResIds.has(Number(res.reserve_id || res.id))
    );

    const loadedItems: CartItem[] = selectedReservations.map((res: any, index: number) => ({
      id: `RES-${res.reserve_id || res.id}-${Date.now()}-${index}`,
      productId: res.product_id || '',
      variantId: res.variant_id || undefined,
      variantName: res.variant_name || undefined,
      name: res.product_name || 'Servicio de reserva',
      quantity: 1,
      price: res.total_amount || 0,
      originalPrice: res.total_amount || 0,
      discount: 0,
      discountType: 'amount',
      discountInput: 0,
      discountReason: '',
      taxRate: res.tax_rate || 0,
      unit: res.unit || res.base_unit || 'hour',
      isFromPendingSale: false,
      reserve_id: Number(res.reserve_id || res.id) || undefined,
    }));

    setItems(prev => {
      const existingProductVariantKeys = new Set(prev.map(item => `${item.productId}_${item.variantId || 'base'}`));
      const existingReserveIds = new Set(
        prev
          .map(item => item.reserve_id)
          .filter((id): id is number => id !== undefined && id !== null)
      );
      
      const seenProductIdsInNew = new Set<string>();
      const newItems = loadedItems.filter(item => {
        // 1. Evitar duplicar reserva exacta
        if (item.reserve_id && existingReserveIds.has(item.reserve_id)) return false;
        
        // 2. Evitar múltiples reservas para el mismo producto exacto (con variante)
        const productKey = `${item.productId}_${item.variantId || 'base'}`;
        if (existingProductVariantKeys.has(productKey) || seenProductIdsInNew.has(productKey)) {
          return false;
        }
        seenProductIdsInNew.add(productKey);
        
        return true;
      });
      
      if (newItems.length === 0) {
        toast.info('Los productos de estas reservas ya están en el carrito');
        return prev;
      }

      return [...prev, ...newItems];
    });

    setShowReservationModal(false);
    setPendingReservations([]);
    setSelectedResIds(new Set());
    toast.success('Reservas añadidas al carrito');
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setCurrentSaleId(null);
    setPendingReservations([]);
  };

  const handleOpenEditModal = (item: CartItem) => {
    setEditingItemId(item.id);
    setSelectedModalProduct({
      id: item.productId,
      name: item.name,
      price: item.originalPrice || item.price,
      quantity: item.quantity,
      discount: item.discountInput,
      discountType: item.discountType,
      discountReason: item.discountReason,
      taxRate: item.taxRate,
    });
    setModalQuantity(item.quantity);
    setModalUnit(item.unit || 'unit');
    setModalPrice(item.price);
    setModalDiscount(item.discountInput);
    setModalDiscountType(item.discountType);
    
    const isStandardReason = !item.discountReason || PRICE_CHANGE_REASONS.some(r => r.label === item.discountReason);
    setModalDiscountReason(isStandardReason ? (item.discountReason || '') : 'Other');
    setModalCustomReasonText(isStandardReason ? '' : item.discountReason);
    
    setIsModalOpen(true);
  };

  const handleConfirmAdd = () => {
    if (!selectedModalProduct) {
      setIsModalOpen(false);
      return;
    }

    const productDisplay = getProductDisplay(selectedModalProduct);
    const originalPrice = productDisplay.price;
    const allowDecimal = isDecimalUnit(modalUnit || productDisplay.base_unit);
    const minQty = allowDecimal ? 0.01 : 1;
    let parsedModalQuantity = Math.max(minQty, Number(modalQuantity) || minQty);
    if (!allowDecimal) parsedModalQuantity = Math.floor(parsedModalQuantity);
    const parsedModalDiscount = Math.max(0, Number(modalDiscount) || 0);
    
    // Si el descuento es > 0, calculamos el precio final desde el descuento
    // Si el descuento es 0, usamos el modalPrice (que pudo ser editado directamente)
    let finalUnitPrice = Number(modalPrice);
    let currentDiscountInput = parsedModalDiscount;
    let currentDiscountType = modalDiscountType;

    if (parsedModalDiscount > 0) {
      if (modalDiscountType === 'percent') {
        finalUnitPrice = originalPrice * (1 - parsedModalDiscount / 100);
      } else {
        finalUnitPrice = originalPrice - parsedModalDiscount;
      }
    } else if (finalUnitPrice < originalPrice) {
      currentDiscountType = 'amount';
      currentDiscountInput = Number((originalPrice - finalUnitPrice).toFixed(2));
    }

    const priceChanged = Math.abs(finalUnitPrice - originalPrice) > 0.01;
    const finalReason = modalDiscountReason === 'Other' ? modalCustomReasonText : modalDiscountReason;

    // VALIDACIÓN ESTRICTA: Si el precio cambió, la razón es obligatoria
    if (priceChanged && !finalReason.trim()) {
      toast.error('Debes ingresar una razón para el cambio de precio');
      return;
    }

    let totalDiscountAmount = 0;
    if (finalUnitPrice < originalPrice) {
      totalDiscountAmount = (originalPrice - finalUnitPrice) * parsedModalQuantity;
    }

    const existingItem = editingItemId ? items.find(i => i.id === editingItemId) : null;

    const newItem: CartItem = {
      id: editingItemId || `${productDisplay.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: productDisplay.id,
      name: productDisplay.name,
      quantity: parsedModalQuantity,
      price: finalUnitPrice, // El precio que efectivamente se cobra
      originalPrice: originalPrice,
      stock: (selectedModalProduct as any).stock_quantity || (selectedModalProduct as any).stock,
      discount: totalDiscountAmount,
      discountType: currentDiscountType,
      discountInput: currentDiscountInput,
      discountReason: priceChanged ? finalReason : '',
      taxRate: productDisplay.taxRate,
      unit: modalUnit || productDisplay.base_unit,
      isFromPendingSale: existingItem?.isFromPendingSale || false,
      detailId: existingItem?.detailId,
    };

    setItems(prev => {
      if (editingItemId) {
        return prev.map(item => (item.id === editingItemId ? newItem : item));
      }
      return [...prev, newItem];
    });

    setModalQuantity(1);
    setModalUnit('unit');
    setModalDiscount(0);
    setModalPrice(0);
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
      clientSearchInputRef.current?.focus();
      return;
    }
    if (items.length === 0) {
      productSearchInputRef.current?.focus();
      return;
    }
    
    setIsProcessingSale(true);
    try {
      if (currentSaleId) {
        // Filtrar solo los productos NUEVOS
        const newItems = items.filter(item => !item.isFromPendingSale);
        
        if (newItems.length === 0) {
          toast.info('No hay productos nuevos para agregar a esta venta');
          setIsProcessingSale(false);
          return;
        }

        // VALIDACIÓN DE STOCK antes de enviar (según el Error 500 reportado)
        for (const item of newItems) {
          // Intentar obtener stock actualizado si es posible o usar el del carrito
          if (item.quantity > (item as any).stock && (item as any).stock !== undefined) {
            toast.error(`Stock insuficiente para ${item.name}. Disponible: ${(item as any).stock}`);
            setIsProcessingSale(false);
            return;
          }
        }

        const payload = {
          allow_price_modifications: newItems.some(item => Math.abs((Number(item.price) || 0) - (Number(item.originalPrice) || 0)) > 0.01),
          product_details: newItems.map(item => {
            const currentPrice = Number(item.price) || 0;
            const originalPrice = Number(item.originalPrice) || 0;
            const hasModification = Math.abs(currentPrice - originalPrice) > 0.01;
            const discountInputVal = Number(item.discountInput) || 0;
            
            return {
              product_id: item.productId,
              ...(item.variantId && { variant_id: item.variantId }),
              quantity: Number(item.quantity) || 1,
              unit: item.unit || 'unit',
              ...(item.reserve_id && { reserve_id: item.reserve_id }),
              ...(hasModification && {
                sale_price: currentPrice,
                price_change_reason: (item.discountReason || 'Ajuste de precio aplicado').trim() || 'Ajuste de precio',
                [item.discountType === 'percent' ? 'discount_percent' : 'discount_amount']: discountInputVal,
                discount_reason: (item.discountReason || 'Ajuste de precio aplicado').trim() || 'Ajuste de precio',
              }),
            };
          }),
        };

        const response = await saleService.addProductsToSale(currentSaleId, payload);
        
        if (response?.success) {
          toast.success(`Venta #${currentSaleId} actualizada exitosamente.`);
          setItems([]);
          setCurrentSaleId(null);
          setSelectedClient(null);
          fetchDashboardData();
          handleHistoryFilter();
        } else {
          const errMsg = response?.error || response?.message || 'No se pudieron agregar los productos a la venta';
          if (errMsg.toLowerCase().includes('no existe conversion') || errMsg.toLowerCase().includes('conversión')) {
            toast.error(`No existe conversión de unidad: ${errMsg}. Registre la conversión primero.`);
          } else {
            toast.error(errMsg);
          }
        }
      } else {
        // 1. Validar unicidad de reserve_id y productId para reservas (Instrucción: permitir solo uno por producto)
        const seenReserves = new Set<number>();
        const seenProductVariantForReserves = new Set<string>();
        const uniqueItems: CartItem[] = [];
        const duplicatesRemoved: string[] = [];

        for (const item of items) {
          if (item.reserve_id) {
            // Regla: No duplicar reserve_id exacto
            if (seenReserves.has(item.reserve_id)) {
              duplicatesRemoved.push(`${item.name} (Reserva Duplicada)`);
              continue;
            }
            
            // Regla: No permitir dos reservas distintas para el MISMO producto exacto
            const productKey = `${item.productId}_${item.variantId || 'base'}`;
            if (seenProductVariantForReserves.has(productKey)) {
              duplicatesRemoved.push(`${item.name} (Mismo Producto)`);
              continue;
            }

            seenReserves.add(item.reserve_id);
            seenProductVariantForReserves.add(productKey);
          }
          uniqueItems.push(item);
        }

        if (duplicatesRemoved.length > 0) {
          toast.warning(`Se filtraron ítems para cumplir con la regla de una reserva por producto: ${duplicatesRemoved.join(', ')}`);
        }

        // 2. Validar que exista maximo 1 reserve_id distinto en el carrito (Regla de negocio actual)
        const distinctReserveIds = Array.from(seenReserves);
        
        if (distinctReserveIds.length > 1) {
          toast.error('Solo se permite una reserva por venta. Remueve ítems de otras reservas.');
          setIsProcessingSale(false);
          return;
        }

        // Tomar el reserve_id único si existe
        const saleReserveId = distinctReserveIds.length === 1 ? distinctReserveIds[0] : undefined;

        const payloadPriceMod = uniqueItems.some(
          item => Math.abs((Number(item.price) || 0) - (Number(item.originalPrice) || 0)) > 0.01
        );

        const saleData = {
          client_id: selectedClient.id,
          ...(saleReserveId && { reserve_id: saleReserveId }),
          allow_price_modifications: payloadPriceMod,
          currency_id: Number(currencyId) || 1,
          product_details: uniqueItems.map(item => {
            const currentPrice = Number(item.price) || 0;
            const originalPrice = Number(item.originalPrice) || 0;
            const hasModification = Math.abs(currentPrice - originalPrice) > 0.01;
            const discountInputVal = Number(item.discountInput) || 0;

            const detail: any = {
              product_id: item.productId,
              ...(item.variantId && { variant_id: item.variantId }),
              quantity: Number(item.quantity) || 1,
            };

            // Validar unit: no enviar "service" (no existe en DB), usar "hour" para reservas o el valor real
            const validUnit = item.unit && item.unit !== 'service' ? item.unit : 'hour';
            detail.unit = validUnit;

            // Incluir reserve_id cuando existe (sin condicionar por unit)
            if (item.reserve_id) {
              detail.reserve_id = item.reserve_id;
            }

            // Si hay modificacion: sale_price = precio FINAL (sin discount_amount/discount_percent)
            if (hasModification) {
              detail.sale_price = currentPrice;
              detail.price_change_reason = (item.discountReason || 'Ajuste de precio').trim();
              
              if (item.discountType === 'percent') {
                detail.discount_percent = discountInputVal;
              } else {
                detail.discount_amount = discountInputVal;
              }
              detail.discount_reason = (item.discountReason || 'Ajuste de precio').trim();
            }

            return detail;
          }),
        };

        const response = await createSale(saleData);

        if (response?.sale_id) {
          const selectedMethod = paymentMethods.find(m => m.id === paymentMethodId);
          const selectedCurrency = currencies.find(c => c.id === currencyId);
          
          const responseTotal =
            Number((response as any)?.data?.total_amount) ||
            Number((response as any)?.total_amount) ||
            Number(total) ||
            0;

          setCreatedSaleData({ 
            id: response.sale_id, 
            total: responseTotal,
            status: 'pending',
            paymentMethodId: paymentMethodId,
            paymentMethodLabel: (selectedMethod as any)?.name || (selectedMethod as any)?.description || 'Efectivo',
            currencyCode: (selectedCurrency as any)?.code || 'PYG'
          });

          // Trazabilidad y advertencias (PRICE_DERIVATION_SKIPPED, etc)
          const warnings = response.validation_summary?.warnings || response.warnings || [];
          if (warnings.length > 0) {
            warnings.forEach((w: any) => {
              if (w.type === 'PRICE_DERIVATION_SKIPPED') {
                toast.warning(`${w.product_name || 'Producto'}: ${w.reason || 'No se pudo derivar precio.'}`);
              } else {
                toast.warning(w.message || 'Advertencia de validación al crear la venta.');
              }
            });
          }

          setShowInstantCollection(true);
          fetchDashboardData();
        } else {
          const errMsg = response?.error || response?.message || 'No se pudo registrar la venta';
          if (errMsg.toLowerCase().includes('no existe conversion') || errMsg.toLowerCase().includes('conversión')) {
            toast.error(`No existe conversión de unidad: ${errMsg}. Registre la conversión primero.`);
          } else {
            toast.error(errMsg);
          }
        }
      }
    } catch (error: any) {
      const errMsg = error?.message || error?.error || 'Error inesperado al procesar la venta';
      if (errMsg.toLowerCase().includes('no existe conversion') || errMsg.toLowerCase().includes('conversión')) {
        toast.error(`No existe conversión de unidad: ${errMsg}. Registre la conversión primero.`);
      } else {
        toast.error('Ocurrió un error al procesar la venta');
      }
    } finally {
      setIsProcessingSale(false);
    }
  };

  const modalDisplay = selectedModalProduct ? getProductDisplay(selectedModalProduct) : null;
  const modalUnitPrice = modalDisplay?.price || 0;
  const parsedModalQuantity = Math.max(0, Number(modalQuantity ?? 1));
  const parsedModalDiscount = Number(modalDiscount) || 0;
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
            <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">
              {t('sales.title', 'Punto de Venta')}
            </h1>
            <p className="text-text-secondary text-sm font-medium mt-1">
              {t('sales.subtitle', 'Facturación y registro de operaciones')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
          {[
            { id: 'new-sale' as const, label: t('sales.tab.new', 'Nueva Venta'), icon: <Plus size={16} /> },
            { id: 'history' as const, label: t('sales.tab.history', 'Historial'), icon: <History size={16} /> },
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
            <div className="lg:col-span-9 space-y-4">
              <article className="bg-white rounded-lg shadow-sm border relative">
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
                  <div className="mb-4 relative">
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
                      <div className="absolute z-50 w-full mt-1 bg-white border border-border-subtle rounded-xl shadow-fluent-16 overflow-x-hidden max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-1">
                          {productSearchResults.map((product, index) => {
                            const isHighlighted = index === productHighlightedIndex;
                            const itemKey = product.id ? `search-product-${product.id}` : `search-product-index-${index}`;
                            
                            // 1. Calcular cantidad actual en el carrito para este producto
                            const quantityInCart = items
                              .filter(item => item.productId === product.id)
                              .reduce((sum, item) => sum + item.quantity, 0);
                            
                            // 2. Calcular stock virtual (disponible)
                            const availableStock = Math.max(0, product.stock - quantityInCart);

                            return (
                              <div key={itemKey} className="w-full mb-0.5 last:mb-0">
                                <div className={cn(
                                  "flex items-center w-full transition-all rounded-lg overflow-hidden",
                                  isHighlighted 
                                    ? "bg-primary/5 ring-1 ring-primary/10 shadow-sm" 
                                    : "hover:bg-slate-50"
                                )}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (availableStock <= 0) {
                                        toast.error(`Sin stock disponible para ${product.name}`);
                                        return;
                                      }
                                      let qty = parseFloat(String(selectedProductQuantity));
                                      if (isNaN(qty) || qty <= 0) qty = 1;
                                      addProductToCart(product, qty);
                                      setProductSearchTerm('');
                                      setShowProductDropdown(false);
                                      setProductHighlightedIndex(-1);
                                      productSearchInputRef.current?.focus();
                                    }}
                                    onMouseEnter={() => setProductHighlightedIndex(index)}
                                    className={cn(
                                      "flex-1 flex items-center gap-2 px-3 py-2.5 text-left transition-colors min-w-0",
                                      availableStock <= 0 && "opacity-60 grayscale-[0.5]"
                                    )}
                                  >
                                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <p className="font-bold text-[14px] text-slate-900 truncate leading-none uppercase tracking-tight">{product.name}</p>
                                        <Badge variant="outline" className="text-[9px] h-5 px-1.5 font-bold uppercase text-slate-400 border-slate-200 shrink-0 bg-slate-50">
                                          #{product.sku}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-baseline gap-1 shrink-0">
                                          <p className="text-[14px] font-black text-primary tracking-tight leading-none">
                                            {formatCurrency(product.price)}
                                          </p>
                                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                                            / {product.base_unit}
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                          <div className={cn(
                                            'px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 shrink-0',
                                            availableStock > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                                          )}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full", availableStock > 0 ? "bg-emerald-500" : "bg-red-500")} />
                                            Stock: {formatNumber(availableStock)} {product.base_unit}
                                          </div>
                                          {quantityInCart > 0 && (
                                            <div className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 flex items-center gap-1 shrink-0">
                                              <ShoppingCart size={10} className="shrink-0" />
                                              {formatNumber(quantityInCart)} en carrito
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </button>

                                  {isHighlighted && availableStock > 0 && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 mr-1 bg-white rounded-md border border-slate-200 shadow-sm shrink-0 ml-1 animate-in slide-in-from-right-2 duration-200">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-black uppercase text-slate-400 whitespace-nowrap">
                                          Cant:
                                        </span>
                                        <input
                                          ref={dropdownQuantityInputRef}
                                          type="number"
                                          min={isDecimalUnit(product.base_unit) ? "0.01" : "1"}
                                          step={isDecimalUnit(product.base_unit) ? "0.01" : "1"}
                                          max={availableStock}
                                          value={selectedProductQuantity}
                                          onChange={(e) => {
                                            setSelectedProductQuantity(e.target.value);
                                          }}
                                          onBlur={() => {
                                            const allowDecimal = isDecimalUnit(product.base_unit);
                                            const minQty = allowDecimal ? 0.01 : 1;
                                            let val = parseFloat(String(selectedProductQuantity));
                                            if (isNaN(val)) val = minQty;
                                            val = Math.max(minQty, val);
                                            if (!allowDecimal) val = Math.floor(val);
                                            val = Math.min(val, availableStock);
                                            setSelectedProductQuantity(val);
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              const allowDecimal = isDecimalUnit(product.base_unit);
                                              const minQty = allowDecimal ? 0.01 : 1;
                                              let qty = parseFloat(String(selectedProductQuantity));
                                              if (isNaN(qty)) qty = minQty;
                                              qty = Math.max(minQty, qty);
                                              if (!allowDecimal) qty = Math.floor(qty);
                                              qty = Math.min(qty, availableStock);
                                              
                                              if (qty > availableStock || qty <= 0) {
                                                toast.error('Cantidad inválida');
                                                return;
                                              }
                                              addProductToCart(product, qty);
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
                                          className="w-14 h-8 text-[13px] font-black text-center border-2 border-primary/20 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div className="flex flex-col border-l border-slate-100 pl-1.5">
                                        <div className="flex items-center gap-0.5 text-[7px] font-black text-primary leading-none">
                                          <span className="opacity-60">⏎</span> OK
                                        </div>
                                        <div className="flex items-center gap-0.5 text-[7px] font-bold text-slate-400 uppercase leading-none mt-0.5">
                                          <span className="opacity-60">ESC</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {isHighlighted && availableStock <= 0 && (
                                    <div className="px-3 py-1 mr-2 bg-red-50 rounded border border-red-100 text-[8px] font-black text-red-500 uppercase animate-in fade-in duration-200">
                                      Agotado
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <SalesCartGrid
                    items={filteredItems}
                    onEditItem={handleOpenEditModal}
                    onRemoveItem={(id) => setItems(prev => prev.filter(i => i.id !== id))}
                    getItemBaseUnitPrice={getItemBaseUnitPrice}
                    getItemLineDiscount={getItemLineDiscount}
                    getItemLineTotal={getItemLineTotal}
                  />
                </div>
              </article>

              <article className="bg-white rounded-lg shadow-sm border">
                <header className="flex items-center gap-2 px-4 py-3 border-b">
                  <DollarSign size={18} className="text-primary" />
                  <h3 className="font-semibold">Resumen</h3>
                </header>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    {pendingItems.length > 0 ? (
                      <div className="space-y-1.5 mb-3 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                        <div className="flex justify-between text-sm font-medium text-slate-500">
                          <span>Venta Procesada (Anterior)</span>
                          <span>{formatCurrency(pendingTotals.total)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-slate-700">
                          <span>Nuevos Ítems</span>
                          <span>{formatCurrency(newTotals.total)}</span>
                        </div>
                        <div className="border-t border-slate-200/60 my-1"></div>
                        <div className="flex justify-between text-sm pt-1">
                          <span className="text-slate-500 font-semibold">Subtotal Combinado</span>
                          <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-medium text-slate-700">{formatCurrency(subtotal)}</span>
                      </div>
                    )}
                    
                    {/* Desglose de IVA */}
                    <div className="space-y-1 py-2 border-y border-slate-100 border-dashed">
                      {iva10 > 0 && (
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                          <span>Liquidación IVA 10%</span>
                          <span>{formatCurrency(iva10)}</span>
                        </div>
                      )}
                      {iva5 > 0 && (
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                          <span>Liquidación IVA 5%</span>
                          <span>{formatCurrency(iva5)}</span>
                        </div>
                      )}
                      {exento > 0 && (
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                          <span>Monto Exento</span>
                          <span>{formatCurrency(exento)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between text-sm text-red-500 font-bold">
                      <span>Descuentos</span>
                      <span>-{formatCurrency(lineDiscounts + generalDiscount)}</span>
                    </div>

                    {pendingItems.length === 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-100 space-y-2 my-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                          <DollarSign size={10} /> Precio Final de Venta
                        </label>
                        <div className="relative group">
                          <Input
                            type="number"
                            value={total}
                            onChange={(e) => {
                              const targetTotal = Math.max(0, Number(e.target.value));
                              if (targetTotal === total || items.length === 0) return;
                              
                              // Proportional adjustment logic
                              const currentTotal = total;
                              if (currentTotal === 0) return;
                              const ratio = targetTotal / currentTotal;
                              
                              setItems(prev => prev.map(item => {
                                const newPrice = Number((item.price * ratio).toFixed(2));
                                const newDiscount = Number(((item.originalPrice - newPrice) * item.quantity).toFixed(2));
                                return {
                                  ...item,
                                  price: newPrice,
                                  discount: newDiscount,
                                  discountType: 'amount',
                                  discountInput: Number((item.originalPrice - newPrice).toFixed(2)),
                                  discountReason: 'Ajuste global de venta'
                                };
                              }));
                            }}
                            className="h-11 pl-4 text-xl font-black tracking-tighter text-primary border-transparent bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-lg"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">
                            EDITABLE
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium px-1 leading-tight">Este monto ajustará proporcionalmente todos los precios en el carrito.</p>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total Neto</span>
                        <span className="text-base font-bold">TOTAL</span>
                      </div>
                      <span className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(total)}</span>
                    </div>
                  </div>
                  
                  {items.length === 0 ? (
                    <MessageBar intent="info" className="mb-2">
                      Agrega productos al carrito para continuar.
                    </MessageBar>
                  ) : !selectedClient ? (
                    <MessageBar intent="warning" className="mb-2">
                      Selecciona un cliente para poder confirmar la venta.
                    </MessageBar>
                  ) : null}

                  <div className="flex flex-col justify-end gap-2">
                    <Button
                      onClick={handleSaveSale}
                      disabled={isProcessingSale || items.length === 0 || !canWrite || !selectedClient}
                      className={cn(
                        "w-full h-12 text-base font-black uppercase tracking-widest transition-all",
                        currentSaleId ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200" : "shadow-primary/20"
                      )}
                    >
                      {isProcessingSale 
                        ? 'Procesando...' 
                        : currentSaleId 
                          ? `Actualizar Venta #${currentSaleId}` 
                          : 'Confirmar Venta'
                      }
                    </Button>
                    <Button variant="outline" onClick={() => setItems([])} className="w-full">Limpiar Carrito</Button>
                  </div>
                </div>
              </article>
            </div>

            <aside className="lg:col-span-3 space-y-4">
              <article className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <div className="flex items-center gap-2 border-b pb-2 mb-2">
                  <User size={18} className="text-primary" />
                  <h3 className="font-semibold">Cliente</h3>
                </div>
                <SearchableDropdown<Client>
                  inputRef={clientSearchInputRef}
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
                        <p className="font-bold text-sm truncate">{item.displayName || item.name}</p>
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
                      <p className="font-bold text-sm">{selectedClient.displayName || selectedClient.name}</p>
                      <p className="text-xs text-slate-500">{selectedClient.document_id}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClearClient} className="size-8 text-slate-400 hover:text-red-500">
                      <X size={14} />
                    </Button>
                  </div>
                )}
              </article>

              <article className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <CreditCard size={18} className="text-primary" />
                  <h3 className="font-semibold">Método de Pago</h3>
                </div>
                <Select value={String(paymentMethodId)} onValueChange={(v) => setPaymentMethodId(Number(v))}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                    {paymentMethods.map(method => (
                      <SelectItem key={method.id} value={String(method.id)}>
                        {(method as any).name || (method as any).description || `Método #${method.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </article>

              <article className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <DollarSign size={18} className="text-primary" />
                  <h3 className="font-semibold">Moneda</h3>
                </div>
                <Select value={String(currencyId)} onValueChange={(v) => setCurrencyId(Number(v))}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                    {currencies.map(currency => (
                      <SelectItem key={currency.id} value={String(currency.id)}>
                        {(currency as any).code || (currency as any).name || `Moneda #${currency.id}`}
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
                {/* Desktop History Table */}
                <table className="w-full text-sm hidden md:table">
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
                            <div className="flex justify-end items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleViewSale(sale)} className="size-8 text-slate-400 hover:text-primary"><Eye size={16} /></Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8"><MoreVertical size={16} /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleViewSale(sale)} className="gap-2"><Eye size={14} /> Ver Detalle</DropdownMenuItem>
                                  {sale.status !== 'CANCELLED' && canWrite && (
                                    <DropdownMenuItem onClick={() => handleCancelSale(sale)} className="gap-2 text-red-600 focus:text-red-600"><Ban size={14} /> Anular Venta</DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Mobile History Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {saleLoading ? (
                    <div className="py-12 text-center text-slate-400 text-sm">Cargando historial...</div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">No se encontraron resultados</div>
                  ) : (
                    filteredHistory.map((sale) => (
                      <div key={sale.internalKey} className="p-4 space-y-3 active:bg-slate-50 transition-colors" onClick={() => handleViewSale(sale)}>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-xs font-mono font-bold text-primary">#{sale.displayId}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{formatDateTime(sale.date)}</span>
                          </div>
                          <Badge className={cn('uppercase text-[8px] font-black', STATUS_STYLES[sale.status.toLowerCase()]?.badge || 'bg-slate-100')}>
                            {STATUS_STYLES[sale.status.toLowerCase()]?.label || sale.status}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 tracking-tight">Cliente</span>
                            <span className="text-sm font-bold text-slate-900 leading-none truncate max-w-[180px]">{sale.client_name}</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 tracking-tight">Importe Total</span>
                            <span className="text-base font-black text-slate-900 leading-none">{formatCurrency(sale.total_amount)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-50">
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewSale(sale); }} className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest border-slate-200">
                            <Eye size={14} className="mr-1.5 text-primary" /> Detalles
                          </Button>
                          {sale.status !== 'CANCELLED' && (
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleCancelSale(sale); }} className="h-9 w-10 border-slate-200 text-red-500">
                              <Ban size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </article>
          </div>
        )}
      </main>

      {isModalOpen && selectedModalProduct && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg shadow-2xl rounded-xl bg-white overflow-hidden flex flex-col max-h-[95vh]" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-row items-start justify-between border-b border-slate-200 bg-white px-6 py-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 shrink-0">
                  <ShoppingCart size={20} strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold text-slate-900 leading-tight">
                    {editingItemId ? 'Editar Detalles' : 'Configurar Producto'}
                  </h2>
                  {modalDisplay && (
                    <p className="text-sm text-slate-500 font-medium mt-0.5">{modalDisplay.name}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md shrink-0 -mr-2">
                <X size={20} />
              </Button>
            </div>
            
            <div className="overflow-y-auto overflow-x-hidden p-6 space-y-6 flex-1 bg-slate-50/50">
              {modalDisplay && (
                <div className="flex flex-col space-y-6">
                  {/* Grid de Inputs Principales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Cantidad y Unidad */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Cantidad</label>
                      <Input
                        type="number"
                        value={modalQuantity}
                        onChange={(e) => setModalQuantity(e.target.value)}
                        min={isDecimalUnit(modalUnit || 'unit') ? "0.01" : "1"}
                        step={isDecimalUnit(modalUnit || 'unit') ? "0.01" : "1"}
                        className="h-10 text-base font-mono font-medium text-slate-900 bg-white border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all rounded-md shadow-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Unidad de Medida</label>
                      <Input
                        type="text"
                        list="allowed-units"
                        value={modalUnit}
                        onChange={(e) => setModalUnit(e.target.value)}
                        className="h-10 text-base text-slate-900 bg-white border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all rounded-md shadow-sm"
                      />
                    </div>

                    {/* Precios */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Precio Base Unit.</label>
                      <Input
                        type="text"
                        value={formatCurrency(modalDisplay.price).replace('₲', '').trim()}
                        disabled
                        className="h-10 text-base font-mono font-medium text-slate-500 border border-slate-200 bg-slate-100 rounded-md cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 text-primary">Precio Final Unit.</label>
                      <Input
                        type="number"
                        value={modalPrice}
                        onChange={(e) => {
                          const newPrice = Math.max(0, Number(e.target.value));
                          setModalPrice(newPrice);
                          const diff = modalDisplay.price - newPrice;
                          if (modalDiscountType === 'percent') {
                            setModalDiscount(Number(((diff / modalDisplay.price) * 100).toFixed(2)));
                          } else {
                            setModalDiscount(diff);
                          }
                        }}
                        className="h-10 text-base font-mono font-semibold text-primary bg-white border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all rounded-md shadow-sm"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Zona de descuentos */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="text-sm font-semibold text-slate-800">Ajuste o Descuento</label>
                      <div className="flex bg-slate-200/60 p-1 rounded-md">
                        <button
                          type="button"
                          onClick={() => {
                            setModalDiscountType('amount');
                            setModalDiscount(modalDisplay.price - modalPrice);
                          }}
                          className={`flex-1 px-3 py-1 text-xs font-semibold rounded transition-all ${
                            modalDiscountType === 'amount' 
                              ? 'bg-white text-slate-900 shadow-sm' 
                              : 'text-slate-600 hover:text-slate-800'
                          }`}
                        >
                          Monto Fijo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalDiscountType('percent');
                            setModalDiscount(Number((((modalDisplay.price - modalPrice) / modalDisplay.price) * 100).toFixed(2)));
                          }}
                          className={`flex-1 px-3 py-1 text-xs font-semibold rounded transition-all ${
                            modalDiscountType === 'percent' 
                              ? 'bg-white text-slate-900 shadow-sm' 
                              : 'text-slate-600 hover:text-slate-800'
                          }`}
                        >
                          Porcentaje
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-500">
                          {modalDiscountType === 'percent' ? <Percent size={16} /> : <DollarSign size={16} />}
                        </div>
                        <Input
                          type="number"
                          value={modalDiscount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setModalDiscount(val);
                            if (modalDiscountType === 'percent') {
                              setModalPrice(Math.max(0, modalDisplay.price * (1 - val / 100)));
                            } else {
                              setModalPrice(Math.max(0, modalDisplay.price - val));
                            }
                          }}
                          placeholder="0"
                          className="h-10 pl-9 pr-3 text-base font-mono font-medium border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary transition-all rounded-md"
                        />
                      </div>

                      <Select value={modalDiscountReason} onValueChange={setModalDiscountReason}>
                        <SelectTrigger className="w-full h-10 border border-slate-300 rounded-md font-medium text-sm focus:ring-1 focus:ring-primary bg-white">
                          <SelectValue placeholder="Razón del ajuste..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PRICE_CHANGE_REASONS.map(reason => (
                            <SelectItem key={reason.id} value={reason.label} className="text-sm">
                              {reason.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="Other" className="text-sm">Otras razones...</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {modalDiscountReason === 'Other' && (
                      <div className="animate-in slide-in-from-top-1 duration-200">
                        <Input
                          value={modalCustomReasonText}
                          onChange={(e) => setModalCustomReasonText(e.target.value)}
                          placeholder="Especificar motivo detallado del ajuste..."
                          className="h-10 border border-slate-300 rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Resumen Final: Deep Brand Blue Anchor */}
                  <div className="bg-gradient-to-br from-[#003966] via-[#004578] to-[#0f6cbd] p-6 rounded-xl shadow-2xl shadow-blue-900/20 text-white mt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm font-medium text-blue-100/80">
                        <span>Subtotal Bruto</span>
                        <span className="font-mono">{formatCurrency(modalUnitPrice * Number(modalQuantity))}</span>
                      </div>
                      {modalDiscountValue !== 0 && (
                        <div className={`flex justify-between items-center text-sm font-medium ${modalDiscountValue > 0 ? 'text-emerald-300' : 'text-orange-300'}`}>
                          <span>{modalDiscountValue > 0 ? 'Descuento' : 'Recargo'}</span>
                          <span className="font-mono">{modalDiscountValue > 0 ? '-' : '+'}{formatCurrency(Math.abs(modalDiscountValue))}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-end pt-3 mt-3 border-t border-blue-400/30">
                        <span className="text-sm font-semibold text-white">Total a Pagar</span>
                        <span className="text-3xl font-mono font-black text-white">{formatCurrency(modalLineTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-200 shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 h-10 text-sm font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md transition-all"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmAdd} 
                className="flex-1 h-10 text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm rounded-md transition-all"
              >
                {editingItemId ? 'Guardar Cambios' : 'Confirmar Adición'}
              </Button>
            </div>
          </div>
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
                <Button onClick={handleConfirmCancelSale} disabled={cancelSubmitting || !canWrite} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold">{cancelSubmitting ? 'Anulando...' : 'Sí, Anular'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showActiveSaleModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 bg-white">
            <CardHeader className="border-b bg-amber-50 px-6 py-4">
              <CardTitle className="text-amber-700 flex items-center gap-2">
                <History size={20} /> Ventas Pendientes Detectadas
              </CardTitle>
              <p className="text-xs text-amber-600 font-medium">El cliente "{selectedClient?.name}" tiene ventas sin completar.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {activeSales.map((sale, index) => {
                  const saleId = sale.id || sale.sale_id;
                  const itemKey = saleId ? `pending-sale-${saleId}` : `pending-sale-index-${index}`;
                  
                  return (
                    <label
                      key={itemKey}
                      className={cn(
                        "flex flex-col p-3 border rounded-lg cursor-pointer transition-all",
                        activeSale?.id === sale.id || activeSaleIndex === index 
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" 
                          : "hover:bg-slate-50 border-slate-200"
                      )}
                      onMouseEnter={() => {
                        setActiveSale(sale);
                        setActiveSaleIndex(index);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="activeSale"
                            checked={activeSale?.id === sale.id || activeSaleIndex === index}
                            onChange={() => {
                              setActiveSale(sale);
                              setActiveSaleIndex(index);
                            }}
                            className="size-4 text-primary"
                          />
                          <span className="font-bold text-sm text-slate-700">Venta #{saleId}</span>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[9px] uppercase font-black">
                          Pendiente
                        </Badge>
                      </div>
                      <div className="flex justify-between items-end ml-6">
                        <span className="text-xs text-slate-500">{formatDateTime(sale.sale_date || sale.created_at)}</span>
                        <span className="text-sm font-black text-primary">{formatCurrency(sale.total_amount)}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowActiveSaleModal(false);
                    setCurrentSaleId(null);
                    // Si hay reservas pendientes, mostrar el modal de reservas
                    if (pendingReservations.length > 0) {
                      setTimeout(() => setShowReservationModal(true), 300);
                    }
                  }} 
                  className="flex-1 h-11 text-xs font-black uppercase tracking-widest"
                >
                  Nueva Venta
                </Button>
                <Button 
                  onClick={handleContinueSale} 
                  className="flex-1 h-11 text-xs font-black uppercase tracking-widest"
                >
                  Continuar Seleccionada
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ReservationModal
        isOpen={showReservationModal}
        onClose={() => {
          setShowReservationModal(false);
          setPendingReservations([]);
          setSelectedResIds(new Set());
        }}
        pendingReservations={pendingReservations}
        selectedResIds={selectedResIds}
        onToggleSelection={(resId) => {
          const isProductAlreadySelected = Array.from(selectedResIds).some(sid => {
            if (sid === resId) return false;
            const otherRes = pendingReservations.find(r => Number(r.reserve_id || r.id) === sid);
            const thisRes = pendingReservations.find(r => Number(r.reserve_id || r.id) === resId);
            return otherRes?.product_id === thisRes?.product_id;
          });
          const isSelected = selectedResIds.has(resId);
          if (isProductAlreadySelected && !isSelected) {
            const res = pendingReservations.find(r => Number(r.reserve_id || r.id) === resId);
            toast.warning(`Solo se permite una reserva por cada producto (${res?.product_name})`);
            return;
          }
          const newSelection = new Set(selectedResIds);
          if (isSelected) newSelection.delete(resId);
          else newSelection.add(resId);
          setSelectedResIds(newSelection);
        }}
        onAddReservations={handleAddReservations}
        selectedClientName={selectedClient?.name}
        formatDateTime={formatDateTime}
      />

      {showInstantCollection && createdSaleData && (
        <InstantPaymentDialog
          open={showInstantCollection}
          onConfirmPayment={async (data) => {
            try {
              const paymentStatus = await saleService.getSalePaymentStatus(createdSaleData.id);
              const alreadyPaid = Boolean((paymentStatus as any)?.data?.is_fully_paid);
              if (alreadyPaid) {
                setShowInstantCollection(false);
                setCreatedSaleData(null);
                setItems([]);
                setSelectedClient(null);
                setCurrentSaleId(null);
                toast.info('La venta ya estaba pagada. Se guardo correctamente.');
                fetchDashboardData();
                return;
              }

              await salePaymentService.processSalePaymentWithCashRegister({
                sales_order_id: createdSaleData.id,
                amount_received: data.amount_received || data.amount,
                payment_method_id: data.paymentMethodId || createdSaleData.paymentMethodId,
                payment_notes: data.payment_notes || null,
                cash_register_id: data.cash_register_id,
              });
              setShowInstantCollection(false);
              setCreatedSaleData(null);
              setItems([]);
              setSelectedClient(null);
              setCurrentSaleId(null);
              toast.success('Cobro registrado exitosamente');
              fetchDashboardData();
            } catch (e: any) {
              const errorText = String(e?.message || '').toLowerCase();
              if (errorText.includes('already fully paid') || errorText.includes('ya esta pagada')) {
                setShowInstantCollection(false);
                setCreatedSaleData(null);
                setItems([]);
                setSelectedClient(null);
                setCurrentSaleId(null);
                toast.info('La venta ya estaba pagada. No se registro un cobro duplicado.');
                fetchDashboardData();
                return;
              }
              toast.error('Error al registrar cobro');
              throw e;
            }
          }}
          onLeavePending={() => {
            setShowInstantCollection(false);
            setCreatedSaleData(null);
            setItems([]);
            setSelectedClient(null);
            setCurrentSaleId(null);
            toast.success('Venta guardada como pendiente');
          }}
          variant="sale"
          orderId={createdSaleData.id}
          totalAmount={createdSaleData.total}
          currencyCode={createdSaleData.currencyCode || 'PYG'}
          paymentMethodId={createdSaleData.paymentMethodId}
          paymentMethodLabel={createdSaleData.paymentMethodLabel}
          paymentMethods={paymentMethods}
        />
      )}

      {variantSelectorProduct && (
        <VariantSelectorModal 
          product={variantSelectorProduct} 
          onClose={() => setVariantSelectorProduct(null)} 
          onSelect={(variant: any, _qty: number) => {
            addProductToCart(variantSelectorProduct, variantSelectorQuantity, variant.id, variant.variant_name);
            setVariantSelectorProduct(null);
          }} 
        />
      )}

      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  );
};

export default SalesNew;
