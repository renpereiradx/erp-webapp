import React, { useState } from 'react';
import { 
  FileText, 
  Settings, 
  AlertTriangle, 
  Package, 
  ArrowRight, 
  CheckCircle, 
  Edit3,
  Camera,
  MapPin,
  User,
  Clock,
  Truck,
  RotateCcw,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { DEFAULT_METADATA_TEMPLATES } from '@/constants/inventoryDefaults';

const MetadataTemplateSelector = ({ 
  selectedTemplate = 'DEFAULT', 
  onTemplateChange, 
  metadata = {}, 
  onMetadataChange,
  className = "" 
}) => {
  const { styles } = useThemeStyles();
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [jsonString, setJsonString] = useState('');

  // Configuración de plantillas con iconos y descripciones
  const templateConfigs = {
    PHYSICAL_COUNT: {
      icon: Package,
      title: 'Conteo Físico',
      description: 'Para ajustes basados en conteo físico o inventario',
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      fields: [
        { key: 'operator', label: 'Operador', type: 'text', placeholder: 'warehouse_manager', icon: User },
        { key: 'location', label: 'Ubicación', type: 'text', placeholder: 'A1-B2', icon: MapPin },
        { key: 'verification', label: 'Verificación', type: 'select', options: [
          { value: 'single_check', label: 'Verificación simple' },
          { value: 'double_check', label: 'Verificación doble' }
        ], icon: CheckCircle },
        { key: 'counting_method', label: 'Método', type: 'select', options: [
          { value: 'manual', label: 'Manual' },
          { value: 'scanner', label: 'Escáner' }
        ], icon: Settings }
      ]
    },
    DAMAGED_GOODS: {
      icon: AlertTriangle,
      title: 'Producto Dañado',
      description: 'Para productos dañados, vencidos o defectuosos',
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      fields: [
        { key: 'damage_type', label: 'Tipo de daño', type: 'select', options: [
          { value: 'expired', label: 'Vencido' },
          { value: 'broken', label: 'Roto' },
          { value: 'contaminated', label: 'Contaminado' },
          { value: 'defective', label: 'Defectuoso' }
        ], icon: AlertTriangle },
        { key: 'damage_severity', label: 'Severidad', type: 'select', options: [
          { value: 'partial', label: 'Parcial' },
          { value: 'total', label: 'Total' }
        ], icon: AlertTriangle },
        { key: 'disposal_method', label: 'Método de disposición', type: 'select', options: [
          { value: 'discard', label: 'Descartar' },
          { value: 'return_supplier', label: 'Devolver a proveedor' },
          { value: 'repair', label: 'Reparar' }
        ], icon: RotateCcw },
        { key: 'photos_taken', label: 'Fotos tomadas', type: 'checkbox', icon: Camera },
        { key: 'insurance_claim', label: 'Reclamo de seguro', type: 'checkbox', icon: FileText }
      ]
    },
    SYSTEM_ERROR: {
      icon: Settings,
      title: 'Error del Sistema',
      description: 'Para correcciones por errores técnicos o de sistema',
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      fields: [
        { key: 'error_type', label: 'Tipo de error', type: 'select', options: [
          { value: 'sync_error', label: 'Error de sincronización' },
          { value: 'calculation_error', label: 'Error de cálculo' },
          { value: 'data_corruption', label: 'Corrupción de datos' }
        ], icon: AlertTriangle },
        { key: 'original_transaction', label: 'Transacción original', type: 'text', placeholder: 'TXN_123456', icon: Database },
        { key: 'detection_method', label: 'Método de detección', type: 'select', options: [
          { value: 'audit', label: 'Auditoría' },
          { value: 'user_report', label: 'Reporte de usuario' },
          { value: 'automatic', label: 'Automático' }
        ], icon: Settings },
        { key: 'corrected_by', label: 'Corregido por', type: 'text', placeholder: 'admin_user', icon: User },
        { key: 'approval_required', label: 'Requiere aprobación', type: 'checkbox', icon: CheckCircle }
      ]
    },
    INITIAL_STOCK: {
      icon: Database,
      title: 'Stock Inicial',
      description: 'Para configuración inicial de inventario',
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      fields: [
        { key: 'data_source', label: 'Fuente de datos', type: 'select', options: [
          { value: 'manual', label: 'Manual' },
          { value: 'import', label: 'Importación' },
          { value: 'system_migration', label: 'Migración de sistema' }
        ], icon: Database },
        { key: 'verified_by', label: 'Verificado por', type: 'text', placeholder: 'supervisor_name', icon: User },
        { key: 'cost_basis', label: 'Base de costo', type: 'text', placeholder: 'average_cost', icon: Settings },
        { key: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Información adicional...', icon: FileText }
      ]
    },
    TRANSFER: {
      icon: Truck,
      title: 'Transferencia',
      description: 'Para movimientos de transferencia entre ubicaciones',
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      fields: [
        { key: 'from_location', label: 'Ubicación origen', type: 'text', placeholder: 'Almacén A', icon: MapPin },
        { key: 'to_location', label: 'Ubicación destino', type: 'text', placeholder: 'Almacén B', icon: MapPin },
        { key: 'transfer_type', label: 'Tipo de transferencia', type: 'select', options: [
          { value: 'internal', label: 'Interna' },
          { value: 'external', label: 'Externa' }
        ], icon: Truck },
        { key: 'shipping_method', label: 'Método de envío', type: 'text', placeholder: 'Express, Regular...', icon: Truck },
        { key: 'tracking_number', label: 'Número de seguimiento', type: 'text', placeholder: 'TRK123456', icon: Package },
        { key: 'expected_delivery', label: 'Entrega esperada', type: 'date', icon: Clock }
      ]
    },
    DEFAULT: {
      icon: FileText,
      title: 'Básico',
      description: 'Plantilla básica con campos mínimos',
      color: 'gray',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      fields: [
        { key: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Información adicional sobre el ajuste...', icon: FileText }
      ]
    }
  };

  const currentTemplate = templateConfigs[selectedTemplate] || templateConfigs.DEFAULT;

  // Manejar cambio de plantilla
  const handleTemplateChange = (templateKey) => {
    const newTemplate = DEFAULT_METADATA_TEMPLATES[templateKey] || DEFAULT_METADATA_TEMPLATES.DEFAULT;
    const processedTemplate = {};
    
    // Procesar funciones en el template
    Object.keys(newTemplate).forEach(key => {
      if (typeof newTemplate[key] === 'function') {
        processedTemplate[key] = newTemplate[key]();
      } else {
        processedTemplate[key] = newTemplate[key];
      }
    });
    
    onTemplateChange(templateKey);
    onMetadataChange(processedTemplate);
  };

  // Manejar cambio de field específico
  const handleFieldChange = (fieldKey, value) => {
    const updatedMetadata = {
      ...metadata,
      [fieldKey]: value
    };
    onMetadataChange(updatedMetadata);
  };

  // Editor avanzado JSON
  const handleAdvancedEdit = () => {
    setJsonString(JSON.stringify(metadata, null, 2));
    setShowAdvancedEditor(true);
  };

  const handleSaveAdvanced = () => {
    try {
      const parsed = JSON.parse(jsonString);
      onMetadataChange(parsed);
      setShowAdvancedEditor(false);
    } catch (error) {
      alert('JSON inválido. Por favor verifica el formato.');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selector de plantillas */}
      <div>
        <label className={`${styles.label()} mb-3`}>
          Seleccionar Plantilla de Metadata
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(templateConfigs).map(([key, config]) => {
            const IconComponent = config.icon;
            const isSelected = selectedTemplate === key;
            
            return (
              <div
                key={key}
                onClick={() => handleTemplateChange(key)}
                className={`
                  ${config.bgColor} ${config.borderColor} border-2 rounded-lg p-3 cursor-pointer 
                  transition-all duration-200 hover:shadow-md
                  ${isSelected ? 'ring-2 ring-blue-300 shadow-md' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
                    <IconComponent className={`w-5 h-5 ${config.textColor}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${config.textColor}`}>
                      {config.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {config.description}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formulario dinámico para la plantilla seleccionada */}
      <div className={`${currentTemplate.bgColor} border ${currentTemplate.borderColor} rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <currentTemplate.icon className={`w-5 h-5 ${currentTemplate.textColor}`} />
            <h3 className={`font-semibold ${currentTemplate.textColor}`}>
              {currentTemplate.title}
            </h3>
          </div>
          <Button
            onClick={showAdvancedEditor ? handleSaveAdvanced : handleAdvancedEdit}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            {showAdvancedEditor ? 'Guardar JSON' : 'Editor JSON'}
          </Button>
        </div>

        {showAdvancedEditor ? (
          <div className="space-y-2">
            <textarea
              value={jsonString}
              onChange={(e) => setJsonString(e.target.value)}
              className={`${styles.input()} min-h-32 font-mono text-xs`}
              placeholder="Editar metadata en formato JSON..."
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveAdvanced} size="sm" className="text-xs">
                Guardar
              </Button>
              <Button 
                onClick={() => setShowAdvancedEditor(false)} 
                variant="outline" 
                size="sm" 
                className="text-xs"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {currentTemplate.fields.map((field) => {
              const FieldIcon = field.icon;
              const fieldValue = metadata[field.key] || '';

              return (
                <div key={field.key}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <FieldIcon className="w-4 h-4" />
                    {field.label}
                  </label>
                  
                  {field.type === 'text' && (
                    <Input
                      type="text"
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={`${styles.input()} text-sm`}
                    />
                  )}
                  
                  {field.type === 'select' && (
                    <select
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className={`${styles.input()} text-sm cursor-pointer`}
                    >
                      <option value="">Seleccionar...</option>
                      {field.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {field.type === 'textarea' && (
                    <textarea
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={`${styles.input()} text-sm min-h-20 resize-y`}
                    />
                  )}
                  
                  {field.type === 'checkbox' && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fieldValue === true}
                        onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                        className="accent-blue-600"
                      />
                      <span>Sí</span>
                    </label>
                  )}
                  
                  {field.type === 'date' && (
                    <Input
                      type="date"
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className={`${styles.input()} text-sm`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumen de metadata */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Resumen de Metadata:</h4>
        <div className="text-xs text-gray-600 space-y-1">
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="font-medium">{key}:</span>
              <span className="max-w-32 truncate">
                {typeof value === 'boolean' ? (value ? 'Sí' : 'No') :
                 typeof value === 'object' ? JSON.stringify(value) : 
                 String(value) || 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetadataTemplateSelector;