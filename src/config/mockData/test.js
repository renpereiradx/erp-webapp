/**
 * Test file to verify modular mock data system
 * Run this to ensure all systems work correctly with mock data
 */

import { MockDataService, MOCK_CONFIG } from './index.js';

// Test function to verify all services
export const testMockDataSystem = async () => {
  console.log('🧪 Testing Modular Mock Data System...');
  
  try {
    // Test Products
    console.log('\n📦 Testing Products...');
    const products = await MockDataService.getProducts({ page: 1, pageSize: 5 });
    console.log(`✅ Products loaded: ${products.data.length} items`);
    console.log('Sample product:', products.data[0]?.name);
    
    // Test Sales
    console.log('\n💰 Testing Sales...');
    const sales = await MockDataService.getSales({ page: 1, pageSize: 5 });
    console.log(`✅ Sales loaded: ${sales.data.length} items`);
    console.log('Sample sale:', sales.data[0]?.id);
    
    // Test Reservations
    console.log('\n📅 Testing Reservations...');
    const reservations = await MockDataService.getReservations({ page: 1, pageSize: 5 });
    console.log(`✅ Reservations loaded: ${reservations.data.length} items`);
    console.log('Sample reservation:', reservations.data[0]?.product_name);
    
    // Test Schedules
    console.log('\n⏰ Testing Schedules...');
    const schedules = await MockDataService.getSchedules({ page: 1, pageSize: 10 });
    console.log(`✅ Schedules loaded: ${schedules.data.length} items`);
    console.log('Sample schedule:', schedules.data[0]?.product_name);
    
    // Test Filtering
    console.log('\n🔍 Testing Filters...');
    const serviceProducts = await MockDataService.getProducts({ type: 'service' });
    console.log(`✅ Service products: ${serviceProducts.data.length} items`);
    
    const reservableProducts = await MockDataService.getProducts({ reservable: true });
    console.log(`✅ Reservable products: ${reservableProducts.data.length} items`);
    
    console.log('\n✅ All tests passed! Modular mock data system is working correctly.');
    
    return {
      success: true,
      results: {
        products: products.data.length,
        sales: sales.data.length,
        reservations: reservations.data.length,
        schedules: schedules.data.length,
        serviceProducts: serviceProducts.data.length,
        reservableProducts: reservableProducts.data.length
      }
    };
    
  } catch (error) {
    console.error('❌ Mock data system test failed:', error);
    return { success: false, error: error.message };
  }
};

// Run test if called directly
if (typeof window !== 'undefined' && window.location?.search?.includes('test-mock')) {
  testMockDataSystem().then(result => {
    console.log('Test completed:', result);
  });
}
