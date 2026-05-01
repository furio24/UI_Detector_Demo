import { Search, ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="bg-emerald-100 p-2 rounded-lg">
          <Search className="w-6 h-6 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">
          Display<span className="text-emerald-500">Scan</span>
        </h1>
        <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full border border-emerald-100">
          Version A
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-slate-600">Claude Vision</span>
        </div>
        <div className="px-3 py-1.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-500">
          UI Display Detector
        </div>
      </div>
    </header>
  );
}
