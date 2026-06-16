const email = 'admin@demo.com';
const password = 'admin';

async function run() {
  // 1. Login
  const loginRes = await fetch('http://localhost:5050/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const loginData = await loginRes.json();
  const token = loginData.access_token;
  console.log('Token:', token ? token.substring(0, 10) + '...' : 'Failed');

  // 2. Fetch brands
  const brandsRes = await fetch('http://localhost:5050/api/v1/brands', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('GET /api/v1/brands status:', brandsRes.status);
  console.log('GET /api/v1/brands response:', await brandsRes.text());

  const brandsRes2 = await fetch('http://localhost:5050/products/brands', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('GET /products/brands status:', brandsRes2.status);
  console.log('GET /products/brands response:', await brandsRes2.text());

  // 3. Create brand
  const createRes = await fetch('http://localhost:5050/api/v1/brands', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'TestBrandNode' })
  });
  console.log('POST /api/v1/brands status:', createRes.status);
  console.log('POST /api/v1/brands response:', await createRes.text());

  const createRes2 = await fetch('http://localhost:5050/products/brands', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'TestBrandNode' })
  });
  console.log('POST /products/brands status:', createRes2.status);
  console.log('POST /products/brands response:', await createRes2.text());
}

run();
