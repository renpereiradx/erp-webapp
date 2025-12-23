import React, { useState } from 'react'
import {
  Package,
  AlertTriangle,
  Settings,
  Database,
  Truck,
  FileText,
  User,
  MapPin,
  CheckCircle
} from 'lucide-react'
import { DEFAULT_METADATA_TEMPLATES } from '@/constants/inventoryDefaults'

const TemplateMetadataSelector = ({
  selectedTemplate = 'PHYSICAL_COUNT',
  onTemplateChange,
  metadata = {},
  onMetadataChange
}) => {
  const [showFields, setShowFields] = useState(true)

  // Configuración de plantillas
  const templateConfigs = {
    PHYSICAL_COUNT: {
      icon: Package,
      title: 'Conteo Físico',
      description: 'Para ajustes basados en conteo físico',
      color: 'blue',
      fields: [
        { key: 'operator', label: 'Operador', type: 'text', placeholder: 'Nombre del operador', icon: User },
        { key: 'location', label: 'Ubicación', type: 'text', placeholder: 'Ej: Almacén A', icon: MapPin },
        { key: 'verification', label: 'Verificación', type: 'select', options: [
          { value: 'single_check', label: 'Verificación simple' },
          { value: 'double_check', label: 'Verificación doble' },
          { value: 'triple_check', label: 'Verificación triple' }
        ], icon: CheckCircle },
        { key: 'counting_method', label: 'Método de conteo', type: 'select', options: [
          { value: 'manual', label: 'Manual' },
          { value: 'barcode_scanner', label: 'Escáner de código de barras' },
          { value: 'rfid', label: 'RFID' },
          { value: 'weight_scale', label: 'Báscula' }
        ], icon: Settings }
      ]
    },
    DAMAGED_GOODS: {
      icon: AlertTriangle,
      title: 'Producto Dañado',
      description: 'Para productos dañados o defectuosos',
      color: 'orange',
      fields: [
        { key: 'damage_type', label: 'Tipo de daño', type: 'select', options: [
          { value: 'expired', label: 'Vencido' },
          { value: 'physical_damage', label: 'Daño físico' },
          { value: 'quality_issue', label: 'Problema de calidad' },
          { value: 'contaminated', label: 'Contaminado' },
          { value: 'other', label: 'Otro' }
        ], icon: AlertTriangle },
        { key: 'severity', label: 'Severidad', type: 'select', options: [
          { value: 'minor', label: 'Menor' },
          { value: 'moderate', label: 'Moderado' },
          { value: 'severe', label: 'Severo' },
          { value: 'total_loss', label: 'Pérdida total' }
        ], icon: AlertTriangle },
        { key: 'disposal_method', label: 'Método de disposición', type: 'select', options: [
          { value: 'return_supplier', label: 'Devolver a proveedor' },
          { value: 'donate', label: 'Donar' },
          { value: 'destroy', label: 'Destruir' },
          { value: 'repair', label: 'Reparar' }
        ], icon: Settings }
      ]
    },
    SYSTEM_ERROR: {
      icon: Settings,
      title: 'Error del Sistema',
      description: 'Corrección por error técnico',
      color: 'red',
      fields: [
        { key: 'error_type', label: 'Tipo de error', type: 'select', options: [
          { value: 'sync_error', label: 'Error de sincronización' },
          { value: 'duplicate_entry', label: 'Entrada duplicada' },
          { value: 'calculation_error', label: 'Error de cálculo' },
          { value: 'integration_failure', label: 'Fallo de integración' },
          { value: 'other', label: 'Otro' }
        ], icon: AlertTriangle },
        { key: 'system_source', label: 'Sistema origen', type: 'text', placeholder: 'Ej: ERP, WMS', icon: Database },
        { key: 'error_code', label: 'Código de error', type: 'text', placeholder: 'Ej: ERR-001', icon: Settings }
      ]
    },
    INITIAL_STOCK: {
      icon: Database,
      title: 'Stock Inicial',
      description: 'Configuración inicial de inventario',
      color: 'green',
      fields: [
        { key: 'source', label: 'Fuente', type: 'select', options: [
          { value: 'new_warehouse', label: 'Nuevo almacén' },
          { value: 'migration', label: 'Migración' },
          { value: 'supplier_transfer', label: 'Transferencia de proveedor' },
          { value: 'manufacturing', label: 'Manufactura' }
        ], icon: Database },
        { key: 'reference_document', label: 'Documento de referencia', type: 'text', placeholder: 'Ej: DOC-123', icon: FileText },
        { key: 'batch_number', label: 'Número de lote', type: 'text', placeholder: 'Ej: LOTE-001', icon: Package }
      ]
    },
    TRANSFER: {
      icon: Truck,
      title: 'Transferencia',
      description: 'Movimiento entre ubicaciones',
      color: 'purple',
      fields: [
        { key: 'origin_location', label: 'Ubicación origen', type: 'text', placeholder: 'Ej: Almacén A', icon: MapPin },
        { key: 'destination_location', label: 'Ubicación destino', type: 'text', placeholder: 'Ej: Almacén B', icon: MapPin },
        { key: 'transfer_type', label: 'Tipo de transferencia', type: 'select', options: [
          { value: 'warehouse_to_warehouse', label: 'Almacén a almacén' },
          { value: 'warehouse_to_store', label: 'Almacén a tienda' },
          { value: 'store_to_store', label: 'Tienda a tienda' }
        ], icon: Truck },
        { key: 'reference_document', label: 'Documento de referencia', type: 'text', placeholder: 'Ej: TRANS-123', icon: FileText }
      ]
    },
    DEFAULT: {
      icon: FileText,
      title: 'Básico',
      description: 'Plantilla básica sin campos adicionales',
      color: 'gray',
      fields: []
    }
  }

  const currentTemplate = templateConfigs[selectedTemplate] || templateConfigs.DEFAULT

  // Manejar cambio de plantilla
  const handleTemplateChange = (templateKey) => {
    const newTemplate = DEFAULT_METADATA_TEMPLATES[templateKey] || DEFAULT_METADATA_TEMPLATES.DEFAULT
    const processedTemplate = {}

    // Procesar funciones en el template
    Object.keys(newTemplate).forEach(key => {
      if (typeof newTemplate[key] === 'function') {
        processedTemplate[key] = newTemplate[key]()
      } else {
        processedTemplate[key] = newTemplate[key]
      }
    })

    onTemplateChange(templateKey)
    onMetadataChange(processedTemplate)
  }

  // Manejar cambio de field específico
  const handleFieldChange = (fieldKey, value) => {
    const updatedMetadata = {
      ...metadata,
      [fieldKey]: value
    }
    onMetadataChange(updatedMetadata)
  }

  return (
    <div className='template-metadata-selector'>
      {/* Selector de plantillas */}
      <div className='template-metadata-selector__header'>
        <label className='template-metadata-selector__label'>
          Plantilla de Metadata
        </label>
        <button
          type='button'
          className='template-metadata-selector__toggle'
          onClick={() => setShowFields(!showFields)}
        >
          {showFields ? 'Ocultar campos' : 'Mostrar campos'}
        </button>
      </div>

      <div className='template-metadata-selector__grid'>
        {Object.entries(templateConfigs).map(([key, config]) => {
          const IconComponent = config.icon
          const isSelected = selectedTemplate === key

          return (
            <button
              key={key}
              type='button'
              onClick={() => handleTemplateChange(key)}
              className={`template-card template-card--${config.color} ${isSelected ? 'template-card--selected' : ''}`}
            >
              <div className='template-card__icon'>
                <IconComponent size={20} strokeWidth={2} />
              </div>
              <div className='template-card__content'>
                <h4 className='template-card__title'>{config.title}</h4>
                <p className='template-card__description'>{config.description}</p>
              </div>
              {isSelected && (
                <div className='template-card__check'>
                  <CheckCircle size={18} strokeWidth={2} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Campos dinámicos */}
      {showFields && currentTemplate.fields.length > 0 && (
        <div className='template-metadata-selector__fields'>
          <h4 className='template-metadata-selector__fields-title'>
            Campos de {currentTemplate.title}
          </h4>
          <div className='template-metadata-selector__fields-grid'>
            {currentTemplate.fields.map((field) => {
              const FieldIcon = field.icon
              const fieldValue = metadata[field.key] || ''

              return (
                <div key={field.key} className='template-field'>
                  <label className='template-field__label'>
                    <FieldIcon className='template-field__icon' size={16} strokeWidth={2} />
                    {field.label}
                  </label>

                  {field.type === 'text' && (
                    <input
                      type='text'
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className='template-field__input'
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className='template-field__select'
                    >
                      <option value=''>Seleccionar...</option>
                      {field.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default TemplateMetadataSelector
