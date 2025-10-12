# 🐧 Guía Docker con PostgreSQL en WSL

## 📋 Configuración Actual

- **Backend:** `C:\dev\erp-project\backend`
- **Frontend:** `C:\dev\erp-project\frontend`
- **PostgreSQL:** Ejecutándose en WSL (Linux)
- **IP WSL Actual:** `172.25.57.141` (puede cambiar después de reiniciar)

---

## ⚠️ Importante: IP de WSL

La IP de WSL **puede cambiar** cada vez que reinicias Windows. Por eso hemos creado un script que la actualiza automáticamente.

### Verificar IP Actual de WSL

```powershell
wsl hostname -I
```

### Actualizar Configuración Automáticamente

```powershell
.\scripts\update-wsl-ip.ps1
```

El script de despliegue (`deploy-full-stack.ps1`) hace esto automáticamente.

---

## 🔧 Verificar PostgreSQL en WSL

### 1. Verificar que PostgreSQL esté corriendo

```powershell
# Desde PowerShell
wsl sudo service postgresql status

# Si no está corriendo, iniciarlo
wsl sudo service postgresql start
```

### 2. Verificar que esté escuchando en todas las interfaces

Editar `postgresql.conf` en WSL:

```bash
# Desde WSL
sudo nano /etc/postgresql/15/main/postgresql.conf

# Buscar y modificar:
listen_addresses = '*'          # Escuchar en todas las interfaces
port = 5432                     # Puerto por defecto
```

### 3. Permitir conexiones desde Docker

Editar `pg_hba.conf` en WSL:

```bash
# Desde WSL
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Agregar al final:
# Permitir conexiones desde Docker
host    all             all             172.0.0.0/8             md5
host    all             all             192.168.0.0/16          md5
```

### 4. Reiniciar PostgreSQL

```bash
# Desde WSL
sudo service postgresql restart
```

---

## 🚀 Despliegue con PostgreSQL en WSL

### Paso 1: Asegurarse de que PostgreSQL esté corriendo

```powershell
wsl sudo service postgresql start
wsl sudo service postgresql status
```

### Paso 2: Verificar conectividad desde Windows

```powershell
# Obtener IP de WSL
$wslIP = wsl hostname -I
Write-Host "IP de WSL: $wslIP"

# Probar conexión (si tienes psql en Windows)
psql -h $wslIP.Trim() -U dev_user -d erp_db

# O desde WSL
wsl psql -h localhost -U dev_user -d erp_db
```

### Paso 3: Ejecutar Despliegue Automatizado

```powershell
cd C:\dev\erp-project\frontend
.\scripts\deploy-full-stack.ps1
```

El script automáticamente:
- ✅ Detecta la IP de WSL
- ✅ Actualiza `docker-compose.yml`
- ✅ Construye las imágenes
- ✅ Despliega los servicios

---

## 🏗️ Arquitectura con WSL

```
┌─────────────────────────────────────┐
│  Windows Host                        │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Docker Desktop (Windows)        │ │
│  │                                 │ │
│  │  ┌──────────────────────────┐  │ │
│  │  │ erp-frontend             │  │ │
│  │  │ (Container)              │  │ │
│  │  │ Nginx :8080              │  │ │
│  │  └──────────┬───────────────┘  │ │
│  │             │                   │ │
│  │  ┌──────────▼───────────────┐  │ │
│  │  │ erp-backend              │  │ │
│  │  │ (Container)              │  │ │
│  │  │ API :5050                │  │ │
│  │  └──────────┬───────────────┘  │ │
│  └─────────────┼──────────────────┘ │
│                │                     │
│                │ TCP Connection      │
│                │ 172.25.57.141:5432  │
│                │                     │
│  ┌─────────────▼──────────────────┐ │
│  │ WSL 2 (Linux Subsystem)        │ │
│  │ IP: 172.25.57.141              │ │
│  │                                │ │
│  │  ┌──────────────────────────┐ │ │
│  │  │ PostgreSQL 15            │ │ │
│  │  │ Port: 5432               │ │ │
│  │  │ Database: erp_db         │ │ │
│  │  │ User: dev_user           │ │ │
│  │  └──────────────────────────┘ │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🔍 Verificación de Conectividad

### Script de Prueba Completo

```powershell
# 1. Verificar IP de WSL
$wslIP = (wsl hostname -I).Trim()
Write-Host "IP de WSL: $wslIP" -ForegroundColor Cyan

# 2. Verificar PostgreSQL en WSL
Write-Host "`nVerificando PostgreSQL..." -ForegroundColor Yellow
wsl sudo service postgresql status

# 3. Probar conexión desde WSL
Write-Host "`nProbando conexión local en WSL..." -ForegroundColor Yellow
wsl psql -h localhost -U dev_user -d erp_db -c "SELECT version();"

# 4. Probar conexión desde Windows usando IP de WSL
Write-Host "`nProbando conexión desde Windows..." -ForegroundColor Yellow
wsl psql -h $wslIP -U dev_user -d erp_db -c "SELECT version();"
```

---

## 🐛 Solución de Problemas WSL

### Problema: IP de WSL cambió después de reiniciar

**Solución:**

```powershell
# Actualizar configuración
.\scripts\update-wsl-ip.ps1

# Reiniciar contenedores
docker-compose restart
```

### Problema: Backend no puede conectar a PostgreSQL

**Síntomas:** Error "connection refused" o "no route to host"

**Solución:**

```powershell
# 1. Verificar que PostgreSQL esté corriendo en WSL
wsl sudo service postgresql status
wsl sudo service postgresql start

# 2. Verificar configuración de PostgreSQL
wsl sudo nano /etc/postgresql/15/main/postgresql.conf
# Asegurar: listen_addresses = '*'

# 3. Verificar pg_hba.conf
wsl sudo nano /etc/postgresql/15/main/pg_hba.conf
# Debe tener: host all all 172.0.0.0/8 md5

# 4. Reiniciar PostgreSQL
wsl sudo service postgresql restart

# 5. Verificar firewall de WSL (generalmente no es necesario)
```

### Problema: PostgreSQL no escucha en la IP de WSL

**Solución:**

```bash
# En WSL, verificar en qué interfaces escucha PostgreSQL
sudo netstat -tlnp | grep 5432

# Debería mostrar:
# tcp   0.0.0.0:5432   (escuchando en todas las interfaces)
# tcp   :::5432        (IPv6)

# Si solo muestra 127.0.0.1:5432, editar postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf
# Cambiar:
# listen_addresses = 'localhost'  →  listen_addresses = '*'

# Reiniciar
sudo service postgresql restart
```

### Problema: WSL no inicia

**Solución:**

```powershell
# Reiniciar WSL
wsl --shutdown
wsl

# O reiniciar servicio LxssManager
Restart-Service LxssManager
```

---

## 📝 Checklist de Configuración WSL

### PostgreSQL en WSL

- [ ] PostgreSQL instalado en WSL
- [ ] PostgreSQL corriendo: `wsl sudo service postgresql status`
- [ ] Base de datos `erp_db` creada
- [ ] Usuario `dev_user` creado con contraseña `aDmin404942`
- [ ] `postgresql.conf`: `listen_addresses = '*'`
- [ ] `pg_hba.conf`: Permitir conexiones desde rango Docker (172.0.0.0/8)
- [ ] PostgreSQL reiniciado después de cambios

### Configuración Windows

- [ ] WSL 2 instalado y funcionando
- [ ] Docker Desktop con integración WSL habilitada
- [ ] IP de WSL conocida: `wsl hostname -I`
- [ ] Conexión verificada desde Windows a PostgreSQL en WSL

### Configuración Docker

- [ ] `docker-compose.yml` actualizado con IP de WSL
- [ ] Script `update-wsl-ip.ps1` probado
- [ ] Contenedores pueden alcanzar la IP de WSL

---

## 🚀 Comando de Inicio Rápido

```powershell
# Todo en uno
cd C:\dev\erp-project\frontend

# Iniciar PostgreSQL en WSL
wsl sudo service postgresql start

# Desplegar stack completo
.\scripts\deploy-full-stack.ps1

# Verificar estado
.\scripts\check-status.ps1
```

---

## 📊 Comandos Útiles WSL + Docker

```powershell
# Ver IP actual de WSL
wsl hostname -I

# Estado de PostgreSQL en WSL
wsl sudo service postgresql status

# Iniciar PostgreSQL en WSL
wsl sudo service postgresql start

# Logs de PostgreSQL en WSL
wsl sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Conectar a PostgreSQL desde WSL
wsl psql -U dev_user -d erp_db

# Actualizar IP en docker-compose.yml
.\scripts\update-wsl-ip.ps1

# Ver logs de backend (buscar errores de conexión)
docker-compose logs -f backend | Select-String "database\|connection\|error"
```

---

## 🔒 Configuración de Seguridad (Producción)

Para producción, considera:

1. **Firewall en WSL:**
   ```bash
   # Permitir solo rangos específicos
   sudo ufw allow from 172.17.0.0/16 to any port 5432
   ```

2. **Usuarios PostgreSQL:**
   - Crear usuarios específicos por servicio
   - Usar contraseñas seguras
   - Limitar privilegios

3. **SSL/TLS:**
   - Configurar PostgreSQL con certificados SSL
   - Actualizar connection string: `sslmode=require`

---

## 📚 Referencias

- [WSL Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [PostgreSQL on WSL](https://docs.microsoft.com/en-us/windows/wsl/tutorials/wsl-database)
- [Docker Desktop WSL Integration](https://docs.docker.com/desktop/wsl/)

---

## ✅ Verificación Final

Después del despliegue, verifica:

```powershell
# 1. PostgreSQL en WSL corriendo
wsl sudo service postgresql status

# 2. Contenedores saludables
docker-compose ps

# 3. Backend conecta a DB
docker-compose logs backend | Select-String "database\|connected"

# 4. Frontend accesible
start http://localhost:8080

# 5. Login funciona
# Email: admin / Password: aDmin404942
```

---

**🎉 ¡Listo! Tu sistema ERP con PostgreSQL en WSL está configurado.**

Para desplegar: `.\scripts\deploy-full-stack.ps1`
