import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBarcodeScanner } from '@/features/sales/hooks/useBarcodeScanner';
import { useSalesShortcuts } from '@/features/sales/hooks/useSalesShortcuts';
import { SalesCartGrid } from '@/features/sales/components/SalesCartGrid';
import { SaleCheckoutWizard } from '@/features/sales/components/SaleCheckoutWizard';
import { ProductSearchPanel } from '@/features/sales/components/ProductSearchPanel';
import { CheckoutSummaryPanel } from '@/features/sales/components/CheckoutSummaryPanel';
import { SalesHistoryView } from '@/features/sales/components/SalesHistoryView';
import { EditItemModal } from '@/features/sales/components/EditItemModal';
import { CancelSaleModal } from '@/features/sales/components/CancelSaleModal';
import { RequestCancellationModal } from '@/features/sales/components/RequestCancellationModal';
import { CancellationRequestsPanel } from '@/features/sales/components/CancellationRequestsPanel';
import { useCancellationRequests } from '@/features/sales/hooks/useCancellationRequests';
import { PRICE_CHANGE_REASONS } from '@/features/sales/constants/priceChangeReasons';
import type { CollectionData } from '@/features/sales/components/steps/CollectionStep';
import type { AddProductsToSaleRequest } from '@/types';
import {
  History,
  Plus,
  ShoppingCart,
  ClipboardX,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SearchableDropdownItem } from '@/components/ui/SearchableDropdown';
import useSaleStore from '@/store/useSaleStore';
import useDashboardStore from '@/store/useDashboardStore';
import {
  resolveApplicableRateFraction,
  coerceTaxRateFraction,
} from '@/domain/tax/resolveApplicableRate';
import { isBlockedByStock } from '@/domain/products/sellability';
import { getDefaultVatPercent } from '@/store/useTaxRateStore';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import saleService from '@/services/saleService';
import clientService from '@/services/clientService';
import apiService from '@/services/api.ts';
import { PaymentMethodService } from '@/services/paymentMethodService';
import { CurrencyService } from '@/services/currencyService';
import { productService } from '@/services/productService';
import { VariantSelectorModal } from '@/features/sales/components/VariantSelectorModal';
import { salePaymentService } from '@/services/salePaymentService';
import { reservationService } from '@/services/reservationService';
import type { WalkInSpec } from '@/features/sales/components/steps/WalkInReservationForm';
import { useI18n } from '@/lib/i18n';
import { toApiError } from '@/utils/ApiError';
import { formatCurrency } from '@/utils/currencyUtils';
import { isDecimalUnit } from '@/constants/units';
import ToastContainer from '@/components/ui/ToastContainer';
import { useCounterOrderCheckout } from '@/features/counterorders/hooks/useCounterOrderCheckout';
import { useClientActiveCounterOrders } from '@/features/counterorders/hooks/useCounterOrders';
import type { CounterOrderSummary } from '@/features/counterorders/types';

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
  variantId?: string | null;
  variantName?: string;
  // Ítem cargado desde un pedido de mostrador (PLAN_PEDIDOS_MOSTRADOR FASE 3):
  // se marca para poder liberarlo del carrito si el pedido se libera.
  isFromCounterOrder?: boolean;
  counterOrderId?: string;
  counterOrderCode?: string;
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
  product_type?: string;
  /** Fila plana (granularity=variant): variante ya resuelta en la fila. */
  variantId?: string | null;
  variantName?: string;
  /** Etiqueta compuesta "Producto · Variante" para el dropdown. */
  displayName?: string;
}

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
  // Tasa resuelta por el backend (applicable_tax_rate) con normalización
  // percent ↔ fracción en un único helper de dominio; 0 (EXENTO) es válido.
  const normalizedTaxRate = resolveApplicableRateFraction(
    product as Record<string, any>,
    getDefaultVatPercent(),
  );

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
    has_valid_price: Number(price) > 0,
    has_variants: Boolean(product.has_variant || product.has_variants || (Array.isArray(product.variants) && product.variants.length > 0)),
    product_type: String(product.product_type || 'PHYSICAL'),
  };
};

/**
 * Fila plana de búsqueda (granularity=variant, PLAN_BUSQUEDA_VARIANTES_PLANAS
 * F5): la fila ya resuelve producto+variante — variant_id, precio efectivo
 * (variante-primero, fallback padre) y stock propio de la unidad. La
 * variante llega elegida: el dropdown ya no abre el selector por defecto.
 */
const getUnitDisplay = (unit: Record<string, unknown>): ProductDisplay => {
  const display = getProductDisplay(unit);
  const variantId = (unit.variant_id as string | null) ?? null;
  const variantName = (unit.variant_name as string | null) ?? null;
  // Fila plana: el precio efectivo viaja en `current_price` — variante-primero
  // con fallback al padre (la herencia ya viene resuelta por el backend); los
  // campos legacy (sale_price/unit_prices) no existen en esta fila.
  const flatPrice = Number(unit.current_price ?? 0);
  const price = flatPrice > 0 ? flatPrice : display.price;
  return {
    ...display,
    price,
    has_valid_price: price > 0,
    has_variants: false, // fila unidad: se agrega directo, sin selector
    variantId,
    variantName: variantName ?? undefined,
    displayName: variantName ? `${display.name} · ${variantName}` : display.name,
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
  // B.3/B.5 (PLAN_VENDOR_ROLE): cosmetic gating — the server enforces both.
  const canApplyDiscount = hasPermission('sales:apply_discount');
  const canCancelSale = hasPermission('sales:cancel');
  // FASE C: sin sales:cancel, la anulación pasa por solicitud. FASE 4
  // (PLAN_PEDIDOS_MOSTRADOR v3) revocó sales:write a VNDR01 pero el backend
  // re-gateó la creación de solicitudes a sales:read (routes.go) para
  // conservar esta función: el gate FE tiene que seguirlo (audit A1 —
  // con = canWrite el vendor perdió el botón "Solicitar Anulación").
  const canRequestCancellation = hasPermission('sales:read');
  // FASE 4 (PLAN_PEDIDOS_MOSTRADOR v3): sin sales:write el vendor NO crea
  // ventas — /ventas abre directo en Historial y la tab "Nueva Venta" no
  // existe (el flujo del vendor es /pedidos).
  const initialTab = canWrite ? 'new-sale' : 'history';
  const cancellationRequests = useCancellationRequests(canCancelSale);
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  const dropdownQuantityInputRef = useRef<HTMLInputElement>(null);
  // Última versión de handleSaveSale para el listener global de F12 (evita
  // stale-closures: items/selectedClient cambian sin que el effect re-corra).
  const handleSaveSaleRef = useRef<() => void>(() => {});

  const {
    createSale,
    sales,
    fetchSalesByDateRange,
    fetchSalesByClientName,
    clearSales,
    cancelSale,
    loading: saleLoading,
  } = useSaleStore();

  const [activeTab, setActiveTab] = useState<'new-sale' | 'history' | 'cancellations'>(initialTab);

  const [items, setItems] = useState<CartItem[]>([]);
  const [variantSelectorProduct, setVariantSelectorProduct] = useState<ProductDisplay | null>(null);
  const [variantSelectorQuantity, setVariantSelectorQuantity] = useState<number>(1);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  // Ítem "activo" del carrito (fila en hover/foco): lo consumen Alt+Q/Alt+X.
  const [activeCartItemId, setActiveCartItemId] = useState<string | null>(null);
  // Error del último fetch de historial (para DataState error + reintentar).
  const [historyError, setHistoryError] = useState<string | null>(null);

  const handleClearCart = useCallback(() => setItems([]), []);
  const handleGoToHistory = useCallback(() => setActiveTab('history'), []);
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

  // FASE C: solicitud de anulación del vendor (sin sales:cancel).
  const [requestCancellationSale, setRequestCancellationSale] = useState<Record<string, unknown> | null>(null);
  const [requestCancellationReason, setRequestCancellationReason] = useState('');
  const [requestCancellationSubmitting, setRequestCancellationSubmitting] = useState(false);

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

  const [isProcessingSale, setIsProcessingSale] = useState(false);
  // POS checkout atómico: payload de venta listo para enviar junto con el pago
  // en una sola transacción (POST /sale/pos-checkout). Se popula al "Cobrar" y
  // se consume al confirmar el diálogo. Si el operador elige "Dejar pendiente",
  // se envía como createSale por separado (venta a crédito/asíncrono).
  const [pendingSaleData, setPendingSaleData] = useState<any | null>(null);

  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);
  const [activeSales, setActiveSales] = useState<any[]>([]);
  const [activeSale, setActiveSale] = useState<any | null>(null);
  // Wizard de concreción unificado (reemplaza CheckoutModal + InstantPaymentDialog
  // + modales de pendientes/reservas). Un solo Stepper: Cliente → Pendientes →
  // Reservas → Pago → Cobro, con carrito siempre visible.
  const [showCheckoutWizard, setShowCheckoutWizard] = useState(false);

  const [pendingReservations, setPendingReservations] = useState<any[]>([]);
  const [selectedResIds, setSelectedResIds] = useState<Set<number>>(new Set());

  const [productSearchResults, setProductSearchResults] = useState<ProductDisplay[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productHighlightedIndex, setProductHighlightedIndex] = useState(-1);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductQuantity, setSelectedProductQuantity] = useState<number | string>(1);

  const { handleBarcodeScan } = useBarcodeScanner({
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
          taxRate: coerceTaxRateFraction(reservation.tax_rate, getDefaultVatPercent() / 100),
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
        
        const sRec = s as Record<string, unknown>;

        return {
          ...sRec,
          internalKey: saleId ? `sale-${saleId}-${idx}` : `sale-index-${idx}`,
          id: saleId ? String(saleId) : undefined,
          displayId: saleId ? String(saleId) : 'N/A',
          client_name: String(sRec.client_name || ((sRec.client as Record<string, unknown>)?.name) || 'Cliente Ocasional'),
          total_amount: Number(sRec.total_amount || sRec.total || 0),
          date: (sRec.sale_date || sRec.order_date || sRec.date) as string | Date | null | undefined,
          status: String((sRec.status || (entry as Record<string, unknown>).status || 'PENDING')).toUpperCase(),
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

  // El historial es POR SUCURSAL: el set cacheado en el store puede ser de
  // otra activa (sobrevive logout/login y cambios de sucursal — SPA sin
  // reload) y abrir esas ventas da 404: el detalle pide con el X-Branch-ID
  // vigente. Recarga cuando el set está vacío o corresponde a otra branch.
  const salesBranchId = useSaleStore((state) => state.salesBranchId);
  const historyStale =
    activeTab === 'history' &&
    !saleLoading &&
    (sales.length === 0 || (salesBranchId ?? null) !== (currentBranchId ?? null));
  const historyLoadAttemptedRef = useRef<number | null>(null);
  useEffect(() => {
    if (!historyStale) {
      historyLoadAttemptedRef.current = null; // datos válidos de nuevo: reset
      return;
    }
    const branchKey = currentBranchId ?? null;
    // Un intento por branch: evita re-fetch en loop si el fetch falla.
    if (historyLoadAttemptedRef.current === branchKey) return;
    historyLoadAttemptedRef.current = branchKey;
    handleHistoryFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyStale, currentBranchId]);

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        const response = await PaymentMethodService.getAll();
        const rawArray: any[] = Array.isArray(response) ? response : (response as any)?.data || [];
        // Filter duplicates by ID to avoid React key errors
        const uniqueMethods = Array.from(new Map(rawArray.map((m: any) => [m.id, m])).values()) as any[];
        setPaymentMethods(uniqueMethods);
        if (uniqueMethods.length > 0) setPaymentMethodId(uniqueMethods[0].id);
      } catch (error) {
        console.error('Error loading payment methods:', error);
      }

      try {
        const response = await CurrencyService.getAll();
        const rawList: any[] = Array.isArray(response) ? response : (response as any)?.data || [];
        // Filter duplicates by ID to avoid React key errors
        const uniqueCurrencies = Array.from(new Map(rawList.map((c: any) => [c.id, c])).values()) as any[];
        setCurrencies(uniqueCurrencies);
        // Política: el documento se emite en moneda base; el selector del
        // wizard elige la MONEDA DE COBRO y arranca en la base.
        const baseCurrency = uniqueCurrencies.find((c: any) => c.is_base || c.is_base_currency);
        setCurrencyId(baseCurrency?.id ?? uniqueCurrencies[0]?.id ?? 1);
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
        try {
          // Búsqueda plana (granularity=variant): el término matchea también
          // SKU/barcode/nombre de variante y cada fila trae precio/stock
          // propio — sin segundo paso de selección de variante.
          const response = await productService.searchAdvanced({
            search: term || undefined,
            granularity: 'variant',
            page: 1,
            page_size: 15,
          });
          const raw = (response as any)?.products;
          const allResults: Record<string, unknown>[] = Array.isArray(raw) ? raw : [];
          const displayResults = allResults
            .filter(p => p.state !== false)
            .slice(0, 15)
            .map(p => getUnitDisplay(p));
          setProductSearchResults(displayResults);
          setShowProductDropdown(true);
          setProductHighlightedIndex(displayResults.length > 0 ? 0 : -1);
        } catch (error) {
          console.error('Error searching products:', error);
          setProductSearchResults([]);
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
              if (document.activeElement !== dropdownQuantityInputRef.current && !selectedProduct.has_variants) {
                dropdownQuantityInputRef.current?.focus();
                dropdownQuantityInputRef.current?.select();
              } else {
                let qty = parseFloat(String(selectedProductQuantity));
                if (isNaN(qty) || qty <= 0) qty = 1;
                // Fila plana: la variante ya viene resuelta (undefined nunca
                // llega acá, así el selector de variantes no se abre).
                addProductToCart(selectedProduct, qty, selectedProduct.variantId ?? null, selectedProduct.variantName);
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

      if (event.key === 'F12') {
        event.preventDefault();
        // Usar el ref: el effect no re-corre al cambiar items/selectedClient,
        // y el closure capturado tendría estado viejo (carrito vacío o sin
        // cliente) que rompería el cobro.
        handleSaveSaleRef.current();
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
        setHistoryError(null);
        return;
      } catch (error) {
        console.error('Error fetching by name:', error);
        setHistoryError((error as Error)?.message || 'No se pudo buscar por cliente');
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
      setHistoryError(null);
    } catch (error) {
      setHistoryError((error as Error)?.message || 'No se pudo obtener el historial de ventas');
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
      setHistoryError(null);
    } catch (error) {
      setHistoryError((error as Error)?.message || 'Error al cargar últimos registros');
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

    if (variantId === undefined && isBlockedByStock(product)) {
      toast.error(`El producto "${product.name}" no tiene stock disponible en esta sucursal.`);
      return;
    }

    const finalVariantId = variantId === null ? null : variantId;
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
    // Defensa: ignorar ítems fantasma sin id real (un cliente sin id produce
    // payload sin client_id → 500 "Cliente con ID  no encontrado").
    if (!client?.id) return;
    setSelectedClient(client);

    // Si el wizard ya está abierto (paso Cliente), el payload validado se
    // armó sin client_id — parchearlo con el cliente recién elegido.
    setPendingSaleData(prev => (prev ? { ...prev, client_id: client.id } : prev));

    // Buscar ventas pendientes del cliente (el wizard las muestra como paso).
    try {
      const response = await saleService.getPendingSalesByClient(client.id, client.name);
      if (response?.success && Array.isArray(response.data) && response.data.length > 0) {
        setActiveSales(response.data);
        setActiveSale(response.data[0]);
      } else {
        setActiveSales([]);
        setActiveSale(null);
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
        // Pre-seleccionar todas las reservas por defecto (Set de IDs numéricos).
        // El wizard las muestra como un paso condicional.
        const allIds = new Set(reservations.map((r: any) => Number(r.reserve_id || r.id)).filter(Boolean));
        setSelectedResIds(allIds);
      }
    } catch (error) {
      console.error('Error buscando reservas del cliente:', error);
    }
  };

  // ─── Pedidos de mostrador (PLAN_PEDIDOS_MOSTRADOR FASE 3) ────────────────
  // Orquestación del pedido dentro del wizard: claim al continuar, ítems →
  // CartItems con flag isFromCounterOrder, release al salir sin procesar y
  // convert tras el cobro. La lógica vive en el hook del feature.
  const clientCounterOrdersQuery = useClientActiveCounterOrders(selectedClient?.id ?? null);
  const clientCounterOrders: CounterOrderSummary[] = clientCounterOrdersQuery.data ?? [];

  const counterOrderFlow = useCounterOrderCheckout({
    toast,
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => t(key, fallback, vars),
    addItems: (items) => setItems((prev) => [...prev, ...items]),
    enterMergeMode: (sale: any) => {
      setCurrentSaleId(sale?.sale_id || sale?.id);
      setActiveSale(sale);
    },
    openWizard: () => setShowCheckoutWizard(true),
    selectClient: (client) => handleSelectClient(client as Client),
  });

  const handleContinueOrder = useCallback(
    async (order: CounterOrderSummary, mergeSale: any | null) =>
      counterOrderFlow.continueOrder(order, mergeSale ?? undefined),
    [counterOrderFlow],
  );

  const handleContinueSale = useCallback(async (saleOverride?: any) => {
    const sale = saleOverride || activeSale;
    if (!sale) return;

    let saleDetails = sale.details || [];
    const saleId = sale.sale_id || sale.id;

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
    toast.success(`Cargada venta #${saleId} para continuar`);

    // Las reservas ahora se gestionan como un paso del wizard de checkout,
    // no con un modal separado disparado por setTimeout.
  }, [activeSale, saleService, setItems, toast]);

  // Wrapper para el wizard: continúa la venta pendiente en el índice dado.
  // Pasa el sale explícitamente a handleContinueSale para evitar el stale-closure
  // del useCallback (que leería un activeSale desactualizado).
  const handleContinueSaleByIndex = useCallback(
    async (index: number) => {
      if (index < 0 || index >= activeSales.length) return;
      const sale = activeSales[index];
      setActiveSale(sale);
      await handleContinueSale(sale);
    },
    [activeSales, handleContinueSale],
  );

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

    // El wizard gestiona el cierre; aquí solo limpiamos las reservas ya cargadas.
    setPendingReservations([]);
    setSelectedResIds(new Set());
    toast.success('Reservas añadidas al carrito');
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setCurrentSaleId(null);
    setPendingReservations([]);
    // Quitar el client_id del payload validado si el operador deselecciona.
    setPendingSaleData(prev => {
      if (!prev) return prev;
      const { client_id, ...rest } = prev;
      return rest;
    });
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

  // Atajos globales del POS (F2/F4/Alt+Q/Alt+X/Ctrl+Shift+H). Va después de
  // handleOpenEditModal porque los callbacks de fila activa lo referencian.
  useSalesShortcuts({
    activeTab,
    productSearchInputRef,
    onClearCart: handleClearCart,
    onGoToHistory: handleGoToHistory,
    onEditActiveItem: useCallback(() => {
      if (!activeCartItemId) return;
      const item = items.find((i) => i.id === activeCartItemId);
      if (item && !item.isFromPendingSale) handleOpenEditModal(item);
    }, [activeCartItemId, items]),
    onRemoveActiveItem: useCallback(() => {
      if (!activeCartItemId) return;
      const item = items.find((i) => i.id === activeCartItemId);
      if (item && !item.isFromPendingSale) {
        setItems((prev) => prev.filter((i) => i.id !== activeCartItemId));
        setActiveCartItemId(null);
      }
    }, [activeCartItemId, items]),
    // El wizard de checkout vive encima: limpiar/editar el carrito por teclado
    // en ese estado corrompería la venta en curso.
    enabled: !showCheckoutWizard && !isModalOpen,
  });

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

  // ─── FASE C: solicitud de anulación (vendor sin sales:cancel) ───────────────

  const handleRequestCancellation = useCallback((sale: Record<string, unknown>) => {
    setRequestCancellationSale(sale);
    setRequestCancellationReason('');
  }, []);

  const handleConfirmRequestCancellation = async () => {
    if (!requestCancellationSale) return;
    const saleId = requestCancellationSale.sale_id || requestCancellationSale.id;
    if (!saleId) return;
    setRequestCancellationSubmitting(true);
    try {
      const result = await saleService.requestSaleCancellation(String(saleId), requestCancellationReason.trim());
      if (result.success) {
        toast.success(t('sales.cancellation.requestedToast', 'Solicitud enviada: un encargado la revisará'));
        setRequestCancellationSale(null);
        setRequestCancellationReason('');
        handleHistoryFilter();
      } else {
        toast.errorFrom(new Error(result.error), {
          fallback: t('sales.cancellation.requestError', 'No se pudo enviar la solicitud'),
        });
      }
    } finally {
      setRequestCancellationSubmitting(false);
    }
  };

  const handleSaveSale = async () => {
    // El cliente se selecciona dentro del SaleCheckoutWizard (ClientStep,
    // paso 1). No gatear acá: si no hay cliente, el wizard abre igual y
    // handleSelectClient parchea pendingSaleData.client_id al elegirlo.
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

        const payload: AddProductsToSaleRequest = {
          allow_price_modifications: newItems.some(item => Math.abs((Number(item.price) || 0) - (Number(item.originalPrice) || 0)) > 0.01),
          product_details: newItems.map(item => {
            const currentPrice = Number(item.price) || 0;
            const originalPrice = Number(item.originalPrice) || 0;
            const hasModification = Math.abs(currentPrice - originalPrice) > 0.01;
            const discountInputVal = Number(item.discountInput) || 0;
            
            return {
              product_id: item.productId,
              ...(item.variantId !== undefined ? { variant_id: item.variantId } : {}),
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
        // FASE 5B: si hay un pedido de mostrador reclamado, cerrarlo en la
        // misma tx que agrega los ítems (el carrito puede venir de /pedidos).
        const claimedOrderId = counterOrderFlow.getClaimedOrderId();
        if (claimedOrderId) payload.counter_order_id = claimedOrderId;

        const response = await saleService.addProductsToSale(currentSaleId, payload, activeSale?.branch_id);
        
        if (response?.success) {
          toast.success(`Venta #${currentSaleId} actualizada exitosamente.`);
          setItems([]);
          setCurrentSaleId(null);
          setSelectedClient(null);
          fetchDashboardData();
          handleHistoryFilter();
        } else {
          const errMsg = response?.error || 'No se pudieron agregar los productos a la venta';
          if (errMsg.toLowerCase().includes('no existe conversion') || errMsg.toLowerCase().includes('conversión')) {
            toast.error(`No existe conversión de unidad: ${errMsg}. Registre la conversión primero.`);
          } else if (errMsg.toLowerCase().includes('variant_id is required')) {
            toast.error('Este producto requiere seleccionar una variante. Por favor, seleccione la variante correspondiente.');
          } else {
            toast.error(errMsg);
          }
        }
      } else {
        const saleData = buildNewSaleData();
        if (!saleData) {
          setIsProcessingSale(false);
          return;
        }

        // POS checkout atómico: guardamos el payload validado y abrimos el
        // wizard de concreción. Al confirmar el cobro (onConfirmWizard), se
        // reconstruye desde el carrito vigente (el operador puede agregar
        // reservas dentro del wizard) y se envía venta + pago juntos en una
        // sola transacción (POST /sale/pos-checkout): si el pago falla, la
        // venta se revierte entera (sin venta fantasma). "Dejar pendiente"
        // cae al path de createSale por separado (venta a crédito/asíncrono).
        setPendingSaleData(saleData);
        setShowCheckoutWizard(true);
      }
    } catch (error: any) {
      const errMsg = error?.message || error?.error || 'Error inesperado al procesar la venta';
      if (errMsg.toLowerCase().includes('no existe conversion') || errMsg.toLowerCase().includes('conversión')) {
        toast.error(`No existe conversión de unidad: ${errMsg}. Registre la conversión primero.`);
      } else if (errMsg.toLowerCase().includes('variant_id is required')) {
        toast.error('Este producto requiere seleccionar una variante. Por favor, seleccione la variante correspondiente.');
      } else {
        toast.error(errMsg);
      }
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Arma el payload de venta nueva desde el carrito vigente: valida unicidad
  // de reserve_id (máx. una reserva por venta), la regla de una reserva por
  // producto y mapea los ítems a product_details. Se usa al abrir el wizard
  // (handleSaveSale) y AL CONFIRMAR (onConfirmWizard/onLeavePendingWizard):
  // reconstruir al confirmar garantiza que las reservas agregadas dentro del
  // wizard (walk-in o existentes) lleguen al backend.
  const buildNewSaleData = useCallback((): any | null => {
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
      return null;
    }

    // Tomar el reserve_id único si existe
    const saleReserveId = distinctReserveIds.length === 1 ? distinctReserveIds[0] : undefined;

    const payloadPriceMod = uniqueItems.some(
      item => Math.abs((Number(item.price) || 0) - (Number(item.originalPrice) || 0)) > 0.01
    );

    return {
      // El cliente puede haberse elegido en ClientStep del wizard (después
      // de abrirlo); se lee del estado vigente.
      ...(selectedClient ? { client_id: selectedClient.id } : {}),
      ...(saleReserveId && { reserve_id: saleReserveId }),
      allow_price_modifications: payloadPriceMod,
      // El documento SIEMPRE en moneda base; la divisa elegida viaja en el pago.
      currency_id: baseCurrencyId,
      product_details: uniqueItems.map(item => {
        const currentPrice = Number(item.price) || 0;
        const originalPrice = Number(item.originalPrice) || 0;
        const hasModification = Math.abs(currentPrice - originalPrice) > 0.01;
        const discountInputVal = Number(item.discountInput) || 0;

        const detail: any = {
          product_id: item.productId,
          ...(item.variantId !== undefined ? { variant_id: item.variantId } : {}),
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
  }, [items, selectedClient, currencyId, toast]);

  // Payload para agregar productos a una venta EXISTENTE (modo merge): filtra
  // los ítems nuevos (sin isFromPendingSale) y mapea cada detalle con la
  // convención precio/descuento. Lo comparten onConfirmWizard (merge + cobro)
  // y onLeavePendingWizard (merge + "Dejar pendiente") para no duplicar reglas.
  const buildAddProductsPayload = useCallback(
    (sourceItems: CartItem[]): AddProductsToSaleRequest | null => {
    const newItems = sourceItems.filter((item) => !item.isFromPendingSale);
    if (newItems.length === 0) return null;
    return {
      allow_price_modifications: newItems.some(
        (item) => Math.abs((Number(item.price) || 0) - (Number(item.originalPrice) || 0)) > 0.01,
      ),
      product_details: newItems.map((item) => {
        const currentPrice = Number(item.price) || 0;
        const originalPrice = Number(item.originalPrice) || 0;
        const hasModification = Math.abs(currentPrice - originalPrice) > 0.01;
        const discountInputVal = Number(item.discountInput) || 0;
        return {
          product_id: item.productId,
          ...(item.variantId !== undefined ? { variant_id: item.variantId } : {}),
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'unit',
          ...(item.reserve_id && { reserve_id: item.reserve_id }),
          ...(hasModification && {
            sale_price: currentPrice,
            price_change_reason: (item.discountReason || 'Ajuste de precio').trim(),
            [item.discountType === 'percent' ? 'discount_percent' : 'discount_amount']: discountInputVal,
            discount_reason: (item.discountReason || 'Ajuste de precio').trim(),
          }),
        };
      }),
    };
  }, []);

  // Mantener el ref de F12 apuntando a la última versión de handleSaveSale.
  useEffect(() => {
    handleSaveSaleRef.current = handleSaveSale;
  });

  // ─── Callbacks del SaleCheckoutWizard ────────────────────────────────────
  // Moneda base del sistema (fallback id 1 = PYG sembrada): identifica la
  // moneda del documento de venta.
  const baseCurrencyId =
    currencies.find((c: any) => c.is_base || c.is_base_currency)?.id ?? 1;

  // onConfirmWizard: confirma el cobro. Si hay currentSaleId (modo merge),
  // agrega los productos nuevos (addProductsToSale) y procesa el pago. Si no,
  // usa el checkout POS atómico (venta + pago en una transacción).
  const onConfirmWizard = useCallback(
    async (collection: CollectionData) => {
      setIsProcessingSale(true);
      // Venta resultante del checkout (para marcar el pedido CONVERTED).
      let checkoutSaleId = '';
      try {
        if (currentSaleId) {
          // Modo merge: agregar productos nuevos a la venta existente.
          checkoutSaleId = currentSaleId;
          const payload = buildAddProductsPayload(items);
          if (!payload) {
            toast.info('No hay productos nuevos para agregar a esta venta');
            return;
          }
          // FASE 5B: cierre atómico del pedido de mostrador en la tx del merge.
          const claimedOrderId = counterOrderFlow.getClaimedOrderId();
          if (claimedOrderId) payload.counter_order_id = claimedOrderId;
          const response = await saleService.addProductsToSale(currentSaleId, payload, activeSale?.branch_id);
          if (!response?.success) {
            throw new Error(response?.error || 'No se pudo actualizar la venta');
          }
          toast.success(
            `Venta #${currentSaleId} actualizada (${response?.data?.items_added ?? payload.product_details.length} ítem${payload.product_details.length > 1 ? 's' : ''}).`,
          );

          // Cobro en modo merge: la venta existente debe quedar COBRADA, no solo
          // aumentada. Antes solo se llamaba a addProductsToSale y el cobro se
          // ignoraba por completo → la venta seguía PENDING pese a confirmar el
          // pago. PUT /sale/{id}/confirm-payment usa CashRegisterExplicit: la
          // caja es opcional y NUNCA se auto-resuelve (si el operador eligió
          // "Sin caja", el cobro avanza sin caja). POST /payment/process usaba
          // CashRegisterOptional y auto-resolvía una caja de otra sucursal →
          // 500 "Branch mismatch" al cobrar sin caja.
          const appliedAmount = collection.amountToApply ?? collection.amountReceived;
          const matchedMethod =
            paymentMethods.find((m) => String(m.id) === String(collection.paymentMethodId)) ||
            paymentMethods.find((m) => String(m.id) === String(paymentMethodId));
          const methodName =
            matchedMethod?.name || matchedMethod?.description || matchedMethod?.method_code || 'CASH';
          const confirmPayload: any = {
            payment_methods: [
              {
                method: methodName,
                amount: appliedAmount,
                amount_received: collection.amountReceived,
                ...(collection.currencyId != null && {
                  currency_id: collection.currencyId,
                  exchange_rate: collection.exchangeRate,
                  original_amount: collection.foreignAmountReceived ?? undefined,
                }),
              },
            ],
            caja_id: collection.cashRegisterId ?? undefined,
            ...(collection.notes && { payment_notes: collection.notes }),
          };
          const paymentResult = await salePaymentService.confirmSalePayment(currentSaleId, confirmPayload);
          if (paymentResult?.success === false) {
            throw new Error(paymentResult?.error || paymentResult?.message || 'No se pudo registrar el cobro');
          }
          if (appliedAmount < total) {
            toast.info(
              t('sales.checkoutWizard.partialCollectionToast', 'Cobro parcial registrado: {applied}. Saldo pendiente: {pending}.', {
                applied: formatCurrency(appliedAmount),
                pending: formatCurrency(Math.max(0, total - appliedAmount)),
              }),
            );
          } else {
            toast.success(`Venta #${currentSaleId} cobrada exitosamente`);
          }
        } else if (pendingSaleData || items.length > 0) {
          // Modo venta nueva: checkout POS atómico (venta + pago).
          // Reconstruir el payload desde el carrito vigente: el operador
          // puede haber agregado reservas dentro del wizard (walk-in o
          // existentes) DESPUÉS de que handleSaveSale armó pendingSaleData.
          // Refleja la moneda seleccionada en el wizard (puede haber cambiado).
          // Audit C3: también cubre el wizard abierto por precarga desde
          // /pedidos ("Procesar en caja"), que nunca arma pendingSaleData —
          // antes caía al else con "No hay datos de venta para procesar" y
          // el flujo quedaba sin salida.
          const salePayload = buildNewSaleData() ?? pendingSaleData;
          if (!salePayload) {
            // buildNewSaleData ya informó el problema (regla de reservas).
            return;
          }
          const result = await salePaymentService.posCheckout({
            // Documento SIEMPRE en moneda base (política cobro en divisa).
            sale: { ...salePayload, currency_id: Number(baseCurrencyId) || 1 },
            payment: {
              // amount_received viaja en moneda base; si el cobro fue en otra
              // divisa, los metadatos describen qué entregó el cliente y a qué
              // tasa. El backend valida la tasa y completa original_amount.
              amount_received: collection.amountReceived,
              // Cobro parcial: aplica al saldo solo lo tipeado en "monto a
              // aplicar"; la diferencia con lo recibido es vuelto. La venta
              // nace PARTIAL_PAYMENT con el resto como saldo (backend la
              // crea con saldo; después se abona con cobros parciales).
              ...(collection.amountToApply != null && {
                amount_to_apply: collection.amountToApply,
              }),
              payment_method_id: collection.paymentMethodId || Number(paymentMethodId) || 0,
              // Caja opcional: si el operador la eligió en el paso de cobro se
              // envía; sin caja, el backend procesa el pago sin caja (nunca
              // adivina una caja activa de otra sucursal).
              cash_register_id: collection.cashRegisterId ?? undefined,
              payment_notes: collection.notes,
              ...(collection.currencyId != null && {
                currency_id: collection.currencyId,
                exchange_rate: collection.exchangeRate,
                original_amount: collection.foreignAmountReceived ?? undefined,
              }),
            },
            // FASE 5B: cierre atómico del pedido de mostrador en la tx del
            // checkout (venta + pago + convert juntos; el /convert post-hoc
            // queda como recuperación idempotente).
            ...(counterOrderFlow.hasClaimedOrder() && {
              counter_order_id: counterOrderFlow.getClaimedOrderId() ?? undefined,
            }),
          });

          // El backend puede responder success:false / payment_error SIN error
          // HTTP (la venta se revierte). No mentir con el toast de éxito ni
          // resetear el carrito: el operador queda en el paso de cobro para
          // reintentar.
          if (result?.success === false || result?.payment_error) {
            const detail = result?.payment_error || (result?.sale as any)?.message || '';
            toast.error(
              t(
                'sales.checkoutWizard.confirmPaymentError',
                'No se pudo completar el cobro. La operación se canceló; intentá de nuevo.',
              ) + (detail ? ` ${detail}` : ''),
            );
            return;
          }

          const saleId = result?.sale?.sale_id || '';
          checkoutSaleId = saleId;
          if (collection.amountToApply != null && collection.amountToApply < total) {
            // Cobro parcial: la venta quedó con saldo pendiente; avisar en
            // lugar de "cobrada exitosamente" para que no se confunda con PAID.
            toast.info(
              t(
                'sales.checkoutWizard.partialCollectionToast',
                'Cobro parcial registrado: {applied}. Saldo pendiente: {pending}.',
                {
                  applied: formatCurrency(collection.amountToApply),
                  pending: formatCurrency(Math.max(0, total - collection.amountToApply)),
                },
              ),
            );
          } else {
            toast.success(saleId ? `Venta #${saleId} cobrada exitosamente` : 'Cobro registrado exitosamente');
          }
        } else {
          toast.error('No hay datos de venta para procesar');
          return;
        }
        // PLAN_PEDIDOS_MOSTRADOR: si el cobro salió de un pedido de mostrador,
        // marcarlo CONVERTED con la venta (idempotente; en error queda
        // CLAIMED con toast accionable de reintento — el hook lo maneja).
        if (counterOrderFlow.hasClaimedOrder()) {
          await counterOrderFlow.convertAfterCheckout(checkoutSaleId);
        }
        resetSaleState();
      } catch (e: any) {
        const norm = toApiError(e);
        const rawMsg = String(e?.message || norm.message || '').toLowerCase();
        if (norm.code === 'SALE_ALREADY_PAID' || norm.code === 'ALREADY_CANCELLED') {
          toast.error(t('sales.errors.saleAlreadyPaid', 'No se pueden agregar items a una venta ya pagada. Creá una venta nueva.') + ` (${norm.code})`);
        } else if (rawMsg.includes('insufficient_stock') || rawMsg.includes('stock insuficiente')) {
          // FASE 5 (stock en caja): el pedido no reserva stock; si otra venta
          // pagada consumió lo que este necesitaba, process_sale_with_reserve
          // revierte TODO y el SQL nombra producto + disponible + solicitado.
          // Mostrarlo completo: el operador coordina con el cliente o libera
          // el pedido desde /pedidos.
          toast.error(
            t(
              'sales.errors.insufficientStock',
              'No hay stock disponible para procesar la venta. La operación se canceló.',
            ) + (String(e?.message || norm.message) ? ` ${String(e?.message || norm.message)}` : ''),
          );
        } else if (rawMsg.includes('branch mismatch')) {
          // La caja seleccionada pertenece a otra sucursal y el SQL de pago la
          // rechazó. Guiar al operador en vez de mostrar un error genérico.
          toast.error(
            t(
              'sales.errors.cashRegisterBranchMismatch',
              'La caja seleccionada pertenece a otra sucursal. Seleccioná una caja de esta sucursal o cobrá sin caja.',
            ) + ' (BRANCH_MISMATCH)',
          );
        } else if (rawMsg.includes('cash register is not open')) {
          toast.error(
            t(
              'sales.errors.cashRegisterNotOpen',
              'La caja seleccionada no está abierta. Abrí una caja de esta sucursal o cobrá sin caja.',
            ) + ' (CASH_REGISTER_NOT_OPEN)',
          );
        } else if (norm.code === 'CONFLICT') {
          toast.error(
            t(
              'sales.errors.paymentConflict',
              'El cobro fue rechazado por el backend. Revisá el monto y la caja e intentá de nuevo.',
            ) + ' (CONFLICT)',
          );
        } else {
          toast.error(
            t('sales.collectionDecision.atomicError', 'No se pudo completar la venta y el cobro. La operación se canceló.') +
              (norm.code && norm.code !== 'UNKNOWN' ? ` (${norm.code})` : ''),
          );
        }
        throw e;
      } finally {
        setIsProcessingSale(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentSaleId, items, activeSale, pendingSaleData, paymentMethodId, currencyId, currencies, t, buildNewSaleData],
  );

  // onLeavePendingWizard: persiste la venta sin cobrar (venta a crédito/asíncrono).
  const onLeavePendingWizard = useCallback(async () => {
    setIsProcessingSale(true);
    let checkoutSaleId = '';
    try {
      if (currentSaleId) {
        // Modo merge + "Dejar pendiente": persiste los ítems nuevos del carrito
        // en la venta existente (sin cobrar). Antes no se agregaba nada y los
        // ítems nuevos se perdían al salir del flujo.
        checkoutSaleId = currentSaleId;
        const payload = buildAddProductsPayload(items);
        if (payload) {
          // FASE 5B: cierre atómico del pedido de mostrador en la tx del merge.
          const claimedOrderId = counterOrderFlow.getClaimedOrderId();
          if (claimedOrderId) payload.counter_order_id = claimedOrderId;
          const response = await saleService.addProductsToSale(currentSaleId, payload, activeSale?.branch_id);
          if (!response?.success) {
            throw new Error(response?.error || 'No se pudo actualizar la venta');
          }
          toast.success(
            `Venta #${currentSaleId} actualizada (${response?.data?.items_added ?? payload.product_details.length} ítem${payload.product_details.length > 1 ? 's' : ''}).`,
          );
        }
        toast.info(`Venta #${currentSaleId} queda pendiente`);
      } else if (pendingSaleData || items.length > 0) {
        // Audit C3: mismo criterio que onConfirmWizard — el wizard de precarga
        // desde /pedidos no arma pendingSaleData; "Dejar pendiente" igual debe
        // persistir la venta nueva (si no, liberaba el claim y perdía el flujo).
        const salePayload = buildNewSaleData() ?? pendingSaleData;
        if (!salePayload) {
          // buildNewSaleData ya informó el problema (regla de reservas).
          return;
        }
        const response = await createSale(salePayload);
        if (!response?.sale_id) {
          throw new Error(response?.error || response?.message || 'No se pudo registrar la venta');
        }
        checkoutSaleId = String(response.sale_id);
        toast.success('Venta guardada como pendiente');
      }
      // PLAN_PEDIDOS_MOSTRADOR: los ítems del pedido quedaron persistidos en
      // la venta (merge o venta nueva pendiente) — marcarlo CONVERTED.
      if (counterOrderFlow.hasClaimedOrder()) {
        await counterOrderFlow.convertAfterCheckout(checkoutSaleId);
      }
      resetSaleState();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo registrar la venta como pendiente');
    } finally {
      setIsProcessingSale(false);
    }
  }, [currentSaleId, items, pendingSaleData, createSale, buildNewSaleData, buildAddProductsPayload, activeSale]);

  // ─── Walk-in: registrar uso de cancha desde el wizard ──────────────────────
  // Flujo: cliente usó la cancha sin reserva previa y quiere pagar. Crea la
  // reserva (CREATE), la confirma (CONFIRM) y suma el ítem al carrito con el
  // total autoritativo del backend (tarifa vigente × horas). Si el cobro
  // luego falla o se deja pendiente, la reserva queda CONFIRMED y aparece
  // como cobrable en el próximo checkout (refleja que la cancha se usó).
  const handleRegisterWalkIn = useCallback(async (spec: WalkInSpec): Promise<boolean> => {
    if (!selectedClient?.id) {
      toast.error(t('sales.checkoutWizard.walkIn.needsClient', 'Seleccioná un cliente antes de registrar el uso de la cancha'));
      return false;
    }
    // Regla de negocio: máximo una reserva por venta (process_sale_with_reserve).
    if (items.some(i => i.reserve_id)) {
      toast.error(t('sales.checkoutWizard.walkIn.oneReservationPerSale', 'Solo se permite una reserva por venta. Remové el ítem de reserva del carrito para registrar otra.'));
      return false;
    }

    const branchIdStr = localStorage.getItem('activeBranch');
    const branchId = branchIdStr ? parseInt(branchIdStr, 10) : undefined;

    try {
      // 1. CREATE — el backend calcula el total con la tarifa vigente.
      const createRes = await reservationService.manageReserve({
        action: 'CREATE',
        product_id: spec.productId,
        client_id: selectedClient.id,
        start_time: spec.startTime,
        duration: spec.duration,
        ...(branchId ? { branch_id: branchId } : {}),
      } as any);
      const created = createRes?.data || createRes || {};
      if (created.success === false || !created.reserve_id) {
        throw new Error(created.error || t('sales.checkoutWizard.walkIn.createFailed', 'No se pudo registrar el uso de la cancha'));
      }
      const reserveId = Number(created.reserve_id);
      const totalAmount = Number(created.total_amount) || 0;

      // 2. CONFIRM — la venta con reserva exige estado CONFIRMED (también
      // cubre el path "Dejar pendiente": createSale sin cobro).
      const confirmRes = await reservationService.manageReserve({
        action: 'CONFIRM',
        reserve_id: reserveId,
        product_id: spec.productId,
        ...(branchId ? { branch_id: branchId } : {}),
      } as any);
      const confirmed = confirmRes?.data || confirmRes || {};
      if (confirmed.success === false) {
        throw new Error(confirmed.error || t('sales.checkoutWizard.walkIn.confirmFailed', 'La reserva se creó pero no se pudo confirmar'));
      }

      // 3. Ítem al carrito (misma convención que las reservas confirmadas:
      // quantity 1 × total de la reserva, unit "hour").
      const item: CartItem = {
        id: `RES-${reserveId}-${Date.now()}`,
        productId: spec.productId,
        name: `${spec.productName} — ${spec.duration}h`,
        quantity: 1,
        price: totalAmount,
        originalPrice: totalAmount,
        discount: 0,
        discountType: 'amount',
        discountInput: 0,
        discountReason: '',
        taxRate: 0,
        unit: 'hour',
        reserve_id: reserveId,
      };
      setItems(prev => [...prev, item]);
      toast.success(
        t('sales.checkoutWizard.walkIn.registered', 'Uso de cancha registrado (reserva #{id})', { id: reserveId }),
      );
      return true;
    } catch (e: any) {
      toast.error(e?.message || t('sales.checkoutWizard.walkIn.createFailed', 'No se pudo registrar el uso de la cancha'));
      return false;
    }
  }, [selectedClient, items, setItems, toast, t]);

  // Productos ya presentes en el carrito VÍA RESERVA: el walk-in los bloquea
  // (una reserva por producto). Los ítems de ventas pendientes continuadas
  // (sin reserve_id) NO bloquean el registro walk-in.
  const blockedProductIds = useMemo(
    () => new Set(items.filter((i) => i.reserve_id).map((i) => String(i.productId))),
    [items],
  );

  // Resetea el estado del carrito tras concretar o dejar pendiente.
  const resetSaleState = () => {
    setShowCheckoutWizard(false);
    setPendingSaleData(null);
    setItems([]);
    setSelectedClient(null);
    setCurrentSaleId(null);
    setActiveSales([]);
    setActiveSale(null);
    setPendingReservations([]);
    setSelectedResIds(new Set());
    fetchDashboardData();
  };

  // Cantidad de un producto ya agregada al carrito (stock virtual del dropdown).
  const getQuantityInCart = useCallback(
    // Stock virtual por unidad: variante y producto base cuentan aparte
    // (un carrito con "Camisa · Rojo" no consume el stock de la fila base).
    (productId: string, variantId?: string | null) =>
      items
        .filter((item) => item.productId === productId && (item.variantId ?? null) === (variantId ?? null))
        .reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  // Precio Final de Venta: ajusta proporcionalmente el precio de todos los
  // ítems para que la suma dé el monto tipeado (razón "Ajuste global de venta").
  const handleFinalPriceChange = (targetTotal: number) => {
    if (targetTotal === total || items.length === 0) return;
    const currentTotal = total;
    if (currentTotal === 0) return;
    const ratio = targetTotal / currentTotal;
    setItems((prev) =>
      prev.map((item) => {
        const newPrice = Number((item.price * ratio).toFixed(2));
        const newDiscount = Number(((item.originalPrice - newPrice) * item.quantity).toFixed(2));
        return {
          ...item,
          price: newPrice,
          discount: newDiscount,
          discountType: 'amount',
          discountInput: Number((item.originalPrice - newPrice).toFixed(2)),
          discountReason: 'Ajuste global de venta',
        };
      }),
    );
  };

  const modalDisplay = selectedModalProduct ? getProductDisplay(selectedModalProduct) : null;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-primary pl-4 py-1">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary rounded-md flex items-center justify-center text-on-primary shadow-whisper">
            <ShoppingCart size={20} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-headline-lg text-foreground leading-none mb-0.5">
              {t('sales.title', 'Punto de Venta')}
            </h1>
            <p className="text-body-md text-on-surface-deep hidden sm:block">
              {t('sales.subtitle', 'Facturación y registro de operaciones')}
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-2" aria-label={t('sales.navAria', 'Secciones de ventas')}>
          {[
            // FASE 4 (PLAN_PEDIDOS_MOSTRADOR v3): sin sales:write no hay
            // "Nueva Venta" — el vendor entra directo al Historial.
            ...(canWrite
              ? [{ id: 'new-sale' as const, label: t('sales.tab.new', 'Nueva Venta'), icon: Plus, badge: undefined as number | undefined }]
              : []),
            { id: 'history' as const, label: t('sales.tab.history', 'Historial'), icon: History, badge: undefined as number | undefined },
            ...(canCancelSale
              ? [{
                  id: 'cancellations' as const,
                  label: t('sales.tab.cancellations', 'Anulaciones'),
                  icon: ClipboardX,
                  badge: cancellationRequests.pendingCount,
                }]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={cn(
                'flex items-center justify-center gap-1.5 px-4 h-10 rounded-button text-body-sm-bold uppercase transition-colors duration-150',
                activeTab === tab.id
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-on-surface-deep border border-border-subtle hover:text-foreground',
              )}
            >
              <tab.icon size={16} aria-hidden="true" />
              <span>{tab.label}</span>
              {tab.badge != null && tab.badge > 0 && (
                <span
                  className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-error text-on-error text-body-sm-bold font-data-mono"
                  data-testid="cancellations-tab-badge"
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="w-full">
        {activeTab === 'new-sale' && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
            {/* Productos Seleccionados (carrito) */}
            <Card className="bg-surface rounded-md shadow-whisper border-0 p-lg min-w-0">
              <CardHeader className="p-0 pb-md">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-title-md text-foreground flex items-center gap-2">
                    <ShoppingCart size={18} className="text-primary" aria-hidden="true" />
                    {t('sales.cart.title', 'Productos Seleccionados')}
                  </CardTitle>
                  <p className="hidden sm:flex items-center gap-2 text-body-sm font-data-mono text-outline-fg">
                    <span>[F2] {t('sales.hints.search', 'Buscar')}</span>
                    <span aria-hidden="true">·</span>
                    <span>[F12] {t('sales.hints.checkout', 'Cobrar')}</span>
                    <span aria-hidden="true">·</span>
                    <span>[F4] {t('sales.hints.clear', 'Limpiar')}</span>
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <ProductSearchPanel
                  searchTerm={productSearchTerm}
                  onSearchTermChange={(v) => {
                    setProductSearchTerm(v);
                    setSelectedProductQuantity(1);
                  }}
                  searchInputRef={productSearchInputRef}
                  qtyInputRef={dropdownQuantityInputRef}
                  results={productSearchResults}
                  open={showProductDropdown}
                  highlightedIndex={productHighlightedIndex}
                  onHighlight={setProductHighlightedIndex}
                  selectedQty={selectedProductQuantity}
                  onSelectedQtyChange={setSelectedProductQuantity}
                  onProductClick={(product, qty) => {
                    const unit = product as ProductDisplay;
                    addProductToCart(unit, qty, unit.variantId ?? null, unit.variantName);
                    setProductSearchTerm('');
                    setShowProductDropdown(false);
                    setProductHighlightedIndex(-1);
                    setSelectedProductQuantity(1);
                    productSearchInputRef.current?.focus();
                  }}
                  onClose={() => {
                    setShowProductDropdown(false);
                    setProductHighlightedIndex(-1);
                  }}
                  getQuantityInCart={getQuantityInCart}
                />

                <SalesCartGrid
                  items={filteredItems}
                  onEditItem={handleOpenEditModal}
                  onRemoveItem={(id) => {
                    setItems((prev) => prev.filter((i) => i.id !== id));
                    if (activeCartItemId === id) setActiveCartItemId(null);
                  }}
                  getItemBaseUnitPrice={getItemBaseUnitPrice}
                  getItemLineDiscount={getItemLineDiscount}
                  getItemLineTotal={getItemLineTotal}
                  activeItemId={activeCartItemId}
                  onActiveItemChange={setActiveCartItemId}
                />
              </CardContent>
            </Card>

            <CheckoutSummaryPanel
              itemsCount={items.length}
              subtotal={subtotal}
              taxBuckets={saleTotals.tax_buckets}
              exento={exento}
              lineDiscounts={lineDiscounts}
              generalDiscount={generalDiscount}
              total={total}
              pendingTotal={pendingItems.length > 0 ? pendingTotals.total : null}
              newTotal={newTotals.total}
              branchMismatchWarning={!!(currentSaleId && activeSale?.branch_id && activeSale.branch_id !== currentBranchId)}
              finalPriceValue={total}
              onFinalPriceChange={handleFinalPriceChange}
              canEditFinalPrice={pendingItems.length === 0}
              onCheckout={handleSaveSale}
              onClearCart={handleClearCart}
              isProcessingSale={isProcessingSale}
              canWrite={canWrite}
              mergeSaleId={currentSaleId}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <SalesHistoryView
            rows={filteredHistory}
            totalCount={sales.length}
            loading={saleLoading}
            error={historyError}
            onRetry={handleHistoryFilter}
            historySearch={historySearch}
            onHistorySearchChange={setHistorySearch}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            onFilter={handleHistoryFilter}
            onLoadLatest={handleLoadLatest}
            onClear={handleHistoryClear}
            onViewSale={(sale) => handleViewSale(sale as unknown as Record<string, unknown>)}
            onCancelSale={(sale) => handleCancelSale(sale as unknown as Record<string, unknown>)}
            canCancelSale={canCancelSale}
            canRequestCancellation={canRequestCancellation}
            onRequestCancellation={(sale) => handleRequestCancellation(sale as unknown as Record<string, unknown>)}
          />
        )}

        {activeTab === 'cancellations' && canCancelSale && (
          <CancellationRequestsPanel
            requests={cancellationRequests.requests}
            total={cancellationRequests.total}
            loading={cancellationRequests.loading}
            error={cancellationRequests.error}
            statusFilter={cancellationRequests.statusFilter}
            onStatusFilterChange={cancellationRequests.setStatusFilter}
            onRetry={cancellationRequests.refresh}
            onApprove={(request) => cancellationRequests.approve(request)}
            onReject={(request, reason) => cancellationRequests.reject(request, reason)}
            actingId={cancellationRequests.actingId}
          />
        )}
      </main>

      {selectedModalProduct && modalDisplay && (
        <EditItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editing={!!editingItemId}
          productName={modalDisplay.name}
          baseUnitPrice={modalDisplay.price}
          baseUnit={modalDisplay.base_unit}
          quantity={modalQuantity}
          onQuantityChange={setModalQuantity}
          unit={modalUnit}
          onUnitChange={setModalUnit}
          price={modalPrice}
          onPriceChange={(v) => {
            setModalPrice(v);
            const diff = modalDisplay.price - v;
            if (modalDiscountType === 'percent') {
              setModalDiscount(Number(((diff / modalDisplay.price) * 100).toFixed(2)));
            } else {
              setModalDiscount(diff);
            }
          }}
          discount={modalDiscount}
          onDiscountChange={setModalDiscount}
          discountType={modalDiscountType}
          onDiscountTypeChange={setModalDiscountType}
          discountReason={modalDiscountReason}
          onDiscountReasonChange={setModalDiscountReason}
          customReason={modalCustomReasonText}
          onCustomReasonChange={setModalCustomReasonText}
          canApplyDiscount={canApplyDiscount}
          onConfirm={handleConfirmAdd}
          focusQuantityOnOpen
        />
      )}

      <CancelSaleModal
        isOpen={showCancelSaleModal && !!selectedHistorySale}
        onClose={() => setShowCancelSaleModal(false)}
        saleId={String(
          (selectedHistorySale as Record<string, unknown> | null)?.sale_id ||
            (selectedHistorySale as Record<string, unknown> | null)?.id ||
            '',
        )}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        preview={cancelPreview}
        onConfirm={handleConfirmCancelSale}
        submitting={cancelSubmitting}
        canCancel={canCancelSale}
      />

      <RequestCancellationModal
        isOpen={!!requestCancellationSale}
        onClose={() => setRequestCancellationSale(null)}
        saleId={String(requestCancellationSale?.sale_id || requestCancellationSale?.id || '')}
        reason={requestCancellationReason}
        onReasonChange={setRequestCancellationReason}
        onConfirm={handleConfirmRequestCancellation}
        submitting={requestCancellationSubmitting}
      />

      <SaleCheckoutWizard
        isOpen={showCheckoutWizard}
        onClose={() => {
          // Salir sin procesar: liberar el claim del pedido (vuelve OPEN en
          // la bandeja; el sweep de 20 min cubre si falla) y quitar sus
          // ítems del carrito.
          if (counterOrderFlow.hasClaimedOrder()) {
            setItems((prev) => prev.filter((item) => !item.isFromCounterOrder));
            void counterOrderFlow.releaseClaimed();
          }
          setShowCheckoutWizard(false);
        }}
        items={items}
        getItemLineTotal={getItemLineTotal}
        client={selectedClient}
        onClientSelect={handleSelectClient}
        onClearClient={handleClearClient}
        activeSales={activeSales}
        onContinueSale={handleContinueSaleByIndex}
        counterOrders={clientCounterOrders}
        onContinueOrder={handleContinueOrder}
        onNewSale={() => {
          setCurrentSaleId(null);
          setActiveSale(null);
          // "Nueva venta" no arrastra los ítems de la pendiente continuada
          // (isFromPendingSale) ni las reservas marcadas: la venta arranca
          // limpia y el monto del cobro vuelve a ser coherente. Tampoco
          // arrastra ítems del pedido elegido: se libera su claim.
          setItems((prev) => prev.filter((item) => !item.isFromPendingSale && !item.isFromCounterOrder));
          setSelectedResIds(new Set());
          if (counterOrderFlow.hasClaimedOrder()) void counterOrderFlow.releaseClaimed();
        }}
        pendingReservations={pendingReservations}
        selectedResIds={selectedResIds}
        onToggleReservation={(resId) => {
          const isSelected = selectedResIds.has(resId);
          // Regla de negocio: UNA reserva por venta (el backend recibe un
          // único p_reserve_id). Comportamiento tipo radio: marcar otra
          // cuando ya hay una marcada se rechaza con guía.
          if (!isSelected && selectedResIds.size > 0) {
            toast.warning(
              t('sales.checkoutWizard.reservations.oneReservationPerSale', 'Solo se permite una reserva por venta'),
            );
            return;
          }
          const newSelection = new Set(selectedResIds);
          if (isSelected) newSelection.delete(resId);
          else newSelection.add(resId);
          setSelectedResIds(newSelection);
        }}
        onAddReservations={handleAddReservations}
        formatDateTime={formatDateTime}
        blockedProductIds={blockedProductIds}
        onRegisterWalkIn={handleRegisterWalkIn}
        paymentMethods={paymentMethods}
        paymentMethodId={paymentMethodId}
        setPaymentMethodId={setPaymentMethodId}
        currencies={currencies}
        currencyId={currencyId}
        setCurrencyId={setCurrencyId}
        onConfirm={onConfirmWizard}
        onLeavePending={onLeavePendingWizard}
        isProcessingSale={isProcessingSale}
      />

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
