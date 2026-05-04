'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import AnalyzerSection from '@/components/AnalyzerSection';
import ResultDisplay from '@/components/ResultDisplay';
import SummaryCards from '@/components/SummaryCards';
import ResultList from '@/components/ResultList';
import { Clock, Trash2 } from 'lucide-react';

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
    
    setIssues(item.issues || []);
    setHasResult(true);
    if (item.image_url) {
      setImagePreview(item.image_url);
    } else {
      setImagePreview(null);
    }
    setSelectedIssueIdx(null);
    setIsHistoryLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = async () => {
    if (!history.length) return;
    if (!confirm("모든 분석 기록을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    
    try {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .not('id', 'is', null);
      
      if (error) throw error;
      
      setHistory([]);
      alert("기록이 모두 삭제되었습니다.");
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
      
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <AnalyzerSection onScan={handleScan} isLoading={isLoading} />
          <ResultDisplay 
            isLoading={isLoading} 
            hasResult={hasResult} 
            imagePreview={imagePreview} 
            issues={issues}
            selectedIssueIdx={selectedIssueIdx}
          />
        </div>

        {hasResult && (
          <div className="space-y-6">
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

        {/* History Section */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-5 h-5 text-emerald-500" />
              <h2 className="font-bold">최근 분석 기록</h2>
            </div>
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                기록 초기화
              </button>
            )}
          </div>

          {isHistoryLoading && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                <p className="font-bold text-slate-700 text-lg">기록을 불러오는 중입니다...</p>
              </div>
            </div>
          )}

          {history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((item) => {
                const critical = item.issues?.filter((i: any) => i.severity === 'CRITICAL').length ?? 0;
                const warning = item.issues?.filter((i: any) => i.severity === 'WARNING').length ?? 0;
                const score = Math.max(0, 100 - (critical * 15) - (warning * 3));
                const isPass = score >= 86;
                const isReview = score >= 70 && score < 86;
                
                const statusLabel = isPass ? 'PASS' : (isReview ? 'REVIEW' : 'FAIL');
                const statusColor = isPass ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : (isReview ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-red-600 bg-red-50 border-red-100');

                return (
                  <div 
                    key={item.id} 
                    onClick={() => loadRecord(item)}
                    className="group bg-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                  >
                    {/* Card Header: Score & Status */}
                    <div className="p-5 flex items-center justify-between border-b border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Stability Score</span>
                        <span className="text-3xl font-black text-slate-800">{score}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black border ${statusColor}`}>
                        {statusLabel}
                      </div>
                    </div>

                    {/* Card Body: Info */}
                    <div className="p-5 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 mb-4">{new Date(item.created_at).toLocaleString('ko-KR')}</p>
                      <div className="flex gap-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Critical</span>
                          <span className="text-lg font-black text-red-500">{critical}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Warning</span>
                          <span className="text-lg font-black text-amber-500">{warning}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Action */}
                    <div className="px-5 py-4 bg-slate-50 group-hover:bg-emerald-500 transition-colors">
                      <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 group-hover:text-white">
                        기록 보기
                        <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">
              아직 분석 기록이 없습니다. 첫 번째 스캔을 시작해 보세요!
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
