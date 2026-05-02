'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, Loader2, AlertCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ResultDisplayProps {
  isLoading: boolean;
  hasResult: boolean;
  imagePreview: string | null;
  issues: any[];
  selectedIssueIdx: number | null;
}

export default function ResultDisplay({ isLoading, hasResult, imagePreview, issues, selectedIssueIdx }: ResultDisplayProps) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // 이슈 선택 시 자동 확대, 해제 시 초기화
  useEffect(() => {
    setPan({ x: 0, y: 0 }); // 이동 거리 초기화
    if (selectedIssueIdx !== null) {
      setScale(2.5);
    } else {
      setScale(1);
    }
  }, [selectedIssueIdx]);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    const nextScale = Math.min(Math.max(scale + delta, 0.5), 4);
    setScale(nextScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault(); // 브라우저 기본 이미지 드래그 방지
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // 선택된 이슈에 따른 확대 스타일 계산
  const selectedIssue = selectedIssueIdx !== null ? issues[selectedIssueIdx] : null;
  const zoomStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
    transformOrigin: selectedIssue 
      ? `${((selectedIssue.box_2d[1] + selectedIssue.box_2d[3]) / 2) * 100}% ${((selectedIssue.box_2d[0] + selectedIssue.box_2d[2]) / 2) * 100}%`
      : 'center center',
    transition: isDragging ? 'none' : (selectedIssueIdx !== null ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform-origin 0.5s ease' : 'transform 0.1s ease')
  };

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
            <span className="text-sm font-medium">이미지 데이터 전처리</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600 animate-pulse delay-75">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">Gemini 2.5 Flash — 멀티모달 분석</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-400 rounded-full animate-spin" />
            <span className="text-sm font-medium">레이아웃 및 시각적 결함 검사</span>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 w-2/3 animate-[progress_2s_ease-in-out_infinite]" />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">종합적인 UI/UX 이슈 판독 중...</p>
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
        <div className="flex items-center gap-2">
           <div className={cn("w-2 h-2 rounded-full", selectedIssueIdx !== null ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
           <span className="text-xs font-semibold text-slate-600">
             {selectedIssueIdx !== null ? '이슈 상세 분석 (확대)' : '이슈 감지 모드'}
           </span>
           <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 ml-1">
             {Math.round(scale * 100)}%
           </span>
        </div>
        <div className="flex gap-2">
          {scale !== 1 && (
            <button 
              onClick={resetZoom}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              배율 초기화
            </button>
          )}
          <button 
            onClick={() => setShowOverlay(true)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${showOverlay ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
          >
            오버레이
          </button>
          <button 
            onClick={() => setShowOverlay(false)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${!showOverlay ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
          >
            원본
          </button>
        </div>
      </div>
      <div 
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={cn(
          "relative flex-1 bg-slate-900 overflow-hidden flex items-center justify-center p-8 select-none",
          scale > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
        )}
        title="마우스 휠로 확대, 클릭 드래그로 이동"
      >
        {imagePreview ? (
          <div className="relative inline-block" style={zoomStyle}>
             <img src={imagePreview} alt="Preview" className="max-w-full h-auto rounded-lg shadow-2xl block" />
             {/* Bounding boxes will be rendered here */}
             {showOverlay && issues.map((issue, idx) => {
               const [ymin, xmin, ymax, xmax] = issue.box_2d || [0, 0, 0, 0];
               const isCritical = issue.severity === 'CRITICAL';
               const isSelected = selectedIssueIdx === idx;
               const hasSelection = selectedIssueIdx !== null;

               const colorClass = isCritical ? 'border-red-500 bg-red-500/10' : 'border-amber-500 bg-amber-500/10';
               const labelBg = isCritical ? 'bg-red-500' : 'bg-amber-500';

               return (
                 <div 
                   key={idx}
                   className={cn(
                     "absolute border-2 transition-all cursor-pointer",
                     colorClass,
                     isSelected ? "z-30 ring-4 ring-white/50 border-white animate-pulse" : (hasSelection ? "opacity-20 z-10" : "z-20 group-hover:bg-opacity-25")
                   )}
                   title={issue.description}
                   style={{
                     top: `${ymin * 100}%`,
                     left: `${xmin * 100}%`,
                     width: `${(xmax - xmin) * 100}%`,
                     height: `${(ymax - ymin) * 100}%`
                   }}
                 >
                   <div className={cn(
                     "absolute -top-6 left-0 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap flex items-center gap-1 transition-opacity z-20",
                     labelBg,
                     isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                   )}>
                     {isCritical ? <AlertCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                     <span className="font-bold">{issue.element_name || issue.issue_type}</span>
                   </div>
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
