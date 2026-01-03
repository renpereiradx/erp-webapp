# Guía de Integración - APIs de Pagos

## Descripción

Esta guía proporciona información completa para integrar las **APIs de Pagos** del sistema de gestión empresarial. Incluye tres módulos principales: Monedas, Métodos de Pago y Tipos de Cambio.

## 🛠 Tecnologías y Herramientas

- **Backend**: Go REST API
- **Base de datos**: PostgreSQL (schema `payments`)


## 📋 Endpoints Disponibles

### Base URL
```
http://localhost:8080
```

### 1. 💰 Currencies API

#### Obtener todas las monedas
```http
GET /currencies
```

#### Obtener moneda por ID
```http
GET /currencies/{id}
```


## Estructuras de Datos

Las respuestas de los endpoints incluyen los siguientes campos y estructuras:

**Currency:**
| Campo   | Tipo    | Descripción         |
|---------|---------|---------------------|
| id      | number  | ID único            |
| currency_code | string  | Código de moneda    |
| name    | string  | Nombre              |

**PaymentMethod:**
| Campo   | Tipo    | Descripción         |
|---------|---------|---------------------|
| id      | number  | ID único            |
| method_code | string  | Código de método    |
| description | string  | Descripción         |

**ExchangeRate:**
| Campo         | Tipo    | Descripción                |
|---------------|---------|----------------------------|
| id            | number  | ID único                   |
| currency_id   | number  | ID de moneda               |
| rate_to_base  | number  | Tasa respecto a base       |
| date          | string  | Fecha (ISO 8601)           |
| source        | string  | Fuente (opcional)          |
| created_at    | string  | Fecha de creación (ISO)    |

**ExchangeRateEnriched:**
| Campo   | Tipo    | Descripción         |
|---------|---------|---------------------|
| id      | number  | ID único            |
| currency_id | number | ID de moneda      |
| currency_code | string | Código de moneda |
| currency_name | string | Nombre de moneda |
| rate_to_base | number | Tasa respecto a base |
| date    | string  | Fecha (ISO 8601)    |
| source  | string  | Fuente (opcional)   |
| created_at | string | Fecha de creación (ISO) |

**Paginated Response:**
| Campo    | Tipo    | Descripción         |
|----------|---------|---------------------|
| data     | array   | Lista de objetos    |
| total    | number  | Total de registros  |
| page     | number  | Página actual       |
| page_size| number  | Tamaño de página    |
| total_pages| number| Total de páginas    |

## Validaciones y Errores

Las APIs devuelven errores con los siguientes códigos HTTP y mensajes:

| Código | Mensaje                  | Descripción                       |
|--------|--------------------------|-----------------------------------|
| 400    | Bad Request              | Parámetros inválidos              |
| 404    | Not Found                | Recurso no encontrado             |
| 500    | Internal Server Error    | Error interno del servidor        |

Las validaciones incluyen:
- Todos los campos requeridos deben estar presentes.
- Los tipos de datos deben coincidir con la estructura definida.
- Para tipos de cambio, la fecha debe estar en formato ISO 8601.

## Casos de Uso

### Ejemplo de Request/Response

**Obtener todas las monedas**

Request:
```http
GET /currencies
```

Response:
```json
[
  {
    "id": 1,
    "currency_code": "PYG",
    "name": "Guaraní"
  },
  {
    "id": 2,
    "currency_code": "USD",
    "name": "Dólar estadounidense"
  }
]
```

**Obtener tipo de cambio enriquecido**

Request:
```http
GET /exchange-rate/enriched?date=2025-08-09&page=1&page_size=20
```

Response:
```json
{
  "data": [
    {
      "id": 1,
      "currency_id": 2,
      "currency_code": "USD",
      "currency_name": "Dólar estadounidense",
      "rate_to_base": 7300.50,
      "date": "2025-08-09",
      "source": "Banco Central",
      "created_at": "2025-08-09T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

## Cambios Importantes

- Versión inicial de la API de pagos v1.0
- Estructuras de datos y endpoints estables

---

**Guía creada**: 22 de Septiembre de 2025  
**Versión de APIs**: Payments v1.0  
**Próxima actualización**: 22 de Octubre de 2025
  return (
    paymentMethod &&
    typeof paymentMethod.id === 'number' &&
    typeof paymentMethod.method_code === 'string' &&
    typeof paymentMethod.description === 'string'
  );
};

export const validateExchangeRate = (exchangeRate: any): exchangeRate is ExchangeRate => {
  return (
    exchangeRate &&
    typeof exchangeRate.id === 'number' &&
    typeof exchangeRate.currency_id === 'number' &&
    typeof exchangeRate.rate_to_base === 'number' &&
    typeof exchangeRate.date === 'string' &&
    typeof exchangeRate.created_at === 'string'
  );
};
```

## 📚 Recursos Adicionales

### Enlaces Útiles

- [React Query Documentation](https://tanstack.com/query/latest)
- [Axios Documentation](https://axios-http.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Herramientas Recomendadas

- **Estado del servidor**: TanStack Query (React Query)
- **Cliente HTTP**: Axios
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **Tipos**: TypeScript estricto

---

**Guía creada**: 22 de Septiembre de 2025  
**Versión de APIs**: Payments v1.0  
**Compatibilidad**: React 18+, TypeScript 5+

**Equipo de desarrollo**: Business Management Frontend Team  
**Próxima actualización**: 22 de Octubre de 2025
