import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

/**
 * @param {Object} props
 * @param {Array} props.data
 */
const TrendChart = ({ data }) => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
        <div>
          <CardTitle className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Tendencia de Flujo de Caja</CardTitle>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Proyección diaria de ingresos vs. egresos</p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/30"></span>
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter">Entradas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/30"></span>
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter">Salidas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 border-2 border-blue-500 border-dashed rounded-full shadow-sm shadow-blue-500/30"></span>
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter">Saldo Neto</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-2">
        <div className="h-[380px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInflows" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  fontWeight: 900,
                  fontSize: '11px',
                  textTransform: 'uppercase'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="inflows" 
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorInflows)" 
                animationDuration={1500}
              />
              <Area 
                type="monotone" 
                dataKey="outflows" 
                stroke="#f97316" 
                strokeWidth={3} 
                fill="transparent" 
                animationDuration={1800}
              />
              <Area 
                type="monotone" 
                dataKey="net" 
                stroke="#3b82f6" 
                strokeWidth={4} 
                strokeDasharray="8 8" 
                fillOpacity={1} 
                fill="url(#colorNet)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendChart;
