'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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

  const [imageBounds, setImageBounds] = useState({ width: 0, height: 0, left: 0, top: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const updateImageBounds = useCallback(() => {
    if (!imgRef.current || !containerRef.current) return;

    const img = imgRef.current;
    const container = containerRef.current;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    const style = window.getComputedStyle(container);
    const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    
    const availableWidth = container.clientWidth - paddingX;
    const availableHeight = container.clientHeight - paddingY;

    if (naturalWidth === 0 || naturalHeight === 0 || availableWidth <= 0 || availableHeight <= 0) return;

    const containerRatio = availableWidth / availableHeight;
    const imageRatio = naturalWidth / naturalHeight;

    let renderedWidth, renderedHeight;

    if (imageRatio > containerRatio) {
      renderedWidth = availableWidth;
      renderedHeight = availableWidth / imageRatio;
    } else {
      renderedHeight = availableHeight;
      renderedWidth = availableHeight * imageRatio;
    }

    const left = (availableWidth - renderedWidth) / 2 + parseFloat(style.paddingLeft);
    const top = (availableHeight - renderedHeight) / 2 + parseFloat(style.paddingTop);

    setImageBounds({ width: renderedWidth, height: renderedHeight, left, top });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      updateImageBounds();
    });

    observer.observe(containerRef.current);
    window.addEventListener('resize', updateImageBounds);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateImageBounds);
    };
  }, [updateImageBounds]);

  useEffect(() => {
    setPan({ x: 0, y: 0 });
    if (selectedIssueIdx !== null) {
      setScale(2.5);
    } else {
      setScale(1);
    }
  }, [selectedIssueIdx, issues.length]);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    const nextScale = Math.min(Math.max(scale + delta, 0.5), 4);
    setScale(nextScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
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

  const selectedIssue = selectedIssueIdx !== null ? issues[selectedIssueIdx] : null;
  const zoomStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
    transformOrigin: selectedIssue 
      ? `${selectedIssue.x_percent + selectedIssue.width_percent / 2}% ${selectedIssue.y_percent + selectedIssue.height_percent / 2}%`
      : 'center center',
    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
  };

  if (isLoading) {
    return (
      <div className="premium-card flex-1 flex flex-col items-center justify-center p-12 min-h-[500px]">
        <div className="space-y-4 max-w-xs w-full">
          <div className="flex items-center gap-3 text-slate-600 animate-pulse">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">이미지 데이터 전처리</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600 animate-pulse delay-75">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">Claude sonnet 4-6 — 멀티모달 분석</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-400 rounded-full animate-spin" />
            <span className="text-sm font-medium">2단계 추론 (이슈 탐지 및 좌표 정밀 추출)</span>
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
        </div>
        <div className="flex gap-2">
          {scale !== 1 && (
            <button onClick={resetZoom} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors">
              <RotateCcw className="w-3 h-3" />
              배율 초기화
            </button>
          )}
          <button 
            onClick={() => setShowOverlay(!showOverlay)}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
              showOverlay ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
            )}
          >
            {showOverlay ? '오버레이 ON' : '오버레이 OFF'}
          </button>
        </div>
      </div>
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={cn(
          "relative flex-1 bg-slate-900 overflow-hidden flex items-center justify-center p-4 sm:p-8 select-none",
          scale > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-crosshair"
        )}
      >
        {imagePreview ? (
          <div 
            className="relative ring-2 ring-emerald-500/20 shadow-2xl transition-all duration-300 ease-out flex-shrink-0" 
            style={{
              ...zoomStyle,
              width: imageBounds.width > 0 ? imageBounds.width : 'auto',
              height: imageBounds.height > 0 ? imageBounds.height : 'auto',
            }}
          >
             <img 
               ref={imgRef}
               src={imagePreview} 
               alt="Preview" 
               className={cn(
                 "absolute inset-0 w-full h-full block rounded-lg pointer-events-none"
               )} 
               onLoad={updateImageBounds}
             />
             
             {showOverlay && issues.map((issue, idx) => {
               const { x_percent, y_percent, width_percent, height_percent } = issue;
               const isCritical = issue.severity === 'CRITICAL';
               const isSelected = selectedIssueIdx === idx;
               const hasSelection = selectedIssueIdx !== null;

               return (
                 <div 
                   key={idx}
                   className={cn(
                     "absolute border-[3px] transition-all cursor-pointer group rounded-sm",
                     isCritical 
                       ? 'border-red-500 bg-red-500/15 shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                       : 'border-amber-500 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.4)]',
                     isSelected 
                       ? "z-30 ring-4 ring-white border-white scale-105 opacity-100" 
                       : (hasSelection ? "opacity-10 z-10 scale-95" : "z-20 hover:scale-105 hover:bg-opacity-30 opacity-80 hover:opacity-100")
                   )}
                   style={{
                     top: `${y_percent}%`,
                     left: `${x_percent}%`,
                     width: `${width_percent}%`,
                     height: `${height_percent}%`
                   }}
                 >
                   <div className={cn(
                     "absolute -top-8 left-0 text-white text-xs px-2.5 py-1 rounded shadow-2xl whitespace-nowrap flex items-center gap-1.5 transition-all duration-300 transform",
                     isCritical ? 'bg-red-500' : 'bg-amber-500',
                     isSelected ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
                   )}>
                     {isCritical ? <AlertCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                     <span className="font-bold tracking-tight">{issue.element_name || issue.issue_type}</span>
                   </div>
                 </div>
               );
             })}
          </div>
        ) : (
          <div className="text-slate-500">이미지가 로드되지 않았습니다.</div>
        )}
      </div>
    </div>
  );
}
