# ERP Web Application

A modern, multi-theme ERP system built with React, Vite, and Tailwind CSS.

## Features

- 🎨 **Multi-Theme Support**: Neo-Brutalism, Material Design, and Fluent Design
- 📱 **Responsive Design**: Works on all devices
- 🔐 **Authentication**: Secure user management
- 📊 **Dashboard**: Comprehensive analytics and metrics
- 👥 **Client Management**: Customer relationship tools
- 📦 **Product Management**: Inventory and catalog management
- 🛒 **Order Management**: Sales and purchase tracking
- ⚙️ **Settings**: Configurable system preferences

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

### Production Deployment

El despliegue productivo se orquesta desde el backend (compose canónico con perfiles
`laptop`/`server`): ver `business_management/docker-compose.yml` y
`business_management/docs/DEPLOYMENT_DOCKER.md`. La imagen del frontend
(`erp-frontend:latest`) se construye desde este repo con `scripts/docker-build.ps1`
o `docker build` (usa `.env.production`, donde `VITE_API_URL` se hornea al compilar).

```bash
# Build de la imagen del frontend
docker build -t erp-frontend:latest .

# Stack completo desde business_management/
#   docker compose --profile laptop up -d --build   (dev/laptop, :8081)
#   docker compose --profile server up -d --build   (cliente, 80/443 + TLS)
```

See [Frontend Deploy Guide](./docs/development/FRONTEND_DEPLOY_GUIDE.md) for detailed deployment instructions.

## Documentation

### 🚀 Deployment & Production

- **[Frontend Deploy Guide](./docs/development/FRONTEND_DEPLOY_GUIDE.md)** - Guía detallada de deployment

### 📚 Development & Architecture

- [Architecture](./docs/ARCHITECTURE.md) - System architecture and design patterns
- [API Integration](./docs/API_INTEGRATION.md) - Backend API documentation
- [Authentication](./docs/AUTHENTICATION.md) - User authentication system
- [Theme System](./docs/THEME_SYSTEM.md) - Multi-theme implementation
- [Theme Guide](./docs/THEME_GUIDE.md) - Design guidelines and usage
- [Development Docs](./docs/development/) - Development guidelines and processes

## Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS 3
- **Routing**: React Router 6
- **State Management**: Zustand
- **Icons**: Lucide React
- **Charts**: Recharts
- **Themes**: next-themes
- **TypeScript**: Full type safety

## Project Structure

```text
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── layouts/       # Page layouts
├── pages/         # Application pages
├── services/      # API services
├── store/         # State management
├── themes/        # Theme configurations
└── utils/         # Utility functions
```

## Development Guidelines

See [development documentation](./docs/development/) for detailed development guidelines.

## License

MIT License
