import { AlertCircle, AlertTriangle } from 'lucide-react';

interface ResultListProps {
  issues: any[];
}

export default function ResultList({ issues }: ResultListProps) {
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
        {issues.map((issue, idx) => (
          <div 
            key={idx} 
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-emerald-200 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                issue.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {issue.severity}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-700">{issue.element_name}</span>
                <span className="text-xs text-slate-500">{issue.description}</span>
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-emerald-600 text-xs font-bold">자세히 보기</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
