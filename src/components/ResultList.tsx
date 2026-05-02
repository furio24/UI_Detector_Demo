import { AlertCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ResultListProps {
  issues: any[];
  selectedIssueIdx: number | null;
  onSelect: (idx: number | null) => void;
}

export default function ResultList({ issues, selectedIssueIdx, onSelect }: ResultListProps) {
  if (issues.length === 0) return null;

  return (
    <div className="premium-card p-6 mt-4 w-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-emerald-500 p-1 rounded text-white">
          <AlertCircle className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-slate-800">발견된 문제 <span className="text-slate-400 font-normal ml-2 text-sm">{issues.filter(i => i.severity === 'CRITICAL').length}심각 · {issues.filter(i => i.severity === 'WARNING').length}경고</span></h3>
      </div>
      
      <div className="space-y-3">
        {issues.map((issue, idx) => {
          const isSelected = selectedIssueIdx === idx;
          
          return (
            <div 
              key={idx} 
              onClick={() => onSelect(isSelected ? null : idx)}
              className={cn(
                "flex items-center justify-between p-4 border transition-all cursor-pointer group rounded-xl",
                isSelected 
                  ? "bg-emerald-50 border-emerald-500 shadow-sm" 
                  : "bg-slate-50 border-slate-100 hover:border-emerald-200"
              )}
            >
              <div className="flex items-center gap-4">
                <span className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap",
                  issue.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                )}>
                  {issue.severity}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">{issue.element_name}</span>
                  <span className="text-xs text-slate-500">{issue.description}</span>
                </div>
              </div>
              <div className={cn(
                "transition-all flex items-center gap-1",
                isSelected ? "text-emerald-600" : "opacity-0 group-hover:opacity-100 text-slate-400"
              )}>
                <span className="text-xs font-bold">{isSelected ? '선택됨' : '자세히 보기'}</span>
                <ChevronRight className={cn("w-4 h-4 transition-transform", isSelected && "rotate-90")} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
