import { AlertCircle, AlertTriangle, CheckCircle2, ShieldCheck, Gauge } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SummaryCardsProps {
  critical: number;
  warning: number;
  pass: number;
  total: number;
}

export default function SummaryCards({ critical, warning, total }: SummaryCardsProps) {
  // 감점 방식 점수 계산
  const score = Math.max(0, 100 - (critical * 15) - (warning * 3));
  
  // 상태 결정
  let status;
  
  if (score >= 86) {
    status = { 
      label: 'PASS', 
      text: 'UI 상태가 매우 안정적입니다.', 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      icon: CheckCircle2 
    };
  } else if (score >= 70) {
    status = { 
      label: 'REVIEW', 
      text: '검토가 필요합니다', 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      icon: AlertTriangle 
    };
  } else {
    status = { 
      label: 'FAIL', 
      text: '반드시 수정해야합니다.', 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      border: 'border-red-100',
      icon: AlertCircle 
    };
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
      {/* 1. Stability Score Card */}
      <div className="premium-card p-5 flex flex-col justify-between border-l-4 border-l-blue-500">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visual Stability</span>
          <Gauge className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-slate-800">{score}</span>
          <span className="text-sm font-bold text-slate-400">/ 100</span>
        </div>
        <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-1000 ease-out",
              score >= 86 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-red-500"
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* 2. Status Message Card */}
      <div className={cn("premium-card p-5 flex flex-col justify-center border", status.bg, status.border)}>
        <div className="flex items-center gap-3 mb-2">
          <status.icon className={cn("w-6 h-6", status.color)} />
          <span className={cn("text-xs font-black uppercase tracking-widest", status.color)}>{status.label}</span>
        </div>
        <p className={cn("text-lg font-bold leading-tight", status.color)}>{status.text}</p>
        {critical > 0 && (
          <div className="mt-3 flex items-center gap-1.5 px-2 py-1 bg-red-100 rounded text-[10px] font-black text-red-600 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            CRITICAL 이슈 우선 해결 필요
          </div>
        )}
      </div>

      {/* 3. Critical Count Card */}
      <div className="premium-card p-5 flex items-center gap-5">
        <div className="bg-red-50 p-3 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-400 block mb-1 uppercase">Critical</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-red-600">{critical}</span>
            <span className="text-xs font-medium text-slate-400">건</span>
          </div>
        </div>
      </div>

      {/* 4. Warning Count Card */}
      <div className="premium-card p-5 flex items-center gap-5">
        <div className="bg-amber-50 p-3 rounded-2xl">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-400 block mb-1 uppercase">Warning</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-amber-600">{warning}</span>
            <span className="text-xs font-medium text-slate-400">건</span>
          </div>
        </div>
      </div>
    </div>
  );
}
