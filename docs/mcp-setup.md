# MCP Database Setup

## 1. Instalar Toolbox

```bash
export VERSION=0.16.0
curl -L -o toolbox https://storage.googleapis.com/genai-toolbox/v$VERSION/linux/amd64/toolbox
chmod +x toolbox
```

## 2. Configurar .mcp.json

```json
{
  "mcpServers": {
    "postgres": {
      "command": "/home/[USER]/toolbox",
      "args": ["--prebuilt", "postgres", "--stdio"],
      "env": {
        "POSTGRES_HOST": "127.0.0.1",
        "POSTGRES_PORT": "5432",
        "POSTGRES_DATABASE": "business_management",
        "POSTGRES_USER": "dev_user",
        "POSTGRES_PASSWORD": "aDmin404942"
      }
    }
  }
}
```

## 3. Probar

```bash
POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=5432 POSTGRES_DATABASE=business_management POSTGRES_USER=dev_user POSTGRES_PASSWORD=aDmin404942 ./toolbox --prebuilt postgres --stdio
```

## 4. Reiniciar Claude Code

Listo para usar la base de datos desde Claude Code.