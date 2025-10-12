import React, { useState } from 'react';
import { Package, Barcode, Hash, ChevronDown, ChevronRight, Settings, Edit3, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MetadataTemplateSelector from '@/components/ui/MetadataTemplateSelector';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { REASON_OPTIONS, DEFAULT_METADATA_TEMPLATES } from '@/constants/inventoryDefaults';

const ProductAdjustmentCard = ({ 
  product, 
  onClear, 
  onAdjustmentSubmit,
  initialQuantity = 0,
  initialReason = "PHYSICAL_COUNT",
  initialMetadata = {}
}) => {
  const { styles } = useThemeStyles();
  
  // Estados para el ajuste
  const [quantity, setQuantity] = useState(initialQuantity || product?.current_stock || 0);
  const [selectedReason, setSelectedReason] = useState(initialReason);
  const [customReason, setCustomReason] = useState('');
  const [useCustomReason, setUseCustomReason] = useState(false);
  const [metadata, setMetadata] = useState(() => {
    const template = DEFAULT_METADATA_TEMPLATES[selectedReason] || DEFAULT_METADATA_TEMPLATES.DEFAULT;
    const processedTemplate = {};
    
    // Procesar funciones en el template
    Object.keys(template).forEach(key => {
      if (typeof template[key] === 'function') {
        processedTemplate[key] = template[key]();
      } else {
        processedTemplate[key] = template[key];
      }
    });
    
    return { ...processedTemplate, ...initialMetadata };
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedMetadataTemplate, setSelectedMetadataTemplate] = useState(selectedReason);

  // Obtener la razón seleccionada
  const reasonOption = REASON_OPTIONS.find(r => r.value === selectedReason);
  const reasonText = useCustomReason ? customReason : (reasonOption?.label || 'Conteo físico');

  // Manejar cambio de razón
  const handleReasonChange = (newReason) => {
    setSelectedReason(newReason);
    setUseCustomReason(false);
    setCustomReason('');
    setSelectedMetadataTemplate(newReason);
    
    // Actualizar metadata template
    const template = DEFAULT_METADATA_TEMPLATES[newReason] || DEFAULT_METADATA_TEMPLATES.DEFAULT;
    const processedTemplate = {};
    
    Object.keys(template).forEach(key => {
      if (typeof template[key] === 'function') {
        processedTemplate[key] = template[key]();
      } else {
        processedTemplate[key] = template[key];
      }
    });
    
    setMetadata(processedTemplate);
  };

  // Manejar cambio de plantilla de metadata
  const handleMetadataTemplateChange = (templateKey) => {
    setSelectedMetadataTemplate(templateKey);
  };

  // Manejar cambio de metadata desde el selector
  const handleMetadataChange = (newMetadata) => {
    setMetadata(newMetadata);
  };

  // Enviar ajuste
  const handleSubmit = () => {
    const adjustmentData = {
      product_id: product.product_id || product.id,
      new_quantity: parseFloat(quantity),
      reason: useCustomReason ? customReason : reasonOption?.label || reasonText,
      metadata: {
        ...metadata,
        reason_type: selectedReason,
        custom_reason: useCustomReason,
        ui_submitted: true,
        submission_timestamp: new Date().toISOString()
      }
    };
    
    onAdjustmentSubmit(adjustmentData);
  };

  // Calcular diferencia
  const currentStock = product?.current_stock || product?.stock_quantity || 0;
  const difference = parseFloat(quantity) - currentStock;

  if (!product) return null;

  return (
    <div className={`${styles.card('p-6 mt-4 border-2 border-primary/20 bg-gradient-to-r from-blue-50 to-indigo-50')}`}>
      {/* Header del producto */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className={`${styles.header('h3')} mb-1 text-gray-900`}>
              {product.name || product.product_name}
            </h3>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Hash className="w-3 h-3" />
                <span>{product.product_id || product.id}</span>
              </div>
              
              {product.barcode && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Barcode className="w-3 h-3" />
                  <span>{product.barcode}</span>
                </div>
              )}
              
              {product.category?.name && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {product.category.name}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <Button 
          onClick={onClear}
          variant="outline"
          size="sm"
          className="text-gray-500 hover:text-red-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Información de stock */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-white rounded-lg border">
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">Stock Actual</div>
          <div className="text-lg font-bold text-gray-900">{currentStock}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">Nueva Cantidad</div>
          <div className="text-lg font-bold text-blue-600">{quantity}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">Diferencia</div>
          <div className={`text-lg font-bold ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {difference > 0 ? '+' : ''}{difference}
          </div>
        </div>
      </div>

      {/* Configuración del ajuste */}
      <div className="space-y-4">
        {/* Cantidad nueva */}
        <div>
          <label className={`${styles.label()} flex items-center gap-2 mb-2`}>
            <Settings className="w-4 h-4" />
            Nueva Cantidad de Stock
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={`${styles.input()} text-lg font-semibold`}
            placeholder="Cantidad física contada"
          />
        </div>

        {/* Razón del ajuste */}
        <div>
          <label className={`${styles.label()} mb-2`}>
            Razón del Ajuste
          </label>
          <div className="space-y-2">
            <select
              value={useCustomReason ? 'CUSTOM' : selectedReason}
              onChange={(e) => {
                if (e.target.value === 'CUSTOM') {
                  setUseCustomReason(true);
                } else {
                  handleReasonChange(e.target.value);
                }
              }}
              className={`${styles.input()} cursor-pointer`}
            >
              {REASON_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
              <option value="CUSTOM">📝 Razón personalizada</option>
            </select>
            
            {useCustomReason && (
              <Input
                type="text"
                placeholder="Describe la razón específica del ajuste..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className={styles.input()}
              />
            )}
          </div>
        </div>

        {/* Selector de plantillas de metadata */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Opciones avanzadas (Metadata)
          </button>
          
          {showAdvanced && (
            <div className="mt-3">
              <MetadataTemplateSelector
                selectedTemplate={selectedMetadataTemplate}
                onTemplateChange={handleMetadataTemplateChange}
                metadata={metadata}
                onMetadataChange={handleMetadataChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 mt-6 pt-4 border-t">
        <Button
          onClick={handleSubmit}
          variant="primary"
          className="flex-1"
          disabled={!quantity || (!useCustomReason && !selectedReason) || (useCustomReason && !customReason.trim())}
        >
          <Settings className="w-4 h-4 mr-2" />
          Aplicar Ajuste Manual
        </Button>
        <Button
          onClick={onClear}
          variant="outline"
          className="px-6"
        >
          Cancelar
        </Button>
      </div>
      
      {/* Info adicional */}
      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>💡 Resumen:</strong> Se ajustará el stock de "{product.name}" de {currentStock} a {quantity} unidades 
          ({difference > 0 ? `+${difference}` : difference} unidades). 
          Razón: {reasonText}
        </p>
      </div>
    </div>
  );
};

export default ProductAdjustmentCard;
