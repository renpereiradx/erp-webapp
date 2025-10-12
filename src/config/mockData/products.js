/**
 * Mock data for Products - Modular and configurable
 * Separated from main demoData.js for better organization
 */

// Product data factory - no hardcoded values
export const createProductData = (options = {}) => {
  const {
    type = 'physical',
    count = 6,
    categories = ['electronics', 'food', 'sports', 'medical', 'business'],
    priceRange = { min: 100, max: 20000 },
    seed = 1
  } = options;

  const productTemplates = {
    physical: [
      {
        name: 'Laptop Dell Inspiron',
        category: 'electronics',
        description: 'Laptop profesional con alta performance',
        basePrice: 15000,
        tags: ['laptop', 'dell', 'business']
      },
      {
        name: 'Mouse Inalámbrico',
        category: 'electronics', 
        description: 'Mouse ergonómico inalámbrico',
        basePrice: 500,
        tags: ['mouse', 'wireless', 'accessories']
      },
      {
        name: 'Café Premium Orgánico',
        category: 'food',
        description: 'Café de especialidad tostado artesanal',
        basePrice: 400,
        tags: ['coffee', 'organic', 'premium']
      }
    ],
    service: [
      {
        name: 'Cancha de Tenis',
        category: 'sports',
        description: 'Cancha profesional con iluminación',
        basePrice: 200,
        tags: ['tennis', 'sports', 'rental']
      },
      {
        name: 'Consulta Médica',
        category: 'medical',
        description: 'Consulta con médico general',
        basePrice: 800,
        tags: ['medical', 'consultation', 'health']
      },
      {
        name: 'Sala de Conferencias',
        category: 'business',
        description: 'Sala equipada para reuniones',
        basePrice: 500,
        tags: ['meeting', 'business', 'conference']
      }
    ]
  };

  const templates = productTemplates[type] || productTemplates.physical;
  const products = [];

  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    const variation = Math.floor(i / templates.length) + 1;
    const id = `${type === 'service' ? 'SERV' : 'PROD'}_${String(seed + i).padStart(3, '0')}`;
    
    products.push({
      id,
      name: variation > 1 ? `${template.name} ${variation}` : template.name,
      description: template.description,
      price: template.basePrice + (variation - 1) * 100,
      cost: template.basePrice * 0.7,
      category: template.category,
      subcategory: `${template.category}_sub`,
      type,
      reservable: type === 'service',
      stock: type === 'service' ? Math.floor(Math.random() * 10) + 1 : Math.floor(Math.random() * 100) + 10,
      min_stock: type === 'service' ? 1 : 5,
      max_stock: type === 'service' ? 10 : 200,
      barcode: type === 'physical' ? `750${String(seed + i).padStart(10, '0')}` : null,
      sku: `${template.name.replace(/\s+/g, '-').toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
      tags: template.tags,
      supplier_id: type === 'physical' ? 102 : null,
      tax_rate: template.category === 'medical' ? 0.00 : 0.16,
      status: 'active',
      metadata: generateMetadata(template.category, type),
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  return products;
};

// Generate metadata based on category and type
const generateMetadata = (category, type) => {
  const metadataTemplates = {
    electronics: {
      brand: 'GenericBrand',
      warranty_months: 12,
      weight: '1.5kg'
    },
    food: {
      origin: 'México',
      organic_certified: true,
      weight: '1kg'
    },
    sports: {
      capacity: 4,
      equipment_included: true,
      surface_type: 'professional'
    },
    medical: {
      duration_minutes: 30,
      specialty: 'general',
      requires_appointment: true
    },
    business: {
      capacity: 12,
      equipment: ['projector', 'wifi'],
      location: 'Edificio Principal'
    }
  };

  return metadataTemplates[category] || {};
};

// Configuration
export const PRODUCTS_CONFIG = {
  enabled: true,
  useRealAPI: false,
  simulateDelay: true,
  delayMs: 500,
  pageSize: 20,
  categories: ['electronics', 'food', 'sports', 'medical', 'business'],
  types: ['physical', 'service', 'digital']
};

// Export default product data
export const DEMO_PRODUCT_DATA = [
  ...createProductData({ type: 'physical', count: 3 }),
  ...createProductData({ type: 'service', count: 3, seed: 100 })
];
