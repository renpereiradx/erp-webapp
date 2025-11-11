/**
 * Página de Detalle de Ajuste de Precio Específico - Patrón MVP
 * Muestra información detallada de un ajuste de precio individual
 * Siguiendo Fluent Design System 2 - Dashboard Layout
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import DataState from '@/components/ui/DataState';
import '@/styles/scss/pages/_price-adjustment-history-detail.scss';

const PriceAdjustmentHistoryDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adjustmentId } = useParams();

  // Estado del ajuste
  const [adjustment, setAdjustment] = useState(location.state?.adjustment || null);
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.adjustment);
  const [error, setError] = useState(null);

  // Cargar ajuste si no viene del estado de navegación
  useEffect(() => {
    if (adjustment) return;

    setLoading(true);
    setError(null);

    // Si no hay datos, mostramos error
    setError('Ajuste no encontrado');
    setLoading(false);
  }, [adjustmentId, adjustment]);

  // Handlers
  const handleBack = () => {
    navigate(-1);
  };

  // Estados de UI
  if (loading) {
    return <DataState variant="loading" />;
  }

  if (error || !adjustment) {
    return (
      <DataState
        variant="error"
        title="Error"
        message={error || 'Ajuste no encontrado'}
        onRetry={handleBack}
        actionLabel="Volver"
      />
    );
  }

  // Calcular datos
  const changePercent = adjustment.old_value > 0
    ? ((adjustment.value_change / adjustment.old_value) * 100).toFixed(2)
    : 0;
  const isIncrease = adjustment.value_change > 0;

  return (
    <div className="price-adjustment-history-detail">
      {/* Header con botón de volver y título */}
      <div className="detail-header">
        <button
          onClick={handleBack}
          className="back-button"
          aria-label="Volver"
        >
          <ArrowLeft className="back-button__icon" />
          <span className="back-button__text">Volver</span>
        </button>
        <h1 className="detail-title">Detalle del Ajuste de Precio</h1>
      </div>

      {/* Main Content - Single Column Layout como en referencia */}
      <div className="detail-content">
        {/* Información Superior: Producto y Usuario */}
        <div className="info-grid">
          <div className="info-section">
            <span className="info-label">Producto</span>
            <span className="info-value">{product ? `${product.product_name || product.name} (SKU: ${product.product_id || product.id})` : 'N/A'}</span>
          </div>

          <div className="info-section">
            <span className="info-label">Usuario</span>
            <div className="user-info">
              <div className="user-avatar">
                <span className="user-avatar__initials">{adjustment.user_id.substring(0, 2).toUpperCase()}</span>
              </div>
              <span className="info-value">{adjustment.user_id}</span>
            </div>
          </div>
        </div>

        {/* Fecha y Hora */}
        <div className="info-section info-section--full">
          <span className="info-label">Fecha y Hora</span>
          <span className="info-value">
            {new Date(adjustment.adjustment_date).toLocaleString('es-PY', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* Sección de Precios */}
        <div className="price-section">
          <div className="price-info">
            <span className="price-label">Valor Anterior</span>
            <span className="price-value price-value--old">
              PYG {adjustment.old_value.toLocaleString('es-PY')}
            </span>
          </div>

          <div className="price-info">
            <span className="price-label">Nuevo Valor</span>
            <span className={`price-value price-value--new price-value--${isIncrease ? 'increase' : 'decrease'}`}>
              PYG {adjustment.new_value.toLocaleString('es-PY')} {isIncrease ? '↓' : '↑'}
            </span>
          </div>

          <div className="price-change">
            <span className={`price-change__text price-change__text--${isIncrease ? 'increase' : 'decrease'}`}>
              Diferencia: {isIncrease ? '+' : ''}PYG {Math.abs(adjustment.value_change).toLocaleString('es-PY')} ({isIncrease ? '+' : ''}{changePercent}%)
            </span>
          </div>
        </div>

        {/* Unidad de Medida */}
        {adjustment.metadata?.unit && (
          <div className="info-section info-section--full">
            <span className="info-label">Unidad de Medida</span>
            <span className="info-value">{adjustment.metadata.unit}</span>
          </div>
        )}

        {/* Motivo del Ajuste */}
        <div className="reason-section">
          <h2 className="section-title">Motivo del Ajuste</h2>
          <p className="reason-text">{adjustment.reason}</p>
        </div>

        {/* Metadatos Adicionales en formato Tabla */}
        {adjustment.metadata && Object.keys(adjustment.metadata).length > 0 && (
          <div className="metadata-section">
            <h2 className="section-title">Metadatos Adicionales</h2>
            <table className="metadata-table">
              <thead>
                <tr>
                  <th className="metadata-table__header">Clave</th>
                  <th className="metadata-table__header">Valor</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(adjustment.metadata).map(([key, value]) => (
                  <tr key={key} className="metadata-table__row">
                    <td className="metadata-table__cell metadata-table__cell--key">{key}</td>
                    <td className="metadata-table__cell metadata-table__cell--value">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceAdjustmentHistoryDetail;
