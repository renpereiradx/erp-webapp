import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { unitConversionsService, UnitConversion, UnitConversionTemplate } from '../services/unitConversionsService';
import { ArrowRightLeft, Plus, Trash2, HelpCircle, PackageOpen, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UnitConversionsPage = () => {
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();

  const [conversions, setConversions] = useState<UnitConversion[]>([]);
  const [template, setTemplate] = useState<UnitConversionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ from_unit: '', to_unit: '', factor: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [convData, tempData] = await Promise.all([
        unitConversionsService.getAll(),
        unitConversionsService.getTemplate()
      ]);
      setConversions(convData);
      setTemplate(tempData);
    } catch (error: any) {
      toast.error(error?.message || 'Error al cargar conversiones');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (!formData.from_unit || !formData.to_unit || !formData.factor) {
        toast.error('Todos los campos son requeridos');
        return;
      }
      
      const factorNum = Number(formData.factor);
      if (isNaN(factorNum) || factorNum <= 0) {
        toast.error('El factor debe ser un número mayor a 0');
        return;
      }

      await unitConversionsService.createOrUpdate({
        from_unit: formData.from_unit.toLowerCase().trim(),
        to_unit: formData.to_unit.toLowerCase().trim(),
        factor: formData.factor
      });
      
      toast.success('Conversión guardada exitosamente');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar la conversión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (fromUnit: string, toUnit: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la conversión ${fromUnit} → ${toUnit}?`)) return;
    try {
      await unitConversionsService.delete(fromUnit, toUnit);
      toast.success('Conversión eliminada exitosamente');
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Error al eliminar la conversión');
    }
  };

  const loadFromTemplate = (tmpl: UnitConversionTemplate) => {
    setFormData({
      from_unit: tmpl.from_unit,
      to_unit: tmpl.to_unit,
      factor: tmpl.factor
    });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background-light p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <button 
          onClick={() => navigate('/configuracion')}
          className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors text-sm font-bold uppercase tracking-wider"
        >
          <ChevronLeft size={16} /> Volver a Configuración
        </button>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-l-4 border-primary pl-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">
              Conversiones de Unidad
            </h1>
            <p className="text-text-secondary text-sm font-medium mt-2">
              Gestiona factores de conversión para ventas y compras multiformato
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({ from_unit: '', to_unit: '', factor: '' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm shadow-sm hover:bg-primary-hover transition-colors"
          >
            <Plus size={18} />
            NUEVA CONVERSIÓN
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
              <div className="px-6 py-4 border-b border-border-subtle bg-slate-50">
                <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Conversiones Activas</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-text-secondary uppercase tracking-widest border-b border-border-subtle">
                      <th className="px-6 py-3">Origen</th>
                      <th className="px-6 py-3">Destino</th>
                      <th className="px-6 py-3">Factor</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {loading ? (
                      <tr><td colSpan={4} className="p-6 text-center text-text-secondary">Cargando...</td></tr>
                    ) : conversions.length === 0 ? (
                      <tr><td colSpan={4} className="p-6 text-center text-text-secondary">No hay conversiones registradas. Usa la plantilla de la derecha para agregar.</td></tr>
                    ) : (
                      conversions.map(conv => (
                        <tr key={`${conv.from_unit}-${conv.to_unit}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-sm bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{conv.from_unit}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-sm bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{conv.to_unit}</span>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-sm text-primary">
                            1 {conv.from_unit} = {conv.factor} {conv.to_unit}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDelete(conv.from_unit, conv.to_unit)}
                              className="text-slate-400 hover:text-error transition-colors p-1"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-blue-800">
                <HelpCircle size={20} />
                <h3 className="font-black uppercase tracking-wider text-sm">¿Cómo funciona?</h3>
              </div>
              <p className="text-sm text-blue-900/80 mb-2">
                Las transacciones (compras y ventas) que usen unidades de empaque se <b>rechazarán</b> si no existe un factor de conversión.
              </p>
              <p className="text-sm text-blue-900/80">
                Los factores base (ej. kg a lb) están pre-cargados. Aquí debes registrar tus <b>empaques específicos</b> (cajas, bolsas).
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
              <div className="px-5 py-4 border-b border-border-subtle bg-amber-50/50">
                <div className="flex items-center gap-2 text-amber-600">
                  <PackageOpen size={18} />
                  <h2 className="text-sm font-black uppercase tracking-widest">Plantilla de Empaque</h2>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {template.length === 0 && !loading && (
                  <p className="text-xs text-text-secondary">No se pudo cargar la plantilla.</p>
                )}
                {template.map((tmpl, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-amber-200 transition-colors">
                    <p className="text-xs font-bold text-text-main">{tmpl.example}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono bg-white px-2 py-1 rounded border border-slate-200">
                        {tmpl.from_unit} → {tmpl.factor} {tmpl.to_unit}
                      </span>
                      <button
                        onClick={() => loadFromTemplate(tmpl)}
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                      >
                        Usar Plantilla
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border-subtle">
              <h2 className="text-lg font-black uppercase tracking-tighter">Guardar Conversión</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Unidad Origen</label>
                  <input
                    type="text"
                    required
                    value={formData.from_unit}
                    onChange={e => setFormData({ ...formData, from_unit: e.target.value })}
                    placeholder="ej: box"
                    className="w-full px-3 py-2 text-sm border border-border-subtle rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Unidad Destino</label>
                  <input
                    type="text"
                    required
                    value={formData.to_unit}
                    onChange={e => setFormData({ ...formData, to_unit: e.target.value })}
                    placeholder="ej: kg"
                    className="w-full px-3 py-2 text-sm border border-border-subtle rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Factor de Conversión</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-400">=</span>
                  <input
                    type="number"
                    required
                    min="0.00000001"
                    step="any"
                    value={formData.factor}
                    onChange={e => setFormData({ ...formData, factor: e.target.value })}
                    placeholder="Cantidad de destino por cada origen"
                    className="flex-1 px-3 py-2 text-sm border border-border-subtle rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-text-secondary hover:text-text-main uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white text-sm font-bold uppercase tracking-widest rounded-lg shadow-sm hover:bg-primary-hover disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitConversionsPage;
