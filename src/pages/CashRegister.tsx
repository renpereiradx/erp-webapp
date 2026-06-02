import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, History, Plus, X, Wallet, 
  ArrowRight, Search, Clock, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useCashRegisterSession } from '@/features/cash-register/hooks/useCashRegisterSession';
import { OpenCashRegisterModal } from '@/features/cash-register/components/OpenCashRegisterModal';
import { CloseCashRegisterModal } from '@/features/cash-register/components/CloseCashRegisterModal';
import { MovementModal } from '@/features/cash-register/components/MovementModal';
import { CashAuditModal } from '@/features/cash-register/components/CashAuditModal';
import { formatCurrency, calculateNetDifference } from '@/domain/cash-register/calculations';
import { CashMovement, CashAudit } from '@/domain/cash-register/models';

const CashRegister = () => {
  const {
    activeCashRegister,
    cashRegisters,
    movements,
    audits,
    isActiveCashRegisterLoading,
    isCashRegistersLoading,
    isOpeningCashRegister,
    isClosingCashRegister,
    isRegisteringMovement,
    refreshActive,
    refreshHistory,
    openCashRegister,
    closeCashRegister,
    registerMovement,
    getCashRegisterReport,
  } = useCashRegisterSession();

  const [openCashRegisterDialog, setOpenCashRegisterDialog] = useState(false);
  const [closeCashRegisterDialog, setCloseCashRegisterDialog] = useState(false);
  const [movementDialog, setMovementDialog] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'movements' | 'audits'>('movements');

  const handleLoadSummary = async () => {
    try {
      if (activeCashRegister?.id) {
        await getCashRegisterReport(activeCashRegister.id);
      }
    } catch (error) {}
  };

  const netDifference = activeCashRegister 
    ? calculateNetDifference(activeCashRegister.current_balance || 0, activeCashRegister.initial_balance || 0)
    : 0;

  // Fluent 2.0 UI tokens embedded
  const cardShadow = 'shadow-[0_2px_4px_rgba(0,0,0,0.04),0_0_2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_0_2px_rgba(0,0,0,0.14)]';
  const cardBg = 'bg-white dark:bg-[#252423]';
  const canvasBg = 'bg-[#f3f2f1] dark:bg-[#11100f]';
  const borderColor = 'border-slate-200 dark:border-[#3b3a39]';

  return (
    <div className={`min-h-full ${canvasBg} text-[#323130] dark:text-[#f3f2f1] p-4 md:p-8 font-sans`}>
      
      {/* HEADER FLUENT */}
      <header className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
        <div>
          <h1 className='text-2xl font-semibold leading-tight'>Caja registradora</h1>
          <p className='text-sm text-slate-500 dark:text-[#a19f9d] mt-1'>
            Gestión operativa, control de efectivo y auditorías.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button 
            variant='outline' 
            onClick={refreshActive} 
            disabled={isActiveCashRegisterLoading}
            className='h-8 px-3 text-xs font-medium rounded-md bg-white dark:bg-[#323130] border-slate-300 dark:border-[#484644] hover:bg-slate-50 dark:hover:bg-[#3b3a39]'
          >
            {isActiveCashRegisterLoading ? <Clock className='animate-spin w-4 h-4 mr-2' /> : <History className='w-4 h-4 mr-2' />}
            Refrescar
          </Button>
          {!activeCashRegister && (
            <Button 
              onClick={() => setOpenCashRegisterDialog(true)}
              className='h-8 px-4 text-xs font-medium rounded-md bg-[#0f6cbd] hover:bg-[#115ea5] text-white shadow-sm transition-colors border-transparent'
            >
              <Plus className='w-4 h-4 mr-1.5' /> Abrir caja
            </Button>
          )}
        </div>
      </header>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        
        {/* MAIN PANEL */}
        <div className='lg:col-span-8 flex flex-col gap-6'>
          {activeCashRegister ? (
            <div className={`rounded-lg ${cardBg} border ${borderColor} ${cardShadow} flex flex-col`}>
              
              {/* Resumen Superior */}
              <div className={`p-6 border-b ${borderColor} flex flex-col md:flex-row justify-between items-start md:items-center gap-6`}>
                <div>
                  <div className='flex items-center gap-2 mb-1.5'>
                    <div className='w-2 h-2 rounded-full bg-[#107c10]'></div>
                    <span className='text-xs font-semibold text-[#107c10] dark:text-[#54b054]'>Caja abierta</span>
                  </div>
                  <h2 className='text-xl font-semibold'>{activeCashRegister.name}</h2>
                  <div className='text-xs text-slate-500 dark:text-[#a19f9d] mt-1 flex items-center gap-3'>
                    <span>Abierta: {new Date(activeCashRegister.opened_at).toLocaleString([], { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'short' })}</span>
                    {activeCashRegister.location && (
                      <span className='px-1.5 py-0.5 bg-slate-100 dark:bg-[#323130] rounded-sm'>Ubicación: {activeCashRegister.location}</span>
                    )}
                  </div>
                </div>

                <div className='text-left md:text-right'>
                  <p className='text-xs text-slate-500 dark:text-[#a19f9d] mb-0.5'>Saldo actual en sistema</p>
                  <p className='text-4xl font-semibold font-mono tracking-tight'>
                    ₲{formatCurrency(activeCashRegister.current_balance || 0)}
                  </p>
                </div>
              </div>

              {/* Action Bar & Mini metrics */}
              <div className={`px-6 py-4 bg-slate-50 dark:bg-[#201f1e] flex flex-col md:flex-row justify-between items-center gap-4 border-b ${borderColor}`}>
                <div className='flex gap-6 w-full md:w-auto'>
                  <div>
                    <p className='text-[11px] text-slate-500 dark:text-[#a19f9d]'>Fondo inicial</p>
                    <p className='text-sm font-semibold font-mono'>₲{formatCurrency(activeCashRegister.initial_balance || 0)}</p>
                  </div>
                  <div>
                    <p className='text-[11px] text-slate-500 dark:text-[#a19f9d]'>Diferencia neta</p>
                    <p className={`text-sm font-semibold font-mono ${netDifference >= 0 ? 'text-[#107c10] dark:text-[#54b054]' : 'text-[#d13438] dark:text-[#e35c60]'}`}>
                      {netDifference >= 0 ? '+' : '-'} ₲{formatCurrency(Math.abs(netDifference))}
                    </p>
                  </div>
                </div>

                <div className='flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0'>
                  <Button variant='outline' onClick={() => setMovementDialog(true)} className='h-8 px-3 text-xs rounded bg-white dark:bg-[#323130] border-slate-300 dark:border-[#484644] hover:bg-slate-100 dark:hover:bg-[#3b3a39]'>
                    Registrar movimiento
                  </Button>
                  <Button variant='outline' onClick={() => setAuditModalOpen(true)} className='h-8 px-3 text-xs rounded bg-white dark:bg-[#323130] border-slate-300 dark:border-[#484644] hover:bg-slate-100 dark:hover:bg-[#3b3a39]'>
                    Arqueo físico
                  </Button>
                  <Button variant='outline' onClick={() => setCloseCashRegisterDialog(true)} className='h-8 px-3 text-xs rounded border-[#d13438]/30 text-[#d13438] dark:text-[#e35c60] hover:bg-[#d13438]/5 bg-white dark:bg-[#323130]'>
                    Cerrar caja
                  </Button>
                </div>
              </div>

              {/* High Density Table for Movements / Audits */}
              <div className='flex-1 flex flex-col min-h-[300px]'>
                <div className={`px-6 py-2 border-b ${borderColor} flex gap-4`}>
                  <button 
                    onClick={() => setActiveTab('movements')} 
                    className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'movements' ? 'border-[#0f6cbd] text-[#0f6cbd] dark:text-[#4facfe]' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                  >
                    Movimientos
                  </button>
                  <button 
                    onClick={() => setActiveTab('audits')} 
                    className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'audits' ? 'border-[#0f6cbd] text-[#0f6cbd] dark:text-[#4facfe]' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                  >
                    Auditorías
                  </button>
                </div>
                
                <div className='overflow-x-auto'>
                  {activeTab === 'movements' ? (
                    movements.length > 0 ? (
                      <table className='w-full text-left border-collapse'>
                        <thead>
                          <tr className={`border-b ${borderColor} bg-slate-50/50 dark:bg-[#201f1e]`}>
                            <th className='py-2 px-6 text-xs font-semibold text-slate-500 dark:text-[#a19f9d] w-32'>Hora</th>
                            <th className='py-2 px-6 text-xs font-semibold text-slate-500 dark:text-[#a19f9d]'>Concepto</th>
                            <th className='py-2 px-6 text-xs font-semibold text-slate-500 dark:text-[#a19f9d]'>Usuario</th>
                            <th className='py-2 px-6 text-xs font-semibold text-slate-500 dark:text-[#a19f9d] text-right'>Monto</th>
                          </tr>
                        </thead>
                        <tbody className='text-sm'>
                          {movements.map((m: CashMovement) => (
                            <tr key={m.id || m.movement_id} className={`border-b ${borderColor} hover:bg-slate-50 dark:hover:bg-[#292827] transition-colors`}>
                              <td className='py-3 px-6 text-xs whitespace-nowrap'>{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                              <td className='py-3 px-6'>
                                <div className='flex items-center gap-2'>
                                  {m.movement_type === 'INCOME' && <span className='text-[#107c10]'><Plus className='w-3 h-3' /></span>}
                                  {m.movement_type === 'EXPENSE' && <span className='text-[#d13438]'><X className='w-3 h-3' /></span>}
                                  {m.movement_type === 'ADJUSTMENT' && <span className='text-[#0078d4]'><Calculator className='w-3 h-3' /></span>}
                                  <span className='font-medium'>{m.concept || m.description}</span>
                                </div>
                              </td>
                              <td className='py-3 px-6 text-xs text-slate-500 dark:text-[#a19f9d]'>{m.user_full_name || m.created_by_name || 'Sistema'}</td>
                              <td className={`py-3 px-6 text-right font-mono font-medium ${m.movement_type === 'INCOME' ? 'text-[#107c10] dark:text-[#54b054]' : m.movement_type === 'EXPENSE' ? 'text-[#d13438] dark:text-[#e35c60]' : 'text-[#0078d4]'}`}>
                                {m.movement_type === 'EXPENSE' ? '-' : '+'} ₲{formatCurrency(m.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className='py-16 text-center'>
                        <FileText className='w-8 h-8 text-slate-300 mx-auto mb-2' />
                        <p className='text-sm text-slate-500'>No hay movimientos registrados.</p>
                      </div>
                    )
                  ) : (
                    audits.length > 0 ? (
                      <table className='w-full text-left border-collapse'>
                        <thead>
                          <tr className={`border-b ${borderColor} bg-slate-50/50 dark:bg-[#201f1e]`}>
                            <th className='py-2 px-6 text-xs font-semibold text-slate-500 dark:text-[#a19f9d] w-48'>Fecha de arqueo</th>
                            <th className='py-2 px-6 text-xs font-semibold text-slate-500 dark:text-[#a19f9d]'>Estado</th>
                            <th className='py-2 px-6 text-xs font-semibold text-slate-500 dark:text-[#a19f9d] text-right'>Conteo Físico</th>
                            <th className='py-2 px-6 text-xs font-semibold text-slate-500 dark:text-[#a19f9d] text-right'>Diferencia</th>
                          </tr>
                        </thead>
                        <tbody className='text-sm'>
                          {audits.map((audit: CashAudit) => (
                            <tr key={audit.id} className={`border-b ${borderColor} hover:bg-slate-50 dark:hover:bg-[#292827] transition-colors`}>
                              <td className='py-3 px-6 text-xs whitespace-nowrap'>{new Date(audit.created_at).toLocaleString([], {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                              <td className='py-3 px-6'>
                                {audit.difference === 0 ? (
                                  <span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[#dff6dd] text-[#107c10] dark:bg-[#107c10]/20 dark:text-[#54b054] text-xs font-medium'>
                                    <CheckCircle2 className='w-3 h-3' /> Cuadrado
                                  </span>
                                ) : (
                                  <span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[#fde7e9] text-[#d13438] dark:bg-[#d13438]/20 dark:text-[#e35c60] text-xs font-medium'>
                                    <AlertCircle className='w-3 h-3' /> Descuadre
                                  </span>
                                )}
                              </td>
                              <td className='py-3 px-6 text-right font-mono font-medium'>₲{formatCurrency(audit.counted_amount)}</td>
                              <td className={`py-3 px-6 text-right font-mono font-medium ${audit.difference === 0 ? 'text-[#107c10]' : 'text-[#d13438]'}`}>
                                ₲{formatCurrency(audit.difference)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className='py-16 text-center'>
                        <FileText className='w-8 h-8 text-slate-300 mx-auto mb-2' />
                        <p className='text-sm text-slate-500'>No se han realizado arqueos.</p>
                      </div>
                    )
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* EMPTY STATE CLEAN FLUENT */
            <div className={`rounded-lg ${cardBg} border ${borderColor} ${cardShadow} flex-1 flex flex-col items-center justify-center p-12 min-h-[400px] text-center`}>
              <div className='w-16 h-16 bg-slate-50 dark:bg-[#323130] rounded-lg flex items-center justify-center mb-4'>
                <Wallet className='w-8 h-8 text-slate-400 dark:text-[#a19f9d]' />
              </div>
              <h2 className='text-xl font-semibold mb-2'>No hay una caja iniciada</h2>
              <p className='text-sm text-slate-500 dark:text-[#a19f9d] max-w-sm mb-6'>
                Para procesar pagos, realizar movimientos y arqueos, primero debe abrir una caja registradora.
              </p>
              <Button 
                onClick={() => setOpenCashRegisterDialog(true)}
                className='h-9 px-6 text-sm font-medium rounded-md bg-[#0f6cbd] hover:bg-[#115ea5] text-white shadow-sm transition-colors border-transparent'
              >
                Abrir caja ahora
              </Button>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className='lg:col-span-4 flex flex-col'>
          <div className={`rounded-lg ${cardBg} border ${borderColor} ${cardShadow} flex-1 overflow-hidden flex flex-col`}>
            <div className={`p-5 border-b ${borderColor} flex items-center justify-between`}>
              <h3 className='text-base font-semibold'>Historial de cajas</h3>
              <Button variant='ghost' size='sm' onClick={refreshHistory} className='h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-[#323130] text-slate-500 rounded'>
                <History className='w-4 h-4' />
              </Button>
            </div>
            <div className='flex-1 overflow-y-auto max-h-[600px]'>
              {cashRegisters && cashRegisters.length > 0 ? (
                <ul className='divide-y divide-slate-100 dark:divide-[#3b3a39]'>
                  {cashRegisters.map((cr: any) => (
                    <li key={cr.id} className='p-4 hover:bg-slate-50 dark:hover:bg-[#292827] transition-colors'>
                      <div className='flex justify-between items-start mb-2'>
                        <span className='text-sm font-semibold'>{cr.name}</span>
                        {cr.status === 'OPEN' 
                          ? <span className='text-[10px] px-1.5 py-0.5 rounded-sm bg-[#dff6dd] text-[#107c10] font-semibold'>Activa</span>
                          : <span className='text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-[#323130] text-slate-500 font-semibold'>Cerrada</span>
                        }
                      </div>
                      <div className='flex justify-between items-end mt-3'>
                        <div className='text-xs text-slate-500 dark:text-[#a19f9d] flex flex-col gap-1'>
                          <span>Apertura: {new Date(cr.opened_at).toLocaleDateString([], {day:'2-digit', month:'2-digit', year:'2-digit'})}</span>
                          {cr.closed_at && <span>Cierre: {new Date(cr.closed_at).toLocaleDateString([], {day:'2-digit', month:'2-digit', year:'2-digit'})}</span>}
                        </div>
                        <div className='text-right'>
                          <span className='block text-[10px] text-slate-500 mb-0.5'>Saldo final</span>
                          <span className='text-sm font-mono font-medium'>₲{formatCurrency(cr.current_balance || 0)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='p-8 text-center text-sm text-slate-500'>
                  No hay cierres registrados.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* MODALS */}
      <OpenCashRegisterModal 
        isOpen={openCashRegisterDialog} 
        onClose={() => setOpenCashRegisterDialog(false)} 
        onOpen={async (data) => {
          await openCashRegister(data);
          refreshActive();
        }}
        isLoading={isOpeningCashRegister}
      />
      
      {activeCashRegister?.id && (
        <>
          <CloseCashRegisterModal 
            isOpen={closeCashRegisterDialog} 
            onClose={() => setCloseCashRegisterDialog(false)} 
            onCloseRegister={async (data) => {
              await closeCashRegister(activeCashRegister.id, data);
              refreshActive();
              refreshHistory();
            }}
            isLoading={isClosingCashRegister}
            cashRegisterId={activeCashRegister.id}
          />
          <MovementModal 
            isOpen={movementDialog} 
            onClose={() => setMovementDialog(false)} 
            onRegister={async (data) => {
              await registerMovement(activeCashRegister.id, data);
              refreshActive();
            }}
            isLoading={isRegisteringMovement}
          />
          <CashAuditModal 
            isOpen={auditModalOpen} 
            onClose={() => setAuditModalOpen(false)} 
            cashRegisterId={activeCashRegister.id}
            systemBalance={activeCashRegister.current_balance || 0}
            onAuditCreated={() => {
              refreshActive();
              if (activeCashRegister?.id) getCashRegisterReport(activeCashRegister.id);
            }}
          />
        </>
      )}
    </div>
  );
};

export default CashRegister;
