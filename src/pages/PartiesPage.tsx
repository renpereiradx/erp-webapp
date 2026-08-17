import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { visiblePartyTabs, resolvePartyTab, type PartyTab } from '@/domain/party/partiesTabs';
import ClientsPage from './Clients';
import SuppliersPage from './Suppliers';

const PartiesPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { hasAnyPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Gating por permisos: vendedor solo ve Clientes (D1 del plan);
  // `parties:read` sigue habilitando ambos tabs por retrocompatibilidad.
  const canSeeClients = hasAnyPermission('parties:read', 'clients:read');
  const canSeeSuppliers = hasAnyPermission('parties:read', 'suppliers:read');
  const visibleTabs = visiblePartyTabs(canSeeClients, canSeeSuppliers);

  const [activeTab, setActiveTab] = useState(() =>
    resolvePartyTab(searchParams.get('tab'), visibleTabs),
  );

  const handleTabChange = (value: string) => {
    if (!visibleTabs.includes(value as PartyTab)) return;
    setActiveTab(value as PartyTab);
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    // Si la tab pedida por URL no es visible (ej. ?tab=proveedores sin
    // permiso), caer a la primera visible.
    setActiveTab(resolvePartyTab(searchParams.get('tab'), visibleTabs));
  }, [searchParams, canSeeClients, canSeeSuppliers]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 min-h-screen bg-[#faf9f8] p-6 md:p-8">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest gap-2">
          <span onClick={() => navigate('/dashboard')} className="hover:text-[#0f6cbd] cursor-pointer transition-colors">
            {t('parties.breadcrumb.home', 'Inicio')}
          </span>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-[#242424] font-bold">
            {activeTab === 'clientes' ? t('parties.breadcrumb.clients', 'Clientes') : t('parties.breadcrumb.suppliers', 'Proveedores')}
          </span>
        </nav>

        {/* Unified Page Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-l-4 border-[#0f6cbd] pl-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#242424]">
              {t('parties.title', 'Gestión de Entidades')}
            </h1>
            <p className="text-[#616161] text-base font-medium mt-1.5">
              {t('parties.subtitle', 'Administra clientes y proveedores del sistema.')}
            </p>
          </div>
        </div>

        {/* Fluent 2 Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
          <TabsList className="bg-[#f3f2f1] text-[#616161] border border-[#d1d1d1] shadow-fluent-2 p-1 rounded-lg h-12 gap-1 w-full max-w-md">
            {canSeeClients && (
              <TabsTrigger 
                value="clientes" 
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#0f6cbd] data-[state=active]:shadow-sm rounded-md font-bold transition-all text-sm h-10"
              >
                {t('parties.tab.clients', 'Directorio de Clientes')}
              </TabsTrigger>
            )}
            {canSeeSuppliers && (
              <TabsTrigger 
                value="proveedores" 
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#0f6cbd] data-[state=active]:shadow-sm rounded-md font-bold transition-all text-sm h-10"
              >
                {t('parties.tab.suppliers', 'Directorio de Proveedores')}
              </TabsTrigger>
            )}
          </TabsList>

          {canSeeClients && (
            <TabsContent value="clientes" className="mt-0 outline-none">
              <ClientsPage />
            </TabsContent>
          )}
          {canSeeSuppliers && (
            <TabsContent value="proveedores" className="mt-0 outline-none">
              <SuppliersPage />
            </TabsContent>
          )}
        </Tabs>

      </div>
    </div>
  );
};

export default PartiesPage;
