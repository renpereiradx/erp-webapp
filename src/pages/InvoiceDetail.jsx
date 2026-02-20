import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Download, 
  Send, 
  CreditCard, 
  History as HistoryIcon,
  FileText as DescriptionIcon,
  Building2 as BusinessIcon,
  Zap as BoltIcon,
  MapPin,
  Check,
  Plus,
  Mail,
  DollarSign,
  User,
  AtSign,
  Store,
  Clock,
  ChevronLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

/**
 * Detalle de Factura de Pagos e Historial (Payables)
 * 100% STITCH FIDELITY - ZERO TAILWIND
 */
const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);

  const invoice = {
    id: id || 'po_001',
    status: 'PARCIAL',
    montoOriginal: 12450.00,
    montoPagado: 4500.00,
    saldoPendiente: 7950.00,
    progreso: 36.1,
    detalle: {
      emision: '12 Oct, 2023',
      vencimiento: '11 Nov, 2023',
      terminos: 'Net 30 días',
      prioridad: 'Alta'
    },
    proveedor: {
      nombre: 'Suministros Industriales S.A.',
      ruc: '800.231.990-1',
      contacto: 'Carlos Rodriguez',
      email: 'c.rodriguez@sumindustriales.co',
      direccion: 'Av. Industrial #45-12, Piso 4, Bogotá, Colombia'
    },
    pagos: [
      { id: '#PY-00124', fecha: '15 Oct, 2023', metodo: 'Transferencia', ref: 'TXN-8829-KB', user: 'A. Mendoza', userInit: 'AM', monto: 2500.00 },
      { id: '#PY-00138', fecha: '28 Oct, 2023', metodo: 'Tarjeta Corp.', ref: 'VISA-4421-XX', user: 'A. Mendoza', userInit: 'AM', monto: 2000.00 },
    ],
    actividad: [
      { titulo: 'Factura Creada', desc: 'Sistema Automatizado', date: '12 Oct, 2023 · 08:45 AM', type: 'add', color: 'primary' },
      { titulo: 'Pago #PY-00124 Registrado', desc: 'Por: Alejandro Mendoza', date: '15 Oct, 2023 · 02:20 PM', type: 'check', color: 'success' },
      { titulo: 'Recordatorio Enviado', desc: 'Automático (3 días antes del vto)', date: '08 Nov, 2023 · 09:00 AM', type: 'email', color: 'neutral' },
      { titulo: 'Nuevo Pago Registrado', desc: 'Por: Alejandro Mendoza', date: '10 Nov, 2023 · 11:32 AM', type: 'money', color: 'primary' },
    ]
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const formatUSD = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  if (loading) return (
    <div className="invoice-detail__loading">
      <div className="invoice-detail__spinner"></div>
    </div>
  );

  return (
    <div className="invoice-detail animate-in fade-in duration-500">
      
      {/* Breadcrumbs */}
      <nav className="invoice-detail__nav">
        <Link to="/finance/invoices">Cuentas por Pagar</Link>
        <span className="invoice-detail__nav-separator">/</span>
        <span className="invoice-detail__nav-current">Detalle de Factura</span>
      </nav>

      {/* Header */}
      <header className="invoice-detail__header">
        <div className="invoice-detail__header-title">
          <button 
            onClick={() => navigate(-1)} 
            className="invoice-detail__btn invoice-detail__btn--secondary invoice-detail__btn--icon-only"
          >
            <ChevronLeft size={20} />
          </button>
          <h1>Factura #{invoice.id}</h1>
          <Badge variant="warning">{invoice.status}</Badge>
        </div>
        <div className="invoice-detail__header-actions">
          <button className="invoice-detail__btn invoice-detail__btn--secondary">
            <Download size={18} /> Descargar PDF
          </button>
          <button className="invoice-detail__btn invoice-detail__btn--secondary">
            <Send size={18} /> Enviar Recordatorio
          </button>
          <button className="invoice-detail__btn invoice-detail__btn--primary">
            <CreditCard size={18} /> Registrar Pago
          </button>
        </div>
      </header>

      {/* KPI Summary Bar */}
      <div className="invoice-detail__kpis">
        <div className="invoice-detail__kpi-card">
          <span className="invoice-detail__kpi-label">Monto Original</span>
          <div className="invoice-detail__kpi-value">{formatUSD(invoice.montoOriginal)}</div>
          <div className="invoice-detail__progress-track">
            <div className="invoice-detail__progress-bar--neutral" style={{ width: '100%' }}></div>
          </div>
        </div>
        <div className="invoice-detail__kpi-card invoice-detail__kpi-card--success">
          <span className="invoice-detail__kpi-label">Monto Pagado</span>
          <div className="invoice-detail__kpi-value invoice-detail__kpi-value--success">{formatUSD(invoice.montoPagado)}</div>
          <div className="invoice-detail__progress-track">
            <div className="invoice-detail__progress-bar--success" style={{ width: `${invoice.progreso}%` }}></div>
          </div>
        </div>
        <div className="invoice-detail__kpi-card invoice-detail__kpi-card--primary">
          <span className="invoice-detail__kpi-label">Saldo Pendiente</span>
          <div className="invoice-detail__kpi-value invoice-detail__kpi-value--primary">{formatUSD(invoice.saldoPendiente)}</div>
          <div className="invoice-detail__progress-track">
            <div className="invoice-detail__progress-bar--primary" style={{ width: `${100 - invoice.progreso}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="invoice-detail__main-grid">
        
        <div className="invoice-detail__content-col">
          <section className="invoice-detail__card">
            <div className="invoice-detail__card-header">
              <h2><DescriptionIcon size={18} /> Detalle de la Orden</h2>
              <span className="invoice-detail__nav-separator text-xs text-tertiary italic">ID de Sistema: OR-45920-X</span>
            </div>
            <div className="invoice-detail__card-body">
              <div className="invoice-detail__detail-grid">
                <div className="invoice-detail__detail-item">
                  <span className="invoice-detail__detail-label">Fecha de Emisión</span>
                  <span className="invoice-detail__detail-value">{invoice.detalle.emision}</span>
                </div>
                <div className="invoice-detail__detail-item">
                  <span className="invoice-detail__detail-label">Fecha de Vencimiento</span>
                  <span className="invoice-detail__detail-value invoice-detail__detail-value--danger">{invoice.detalle.vencimiento}</span>
                </div>
                <div className="invoice-detail__detail-item">
                  <span className="invoice-detail__detail-label">Términos de Crédito</span>
                  <span className="invoice-detail__detail-value">{invoice.detalle.terminos}</span>
                </div>
                <div className="invoice-detail__detail-item">
                  <span className="invoice-detail__detail-label">Prioridad</span>
                  <div className="invoice-detail__detail-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' }}></span>
                    {invoice.detalle.prioridad}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="invoice-detail__card">
            <div className="invoice-detail__card-header">
              <h2><HistoryIcon size={18} /> Historial de Pagos</h2>
            </div>
            <div className="invoice-detail__table-container">
              <table className="invoice-detail__table">
                <thead>
                  <tr>
                    <th>ID de Pago</th>
                    <th>Fecha</th>
                    <th>Método</th>
                    <th>Referencia</th>
                    <th>Registrado por</th>
                    <th style={{ textAlign: 'right' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.pagos.map((pago, idx) => (
                    <tr key={idx}>
                      <td className="invoice-detail__table-id">{pago.id}</td>
                      <td>{pago.fecha}</td>
                      <td>{pago.metodo}</td>
                      <td style={{ color: '#64748b' }}>{pago.ref}</td>
                      <td>
                        <div className="invoice-detail__user-cell">
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>{pago.userInit}</div>
                          <span>{pago.user}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatUSD(pago.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="invoice-detail__table-footer">
              <span style={{ fontSize: '14px', color: '#64748b', marginRight: '16px' }}>Total Pagado:</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>{formatUSD(invoice.montoPagado)}</span>
            </div>
          </section>
        </div>

        <aside className="invoice-detail__sidebar-col">
          <section className="invoice-detail__card">
            <div className="invoice-detail__card-header">
              <h2><BusinessIcon size={18} /> Información del Proveedor</h2>
            </div>
            <div className="invoice-detail__card-body">
              <div className="invoice-detail__vendor-header">
                <div className="invoice-detail__vendor-icon">
                  <Store size={32} />
                </div>
                <div className="invoice-detail__vendor-name">
                  <h3>{invoice.proveedor.nombre}</h3>
                  <p>NIT: {invoice.proveedor.ruc}</p>
                </div>
              </div>
              <div className="invoice-detail__vendor-info-list">
                <div className="invoice-detail__vendor-info-item">
                  <User size={18} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#94a3b8' }}>Contacto Principal</span>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{invoice.proveedor.contacto}</span>
                  </div>
                </div>
                <div className="invoice-detail__vendor-info-item">
                  <AtSign size={18} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#94a3b8' }}>Correo Electrónico</span>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{invoice.proveedor.email}</span>
                  </div>
                </div>
                <div className="invoice-detail__vendor-info-item">
                  <MapPin size={18} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#94a3b8' }}>Dirección</span>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{invoice.proveedor.direccion}</span>
                  </div>
                </div>
              </div>
              <button className="invoice-detail__btn invoice-detail__btn--outline-primary invoice-detail__btn--full" style={{ marginTop: '24px' }}>
                Ver Perfil del Proveedor
              </button>
            </div>
          </section>

          <section className="invoice-detail__card">
            <div className="invoice-detail__card-header">
              <h2><BoltIcon size={18} /> Línea de Tiempo</h2>
            </div>
            <div className="invoice-detail__card-body">
              <div className="invoice-detail__timeline">
                <div className="invoice-detail__timeline-line"></div>
                {invoice.actividad.map((act, idx) => (
                  <div key={idx} className="invoice-detail__timeline-item">
                    <div className={`invoice-detail__timeline-bullet invoice-detail__timeline-bullet--${act.color}`}>
                      {act.type === 'add' && <Plus size={14} />}
                      {act.type === 'check' && <Check size={14} />}
                      {act.type === 'email' && <Mail size={14} />}
                      {act.type === 'money' && <DollarSign size={14} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>{act.titulo}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{act.desc}</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{act.date}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="invoice-detail__btn invoice-detail__btn--ghost-subtle invoice-detail__btn--full" style={{ marginTop: '32px' }}>
                Ver historial completo
              </button>
            </div>
          </section>

          <div className="invoice-detail__map-card">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6VeuvkJhpjU6CLSV4cjBWbM0cW9WgzmT4Z3pBgfKDd9h6VFKucKaDlRtMm94u4KsQeVHIxrKsksEzbzrSWa8vlhCoe-f29C0vPjLLTF48QnpTh-SNUTihNWbC3bGgq07l3YPVozVEp2PCCYOGg5_qMk8vNjeBX6UZr_94ZoCqrR8Zc6Cb7zoZOvZ8T2SGikiK59Rv36_owBuRZnZ_X98grhXoj3AwPDf_HHB-kMsbgRWX5--gdG7aUPvY6rnX93k-UbRF1_WsLg" alt="Mapa" />
            <div className="invoice-detail__map-badge">
              <MapPin size={14} style={{ color: '#137fec' }} />
              Sede Norte, Bogotá
            </div>
          </div>
        </aside>
      </div>

      <footer className="invoice-detail__page-footer">
        <div>© 2023 ERP System Enterprise. Todos los derechos reservados.</div>
        <div className="invoice-detail__footer-links">
          <a href="#">Política de Privacidad</a>
          <a href="#">Soporte Técnico</a>
          <a href="#">Documentación API</a>
        </div>
      </footer>
    </div>
  );
};

export default InvoiceDetail;
