// Tipos de dominio (migración progresiva)

export interface DomainProduct {
  id: string | number;
  code: string | null;
  name: string;
  categoryId: number | string | null;
  category?: any;
  isActive: boolean;
  stockQuantity: number | null;
  price: number | string | null;
  priceFormatted: string | null;
  hasUnitPricing: boolean;
  unitPrices: any[] | null;
  description: string | null;
  raw: any; // Referencia al objeto original por compatibilidad
}
