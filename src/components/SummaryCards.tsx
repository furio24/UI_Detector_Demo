import { AlertCircle, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react';

interface SummaryCardsProps {
  critical: number;
  warning: number;
  pass: number;
  total: number;
}

export default function SummaryCards({ critical, warning, pass, total }: SummaryCardsProps) {
  const cards = [
    { label: 'Critical', value: critical, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', bar: 'bg-red-400' },
    { label: 'Warning', value: warning, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', bar: 'bg-amber-400' },
    { label: 'Pass', value: pass, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', bar: 'bg-emerald-400' },
    { label: 'Total', value: total, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50', bar: 'bg-blue-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
      {cards.map((card) => (
        <div key={card.label} className="premium-card p-4 flex items-center gap-4">
          <div className={`${card.bg} p-3 rounded-xl`}>
            <card.icon className={`w-6 h-6 ${card.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-500">{card.label}</span>
              <span className="text-xl font-bold text-slate-800">{card.value}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${card.bar}`} 
                style={{ width: total > 0 ? `${(card.value / total) * 100}%` : '0%' }} 
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
