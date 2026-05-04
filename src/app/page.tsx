'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import AnalyzerSection from '@/components/AnalyzerSection';
import ResultDisplay from '@/components/ResultDisplay';
import SummaryCards from '@/components/SummaryCards';
import ResultList from '@/components/ResultList';
import { Clock, Trash2, CheckCircle2, ShieldCheck, History } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedIssueIdx, setSelectedIssueIdx] = useState<number | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // 페이지 로드 시 히스토리 불러오기
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12); // 최근 12개로 확장
      
      if (error) {
        console.error("히스토리 불러오기 실패:", error.message);
        return;
      }
      if (data) setHistory(data);
    } catch (e) {
      console.error("네트워크 오류 (History):", e);
    }
  };

  const loadRecord = async (item: any) => {
    setIsHistoryLoading(true);
    
    // 기록을 불러오는 느낌을 주기 위한 의도적인 짧은 지연
    await new Promise(resolve => setTimeout(resolve, 600));
    
    console.log("기록 불러오기 데이터:", item); // 디버깅용 로그
    
    setIssues(item.issues || []);
    setHasResult(true);
    
    // 이미지 URL이 유효한지 확인 후 설정
    if (item.image_url && item.image_url.includes('http')) {
      setImagePreview(item.image_url);
    } else {
      console.warn("해당 기록에 유효한 이미지 URL이 없습니다. (DB의 image_url 컬럼을 확인하세요)");
      setImagePreview(null);
    }
    
    setSelectedIssueIdx(null);
    setIsHistoryLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = async () => {
    if (!history.length) return;
    if (!confirm("모든 분석 기록을 초기화하시겠습니까? (스토리지의 이미지 파일도 함께 삭제됩니다)")) return;
    
    try {
      // 1. 스토리지에서 파일들 삭제 시도
      const filePaths = history
        .map(item => {
          if (!item.image_url) return null;
          // URL에서 파일명만 추출 (https://.../screenshots/filename.png -> filename.png)
          const parts = item.image_url.split('/');
          return parts[parts.length - 1];
        })
        .filter(Boolean) as string[];

      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('screenshots')
          .remove(filePaths);
        
        if (storageError) {
          console.warn("일부 이미지 파일 삭제 실패:", storageError.message);
        } else {
          console.log("스토리지 이미지 삭제 완료");
        }
      }

      // 2. DB 기록 삭제
      const { error } = await supabase
        .from('analyses')
        .delete()
        .not('id', 'is', null);
      
      if (error) throw error;
      
      setHistory([]);
      alert("모든 기록과 이미지가 삭제되었습니다.");
    } catch (e: any) {
      console.error("초기화 실패:", e.message);
      alert("초기화 중 오류가 발생했습니다.");
    }
  };

  const handleScan = async (data: { type: 'image'; value: File }) => {
    setIsLoading(true);
    setHasResult(false);
    setIssues([]);
    
    try {
      const fileToAnalyze = data.value;

      // Preview 생성
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(fileToAnalyze);

      const formData = new FormData();
      formData.append('image', fileToAnalyze);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '분석 실패');
      }

      const results = await response.json();
      setIssues(results);
      setHasResult(true);

      // --- Supabase 저장 로직 ---
      let publicUrl = null;
      try {
        // 1. 이미지 업로드 시도 (기존 'screenshots' 버킷 사용)
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('screenshots')
          .upload(fileName, fileToAnalyze);
        
        if (!uploadError && uploadData) {
          const { data: { publicUrl: url } } = supabase.storage
            .from('screenshots')
            .getPublicUrl(fileName);
          publicUrl = url;
          console.log("이미지 업로드 성공:", publicUrl);
        } else {
          console.error("이미지 업로드 실패:", uploadError?.message);
          alert(`이미지 업로드 실패: ${uploadError?.message}\n(Storage 정책 설정을 확인해 주세요.)`);
        }
      } catch (storageErr) {
        console.error("Storage 작업 중 에러:", storageErr);
      }

      // 2. DB Insert (image_url 포함 시도)
      const insertData: any = { issues: results };
      if (publicUrl) insertData.image_url = publicUrl;

      const { error: dbError } = await supabase.from('analyses').insert([insertData]);

      if (dbError) {
        // 만약 image_url 컬럼이 없어서 실패했다면, 제외하고 다시 시도
        if (dbError.message.includes('column "image_url" does not exist')) {
          console.warn("DB에 'image_url' 컬럼이 없어 일반 기록만 저장합니다.");
          await supabase.from('analyses').insert([{ issues: results }]);
        } else {
          console.error("DB 저장 실패:", dbError.message);
          alert(`저장 실패: ${dbError.message}`);
        }
      } else {
        console.log("DB 저장 성공!");
        fetchHistory(); // 목록 즉시 갱신
      }
      // -------------------------

    } catch (error: any) {
      console.error("스캔 중 에러:", error);
      alert(`오류: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPage = () => {
    setHasResult(false);
    setImagePreview(null);
    setIssues([]);
    setSelectedIssueIdx(null);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <Header onReset={resetPage} />
      
      {isHistoryLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
            <p className="font-bold text-slate-700 text-lg">기록을 불러오는 중입니다...</p>
          </div>
        </div>
      )}

      <div className="max-w-[1800px] mx-auto p-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* 1. Left: Guide Panel (Fixed width on desktop to protect main layout) */}
          <div className="w-full lg:w-[360px] shrink-0 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-forwards">
            <div className="premium-card p-6 border-t-4 border-t-emerald-500">
              <h2 className="text-xl font-black text-slate-800 mb-6 tracking-tight">UI Stability Check Guide</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="text-2xl h-fit">📷</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">1. Screenshot Upload</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      스크린샷을 업로드하거나 <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-bold">Ctrl+V</kbd>로 붙여넣으세요.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-2xl h-fit">🔍</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">2. Issue Detection</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      AI가 텍스트 넘침, 요소 겹침 등 디스플레이 이슈를 자동으로 탐지합니다.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-2xl h-fit">📊</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">3. Stability Score</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      분석 결과를 종합하여 100점 만점의 시각적 안정성 점수를 제공합니다.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-2xl h-fit">⚠️</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">4. Issue Classification</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      심각도에 따라 <span className="text-amber-500 font-bold">Warning</span> 및 <span className="text-red-500 font-bold">Critical</span>로 분류됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="my-8 border-t border-slate-100" />

              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Score Criteria</h3>
                
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full shadow-sm">PASS</span>
                    <span className="text-xs font-black text-emerald-600">86 ~ 100</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-bold">UI 상태가 매우 안정적입니다.</p>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full shadow-sm">REVIEW</span>
                    <span className="text-xs font-black text-amber-600">70 ~ 85</span>
                  </div>
                  <p className="text-[11px] text-amber-800 font-bold">검토가 필요합니다 (Critical 1개 이상).</p>
                </div>

                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full shadow-sm">FAIL</span>
                    <span className="text-xs font-black text-red-600">Below 70</span>
                  </div>
                  <p className="text-[11px] text-red-800 font-bold">반드시 수정해야 합니다.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Right: Original Content (Restoring the 4:8 Layout) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input & History (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <AnalyzerSection onScan={handleScan} isLoading={isLoading} />
              
              <div className="premium-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">최근 분석 기록</h2>
                  </div>
                  {history.length > 0 && (
                    <button 
                      onClick={clearHistory}
                      className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      기록 초기화
                    </button>
                  )}
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8 italic font-medium">아직 기록이 없습니다.</p>
                  ) : (
                    history.map((item) => {
                      const critical = item.issues?.filter((i: any) => i.severity === 'CRITICAL').length ?? 0;
                      const warning = item.issues?.filter((i: any) => i.severity === 'WARNING').length ?? 0;
                      const score = Math.max(0, 100 - (critical * 15) - (warning * 3));
                      
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => loadRecord(item)}
                          className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(item.created_at).toLocaleString('ko-KR')}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black",
                              score >= 86 ? "bg-emerald-100 text-emerald-600" : score >= 70 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                            )}>
                              SCORE: {score}
                            </span>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Critical</span>
                              <span className="text-sm font-black text-red-500">{critical} <span className="text-[10px]">건</span></span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Warning</span>
                              <span className="text-sm font-black text-amber-500">{warning} <span className="text-[10px]">건</span></span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Result Display (8 cols - Back to original width!) */}
            <div className="lg:col-span-8 space-y-6">
              <ResultDisplay 
                isLoading={isLoading} 
                hasResult={hasResult} 
                imagePreview={imagePreview} 
                issues={issues}
                selectedIssueIdx={selectedIssueIdx}
              />

              {hasResult && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SummaryCards 
                    critical={issues.filter(i => i.severity === 'CRITICAL').length}
                    warning={issues.filter(i => i.severity === 'WARNING').length}
                    pass={0}
                    total={issues.length}
                  />
                  <ResultList 
                    issues={issues} 
                    selectedIssueIdx={selectedIssueIdx}
                    onSelect={setSelectedIssueIdx}
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
