import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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
    <div className="flex flex-col gap-lg">
      {/* Breadcrumb */}
      <nav
        aria-label={t('parties.breadcrumb.home', 'Inicio')}
        className="flex items-center gap-xs text-label-caps uppercase text-on-surface-deep"
      >
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="cursor-pointer transition-colors duration-150 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
        >
          {t('parties.breadcrumb.home', 'Inicio')}
        </button>
        <ChevronRight className="size-3" aria-hidden="true" />
        <span className="text-foreground">
          {activeTab === 'clientes'
            ? t('parties.breadcrumb.clients', 'Clientes')
            : t('parties.breadcrumb.suppliers', 'Proveedores')}
        </span>
      </nav>

      {/* Page header */}
      <header className="border-l-4 border-primary pl-4">
        <h1 className="text-headline-lg-mobile md:text-headline-lg text-foreground leading-none">
          {t('parties.title', 'Gestión de Entidades')}
        </h1>
        <p className="text-body-md text-on-surface-deep mt-sm">
          {t('parties.subtitle', 'Administra clientes y proveedores del sistema.')}
        </p>
      </header>

      {/* Fluent 2 tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full gap-lg">
        <TabsList className="bg-surface-muted border border-border-subtle shadow-fluent-2 p-xs rounded-button h-11 gap-xs w-full max-w-md">
          {canSeeClients && (
            <TabsTrigger
              value="clientes"
              className="flex-1 data-[state=active]:bg-surface data-[state=active]:text-primary rounded-sm h-9 text-body-md"
            >
              {t('parties.tab.clients', 'Directorio de Clientes')}
            </TabsTrigger>
          )}
          {canSeeSuppliers && (
            <TabsTrigger
              value="proveedores"
              className="flex-1 data-[state=active]:bg-surface data-[state=active]:text-primary rounded-sm h-9 text-body-md"
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
  );
};

export default PartiesPage;
