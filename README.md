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

```bash
# 1. Validate configuration
./validate-config.sh

# 2. Automated build and deploy
./build-and-deploy.sh

# 3. Or manually with Docker Compose
docker-compose up --build -d
```

See [Frontend Deploy Guide](./docs/development/FRONTEND_DEPLOY_GUIDE.md) for detailed deployment instructions.

## Documentation

### 🚀 Deployment & Production

- **[Quick Start Deploy](./QUICKSTART_DEPLOY.md)** - Deploy en 3 comandos
- **[Deployment Summary](./DEPLOYMENT_SUMMARY.md)** - Estrategia completa de deployment
- **[Architecture Diagrams](./ARCHITECTURE_DIAGRAMS.md)** - Diagramas visuales de la arquitectura
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
