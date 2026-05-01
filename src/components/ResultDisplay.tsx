'use client';

import { CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ResultDisplayProps {
  isLoading: boolean;
  hasResult: boolean;
  imagePreview: string | null;
  issues: any[];
}

export default function ResultDisplay({ isLoading, hasResult, imagePreview, issues }: ResultDisplayProps) {
  if (isLoading) {
    return (
      <div className="premium-card flex-1 flex flex-col items-center justify-center p-12 min-h-[500px]">
        <div className="relative mb-8">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-emerald-100 rounded-full" />
          </div>
        </div>
        <div className="space-y-4 max-w-xs w-full">
          <div className="flex items-center gap-3 text-slate-600 animate-pulse">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">화면 스크린샷 캡쳐</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600 animate-pulse delay-75">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">Claude Vision — 요소 분석</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-400 rounded-full animate-spin" />
            <span className="text-sm font-medium">텍스트 오버플로 검사</span>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 w-2/3 animate-[progress_2s_ease-in-out_infinite]" />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">반응형 브레이크포인트 확인...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasResult) {
    return (
      <div className="premium-card flex-1 flex flex-col items-center justify-center p-12 min-h-[500px] text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
          <ImageIcon className="w-10 h-10 text-emerald-200" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">아직 스캔하지 않았어요</h3>
        <p className="text-slate-500 max-w-xs">
          URL을 입력하거나 스크린샷을 업로드하고 스캔을 시작해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="premium-card flex-1 flex flex-col min-h-[500px] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-50">
        <div className="flex gap-2">
          <button className="px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-md">오버레이</button>
          <button className="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-500 rounded-md">원본</button>
        </div>
      </div>
      <div className="relative flex-1 bg-slate-900 overflow-auto flex items-center justify-center p-8">
        {imagePreview ? (
          <div className="relative">
             <img src={imagePreview} alt="Preview" className="max-w-full h-auto rounded-lg shadow-2xl" />
             {/* Bounding boxes will be rendered here */}
             {issues.map((issue, idx) => {
               const [ymin, xmin, ymax, xmax] = issue.box_2d;
               return (
                 <div 
                   key={idx}
                   className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none"
                   style={{
                     top: `${ymin * 100}%`,
                     left: `${xmin * 100}%`,
                     width: `${(xmax - xmin) * 100}%`,
                     height: `${(ymax - ymin) * 100}%`
                   }}
                 >
                   <span className="absolute -top-6 left-0 bg-red-500 text-white text-[10px] px-1 rounded whitespace-nowrap">
                     {issue.issue_type}
                   </span>
                 </div>
               );
             })}
          </div>
        ) : (
          <div className="text-slate-500">이미지를 불러올 수 없습니다.</div>
        )}
      </div>
    </div>
  );
}
