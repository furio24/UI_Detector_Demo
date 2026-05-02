'use client';

import { useEffect, useState } from 'react';
import { ClipboardCheck, Image as ImageIcon, Search, Monitor, MousePointerClick } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnalyzerSectionProps {
  onScan: (data: { type: 'image'; value: File }) => void;
  isLoading: boolean;
}

export default function AnalyzerSection({ onScan, isLoading }: AnalyzerSectionProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              const pastedFile = new File([blob], `screenshot-${Date.now()}.png`, { type: blob.type });
              setFile(pastedFile);
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div className="premium-card p-6 w-full max-w-md h-fit">
      <div className="flex items-center gap-2 mb-6 text-slate-700">
        <ClipboardCheck className="w-5 h-5 text-emerald-500" />
        <h2 className="font-bold">검사 입력</h2>
      </div>

      <div className="space-y-4">
        {/* 현재 스크린샷 붙여넣기 배너 */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between group transition-all hover:bg-emerald-100/50">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <Monitor className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">현재 스크린샷</p>
              <p className="text-[11px] text-emerald-600">캡처 후 Ctrl + V로 붙여넣기</p>
            </div>
          </div>
          <div className="px-2 py-1 bg-white border border-emerald-200 rounded text-[10px] font-bold text-emerald-700 shadow-sm">
            Paste Available
          </div>
        </div>

        {/* 메인 이미지 업로드 영역 */}
        <div className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group relative overflow-hidden",
          file ? "border-emerald-400 bg-emerald-50/50" : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50"
        )}>
          <input 
            key="file-input"
            type="file" 
            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            id="file-upload" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
          <div className="relative z-0">
            {file ? (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                   <ImageIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-emerald-700 truncate max-w-[200px] mx-auto">{file.name}</p>
                <p className="text-xs text-emerald-500 mt-1">분석 준비 완료</p>
              </div>
            ) : (
              <div>
                <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-100 transition-colors">
                   <MousePointerClick className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="text-sm font-bold text-slate-600 group-hover:text-slate-800">이미지 업로드</p>
                <p className="text-xs text-slate-400 mt-1">파일을 선택하거나 드래그하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => file && onScan({ type: 'image', value: file })}
        disabled={isLoading || !file}
        className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        <Search className={cn("w-5 h-5", isLoading && "animate-spin")} />
        {isLoading ? '분석 중...' : '분석 시작하기'}
      </button>

      <p className="text-[10px] text-slate-400 mt-4 text-center">
        지원 형식: PNG, JPG, JPEG (최대 10MB)
      </p>
    </div>
  );
}
