/**
 * Servicio de caché para categorías
 * Evita múltiples requests innecesarios y proporciona fallback con datos estáticos
 */

// Categorías de fallback basadas en las observadas en la API real
const FALLBACK_CATEGORIES = [
  { id: 1, name: "Electrónicos", description: "Productos electrónicos y tecnológicos" },
  { id: 2, name: "Jewelry", description: "Joyería y accesorios" },
  { id: 3, name: "Alquiler de Canchas", description: "Canchas disponibles para reserva por horas" },
  { id: 5, name: "Deportes", description: "Artículos deportivos y fitness" },
  { id: 6, name: "Clothing", description: "Ropa y vestimenta" },
  { id: 7, name: "Garden", description: "Productos para jardín y hogar" },
  { id: 9, name: "Baby", description: "Productos para bebés y niños" },
  { id: 15, name: "Computers", description: "Computadoras y accesorios" },
  { id: 22, name: "Kids", description: "Productos para niños" },
  { id: 27, name: "Outdoors", description: "Productos para actividades al aire libre" },
  { id: 32, name: "Industrial", description: "Productos industriales" }
];

class CategoryCacheService {
  private cacheKey: string;
  private timestampKey: string;
  private cacheExpiry: number;

  constructor() {
    this.cacheKey = 'erp_categories_cache';
    this.timestampKey = 'erp_categories_timestamp';
    this.cacheExpiry = 1000 * 60 * 30; // 30 minutos
  }

  /**
   * Obtiene categorías del caché local
   */
  getCachedCategories() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      const timestamp = localStorage.getItem(this.timestampKey);
      
      if (!cached || !timestamp) {
        return null;
      }

      const age = Date.now() - parseInt(timestamp);
      if (age > this.cacheExpiry) {
        this.clearCache();
        return null;
      }

      const categories = JSON.parse(cached);
      return categories;
    } catch (error: any) {
      console.warn('Error al leer caché de categorías:', error);
      return null;
    }
  }

  /**
   * Guarda categorías en el caché local
   */
  setCachedCategories(categories) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(categories));
      localStorage.setItem(this.timestampKey, Date.now().toString());
      // Solo log en modo debug
      if (localStorage.getItem('debug-mode') === 'true') {
        console.log('📦 Categorías guardadas en caché:', categories.length);
      }
    } catch (error: any) {
      console.warn('Error al guardar caché de categorías:', error);
    }
  }

  /**
   * Limpia el caché de categorías
   */
  clearCache() {
    localStorage.removeItem(this.cacheKey);
    localStorage.removeItem(this.timestampKey);
  }

  /**
   * Obtiene categorías de fallback
   */
  getFallbackCategories() {
    // Solo log en modo debug
    if (localStorage.getItem('debug-mode') === 'true') {
      console.log('📦 Usando categorías de fallback');
    }
    return [...FALLBACK_CATEGORIES];
  }

  /**
   * Obtiene categorías con estrategia de caché + fallback
   * Optimizado para evitar llamadas API innecesarias
   */
  async getCategories(apiClient) {
    // 1. Verificar caché primero - si existe y es válido, devolver inmediatamente
    const cached = this.getCachedCategories();
    if (cached && cached.length > 0) {
      // Solo log en modo debug
      if (localStorage.getItem('debug-mode') === 'true') {
        console.log('📦 ✅ Categorías desde caché:', cached.length);
      }
      return cached;
    }

    // 2. Si no hay caché válido, verificar si tenemos token antes de intentar API
    const token = localStorage.getItem('authToken');
    if (!token) {
      // Sin token, ir directamente a fallback
      if (localStorage.getItem('debug-mode') === 'true') {
        console.log('📦 Sin token, usando fallback directo');
      }
      const fallback = this.getFallbackCategories();
      this.setCachedCategories(fallback);
      return fallback;
    }

    // 3. Solo si no hay caché Y hay token, intentar API
    try {
      if (localStorage.getItem('debug-mode') === 'true') {
        console.log('📦 Intentando API con token válido...');
      }
      const categories = await apiClient.getCategories();
      
      if (categories && categories.length > 0) {
        this.setCachedCategories(categories);
        if (localStorage.getItem('debug-mode') === 'true') {
          console.log('📦 ✅ Categorías desde API guardadas en caché:', categories.length);
        }
        return categories;
      }
    } catch (error: any) {
      // Silencioso - solo log en modo debug
      if (localStorage.getItem('debug-mode') === 'true') {
        console.warn('📦 API de categorías falló:', error.message);
      }
    }

    // 4. Fallback final
    const fallback = this.getFallbackCategories();
    this.setCachedCategories(fallback); // Cachear también el fallback
    return fallback;
  }

  /**
   * Fuerza actualización desde API
   */
  async forceRefreshFromAPI(apiClient) {
    this.clearCache();
    return await this.getCategories(apiClient);
  }

  /**
   * Obtiene información del estado del caché
   */
  getCacheInfo() {
    const cached = localStorage.getItem(this.cacheKey);
    const timestamp = localStorage.getItem(this.timestampKey);
    
    if (!cached || !timestamp) {
      return { hasCache: false, count: 0, age: 0 };
    }

    const categories = JSON.parse(cached);
    const age = Date.now() - parseInt(timestamp);
    
    return {
      hasCache: true,
      count: categories.length,
      age: age,
      ageMinutes: Math.floor(age / (1000 * 60)),
      isExpired: age > this.cacheExpiry
    };
  }
}

// Instancia singleton
export const categoryCacheService = new CategoryCacheService();
export default categoryCacheService;
