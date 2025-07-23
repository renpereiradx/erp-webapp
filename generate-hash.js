const crypto = require('crypto');

// Función simple para crear un hash básico (no seguro para producción)
function createSimpleHash(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

console.log('Hash SHA256 for "admin123":', createSimpleHash('admin123'));
console.log('Hash SHA256 for "123456":', createSimpleHash('123456'));
console.log('Hash SHA256 for "password":', createSimpleHash('password'));
