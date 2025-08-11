Feature Products

Este módulo agrupa UI, hooks y servicios específicos de Productos siguiendo una arquitectura por características.

Contenido inicial:
- components/: futuros componentes presentacionales (tabla/lista, toolbar, etc.)
- hooks/: lógica de UI reutilizable (filtros, debounce, etc.)
- services/: API adapters, mappers y validadores

Migración progresiva: inicialmente consumimos el store existente (`useProductStore`) para evitar regresiones.
