// Mocks basados en la especificación de la API de Auditoría

export const mockLogs = {
  success: true,
  data: {
    logs: [
      {
        id: 12345,
        timestamp: "2026-01-07T10:30:00Z",
        user_id: "USER001",
        username: "admin@empresa.com",
        session_id: "sess_abc123",
        ip_address: "192.168.1.100",
        category: "SALE",
        action: "CREATE",
        entity_type: "SALE",
        entity_id: "VTA-2026-00001",
        description: "Venta creada por ₲ 15.000",
        old_values: null,
        new_values: {
          total: 15000,
          currency: "PYG",
          items: 5,
          client_id: "CLI001",
          metadata: {
            payment_method: "CASH"
          }
        },
        level: "INFO",
        success: true,
        duration_ms: 245
      },
      {
        id: 12346,
        timestamp: "2026-01-07T09:45:00Z",
        user_id: "USER002",
        username: "vendedor1@empresa.com",
        session_id: "sess_xyz789",
        ip_address: "192.168.1.101",
        category: "AUTH",
        action: "LOGIN",
        entity_type: "SESSION",
        entity_id: "sess_xyz789",
        description: "Inicio de sesión exitoso desde 192.168.1.101",
        old_values: null,
        new_values: null,
        level: "INFO",
        success: true,
        duration_ms: 120
      },
      {
        id: 12347,
        timestamp: "2026-01-07T10:15:00Z",
        user_id: "USER003",
        username: "desconocido",
        session_id: null,
        ip_address: "192.168.1.50",
        category: "AUTH",
        action: "LOGIN",
        entity_type: "SESSION",
        entity_id: null,
        description: "Fallo en Autenticación (Contraseña incorrecta)",
        old_values: null,
        new_values: null,
        level: "ERROR",
        success: false,
        duration_ms: 85
      },
      {
        id: 12348,
        timestamp: "2026-01-07T15:13:00Z",
        user_id: "USER001",
        username: "admin@empresa.com",
        session_id: "sess_abc123",
        ip_address: "192.168.1.100",
        category: "INVENTORY",
        action: "UPDATE",
        entity_type: "PRODUCT",
        entity_id: "PROD-099",
        description: "Actualización de Stock (Ajuste manual)",
        old_values: { stock: 10 },
        new_values: { stock: 15 },
        level: "INFO",
        success: true,
        duration_ms: 150
      }
    ],
    total: 1500,
    page: 1,
    page_size: 20,
    total_pages: 30
  }
};

export const mockSummary = {
  success: true,
  data: {
    generated_at: "2026-01-07T15:30:00Z",
    period: {
      start_date: "2026-01-01T00:00:00Z",
      end_date: "2026-02-01T00:00:00Z"
    },
    total_logs: 15420,
    successful_actions: 15100,
    failed_actions: 320,
    success_rate: 97.92,
    unique_users: 12,
    unique_sessions: 450,
    unique_ips: 8,
    actions_by_category: [
      { category: "SALE", count: 5200, success_rate: 99.1, percentage: 33.7 },
      { category: "AUTH", count: 3100, success_rate: 94.5, percentage: 20.1 },
      { category: "PRODUCT", count: 2390, success_rate: 98.2, percentage: 15.5 }
    ],
    top_users: [
      {
        user_id: "USER001",
        username: "vendedor1@empresa.com",
        total_actions: 4500,
        successful_actions: 4480,
        failed_actions: 20,
        unique_categories: 6,
        unique_sessions: 120,
        last_activity: "2026-01-07T15:25:00Z",
        avg_actions_per_day: 145.2
      },
      {
        user_id: "USER002",
        username: "admin@empresa.com",
        total_actions: 3200,
        successful_actions: 3200,
        failed_actions: 0,
        unique_categories: 8,
        unique_sessions: 50,
        last_activity: "2026-01-07T10:30:00Z",
        avg_actions_per_day: 103.2
      }
    ],
    security_alerts: [
      {
        type: "FAILED_LOGINS",
        severity: "MEDIUM",
        message: "5 intentos de login fallidos",
        user_id: "USER003",
        ip_address: "192.168.1.50",
        occurred_at: "2026-01-07T10:15:00Z",
        count: 5
      },
      {
        type: "UNUSUAL_ACTIVITY",
        severity: "HIGH",
        message: "Actividad inusual registrada (100+ acciones/hora)",
        user_id: "USER004",
        ip_address: "192.168.1.105",
        occurred_at: "2026-01-07T09:45:00Z",
        count: 120
      }
    ]
  }
};

export const mockUserActivity = {
  success: true,
  data: {
    generated_at: "2026-01-07T15:30:00Z",
    user_id: "USER001",
    username: "admin@empresa.com",
    summary: {
      total_actions: 4500,
      successful_actions: 4480,
      failed_actions: 20,
      unique_categories: 6,
      unique_sessions: 120,
      last_activity: "2026-01-07T15:25:00Z",
      avg_actions_per_day: 145.2
    },
    actions_by_category: [
      { category: "SALE", count: 2502, success_rate: 99.5, percentage: 55.6 },
      { category: "PRODUCT", count: 1125, success_rate: 98.0, percentage: 25.0 },
      { category: "AUTH", count: 873, success_rate: 100.0, percentage: 19.4 }
    ],
    recent_actions: [
      {
        id: 12345,
        timestamp: "2026-01-07T15:25:00Z",
        category: "SALE",
        action: "CREATE",
        entity_type: "SALE",
        entity_id: "VTA-2026-00123",
        description: "Venta Creada",
        ip_address: "192.168.1.100",
        success: true
      },
      {
        id: 12344,
        timestamp: "2026-01-07T15:13:00Z",
        category: "INVENTORY",
        action: "UPDATE",
        entity_type: "PRODUCT",
        entity_id: "PROD-099",
        description: "Actualización de Stock",
        ip_address: "192.168.1.100",
        success: true
      },
      {
        id: 12343,
        timestamp: "2026-01-07T10:15:00Z",
        category: "AUTH",
        action: "LOGIN",
        entity_type: "SESSION",
        entity_id: null,
        description: "Fallo en Autenticación (Contraseña incorrecta)",
        ip_address: "192.168.1.50",
        success: false
      }
    ]
  }
};