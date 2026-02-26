import React, { useState } from 'react';

/**
 * Libros Legales (Ventas y Compras)
 * 100% Faithful to Stitch Design
 */
const LegalBooks = () => {
  const [activeTab, setActiveTab] = useState('ventas'); // 'ventas' or 'compras'
  const [fromDate, setFromDate] = useState('2023-10-01');
  const [toDate, setToDate] = useState('2023-10-31');

  // Mock data for the table
  const tableData = [
    {
      date: '05/10/2023',
      invoiceNo: '001-001-0004512',
      timbrado: '12345678',
      ruc: '80023412-5',
      client: 'Distribuidora Nacional S.A.',
      exento: '0',
      iva5: '0',
      iva10: '250.000',
      gross: '2.750.000'
    },
    {
      date: '12/10/2023',
      invoiceNo: '001-002-0000891',
      timbrado: '15822941',
      ruc: '1245678-3',
      client: 'Juan Pérez Garcia',
      exento: '500.000',
      iva5: '0',
      iva10: '0',
      gross: '500.000'
    },
    {
      date: '18/10/2023',
      invoiceNo: '002-001-0000054',
      timbrado: '16733211',
      ruc: '80102231-0',
      client: 'Constructora del Este S.R.L.',
      exento: '0',
      iva5: '75.000',
      iva10: '0',
      gross: '1.575.000'
    },
    {
      date: '22/10/2023',
      invoiceNo: '001-001-0004513',
      timbrado: '12345678',
      ruc: '80000123-4',
      client: 'Agro Industrial Par',
      exento: '0',
      iva5: '0',
      iva10: '100.000',
      gross: '1.100.000'
    },
    {
      date: '25/10/2023',
      invoiceNo: '001-001-0004514',
      timbrado: '12345678',
      ruc: '3567891-2',
      client: 'Maria Lopez Benitez',
      exento: '0',
      iva5: '0',
      iva10: '15.000',
      gross: '165.000'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f6f7f8] dark:bg-[#101922] min-h-screen font-['Inter',sans-serif]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <nav aria-label="Breadcrumb" className="flex mb-2">
            <ol className="flex items-center space-x-2 text-xs text-slate-500">
              <li>Reportes</li>
              <li><span className="material-symbols-outlined text-xs mx-1">chevron_right</span></li>
              <li>Cumplimiento</li>
              <li><span className="material-symbols-outlined text-xs mx-1">chevron_right</span></li>
              <li className="text-[#137fec] font-semibold">Libros Legales</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Libros Legales</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Ventas y Compras - Tax Compliance Paraguay</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all text-slate-700 dark:text-slate-200 shadow-sm">
            <span className="material-symbols-outlined text-xl">file_download</span> Export XLS
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#137fec]/20 hover:brightness-110 transition-all">
            <span className="material-symbols-outlined text-xl">print</span> Imprimir Libro
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab('ventas')}
              className={`py-4 border-b-2 transition-all text-sm font-bold ${activeTab === 'ventas' ? 'border-[#137fec] text-[#137fec]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Libro Ventas
            </button>
            <button 
              onClick={() => setActiveTab('compras')}
              className={`py-4 border-b-2 transition-all text-sm font-bold ${activeTab === 'compras' ? 'border-[#137fec] text-[#137fec]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Libro Compras
            </button>
          </div>
          <div className="flex items-center gap-4 py-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
              <span className="material-symbols-outlined text-base">calendar_month</span>
              <span>Periodo: <strong className="text-slate-700 dark:text-slate-300">Octubre 2023</strong></span>
            </div>
            <button className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-base">filter_list</span>
            </button>
          </div>
        </div>

        {/* Date Selection Filter */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Desde Fecha</label>
            <input 
              className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:ring-[#137fec] focus:border-[#137fec] transition-all" 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hasta Fecha</label>
            <input 
              className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:ring-[#137fec] focus:border-[#137fec] transition-all" 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{activeTab === 'ventas' ? 'RUC Cliente' : 'RUC Proveedor'} (Filtro)</label>
            <input 
              className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm focus:ring-[#137fec] focus:border-[#137fec] transition-all placeholder-slate-400" 
              placeholder="Ej. 80012345-0" 
              type="text"
            />
          </div>
          <div className="flex items-end">
            <button className="w-full bg-[#137fec]/10 text-[#137fec] px-4 py-2.5 rounded-xl text-sm font-bold border border-[#137fec]/20 hover:bg-[#137fec] hover:text-white transition-all shadow-sm">
              Actualizar Reporte
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Nº Factura</th>
                <th className="px-6 py-4">Timbrado</th>
                <th className="px-6 py-4">RUC</th>
                <th className="px-6 py-4">{activeTab === 'ventas' ? 'Cliente' : 'Proveedor'}</th>
                <th className="px-6 py-4 text-right">Exento</th>
                <th className="px-6 py-4 text-right">IVA 5%</th>
                <th className="px-6 py-4 text-right">IVA 10%</th>
                <th className="px-6 py-4 text-right">Monto Bruto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableData.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{row.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{row.invoiceNo}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{row.timbrado}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{row.ruc}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{row.client}</td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{row.exento}</td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{row.iva5}</td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{row.iva10}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">{row.gross}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#137fec]/5 dark:bg-[#137fec]/10 font-bold border-t-2 border-[#137fec]/20">
                <td className="px-6 py-4 text-right uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400" colSpan="5">Resumen Total del Periodo</td>
                <td className="px-6 py-4 text-right text-[#137fec]">500.000</td>
                <td className="px-6 py-4 text-right text-[#137fec]">75.000</td>
                <td className="px-6 py-4 text-right text-[#137fec]">365.000</td>
                <td className="px-6 py-4 text-right text-[#137fec] text-base underline decoration-double">6.090.000</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900">
          <div className="text-sm text-slate-500 font-medium">
            Mostrando <span className="font-semibold text-slate-900 dark:text-white">1</span> a <span className="font-semibold text-slate-900 dark:text-white">50</span> de <span className="font-semibold text-slate-900 dark:text-white">1.248</span> registros
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 mr-2">Filas por página:</label>
            <select className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm px-2 py-1 focus:ring-[#137fec] mr-4 outline-none transition-all">
              <option>20</option>
              <option selected>50</option>
              <option>100</option>
            </select>
            <div className="flex gap-1">
              <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-sm">first_page</span>
              </button>
              <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="px-4 py-2 bg-[#137fec] text-white rounded-xl text-sm font-bold shadow-sm">1</button>
              <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-semibold">2</button>
              <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-semibold">3</button>
              <span className="px-2 text-slate-400 self-center">...</span>
              <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-semibold">25</button>
              <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
              <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-sm">last_page</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BI Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Impuesto Ventas</span>
            <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold">+12.5%</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">440.000 ₲</div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">IVA 5% + 10% calculado</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Timbrados Activos</span>
            <span className="material-symbols-outlined text-[#137fec] text-lg">verified</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">3 Activos</div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Vencimiento más cercano: 20 Dic, 2023</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Puntaje de Cumplimiento</span>
            <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">98%</div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full w-[98%] transition-all duration-1000"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalBooks;
