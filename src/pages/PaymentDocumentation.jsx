import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import {
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Coins,
  Copy,
  CreditCard,
  Database,
  FileCode,
  Layers,
  Lightbulb,
  ShieldCheck,
  Terminal,
  TriangleAlert,
} from 'lucide-react'

const SectionHeader = ({ icon: iconProp, title, description, badge }) => {
  const Icon = iconProp ?? BookOpen

  return (
    <div className='flex flex-wrap items-start justify-between gap-4'>
      <div className='flex items-center gap-3'>
        <span className='flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary'>
          <Icon className='h-6 w-6' />
        </span>
        <div>
          <h2 className='text-xl font-semibold leading-tight'>{title}</h2>
          {description ? (
            <p className='text-sm text-muted-foreground'>{description}</p>
          ) : null}
        </div>
      </div>
      {badge ? (
        <Badge className='text-xs uppercase tracking-wide'>{badge}</Badge>
      ) : null}
    </div>
  )
}

const CodeBlock = ({ children }) => (
  <pre className='overflow-x-auto rounded-lg bg-muted px-4 py-3 text-sm leading-relaxed'>
    <code>{children}</code>
  </pre>
)

const methodBadgeClasses = {
  GET: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  POST: 'bg-sky-500/10 text-sky-600 border-sky-200',
  PUT: 'bg-amber-500/10 text-amber-600 border-amber-200',
  DELETE: 'bg-rose-500/10 text-rose-600 border-rose-200',
}

const PaymentDocumentation = () => {
  const { styles } = useThemeStyles()
  const [hasCopied, setHasCopied] = useState(false)
  const copyTimeoutRef = useRef(null)

  const baseUrl = 'http://localhost:5050'

  const copyBaseUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(baseUrl)
      setHasCopied(true)
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = setTimeout(() => setHasCopied(false), 2400)
    } catch {
      setHasCopied(false)
    }
  }, [baseUrl])

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    },
    []
  )

  const subsystems = useMemo(
    () => [
      {
        title: 'Payment Methods',
        description:
          'Catálogo estático de métodos de pago disponibles. API de solo lectura.',
        icon: CreditCard,
        highlights: ['GET list', 'GET por ID', 'GET por código'],
        status: 'Lectura garantizada',
      },
      {
        title: 'Currencies',
        description:
          'CRUD completo de monedas con validaciones ISO 4217 y restricciones de integridad.',
        icon: Coins,
        highlights: ['GET', 'POST', 'PUT', 'DELETE'],
        status: 'CRUD habilitado',
      },
      {
        title: 'Exchange Rates',
        description:
          'Tipos de cambio con histórico, paginación y consultas por fecha o rango.',
        icon: ArrowLeftRight,
        highlights: ['Histórico', 'Paginado', 'Validación de rangos'],
        status: 'Histórico auditado',
      },
    ],
    []
  )

  const curlSnippets = useMemo(
    () => [
      {
        title: 'Payment Methods',
        commands: [
          'curl -X GET http://localhost:5050/payment-methods',
          'curl -X GET http://localhost:5050/payment-methods/1',
          'curl -X GET http://localhost:5050/payment-methods/code/CASH',
        ],
      },
      {
        title: 'Currencies',
        commands: [
          String.raw`curl -X GET http://localhost:5050/currencies`,
          String.raw`curl -X POST http://localhost:5050/currencies \
  -H "Content-Type: application/json" \
  -d '{"currency_code": "EUR", "name": "Euro"}'`,
          String.raw`curl -X PUT http://localhost:5050/currencies/10 \
  -H "Content-Type: application/json" \
  -d '{"currency_code": "EUR", "name": "Euro Europeo"}'`,
        ],
      },
      {
        title: 'Exchange Rates',
        commands: [
          'curl -X GET http://localhost:5050/exchange-rate/latest',
          String.raw`curl -X GET "http://localhost:5050/exchange-rate/enriched?page=1&page_size=10"`,
          String.raw`curl -X POST http://localhost:5050/exchange-rate \
  -H "Content-Type: application/json" \
  -d '{"currency_id": 2, "rate_to_base": 7350.50, "source": "BCP"}'`,
        ],
      },
    ],
    []
  )

  const paymentMethodOperations = useMemo(
    () => [
      {
        method: 'GET',
        endpoint: '/payment-methods',
        purpose: 'Listar todos los métodos de pago',
        status: 'Disponible',
      },
      {
        method: 'GET',
        endpoint: '/payment-methods/{id}',
        purpose: 'Obtener método por ID numérico',
        status: 'Disponible',
      },
      {
        method: 'GET',
        endpoint: '/payment-methods/code/{code}',
        purpose: 'Obtener método por código (ej: CASH)',
        status: 'Disponible',
      },
    ],
    []
  )

  const currencyOperations = useMemo(
    () => [
      {
        method: 'GET',
        endpoint: '/currencies',
        purpose: 'Listar todas las monedas',
        status: 'Disponible',
      },
      {
        method: 'GET',
        endpoint: '/currencies/{id}',
        purpose: 'Obtener moneda por ID',
        status: 'Disponible',
      },
      {
        method: 'GET',
        endpoint: '/currencies/code/{code}',
        purpose: 'Obtener moneda por código ISO',
        status: 'Disponible',
      },
      {
        method: 'POST',
        endpoint: '/currencies',
        purpose: 'Crear nueva moneda',
        status: 'Disponible',
      },
      {
        method: 'PUT',
        endpoint: '/currencies/{id}',
        purpose: 'Actualizar moneda existente',
        status: 'Disponible',
      },
      {
        method: 'DELETE',
        endpoint: '/currencies/{id}',
        purpose: 'Eliminar moneda (ver advertencias)',
        status: 'Con restricciones',
      },
    ],
    []
  )
  const exchangeRateOperations = useMemo(
    () => [
      {
        method: 'GET',
        endpoint: '/exchange-rate',
        purpose: 'Listado completo sin paginación',
        status: 'Disponible',
      },
      {
        method: 'GET',
        endpoint: '/exchange-rate/enriched',
        purpose: 'Listado paginado con datos de moneda',
        status: 'Disponible',
      },
      {
        method: 'GET',
        endpoint: '/exchange-rate/latest',
        purpose: 'Último tipo de cambio por moneda',
        status: 'Disponible',
      },
      {
        method: 'GET',
        endpoint: '/exchange-rate/{id}',
        purpose: 'Detalle por ID',
        status: 'Disponible',
      },
      {
        method: 'GET',
        endpoint: '/exchange-rate/currency/{currency_id}',
        purpose: 'Tipo según moneda (opcional ?date)',
        status: 'Disponible',
      },
      {
        method: 'GET',
        endpoint: '/exchange-rate/currency/{currency_id}/range',
        purpose: 'Histórico por rango de fechas',
        status: 'Disponible',
      },
      {
        method: 'POST',
        endpoint: '/exchange-rate',
        purpose: 'Crear tipo de cambio',
        status: 'Disponible',
      },
      {
        method: 'PUT',
        endpoint: '/exchange-rate/{id}',
        purpose: 'Actualizar tipo existente',
        status: 'Requiere auditoría',
      },
      {
        method: 'DELETE',
        endpoint: '/exchange-rate/{id}',
        purpose: 'Eliminar tipo (solo recientes)',
        status: 'Restringido',
      },
    ],
    []
  )

  const validationMatrix = useMemo(
    () => [
      {
        title: 'Payment Methods',
        checks: [
          'El método seleccionado debe existir (usa GET /payment-methods)',
          'Validar IDs numéricos y códigos antes de enviar al backend',
          'Considerar caché de lista completa al iniciar la app',
        ],
      },
      {
        title: 'Currencies',
        checks: [
          'currency_code debe tener exactamente 3 letras mayúsculas',
          'Validar unicidad del código antes de crear o actualizar',
          'Nunca eliminar monedas con tipos o precios activos (aplicar soft delete si es necesario)',
        ],
      },
      {
        title: 'Exchange Rates',
        checks: [
          'currency_id debe existir en el catálogo de monedas',
          'rate_to_base > 0 y dentro de rangos razonables por moneda',
          'Validar formato de fechas (YYYY-MM-DD o ISO 8601)',
          'Detectar si ya existe un rate para misma moneda/fecha y advertir al usuario',
        ],
      },
    ],
    []
  )

  const errorMatrix = useMemo(
    () => [
      {
        code: 'ID inválido',
        status: '400',
        appliesTo: 'Todos los endpoints con :id',
        prevention:
          'Validar que el parámetro sea entero positivo antes de llamar a la API',
      },
      {
        code: 'Datos inválidos: [detalle]',
        status: '400',
        appliesTo: 'POST / PUT',
        prevention:
          'Validar payload desde el frontend y enviar JSON bien formado',
      },
      {
        code: 'El código de moneda es requerido',
        status: '400',
        appliesTo: 'Currencies',
        prevention: 'No permitir submit sin currency_code',
      },
      {
        code: 'El tipo de cambio es requerido',
        status: '400',
        appliesTo: 'Exchange Rates',
        prevention: 'Validar que rate_to_base esté presente y sea > 0',
      },
      {
        code: '[Recurso] no encontrado',
        status: '404',
        appliesTo: 'Todos',
        prevention:
          'Verificar existencia antes de operar; mostrar mensaje claro al usuario',
      },
      {
        code: 'Error al [acción]: [detalle]',
        status: '500',
        appliesTo: 'Todos',
        prevention:
          'Registrar detalle y reintentar; usualmente errores de DB o integridad referencial',
      },
    ],
    []
  )

  const bestPractices = useMemo(
    () => [
      {
        title: 'No alterar históricos de tipos',
        content:
          'Evitar editar tipos de cambio antiguos utilizados en transacciones. Crear nuevos registros documentando la corrección para mantener la trazabilidad.',
      },
      {
        title: 'Documentar la fuente del tipo',
        content:
          'Incluir el campo "source" (ej: BCP, Manual, API Externa) cada vez que se cree un tipo de cambio para facilitar auditorías.',
      },
      {
        title: 'Alertas de variación',
        content:
          'Implementar alertas cuando la tasa varíe más de 5% en un día o 20% en una semana para detectar anomalías.',
      },
      {
        title: 'Búsqueda tolerante por fecha',
        content:
          'Si no existe un tipo para la fecha solicitada, buscar el registro más cercano anterior antes de bloquear la operación.',
      },
    ],
    []
  )

  const renderOperationRow = operation => (
    <TableRow key={`${operation.method}-${operation.endpoint}`}>
      <TableCell>
        <Badge
          variant='outline'
          className={`${
            methodBadgeClasses[operation.method]
          } font-semibold uppercase`}
        >
          {operation.method}
        </Badge>
      </TableCell>
      <TableCell className='font-mono text-xs md:text-sm'>
        {operation.endpoint}
      </TableCell>
      <TableCell>{operation.purpose}</TableCell>
      <TableCell>
        <Badge variant='secondary' className='whitespace-normal text-left'>
          {operation.status}
        </Badge>
      </TableCell>
    </TableRow>
  )

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-8'>
      <div className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <BookOpen className='h-5 w-5' />
            <span className='text-sm font-medium uppercase tracking-wide'>
              Documentación funcional
            </span>
          </div>
          <h1 className='text-3xl font-bold leading-tight'>
            API de Pagos, Monedas y Tipos de Cambio
          </h1>
          <p className='max-w-2xl text-sm text-muted-foreground'>
            Referencia oficial para integrar los subsistemas de pagos con
            soporte de monedas múltiples, tipos de cambio históricos y
            escenarios de uso validados.
          </p>
          <div className='flex flex-wrap gap-2'>
            <Badge variant='secondary'>Versión 1.0</Badge>
            <Badge variant='secondary'>
              Última actualización: 10 de Octubre de 2025
            </Badge>
            <Badge className='bg-emerald-500/10 text-emerald-600 border-emerald-200'>
              Testing automatizado ✅
            </Badge>
          </div>
        </div>
        <Card className='w-full max-w-sm'>
          <CardHeader className='space-y-1'>
            <CardTitle className='flex items-center gap-2 text-base font-semibold'>
              <ShieldCheck className='h-5 w-5 text-primary' />
              Endpoint base
            </CardTitle>
            <CardDescription>
              Usa este dominio como prefijo para todos los endpoints
              documentados en esta página.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <CodeBlock>{baseUrl}</CodeBlock>
            <Button
              type='button'
              variant='outline'
              className='w-full justify-between'
              onClick={copyBaseUrl}
            >
              <span>
                {hasCopied ? '¡Copiado al portapapeles!' : 'Copiar URL base'}
              </span>
              <Copy className='h-4 w-4' />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className={styles.card('', { density: 'compact' })}>
        <CardHeader className='pb-2'>
          <CardTitle className='text-lg font-semibold'>
            Resumen ejecutivo
          </CardTitle>
          <CardDescription>
            Tres subsistemas trabajan en conjunto para ofrecer pagos seguros,
            conversiones en múltiples monedas y respaldo histórico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            {subsystems.map(item => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className='flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm'
                >
                  <div className='flex items-center justify-between'>
                    <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                      <Icon className='h-5 w-5' />
                    </span>
                    <Badge variant='secondary'>{item.status}</Badge>
                  </div>
                  <div className='space-y-2'>
                    <h3 className='text-base font-semibold'>{item.title}</h3>
                    <p className='text-sm text-muted-foreground'>
                      {item.description}
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-2 pt-1'>
                    {item.highlights.map(highlight => (
                      <Badge
                        key={highlight}
                        variant='outline'
                        className='bg-background'
                      >
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className={styles.card('', { density: 'compact' })}>
        <CardHeader className='pb-2'>
          <SectionHeader
            icon={ClipboardList}
            title='Configuración general'
            description='Headers obligatorios y consideraciones de autenticación'
            badge='Requerido'
          />
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-1'>
            <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
              Endpoints de solo lectura (GET)
            </h3>
            <CodeBlock>{`Content-Type: application/json`}</CodeBlock>
          </div>
          <div className='space-y-1'>
            <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
              Endpoints de escritura (POST / PUT / DELETE)
            </h3>
            <CodeBlock>{`Content-Type: application/json
Authorization: Bearer <jwt_token>`}</CodeBlock>
            <p className='text-xs text-muted-foreground'>
              El token JWT debe incluir permisos de pago y finanzas. En
              ambientes QA se recomienda usar tokens con caducidad corta (60
              minutos).
            </p>
          </div>
        </CardContent>
      </Card>

      <Accordion type='multiple' className='space-y-4'>
        <AccordionItem value='payment-methods'>
          <AccordionTrigger>
            <SectionHeader
              icon={CreditCard}
              title='Payment Methods'
              description='Catálogo estático de métodos de pago disponibles'
              badge='Solo lectura'
            />
          </AccordionTrigger>
          <AccordionContent>
            <div className='space-y-6'>
              <Card className='border-dashed'>
                <CardHeader>
                  <CardTitle className='text-base font-semibold'>
                    Operaciones disponibles
                  </CardTitle>
                  <CardDescription>
                    Consulta segura de métodos de pago. No existen endpoints de
                    creación ni eliminación desde la API pública.
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-0'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Uso</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentMethodOperations.map(renderOperationRow)}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base font-semibold'>
                    Ejemplos de respuesta
                  </CardTitle>
                  <CardDescription>
                    Respuestas representativas del entorno de QA con datos
                    reales.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <h4 className='text-sm font-semibold text-foreground'>
                      GET /payment-methods
                    </h4>
                    <CodeBlock>{`[
  {
    "id": 1,
    "method_code": "efectivo",
    "description": "Pago en efectivo"
  },
  {
    "id": 5,
    "method_code": "CASH",
    "description": "Efectivo"
  }
]`}</CodeBlock>
                  </div>
                  <div className='space-y-2'>
                    <h4 className='text-sm font-semibold text-foreground'>
                      GET /payment-methods/code/CASH
                    </h4>
                    <CodeBlock>{`{
  "id": 5,
  "method_code": "CASH",
  "description": "Efectivo"
}`}</CodeBlock>
                  </div>
                </CardContent>
              </Card>

              <Card className='border-yellow-200 bg-yellow-50/40'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base font-semibold text-yellow-700'>
                    <TriangleAlert className='h-4 w-4' />
                    Limitaciones conocidas
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-2 text-sm text-yellow-800'>
                  <p>
                    Los métodos de pago se configuran directamente en base de
                    datos.
                  </p>
                  <p>
                    No existe paginación: para formularios se recomienda cargar
                    una única vez y cachear en el estado global.
                  </p>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='currencies'>
          <AccordionTrigger>
            <SectionHeader
              icon={Coins}
              title='Currencies'
              description='CRUD completo con validaciones ISO 4217'
              badge='Alta crítica'
            />
          </AccordionTrigger>
          <AccordionContent>
            <div className='space-y-6'>
              <Card className='border-dashed'>
                <CardHeader>
                  <CardTitle className='text-base font-semibold'>
                    Endpoints y operaciones
                  </CardTitle>
                  <CardDescription>
                    Todos los endpoints requieren autenticación JWT excepto las
                    consultas de lectura.
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-0'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Uso</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currencyOperations.map(renderOperationRow)}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className='grid gap-4 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base font-semibold'>
                      Modelo de datos
                    </CardTitle>
                    <CardDescription>
                      Estructura base de la entidad almacenada en base de datos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock>{`{
  "id": 1,
  "currency_code": "PYG",
  "name": "Guaranies"
}`}</CodeBlock>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base font-semibold'>
                      Validaciones obligatorias
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2 text-sm'>
                    <p>• Código ISO 4217 de 3 caracteres mayúsculas.</p>
                    <p>• Unicidad global del código.</p>
                    <p>
                      • Validar contra catálogo ISO (opcional pero recomendado).
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className='border-green-200 bg-emerald-50/40'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base font-semibold text-emerald-700'>
                    <CheckCircle2 className='h-4 w-4' />
                    Recomendaciones clave
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-2 text-sm text-emerald-800'>
                  <p>
                    Aplicar cacheo de monedas al iniciar la aplicación y
                    refrescar tras operaciones de escritura.
                  </p>
                  <p>
                    Considerar eliminación lógica cuando existan precios o tipos
                    de cambio asociados.
                  </p>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='exchange-rates'>
          <AccordionTrigger>
            <SectionHeader
              icon={ArrowLeftRight}
              title='Exchange Rates'
              description='Gestión histórica con consultas enriquecidas'
              badge='Crítico'
            />
          </AccordionTrigger>
          <AccordionContent>
            <div className='space-y-6'>
              <Card className='border-dashed'>
                <CardHeader>
                  <CardTitle className='text-base font-semibold'>
                    Endpoints y opciones de consulta
                  </CardTitle>
                  <CardDescription>
                    Combina consultas masivas, paginadas y de rango para cubrir
                    casos de dashboard, reportes y conciliaciones.
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-0'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Uso</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exchangeRateOperations.map(renderOperationRow)}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className='grid gap-4 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base font-semibold'>
                      Modelo enriquecido
                    </CardTitle>
                    <CardDescription>
                      Respuesta de /exchange-rate/enriched con metadatos
                      adicionales.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock>{`{
  "id": 1,
  "currency_id": 2,
  "currency_code": "USD",
  "currency_name": "Dólar Estadounidense",
  "rate_to_base": 7350.50,
  "date": "2025-10-08T00:00:00Z",
  "source": "BCP",
  "created_at": "2025-10-08T10:30:00Z"
}`}</CodeBlock>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base font-semibold'>
                      Advertencias operativas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2 text-sm text-rose-700'>
                    <p>
                      • No eliminar registros usados en transacciones
                      históricas.
                    </p>
                    <p>• PUT debe usarse solo con justificación y auditoría.</p>
                    <p>
                      • Validar variaciones fuera de rango antes de persistir.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base font-semibold'>
                    Consultas frecuentes
                  </CardTitle>
                </CardHeader>
                <CardContent className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2 text-sm'>
                    <h4 className='font-semibold text-foreground'>
                      Último tipo por moneda
                    </h4>
                    <CodeBlock>{`GET /exchange-rate/latest`}</CodeBlock>
                    <p className='text-muted-foreground'>
                      Ideal para dashboard y cálculos rápidos en UI.
                    </p>
                  </div>
                  <div className='space-y-2 text-sm'>
                    <h4 className='font-semibold text-foreground'>
                      Historial por rango
                    </h4>
                    <CodeBlock>{`GET /exchange-rate/currency/2/range?start_date=2025-10-01&end_date=2025-10-08`}</CodeBlock>
                    <p className='text-muted-foreground'>
                      Usar para gráficas y análisis de tendencias.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader>
          <SectionHeader
            icon={Layers}
            title='Casos de uso respaldados'
            description='Escenarios operativos probados end-to-end'
            badge='QA'
          />
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
            <h3 className='text-base font-semibold'>
              Formulario de pago en UI
            </h3>
            <p className='text-sm text-muted-foreground'>
              Consume GET /payment-methods para poblar selectores de forma
              instantánea y garantizar coherencia entre frontend y backend.
            </p>
          </div>
          <div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
            <h3 className='text-base font-semibold'>
              Configuración inicial de monedas
            </h3>
            <p className='text-sm text-muted-foreground'>
              Usa POST /currencies para registrar la moneda base (PYG) y monedas
              secundarias como USD o BRL.
            </p>
          </div>
          <div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
            <h3 className='text-base font-semibold'>
              Actualización diaria de tipos
            </h3>
            <p className='text-sm text-muted-foreground'>
              Automatiza POST /exchange-rate para cargar tasas desde BCP y
              garantizar precios actualizados.
            </p>
          </div>
          <div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
            <h3 className='text-base font-semibold'>
              Conversión a moneda extranjera
            </h3>
            <p className='text-sm text-muted-foreground'>
              Consulta{' '}
              <span className='font-mono'>
                GET /exchange-rate/currency/&#123;currency_id&#125;
              </span>{' '}
              y realiza la conversión en el frontend dividiendo el monto base
              por
              <span className='font-mono'> rate_to_base</span>.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeader
            icon={ShieldCheck}
            title='Checklist de validaciones'
            description='Validaciones pre y post procesamiento'
            badge='Obligatorio'
          />
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-3'>
          {validationMatrix.map(item => (
            <div
              key={item.title}
              className='space-y-3 rounded-lg border bg-card p-4 shadow-sm'
            >
              <h3 className='text-base font-semibold'>{item.title}</h3>
              <ul className='space-y-2 text-sm text-muted-foreground'>
                {item.checks.map(check => (
                  <li key={check} className='flex items-start gap-2'>
                    <span className='mt-1 h-1.5 w-1.5 rounded-full bg-primary' />
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeader
            icon={Terminal}
            title='Snippets cURL'
            description='Comandos listos para probar en QA'
            badge='Dev Ready'
          />
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-3'>
          {curlSnippets.map(block => (
            <div
              key={block.title}
              className='space-y-2 rounded-lg border bg-muted/20 p-4'
            >
              <h3 className='text-sm font-semibold uppercase tracking-wide'>
                {block.title}
              </h3>
              {block.commands.map(command => (
                <CodeBlock key={command}>{command}</CodeBlock>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeader
            icon={FileCode}
            title='Códigos de error consolidados'
            description='Resumen de respuestas HTTP y resolución'
            badge='Soporte'
          />
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Error</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aplica a</TableHead>
                <TableHead>Prevención</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorMatrix.map(error => (
                <TableRow key={error.code}>
                  <TableCell className='font-medium'>{error.code}</TableCell>
                  <TableCell>{error.status}</TableCell>
                  <TableCell>{error.appliesTo}</TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {error.prevention}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeader
            icon={Lightbulb}
            title='Mejores prácticas'
            description='Sugerencias para mantener consistencia y auditoría'
            badge='Recomendado'
          />
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          {bestPractices.map(tip => (
            <div
              key={tip.title}
              className='space-y-2 rounded-lg border bg-card p-4 shadow-sm'
            >
              <h3 className='text-base font-semibold'>{tip.title}</h3>
              <p className='text-sm text-muted-foreground'>{tip.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className='bg-muted/20'>
        <CardHeader>
          <SectionHeader
            icon={Database}
            title='Información de mantenimiento'
            description='Actualizada al 10 de Octubre de 2025'
            badge='Historial'
          />
        </CardHeader>
        <CardContent className='space-y-2 text-sm text-muted-foreground'>
          <p>
            • Versión 1.0 – Documentación consolidada de Payment Methods,
            Currencies y Exchange Rates.
          </p>
          <p>
            • Equipo responsable: Backend Core. Testing automatizado ✅ con
            scripts de regresión en QA.
          </p>
          <Separator className='my-4' />
          <p>
            Para solicitudes de cambio abre un ticket con el equipo de backend y
            adjunta el flujo afectado. Esta documentación sirve como fuente de
            verdad para integraciones internas y externas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentDocumentation
