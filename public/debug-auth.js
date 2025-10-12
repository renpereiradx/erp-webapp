/**
 * Script de debugging para problemas de autenticación
 *
 * Cómo usar:
 * 1. Abre la consola del navegador (F12)
 * 2. Copia y pega este script completo
 * 3. Ejecuta: debugAuth()
 * 4. Copia el output y compártelo
 */

window.debugAuth = function() {
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');

  const debugInfo = {
    timestamp: new Date().toISOString(),
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenPreview: token ? token.substring(0, 80) + '...' : 'NO TOKEN',
    tokenFormat: token ? (token.startsWith('Bearer ') ? 'Con prefijo Bearer' : 'Sin prefijo Bearer') : 'N/A',
    hasUserData: !!userData,
    userData: userData ? JSON.parse(userData) : null,
    apiBaseUrl: 'http://localhost:5050',
    currentUrl: window.location.href
  };

  console.log('🔍 DEBUGGING DE AUTENTICACIÓN');
  console.log('═══════════════════════════════════════');
  console.table(debugInfo);
  console.log('═══════════════════════════════════════');

  // Intentar decodificar JWT (solo si no tiene Bearer prefix)
  if (token && !token.startsWith('Bearer ')) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('📦 JWT Payload:', payload);

        // Verificar expiración
        if (payload.exp) {
          const expirationDate = new Date(payload.exp * 1000);
          const now = new Date();
          const isExpired = now > expirationDate;

          console.log('⏰ Token Expiration:', {
            expiresAt: expirationDate.toISOString(),
            now: now.toISOString(),
            isExpired: isExpired,
            timeRemaining: isExpired ? 'EXPIRADO' : `${Math.round((expirationDate - now) / 1000 / 60)} minutos`
          });
        }
      }
    } catch (e) {
      console.error('❌ No se pudo decodificar el token JWT:', e);
    }
  }

  // Test de conexión al backend
  console.log('\n🌐 Testing backend connection...');
  fetch('http://localhost:5050/', { method: 'GET' })
    .then(res => {
      console.log('✅ Backend respondió:', res.status, res.statusText);
      return res.text();
    })
    .then(text => console.log('📄 Backend response:', text))
    .catch(err => console.error('❌ Backend no responde:', err));

  // Test de autenticación
  if (token) {
    console.log('\n🔐 Testing authentication...');
    fetch('http://localhost:5050/sale/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        client_id: 'test',
        product_details: [{ product_id: 'test', quantity: 1 }],
        payment_method_id: 1,
        currency_id: 1
      })
    })
      .then(res => {
        console.log('📊 Auth test response:', res.status, res.statusText);
        return res.text();
      })
      .then(text => {
        console.log('📄 Auth test body:', text);
        if (text.includes('401')) {
          console.error('❌ Token rechazado por el backend');
        }
      })
      .catch(err => console.error('❌ Error en test de auth:', err));
  }

  return debugInfo;
};

console.log('✅ Script de debugging cargado. Ejecuta: debugAuth()');
