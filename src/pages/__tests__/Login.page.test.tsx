/**
 * Login — página de acceso al ERP.
 *
 * Contrato cubierto:
 * - Validación Zod (src/domain/auth/loginForm): submit vacío muestra las
 *   claves i18n "required" por campo y NO llama a login; credenciales
 *   válidas llaman a login y navegan a /select-branch.
 * - Error del AuthContext: se muestra tal cual (string crudo del backend /
 *   sesión expirada), sin reescribirlo con el genérico.
 * - Badge de modo demo solo con DEMO_CONFIG.enabled.
 * - Toggle de visibilidad del PasswordInput compartido.
 *
 * Mocks en la frontera: AuthContext, demoAuth, react-router (useNavigate) e
 * i18n (firma real t(key, fallback?, vars?)). lucide-react NO se mockea
 * (PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../Login'

const authState = vi.hoisted(() => ({
  login: vi.fn(),
  loading: false,
  error: null as string | null,
  clearError: vi.fn(),
}))

const demoState = vi.hoisted(() => ({
  enabled: false,
}))

const navState = vi.hoisted(() => ({
  navigate: vi.fn(),
}))

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (key: string, fallbackOrVars?: string | Record<string, unknown>, maybeVars?: Record<string, unknown>) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      const vars = (typeof fallbackOrVars === 'object' && fallbackOrVars !== null ? fallbackOrVars : maybeVars) ?? {}
      if (fallback === undefined) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
    },
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

vi.mock('@/config/demoAuth', () => ({
  DEMO_CONFIG: {
    get enabled() {
      return demoState.enabled
    },
  },
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => navState.navigate,
  }
})

const renderLogin = () => render(<Login />)

const getSubmitButton = () =>
  screen.getByRole('button', { name: /sesión/i })

beforeEach(() => {
  authState.login.mockReset()
  authState.clearError.mockReset()
  authState.loading = false
  authState.error = null
  demoState.enabled = false
  navState.navigate.mockReset()
})

describe('Login', () => {
  it('renderiza título, labels y botón de submit', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: /acceso al sistema/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email o usuario/i)).toBeInTheDocument()
    // Anclada: el toggle del password trae aria-label "…contraseña"
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument()
    expect(getSubmitButton()).toBeInTheDocument()
  })

  it('submit vacío: muestra claves "required" por campo y NO llama a login', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(getSubmitButton())

    expect(screen.getByText('login.validation.username.required')).toBeInTheDocument()
    expect(screen.getByText('login.validation.password.required')).toBeInTheDocument()
    expect(authState.login).not.toHaveBeenCalled()
  })

  it('credenciales válidas: llama a login y navega a /select-branch', async () => {
    const user = userEvent.setup()
    authState.login.mockResolvedValue({ success: true })
    renderLogin()

    await user.type(screen.getByLabelText(/email o usuario/i), 'admin')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'admin123')
    await user.click(getSubmitButton())

    await waitFor(() => {
      expect(authState.login).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin123',
      })
    })
    await waitFor(() => {
      expect(navState.navigate).toHaveBeenCalledWith('/select-branch')
    })
  })

  it('login fallido: no navega', async () => {
    const user = userEvent.setup()
    authState.login.mockResolvedValue({ success: false, message: 'Credenciales incorrectas' })
    renderLogin()

    await user.type(screen.getByLabelText(/email o usuario/i), 'admin')
    await user.type(screen.getByLabelText(/^contraseña$/i), 'wrong-password')
    await user.click(getSubmitButton())

    await waitFor(() => {
      expect(authState.login).toHaveBeenCalled()
    })
    expect(navState.navigate).not.toHaveBeenCalled()
  })

  it('muestra el error del AuthContext tal cual (string crudo, role=alert)', async () => {
    authState.error = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
    renderLogin()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
    )
  })

  it('badge de modo demo solo visible con DEMO_CONFIG.enabled', () => {
    const { unmount } = renderLogin()
    expect(screen.queryByText(/modo demo activo/i)).not.toBeInTheDocument()
    unmount()

    demoState.enabled = true
    renderLogin()
    expect(screen.getByText(/modo demo activo/i)).toBeInTheDocument()
  })

  it('el toggle del PasswordInput alterna el tipo del input de contraseña', async () => {
    const user = userEvent.setup()
    renderLogin()

    const passwordInput = screen.getByLabelText(/^contraseña$/i)
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Estado inicial: oculta → el botón ofrece mostrarla
    await user.click(screen.getByRole('button', { name: /mostrar contraseña/i }))
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: /ocultar contraseña/i }))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('el error de un campo se limpia al tipear', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(getSubmitButton())
    expect(screen.getByText('login.validation.username.required')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/email o usuario/i), 'a')
    expect(screen.queryByText('login.validation.username.required')).not.toBeInTheDocument()
  })

  it('loading deshabilita el botón de submit', () => {
    authState.loading = true
    renderLogin()
    expect(getSubmitButton()).toBeDisabled()
  })
})
