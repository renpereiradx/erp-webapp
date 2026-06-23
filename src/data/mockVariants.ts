export interface Variant {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  attributes: { name: string; value: string; color?: string; bgColor?: string; borderColor?: string }[];
  stock: number;
  price: number;
  isActive: boolean;
  lowStock?: boolean;
}

export const mockVariants: Variant[] = [
  {
    id: 'v1',
    sku: 'POLO-R-M',
    name: 'Camisa Polo - Rojo M',
    barcode: '7501234567890',
    attributes: [
      { name: 'Color', value: 'Rojo', bgColor: 'bg-secondary-container/50', color: 'text-on-secondary-container', borderColor: 'border-secondary-container' },
      { name: 'Talla', value: 'M', bgColor: 'bg-surface-container', color: 'text-on-surface-variant', borderColor: 'border-outline-variant/30' },
    ],
    stock: 45,
    price: 29.99,
    isActive: true,
  },
  {
    id: 'v2',
    sku: 'POLO-R-L',
    name: 'Camisa Polo - Rojo L',
    barcode: '7501234567891',
    attributes: [
      { name: 'Color', value: 'Rojo', bgColor: 'bg-secondary-container/50', color: 'text-on-secondary-container', borderColor: 'border-secondary-container' },
      { name: 'Talla', value: 'L', bgColor: 'bg-surface-container', color: 'text-on-surface-variant', borderColor: 'border-outline-variant/30' },
    ],
    stock: 5,
    price: 29.99,
    isActive: true,
    lowStock: true,
  },
  {
    id: 'v3',
    sku: 'POLO-A-M',
    name: 'Camisa Polo - Azul M',
    barcode: '7501234567892',
    attributes: [
      { name: 'Color', value: 'Azul', bgColor: 'bg-[#e0f2fe]', color: 'text-[#0369a1]', borderColor: 'border-[#bae6fd]' },
      { name: 'Talla', value: 'M', bgColor: 'bg-surface-container', color: 'text-on-surface-variant', borderColor: 'border-outline-variant/30' },
    ],
    stock: 60,
    price: 29.99,
    isActive: true,
  },
  {
    id: 'v4',
    sku: 'POLO-N-XL',
    name: 'Camisa Polo - Negro XL',
    barcode: '7501234567893',
    attributes: [
      { name: 'Color', value: 'Negro', bgColor: 'bg-surface-container-high', color: 'text-on-surface-variant', borderColor: 'border-outline-variant/30' },
      { name: 'Talla', value: 'XL', bgColor: 'bg-surface-container', color: 'text-on-surface-variant', borderColor: 'border-outline-variant/30' },
    ],
    stock: 0,
    price: 29.99,
    isActive: false,
  },
];
