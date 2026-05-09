import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientsPage from './Clients';
import SuppliersPage from './Suppliers';

const PartiesPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialTab = searchParams.get('tab') === 'proveedores' ? 'proveedores' : 'clientes';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'proveedores' || tab === 'clientes') {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
            <TabsTrigger 
              value="clientes" 
              className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#0f6cbd] data-[state=active]:shadow-sm rounded-md font-bold transition-all text-sm h-10"
            >
              {t('parties.tab.clients', 'Directorio de Clientes')}
            </TabsTrigger>
            <TabsTrigger 
              value="proveedores" 
              className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#0f6cbd] data-[state=active]:shadow-sm rounded-md font-bold transition-all text-sm h-10"
            >
              {t('parties.tab.suppliers', 'Directorio de Proveedores')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clientes" className="mt-0 outline-none">
            <ClientsPage />
          </TabsContent>
          <TabsContent value="proveedores" className="mt-0 outline-none">
            <SuppliersPage />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default PartiesPage;