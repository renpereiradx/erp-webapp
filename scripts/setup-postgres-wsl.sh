#!/bin/bash
# Script para configurar PostgreSQL en WSL

echo "========================================"
echo "  Configurando PostgreSQL en WSL"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Crear usuario dev_user
echo -e "${YELLOW}1. Creando usuario dev_user...${NC}"
sudo -u postgres psql -c "DROP USER IF EXISTS dev_user;"
sudo -u postgres psql -c "CREATE USER dev_user WITH PASSWORD 'aDmin404942';"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Usuario dev_user creado${NC}"
else
    echo -e "${RED}[ERROR] No se pudo crear el usuario${NC}"
    exit 1
fi

echo ""

# 2. Crear base de datos erp_db
echo -e "${YELLOW}2. Creando base de datos erp_db...${NC}"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS erp_db;"
sudo -u postgres psql -c "CREATE DATABASE erp_db OWNER dev_user;"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Base de datos erp_db creada${NC}"
else
    echo -e "${RED}[ERROR] No se pudo crear la base de datos${NC}"
    exit 1
fi

echo ""

# 3. Otorgar privilegios
echo -e "${YELLOW}3. Otorgando privilegios...${NC}"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE erp_db TO dev_user;"
sudo -u postgres psql -d erp_db -c "GRANT ALL ON SCHEMA public TO dev_user;"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Privilegios otorgados${NC}"
else
    echo -e "${RED}[ERROR] No se pudieron otorgar privilegios${NC}"
fi

echo ""

# 4. Probar conexión
echo -e "${YELLOW}4. Probando conexión...${NC}"
PGPASSWORD='aDmin404942' psql -h localhost -U dev_user -d erp_db -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Conexión exitosa${NC}"
else
    echo -e "${RED}[ERROR] No se pudo conectar${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo -e "${GREEN}  Configuración Completada${NC}"
echo "========================================"
echo ""
echo "Credenciales:"
echo "  Base de datos: erp_db"
echo "  Usuario:       dev_user"
echo "  Password:      aDmin404942"
echo ""
