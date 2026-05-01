'use client';

import { useState } from 'react';
import { ClipboardCheck, Globe, Image as ImageIcon, Search } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnalyzerSectionProps {
  onScan: (data: { type: 'url' | 'image'; value: string | File }) => void;
  isLoading: boolean;
}

export default function AnalyzerSection({ onScan, isLoading }: AnalyzerSectionProps) {
  const [tab, setTab] = useState<'url' | 'image'>('url');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('쇼핑몰');
  const [file, setFile] = useState<File | null>(null);

  const categories = ['쇼핑몰', '대시보드', '모바일앱', '랜딩페이지'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="premium-card p-6 w-full max-w-md h-fit">
      <div className="flex items-center gap-2 mb-6 text-slate-700">
        <ClipboardCheck className="w-5 h-5 text-emerald-500" />
        <h2 className="font-bold">검사 입력</h2>
      </div>

      <div className="flex bg-slate-50 p-1 rounded-xl mb-6">
        <button
          onClick={() => setTab('url')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all",
            tab === 'url' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Globe className="w-4 h-4" />
          URL 입력
        </button>
        <button
          onClick={() => setTab('image')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all",
            tab === 'image' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <ImageIcon className="w-4 h-4" />
          이미지 업로드
        </button>
      </div>

      {tab === 'url' ? (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-600"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                  category === cat 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer group",
          file ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-400"
        )}>
          <input type="file" className="hidden" id="file-upload" accept="image/*" onChange={handleFileChange} />
          <label htmlFor="file-upload" className="cursor-pointer">
            {file ? (
              <div>
                <ImageIcon className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-emerald-700">{file.name}</p>
                <p className="text-xs text-emerald-500 mt-1">파일이 선택되었습니다</p>
              </div>
            ) : (
              <div>
                <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3 group-hover:text-emerald-400 transition-colors" />
                <p className="text-sm text-slate-500">클릭하거나 이미지를 드래그하세요</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
              </div>
            )}
          </label>
        </div>
      )}

      <button
        onClick={() => onScan({ type: tab, value: tab === 'url' ? url : file! })}
        disabled={isLoading || (tab === 'url' && !url) || (tab === 'image' && !file)}
        className="btn-primary w-full mt-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        <Search className={cn("w-5 h-5", isLoading && "animate-spin")} />
        {isLoading ? '스캔 중...' : '스캔 시작'}
      </button>
    </div>
  );
}
