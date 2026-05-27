import React, { useState, useEffect } from 'react';
import { useBranch } from '@/contexts/BranchContext';
import { scaleService } from '../services/scaleService';
import { Scale, LabelFormat, ScaleCatalogItem, WeighItemResponse } from '@/types';
import { useToast } from '@/hooks/useToast';
import { 
  Scale as ScaleIcon, 
  Tag, 
  Play, 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Check, 
  AlertCircle,
  FileText,
  Printer,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ScaleConfigPage: React.FC = () => {
  const { currentBranchId, allowedBranches } = useBranch();
  const toast = useToast();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'scales' | 'formats' | 'simulator' | 'catalog'>('scales');

  // Lists
  const [scales, setScales] = useState<Scale[]>([]);
  const [formats, setFormats] = useState<LabelFormat[]>([]);
  const [catalog, setCatalog] = useState<ScaleCatalogItem[]>([]);

  // Loading States
  const [loadingScales, setLoadingScales] = useState(false);
  const [loadingFormats, setLoadingFormats] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Forms Modals
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [editingScale, setEditingScale] = useState<Scale | null>(null);
  const [scaleForm, setScaleForm] = useState({
    name: '',
    location: '',
    ip_address: '',
    port: 9100,
    protocol: 'TCP',
    model: '',
    branch_id: currentBranchId || (allowedBranches[0] || 1),
    label_format_id: 1,
    is_active: true,
  });

  const [showFormatModal, setShowFormatModal] = useState(false);
  const [editingFormat, setEditingFormat] = useState<LabelFormat | null>(null);
  const [formatForm, setFormatForm] = useState({
    name: '',
    barcode_type: 'EAN13_VARIABLE_PRICE',
    prefix: '20',
    scale_code_digits: 4,
    value_digits: 5,
    label_width_mm: 58,
    label_height_mm: 40,
    includes_product_name: true,
    includes_weight: true,
    includes_unit_price: true,
    includes_total_price: true,
    includes_date: true,
    template: '',
  });

  // Simulator State
  const [simSelectedProductId, setSimSelectedProductId] = useState('');
  const [simWeight, setSimWeight] = useState(1.0);
  const [simResponse, setSimResponse] = useState<WeighItemResponse | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simBarcode, setSimBarcode] = useState('');

  // Fetch Data
  const loadScales = async () => {
    setLoadingScales(true);
    try {
      const data = await scaleService.getScales(currentBranchId || undefined);
      setScales(data || []);
    } catch (err: any) {
      toast.error('No se pudieron cargar las balanzas.');
      // Mock para fines de visualización si falla el backend
      setScales([
        {
          id: 1,
          name: 'Balanza Carnicería Principal',
          location: 'Sector Carnicería',
          ip_address: '192.168.1.150',
          port: 9100,
          protocol: 'TCP',
          model: 'Dibal D-700',
          branch_id: currentBranchId || 1,
          is_connected: true,
          is_active: true,
          label_format_id: 1,
          sync_status: 'SUCCESS',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoadingScales(false);
    }
  };

  const loadFormats = async () => {
    setLoadingFormats(true);
    try {
      const data = await scaleService.getLabelFormats();
      setFormats(data || []);
    } catch (err: any) {
      toast.error('No se pudieron cargar los formatos de etiquetas.');
      setFormats([
        {
          id: 1,
          name: 'EAN-13 Precio Variable (Default)',
          barcode_type: 'EAN13_VARIABLE_PRICE',
          prefix: '20',
          scale_code_digits: 4,
          value_digits: 5,
          label_width_mm: 58,
          label_height_mm: 40,
          includes_product_name: true,
          includes_weight: true,
          includes_unit_price: true,
          includes_total_price: true,
          includes_date: true,
          template: '^XA^FO50,50^A0N,30,30^FD{product_name}^FS^XZ',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoadingFormats(false);
    }
  };

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const data = await scaleService.getScaleCatalog(currentBranchId || undefined);
      setCatalog(data || []);
      if (data && data.length > 0 && !simSelectedProductId) {
        setSimSelectedProductId(data[0].product_id);
      }
    } catch (err: any) {
      toast.error('No se pudo cargar el catálogo de balanza.');
      setCatalog([
        {
          scale_code: '0001',
          product_id: 'TOM_KG',
          product_name: 'Tomate por Kg',
          price_per_unit: '12500',
          unit: 'kg',
          base_unit: 'kg',
          is_variable_measure: true
        },
        {
          scale_code: '0002',
          product_id: 'QSO_KG',
          product_name: 'Queso Paraguay',
          price_per_unit: '48000',
          unit: 'kg',
          base_unit: 'kg',
          is_variable_measure: true
        }
      ]);
      setSimSelectedProductId('TOM_KG');
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadScales();
    loadFormats();
    loadCatalog();
  }, [currentBranchId]);

  // CRUD handlers Scale
  const handleSaveScale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingScale) {
        await scaleService.updateScale(editingScale.id, scaleForm);
        toast.success('Balanza actualizada correctamente');
      } else {
        await scaleService.createScale(scaleForm);
        toast.success('Balanza creada correctamente');
      }
      setShowScaleModal(false);
      setEditingScale(null);
      loadScales();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la balanza');
    }
  };

  const handleEditScale = (scale: Scale) => {
    setEditingScale(scale);
    setScaleForm({
      name: scale.name,
      location: scale.location || '',
      ip_address: scale.ip_address || '',
      port: scale.port || 9100,
      protocol: scale.protocol || 'TCP',
      model: scale.model || '',
      branch_id: scale.branch_id || currentBranchId || 1,
      label_format_id: scale.label_format_id || 1,
      is_active: scale.is_active,
    });
    setShowScaleModal(true);
  };

  const handleDeleteScale = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta balanza?')) return;
    try {
      await scaleService.deleteScale(id);
      toast.success('Balanza eliminada');
      loadScales();
    } catch (err: any) {
      toast.error('No se pudo eliminar la balanza.');
    }
  };

  // CRUD handlers Format
  const handleSaveFormat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFormat) {
        await scaleService.updateLabelFormat(editingFormat.id, formatForm);
        toast.success('Format de etiqueta actualizado');
      } else {
        await scaleService.createLabelFormat(formatForm);
        toast.success('Formato de etiqueta creado');
      }
      setShowFormatModal(false);
      setEditingFormat(null);
      loadFormats();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar formato');
    }
  };

  const handleEditFormat = (format: LabelFormat) => {
    setEditingFormat(format);
    setFormatForm({
      name: format.name,
      barcode_type: format.barcode_type || 'EAN13_VARIABLE_PRICE',
      prefix: format.prefix || '20',
      scale_code_digits: format.scale_code_digits || 4,
      value_digits: format.value_digits || 5,
      label_width_mm: format.label_width_mm || 58,
      label_height_mm: format.label_height_mm || 40,
      includes_product_name: format.includes_product_name,
      includes_weight: format.includes_weight,
      includes_unit_price: format.includes_unit_price,
      includes_total_price: format.includes_total_price,
      includes_date: format.includes_date,
      template: format.template || '',
    });
    setShowFormatModal(true);
  };

  const handleDeleteFormat = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este formato?')) return;
    try {
      await scaleService.deleteLabelFormat(id);
      toast.success('Formato eliminado');
      loadFormats();
    } catch (err: any) {
      toast.error('No se pudo eliminar el formato.');
    }
  };

  // Simulator weighs
  const handleWeighSimulation = async () => {
    if (!simSelectedProductId) {
      toast.error('Selecciona un producto de la lista.');
      return;
    }
    setSimLoading(true);
    try {
      const response = await scaleService.weighItem(
        simSelectedProductId,
        simWeight,
        undefined,
        currentBranchId || undefined
      );
      setSimResponse(response);
      setSimBarcode(response.barcode);
      toast.success('Pesaje simulado correctamente');
    } catch (err: any) {
      toast.error('Error al simular el pesaje.');
    } finally {
      setSimLoading(false);
    }
  };

  const subtabs = [
    { id: 'scales', label: 'Dispositivos de Balanza', icon: <ScaleIcon size={16} /> },
    { id: 'formats', label: 'Formatos de Etiquetas', icon: <Tag size={16} /> },
    { id: 'simulator', label: 'Simulador de Pesaje', icon: <Play size={16} /> },
    { id: 'catalog', label: 'Catálogo Sincronizado', icon: <Database size={16} /> },
  ] as const;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col gap-1 border-l-4 border-primary pl-4 mb-4">
        <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">
          Gestión de Balanzas y Etiquetas
        </h1>
        <p className="text-text-secondary text-sm font-medium mt-1">
          Administra las balanzas físicas del local, configura formatos de impresión ZPL/ESC-POS y sincroniza el catálogo de productos.
        </p>
      </header>

      {/* Tabs Menu */}
      <div className="flex border-b border-border-subtle bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-xl gap-2 w-max">
        {subtabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === tab.id
                ? 'bg-white dark:bg-slate-800 shadow-sm text-primary'
                : 'text-text-secondary hover:text-text-main hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full">
        {activeSubTab === 'scales' && (
          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text-main">Dispositivos Conectados</h3>
                <p className="text-xs text-text-secondary">Lista de balanzas electrónicas en red y sucursal.</p>
              </div>
              <Button onClick={() => {
                setEditingScale(null);
                setScaleForm({
                  name: '',
                  location: '',
                  ip_address: '',
                  port: 9100,
                  protocol: 'TCP',
                  model: '',
                  branch_id: currentBranchId || allowedBranches[0] || 1,
                  label_format_id: formats[0]?.id || 1,
                  is_active: true,
                });
                setShowScaleModal(true);
              }} className="flex items-center gap-2">
                <Plus size={16} /> <span>Añadir Balanza</span>
              </Button>
            </header>

            {loadingScales ? (
              <div className="flex items-center justify-center p-20">
                <RefreshCw className="animate-spin text-primary mr-2" size={24} />
                <span className="text-sm font-medium">Cargando balanzas...</span>
              </div>
            ) : scales.length === 0 ? (
              <div className="text-center p-16 bg-surface border rounded-2xl flex flex-col items-center gap-2">
                <ScaleIcon size={40} className="text-slate-300" />
                <h4 className="font-bold text-sm text-text-main">Sin balanzas registradas</h4>
                <p className="text-xs text-text-secondary max-w-sm">No has configurado balanzas electrónicas para esta sucursal.</p>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl border overflow-hidden shadow-fluent-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-border-subtle text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="p-4">Balanza / Modelo</th>
                      <th className="p-4">Ubicación</th>
                      <th className="p-4">Dirección IP</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {scales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="p-4">
                          <div className="font-bold text-text-main">{s.name}</div>
                          <div className="text-[11px] text-text-secondary">{s.model || 'Genérica'} ({s.protocol})</div>
                        </td>
                        <td className="p-4 text-text-secondary font-medium">{s.location || 'N/A'}</td>
                        <td className="p-4 font-mono text-xs font-semibold">{s.ip_address ? `${s.ip_address}:${s.port}` : 'USB / Local'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                            s.is_connected 
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                          }`}>
                            {s.is_connected ? <Check size={10} /> : <AlertCircle size={10} />}
                            {s.is_connected ? 'En Línea' : 'Desconectada'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEditScale(s)} className="p-2 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                              <Edit3 size={16} />
                            </button>
                            <button onClick={() => handleDeleteScale(s.id)} className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeSubTab === 'formats' && (
          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text-main">Formatos de Etiquetas de Balanza</h3>
                <p className="text-xs text-text-secondary">Estructuras ZPL y códigos de barras dinámicos.</p>
              </div>
              <Button onClick={() => {
                setEditingFormat(null);
                setFormatForm({
                  name: '',
                  barcode_type: 'EAN13_VARIABLE_PRICE',
                  prefix: '20',
                  scale_code_digits: 4,
                  value_digits: 5,
                  label_width_mm: 58,
                  label_height_mm: 40,
                  includes_product_name: true,
                  includes_weight: true,
                  includes_unit_price: true,
                  includes_total_price: true,
                  includes_date: true,
                  template: '',
                });
                setShowFormatModal(true);
              }} className="flex items-center gap-2">
                <Plus size={16} /> <span>Crear Formato</span>
              </Button>
            </header>

            {loadingFormats ? (
              <div className="flex items-center justify-center p-20">
                <RefreshCw className="animate-spin text-primary mr-2" size={24} />
                <span className="text-sm font-medium">Cargando formatos...</span>
              </div>
            ) : formats.length === 0 ? (
              <div className="text-center p-16 bg-surface border rounded-2xl flex flex-col items-center gap-2">
                <Tag size={40} className="text-slate-300" />
                <h4 className="font-bold text-sm text-text-main">Sin formatos</h4>
                <p className="text-xs text-text-secondary">No hay formatos de etiquetas configurados en el sistema.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formats.map((f) => (
                  <div key={f.id} className="bg-surface rounded-2xl border p-5 flex flex-col justify-between gap-4 shadow-fluent-2">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-text-main text-sm">{f.name}</h4>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {f.barcode_type === 'EAN13_VARIABLE_PRICE' ? 'EAN-13 Precio' : 'EAN-13 Peso'}
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary space-y-1 font-medium">
                        <div>Prefijo EAN-13: <strong className="font-semibold text-text-main">{f.prefix}</strong></div>
                        <div>Tamaño etiqueta: <strong className="font-semibold text-text-main">{f.label_width_mm}mm x {f.label_height_mm}mm</strong></div>
                        <div>Estructura: <strong className="font-semibold text-text-main">{f.scale_code_digits} dígitos código, {f.value_digits} dígitos valor</strong></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                        <FileText size={12} /> ZPL
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditFormat(f)} className="p-2 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 transition-colors">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDeleteFormat(f.id)} className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSubTab === 'simulator' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Simulation controls */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-surface rounded-2xl border p-5 space-y-4 shadow-fluent-2">
                <header>
                  <h3 className="text-sm font-bold text-text-main">Simulación de Balanza Fisiológica</h3>
                  <p className="text-xs text-text-secondary">Simula el hardware del pesaje para generar etiquetas ZPL.</p>
                </header>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">1. Seleccionar Producto</label>
                    <select
                      value={simSelectedProductId}
                      onChange={(e) => setSimSelectedProductId(e.target.value)}
                      className="w-full mt-1.5 p-3 text-sm bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
                    >
                      <option value="">Seleccione un producto...</option>
                      {catalog.map((c) => (
                        <option key={c.product_id} value={c.product_id}>
                          {c.product_name} (Cod: {c.scale_code || 'S/C'}) - Gs. {c.price_per_unit} / {c.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">2. Cantidad / Peso Medido (Kg/L)</label>
                    <div className="flex gap-2 items-center mt-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        value={simWeight}
                        onChange={(e) => setSimWeight(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                        className="h-11 text-base font-bold tabular-nums"
                      />
                      <span className="font-bold text-sm text-text-secondary px-3 bg-slate-100 dark:bg-slate-800 h-11 flex items-center rounded-xl">kg</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleWeighSimulation}
                    disabled={simLoading}
                    className="w-full h-12 mt-4 bg-primary text-white font-black uppercase tracking-wider text-xs rounded-xl hover:bg-primary-hover active:scale-[0.98] shadow-fluent-8 flex items-center justify-center gap-2"
                  >
                    {simLoading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                    <span>Pesar Producto y Generar</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Simulation output */}
            <div className="lg:col-span-7 space-y-4">
              {simResponse ? (
                <div className="bg-surface rounded-2xl border p-5 space-y-6 shadow-fluent-8 animate-in fade-in duration-300">
                  <header className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h4 className="font-bold text-text-main text-sm">{simResponse.product_name}</h4>
                      <p className="text-xs text-text-secondary font-medium">Balanza respondió con éxito</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <Check size={10} /> Simulado
                    </span>
                  </header>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Código de Balanza</div>
                      <div className="font-bold text-text-main mt-1 font-mono text-sm">{simResponse.scale_code || 'No configurado'}</div>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cantidad pesada</div>
                      <div className="font-black text-text-main mt-1 font-mono text-base">{simResponse.quantity} {simResponse.unit}</div>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Precio unitario</div>
                      <div className="font-bold text-text-main mt-1 font-mono text-sm">Gs. {simResponse.price_per_unit}</div>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total a Cobrar (c/ IVA)</div>
                      <div className="font-black text-primary mt-1 font-mono text-base">Gs. {simResponse.subtotal_with_tax}</div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <FileText size={12} /> Código EAN-13 Generado
                    </label>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      <div className="flex-1">
                        <div className="font-mono font-black text-lg tracking-[0.25em] text-text-main">{simBarcode}</div>
                        <div className="text-[10px] font-medium text-slate-400 mt-1">Estructura: Prefijo {simBarcode.slice(0, 2)} + Balanza {simBarcode.slice(2, 6)} + Valor {simBarcode.slice(6, 12)} + Verificador {simBarcode.slice(12)}</div>
                      </div>
                      <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1.5 text-xs" onClick={() => {
                        navigator.clipboard.writeText(simBarcode);
                        toast.success('Código copiado al portapapeles');
                      }}>
                        Copiar
                      </Button>
                    </div>
                  </div>

                  {/* Simulate printing label */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" className="flex items-center gap-2 border border-border-subtle h-10 px-4 rounded-xl active:scale-[0.98]">
                      <Printer size={16} /> <span>Imprimir ZPL</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[300px] border border-dashed rounded-2xl flex flex-col justify-center items-center text-center p-8 bg-slate-50 dark:bg-slate-900/20 text-slate-400">
                  <Play size={32} className="opacity-40 mb-2" />
                  <h4 className="font-bold text-sm text-text-main opacity-70">Esperando simulación</h4>
                  <p className="text-xs text-text-secondary max-w-xs mt-1">Selecciona un producto y realiza el pesaje para visualizar la respuesta del hardware.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeSubTab === 'catalog' && (
          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text-main">Catálogo de Productos de Medida Variable</h3>
                <p className="text-xs text-text-secondary">Sincroniza y descarga la lista de productos aptos para balanzas electrónicas.</p>
              </div>
              <Button variant="outline" onClick={loadCatalog} className="flex items-center gap-2 border h-10 px-4 active:scale-95">
                <RefreshCw size={16} className={loadingCatalog ? 'animate-spin' : ''} /> <span>Sincronizar Catálogo</span>
              </Button>
            </header>

            {loadingCatalog ? (
              <div className="flex items-center justify-center p-20">
                <RefreshCw className="animate-spin text-primary mr-2" size={24} />
                <span className="text-sm font-medium">Sincronizando catálogo...</span>
              </div>
            ) : catalog.length === 0 ? (
              <div className="text-center p-16 bg-surface border rounded-2xl flex flex-col items-center gap-2">
                <Database size={40} className="text-slate-300" />
                <h4 className="font-bold text-sm text-text-main">Sin productos variables</h4>
                <p className="text-xs text-text-secondary max-w-sm">No se encontraron productos marcados con medida variable para esta sucursal.</p>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl border overflow-hidden shadow-fluent-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-border-subtle text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="p-4">Código de Balanza</th>
                      <th className="p-4">Producto</th>
                      <th className="p-4">ID del Sistema</th>
                      <th className="p-4">Precio / Unidad</th>
                      <th className="p-4">Unidad Base</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {catalog.map((item) => (
                      <tr key={item.product_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="p-4 font-mono font-bold text-xs text-primary">{item.scale_code || 'S/C'}</td>
                        <td className="p-4 font-bold text-text-main">{item.product_name}</td>
                        <td className="p-4 font-mono text-xs text-text-secondary">{item.product_id}</td>
                        <td className="p-4 font-mono font-semibold text-text-main">Gs. {item.price_per_unit} / {item.unit}</td>
                        <td className="p-4 text-text-secondary font-medium uppercase text-xs">{item.base_unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Scale Add/Edit Modal */}
      {showScaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold text-text-main text-base">{editingScale ? 'Editar Balanza' : 'Registrar Nueva Balanza'}</h3>
              <button onClick={() => setShowScaleModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={18} />
              </button>
            </header>
            <form onSubmit={handleSaveScale} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre del Dispositivo</label>
                  <Input
                    required
                    value={scaleForm.name}
                    onChange={(e) => setScaleForm({ ...scaleForm, name: e.target.value })}
                    placeholder="Ej. Balanza Fiambrería"
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ubicación Física</label>
                  <Input
                    value={scaleForm.location}
                    onChange={(e) => setScaleForm({ ...scaleForm, location: e.target.value })}
                    placeholder="Ej. Sector Lacteos"
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Modelo</label>
                  <Input
                    value={scaleForm.model}
                    onChange={(e) => setScaleForm({ ...scaleForm, model: e.target.value })}
                    placeholder="Ej. Systel Cuora"
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dirección IP</label>
                  <Input
                    value={scaleForm.ip_address}
                    onChange={(e) => setScaleForm({ ...scaleForm, ip_address: e.target.value })}
                    placeholder="Ej. 192.168.1.50"
                    className="mt-1 h-10 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Puerto</label>
                  <Input
                    type="number"
                    value={scaleForm.port}
                    onChange={(e) => setScaleForm({ ...scaleForm, port: parseInt(e.target.value) || 9100 })}
                    className="mt-1 h-10 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Protocolo</label>
                  <select
                    value={scaleForm.protocol}
                    onChange={(e) => setScaleForm({ ...scaleForm, protocol: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border rounded-lg text-sm h-10"
                  >
                    <option value="TCP">TCP / Ethernet</option>
                    <option value="RS232">RS232 / Serie</option>
                    <option value="USB">USB / Local</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Formato Impresión</label>
                  <select
                    value={scaleForm.label_format_id}
                    onChange={(e) => setScaleForm({ ...scaleForm, label_format_id: parseInt(e.target.value) || 1 })}
                    className="w-full mt-1 p-2 bg-slate-50 border rounded-lg text-sm h-10"
                  >
                    {formats.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <footer className="flex justify-end gap-3 pt-4 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => setShowScaleModal(false)} className="h-10 rounded-xl px-5 border">
                  Cancelar
                </Button>
                <Button type="submit" className="h-10 rounded-xl px-6 bg-primary text-white font-bold">
                  Guardar
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Format Add/Edit Modal */}
      {showFormatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold text-text-main text-base">{editingFormat ? 'Editar Formato de Etiqueta' : 'Crear Formato de Etiqueta'}</h3>
              <button onClick={() => setShowFormatModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={18} />
              </button>
            </header>
            <form onSubmit={handleSaveFormat} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre del Formato</label>
                  <Input
                    required
                    value={formatForm.name}
                    onChange={(e) => setFormatForm({ ...formatForm, name: e.target.value })}
                    placeholder="Ej. EAN-13 CatchWeight"
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tipo Código de Barras</label>
                  <select
                    value={formatForm.barcode_type}
                    onChange={(e) => setFormatForm({ ...formatForm, barcode_type: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border rounded-lg text-sm h-10"
                  >
                    <option value="EAN13_VARIABLE_PRICE">EAN-13 Precio Variable</option>
                    <option value="EAN13_VARIABLE_WEIGHT">EAN-13 Peso Variable</option>
                    <option value="CODE128">CODE-128 Estándar</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Prefijo (2 dígitos)</label>
                  <Input
                    value={formatForm.prefix}
                    onChange={(e) => setFormatForm({ ...formatForm, prefix: e.target.value })}
                    maxLength={2}
                    placeholder="20"
                    className="mt-1 h-10 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dígitos Código Balanza</label>
                  <Input
                    type="number"
                    value={formatForm.scale_code_digits}
                    onChange={(e) => setFormatForm({ ...formatForm, scale_code_digits: parseInt(e.target.value) || 4 })}
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dígitos del Valor</label>
                  <Input
                    type="number"
                    value={formatForm.value_digits}
                    onChange={(e) => setFormatForm({ ...formatForm, value_digits: parseInt(e.target.value) || 5 })}
                    className="mt-1 h-10"
                  />
                </div>
                <div className="col-span-2 space-y-2 border-y py-3.5 my-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Información Incluida en Etiqueta</div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-text-main cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formatForm.includes_product_name}
                        onChange={(e) => setFormatForm({ ...formatForm, includes_product_name: e.target.checked })}
                        className="rounded text-primary size-4"
                      />
                      Nombre Producto
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-text-main cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formatForm.includes_weight}
                        onChange={(e) => setFormatForm({ ...formatForm, includes_weight: e.target.checked })}
                        className="rounded text-primary size-4"
                      />
                      Peso Medido
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-text-main cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formatForm.includes_unit_price}
                        onChange={(e) => setFormatForm({ ...formatForm, includes_unit_price: e.target.checked })}
                        className="rounded text-primary size-4"
                      />
                      Precio Unitario
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-text-main cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formatForm.includes_total_price}
                        onChange={(e) => setFormatForm({ ...formatForm, includes_total_price: e.target.checked })}
                        className="rounded text-primary size-4"
                      />
                      Precio Total
                    </label>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plantilla ZPL de Impresión</label>
                  <textarea
                    value={formatForm.template}
                    onChange={(e) => setFormatForm({ ...formatForm, template: e.target.value })}
                    rows={4}
                    placeholder="^XA^FO50,50^A0N,30,30^FD{product_name}^FS^XZ"
                    className="w-full mt-1.5 p-3 text-xs bg-slate-50 border rounded-xl font-mono text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <footer className="flex justify-end gap-3 pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => setShowFormatModal(false)} className="h-10 rounded-xl px-5 border">
                  Cancelar
                </Button>
                <Button type="submit" className="h-10 rounded-xl px-6 bg-primary text-white font-bold">
                  Guardar
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScaleConfigPage;
