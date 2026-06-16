(globalThis as any).import = { meta: { env: { VITE_API_URL: 'http://localhost:5050' } } };
import BusinessManagementAPI from './src/services/BusinessManagementAPI';
import API_CONFIG from './src/config/api.config';
import { DEMO_USERS } from './src/config/demoAuth';

async function testBrands() {
  const api = new BusinessManagementAPI({
    baseUrl: 'http://localhost:5050',
    timeout: 10000,
    defaultHeaders: { 'Content-Type': 'application/json' }
  });

  try {
    console.log('Logging in as Admin...');
    const auth = await api.login(DEMO_USERS.admin.email, DEMO_USERS.admin.password);
    console.log('Login successful. Token:', auth.access_token.substring(0, 10) + '...');
    
    // Set token in localStorage mock
    global.localStorage = {
      getItem: (key) => {
        if (key === 'authToken') return auth.access_token;
        if (key === 'roleId') return DEMO_USERS.admin.role;
        return null;
      }
    } as any;

    console.log('Fetching brands...');
    const brands = await api.makeRequest('/api/v1/brands', { method: 'GET' });
    console.log('Brands GET response:', JSON.stringify(brands, null, 2));

    console.log('Creating a brand...');
    const newBrand = await api.makeRequest('/api/v1/brands', {
      method: 'POST',
      body: JSON.stringify({ name: 'TestBrand' })
    });
    console.log('Brand POST response:', JSON.stringify(newBrand, null, 2));

  } catch (error) {
    console.error('API Error:', error);
  }
}

testBrands();
