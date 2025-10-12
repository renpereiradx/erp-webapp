# 🏗️ Arquitectura de Deployment - Diagrama Visual

## 📊 Vista General de la Arquitectura

```text
┌─────────────────────────────────────────────────────────────────────┐
│                          DEPLOYMENT ARCHITECTURE                     │
│                              ERP Web App                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                      DESARROLLO LOCAL                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌──────────┐                                                       │
│   │ Browser  │                                                       │
│   └────┬─────┘                                                       │
│        │ http://localhost:5173                                       │
│        ↓                                                              │
│   ┌──────────────────────┐                                          │
│   │   Vite Dev Server    │                                          │
│   │      (port 5173)     │                                          │
│   │  - Hot Module Reload │                                          │
│   │  - Source Maps       │                                          │
│   └──────────┬───────────┘                                          │
│              │                                                         │
│              │ API Calls                                              │
│              │ VITE_API_URL=http://localhost:5050                   │
│              ↓                                                         │
│   ┌─────────────────────┐      ┌──────────────────┐                │
│   │  Backend Go Server  │─────▶│   PostgreSQL     │                │
│   │    (port 5050)      │      │   (port 5432)    │                │
│   └─────────────────────┘      └──────────────────┘                │
│                                                                       │
│   Variables clave:                                                   │
│   • VITE_API_URL=http://localhost:5050                              │
│   • VITE_AUTO_LOGIN=true                                            │
│   • VITE_ENV=development                                            │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                    PRODUCCIÓN DOCKER                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌──────────┐                                                       │
│   │  Client  │                                                       │
│   │ (Browser)│                                                       │
│   └────┬─────┘                                                       │
│        │ http://app.com                                              │
│        ↓                                                              │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │              NGINX (Port 80)                                  │  │
│   │              Container: business_management_frontend          │  │
│   ├───────────────────────────┬─────────────────────────────────┤  │
│   │                            │                                  │  │
│   │  location /               │    location /api/                │  │
│   │  ├─ try_files             │    ├─ rewrite ^/api/(.*)$ /$1   │  │
│   │  └─ Serve static files    │    └─ proxy_pass backend:5050   │  │
│   │     from /usr/share/      │                                  │  │
│   │     nginx/html            │                                  │  │
│   │                            │                                  │  │
│   └────────┬──────────────────┴────────────┬─────────────────────┘  │
│            │                                │                         │
│            ↓                                ↓                         │
│   ┌──────────────────┐            ┌─────────────────────┐           │
│   │  Static Files    │            │   Backend Go Server │           │
│   │  (React SPA)     │            │   Container:        │           │
│   │  - index.html    │            │   business_mgmt_    │           │
│   │  - *.js          │            │   backend           │           │
│   │  - *.css         │            │   (port 5050)       │           │
│   │  - assets/       │            └──────────┬──────────┘           │
│   └──────────────────┘                       │                       │
│                                              ↓                        │
│                                    ┌─────────────────────┐           │
│                                    │   PostgreSQL        │           │
│                                    │   (host.docker.     │           │
│                                    │    internal:5432)   │           │
│                                    └─────────────────────┘           │
│                                                                       │
│   Variables clave:                                                   │
│   • VITE_API_URL=/api (proxy interno)                               │
│   • VITE_AUTO_LOGIN=false                                           │
│   • VITE_ENV=production                                             │
│                                                                       │
│   Red Docker: erp-network (bridge)                                  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Requests

### Request 1: Archivos Estáticos (HTML, JS, CSS)

```text
┌─────────┐     GET /              ┌──────────┐     read file    ┌──────────┐
│ Cliente │ ─────────────────────▶ │  Nginx   │ ───────────────▶ │  /usr/   │
│         │                         │  :80     │                  │  share/  │
│         │ ◀───────────────────── │          │ ◀─────────────── │  nginx/  │
└─────────┘    200 OK (index.html)  └──────────┘    index.html    │  html/   │
                                                                   └──────────┘

Proceso:
1. Cliente solicita http://app.com/
2. Nginx busca archivo en /usr/share/nginx/html/
3. Encuentra index.html
4. Lo sirve al cliente con status 200
```

### Request 2: API Request (via Proxy)

```text
┌─────────┐   POST /api/login     ┌──────────┐   rewrite to     ┌──────────┐
│ Cliente │ ─────────────────────▶│  Nginx   │   POST /login    │ Backend  │
│         │                        │  :80     │ ───────────────▶ │  :5050   │
│         │                        │          │                  │          │
│         │                        │          │ ◀─────────────── │          │
│         │ ◀───────────────────── │          │  JSON Response   │          │
└─────────┘   200 OK + JSON        └──────────┘                  └──────────┘
               (proxy_pass)

Proceso:
1. Cliente hace fetch('/api/login', {...})
2. Request llega a Nginx en puerto 80
3. Nginx detecta location /api/
4. Reescribe: /api/login → /login
5. Hace proxy_pass a http://backend:5050/login
6. Backend procesa y responde
7. Nginx devuelve la respuesta al cliente
```

### Request 3: React Router Navigation

```text
┌─────────┐   GET /products       ┌──────────┐   try_files      ┌──────────┐
│ Cliente │ ─────────────────────▶│  Nginx   │   $uri not found │  Return  │
│         │                        │  :80     │   $uri/ not      │  index.  │
│         │                        │          │   found          │  html    │
│         │                        │          │   /index.html ✓  │          │
│         │ ◀───────────────────── │          │ ───────────────▶ │          │
└─────────┘   200 OK (index.html)  └──────────┘                  └──────────┘
               React Router
               handles /products

Proceso:
1. Usuario navega a /products
2. Nginx busca archivo /products (no existe)
3. Nginx busca carpeta /products/ (no existe)
4. Nginx sirve /index.html (fallback para SPA)
5. React Router toma control y renderiza la página Products
```

---

## 🏭 Build Process

### Multi-Stage Dockerfile

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        STAGE 1: BUILDER                               │
│                      Image: node:20-alpine                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. WORKDIR /app                                                     │
│  2. COPY package*.json pnpm-lock.yaml                                │
│  3. RUN npm install -g pnpm                                          │
│  4. RUN pnpm install                                                 │
│  5. COPY . .                                                         │
│  6. RUN pnpm build                                                   │
│                                                                       │
│  Output: /app/dist/                                                  │
│  ├── index.html                                                      │
│  ├── assets/                                                         │
│  │   ├── index-[hash].js                                            │
│  │   ├── index-[hash].css                                           │
│  │   └── [images, fonts, etc.]                                      │
│  └── [other static files]                                           │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
                    Files copied to Stage 2
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                     STAGE 2: PRODUCTION                               │
│                   Image: nginx:stable-alpine                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. COPY --from=builder /app/dist /usr/share/nginx/html             │
│  2. COPY nginx.conf /etc/nginx/conf.d/default.conf                  │
│  3. EXPOSE 80                                                        │
│  4. CMD ["nginx", "-g", "daemon off;"]                              │
│                                                                       │
│  Final Image:                                                        │
│  ├── Nginx server (stable-alpine)                                   │
│  ├── Static files in /usr/share/nginx/html/                         │
│  ├── Proxy configuration in /etc/nginx/conf.d/                      │
│  └── Port 80 exposed                                                 │
│                                                                       │
│  Image Size: ~50-60 MB (vs ~1GB with Node.js included)             │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🌐 Network Architecture (Docker)

```text
┌──────────────────────────────────────────────────────────────────────┐
│                       Docker Network: erp-network                     │
│                            (Bridge Driver)                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Container: business_management_frontend                        │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Hostname: frontend                                       │  │ │
│  │  │  Internal IP: 172.18.0.2 (example)                       │  │ │
│  │  │  Ports: 80:80                                            │  │ │
│  │  │  Image: erp-frontend:latest                              │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              ↕                                        │
│                    Can communicate via                                │
│                    hostname: backend                                  │
│                              ↕                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Container: business_management_backend                         │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Hostname: backend                                        │  │ │
│  │  │  Internal IP: 172.18.0.3 (example)                       │  │ │
│  │  │  Ports: 5050:5050                                        │  │ │
│  │  │  Image: business-management-backend:latest               │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              ↕                                        │
│                    Connects to PostgreSQL                             │
│                    via host.docker.internal                           │
│                              ↕                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Host Machine: PostgreSQL                                       │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Address: host.docker.internal:5432                      │  │ │
│  │  │  Database: business_management_prod                      │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  Port Mapping:                                                       │
│  • Host:80 → frontend:80 (public web access)                        │
│  • Host:5050 → backend:5050 (direct backend access, optional)       │
│  • Host:5432 → PostgreSQL (not exposed to Docker network)           │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

External Access:
┌──────────┐
│ Internet │
│  Users   │
└────┬─────┘
     │
     │ http://app.com (or http://localhost)
     ↓
┌─────────────┐
│   Host:80   │ ← Mapped to frontend container port 80
└─────────────┘
```

---

## 🔐 Security Flow

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. User Login                                                       │
│     ┌─────────┐   POST /api/auth/login   ┌─────────┐               │
│     │ Browser │ ──────────────────────────▶│  Nginx  │               │
│     └─────────┘   {email, password}        └────┬────┘               │
│                                                  │                    │
│                                                  │ proxy to           │
│                                                  │ backend:5050       │
│                                                  ↓                    │
│                                            ┌──────────┐               │
│                                            │ Backend  │               │
│                                            └────┬─────┘               │
│                                                 │                     │
│  2. Backend validates credentials              │                     │
│     ├─ Check user exists                       │                     │
│     ├─ Verify password hash                    │                     │
│     └─ Generate JWT token                      │                     │
│                                                 │                     │
│  3. Response with JWT                          │                     │
│     ┌─────────┐ ◀──────────────────────────────┘                     │
│     │ Browser │   {token: "eyJ...", user: {...}}                     │
│     └────┬────┘                                                       │
│          │                                                             │
│  4. Store token in localStorage                                      │
│     └─ localStorage.setItem('token', token)                          │
│                                                                       │
│  5. Subsequent API requests                                          │
│     ┌─────────┐   GET /api/products          ┌─────────┐            │
│     │ Browser │   Authorization: Bearer eyJ..  │  Nginx  │            │
│     └─────────┘ ──────────────────────────────▶└────┬────┘            │
│                                                     │                 │
│                                                     │ proxy           │
│                                                     ↓                 │
│                                              ┌──────────┐             │
│                                              │ Backend  │             │
│                                              └────┬─────┘             │
│                                                   │                   │
│  6. Backend validates JWT                        │                   │
│     ├─ Verify signature                          │                   │
│     ├─ Check expiration                          │                   │
│     ├─ Extract user info                         │                   │
│     └─ Process request                           │                   │
│                                                   │                   │
│  7. Return data                                  │                   │
│     ┌─────────┐ ◀────────────────────────────────┘                   │
│     │ Browser │   {products: [...]}                                  │
│     └─────────┘                                                       │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

Notes:
• VITE_AUTO_LOGIN=false in production (no test credentials)
• JWT stored in localStorage (accessible to JS)
• Token included in all API requests via Authorization header
• Backend validates token on every protected endpoint
```

---

## 📦 File Structure in Production

```text
Docker Container: business_management_frontend
└── /
    ├── etc/
    │   └── nginx/
    │       └── conf.d/
    │           └── default.conf          ← Nginx configuration
    │
    └── usr/
        └── share/
            └── nginx/
                └── html/                  ← Root directory for static files
                    ├── index.html         ← Main HTML file
                    ├── favicon.ico
                    └── assets/
                        ├── index-[hash].js     ← Bundled JavaScript
                        ├── index-[hash].css    ← Bundled CSS
                        └── [images, fonts]     ← Static assets

Process:
1. Request comes to Nginx on port 80
2. location / matches the request
3. try_files checks:
   - $uri: /usr/share/nginx/html/ + requested path
   - $uri/: same but as directory
   - /index.html: fallback for SPA routing
4. File is served or index.html for client-side routing
```

---

## 🔄 Environment Variable Injection

```text
┌──────────────────────────────────────────────────────────────────────┐
│                   BUILD TIME vs RUNTIME                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─ BUILD TIME (pnpm build) ────────────────────────────────────┐   │
│  │                                                                │   │
│  │  1. Read .env.production file                                 │   │
│  │     VITE_API_URL=/api                                         │   │
│  │     VITE_AUTO_LOGIN=false                                     │   │
│  │     VITE_ENV=production                                       │   │
│  │                                                                │   │
│  │  2. Vite processes src/config/api.config.js:                 │   │
│  │     export const API_BASE_URL =                               │   │
│  │       import.meta.env.VITE_API_URL || 'http://localhost:5050'│   │
│  │                                                                │   │
│  │  3. Vite replaces import.meta.env.VITE_API_URL with "/api"  │   │
│  │                                                                │   │
│  │  4. Output in dist/assets/index-[hash].js:                   │   │
│  │     const API_BASE_URL = "/api";  ← Hardcoded!               │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              ↓                                        │
│                    Variables are BAKED IN                             │
│                              ↓                                        │
│  ┌─ RUNTIME (Nginx serving files) ──────────────────────────────┐   │
│  │                                                                │   │
│  │  • Browser loads index-[hash].js                              │   │
│  │  • API_BASE_URL is already "/api" (can't change)             │   │
│  │  • Any fetch() calls use this hardcoded value                │   │
│  │                                                                │   │
│  │  To change configuration:                                     │   │
│  │  1. Update .env.production                                    │   │
│  │  2. Rebuild: pnpm build                                       │   │
│  │  3. Rebuild Docker: docker-compose build frontend            │   │
│  │  4. Restart: docker-compose up -d frontend                   │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  IMPORTANT:                                                          │
│  • Environment variables are NOT runtime-configurable              │
│  • They are replaced at BUILD time by Vite                         │
│  • Changing .env without rebuild has NO effect                     │
│  • Use build-and-deploy.sh for proper rebuild workflow            │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

**Documento creado:** Diciembre 2024  
**Última actualización:** Diciembre 2024  
**Versión:** 1.0.0
