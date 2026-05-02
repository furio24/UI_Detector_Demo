import { Search, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onReset?: () => void;
}

export default function Header({ onReset }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div 
        onClick={onReset}
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="bg-lime-100 p-2 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-lime-600" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">
          UI Issue <span className="text-lime-500">Detector</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Right side badges removed */}
      </div>
    </header>
  );
}
