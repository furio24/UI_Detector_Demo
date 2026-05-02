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
        .limit(6);
      
      if (error) {
        console.error("히스토리 불러오기 실패:", error.message);
        return;
      }
      if (data) setHistory(data);
    } catch (e) {
      console.error("네트워크 오류 (History):", e);
    }
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

      // Supabase에 저장 시도
      const { error: dbError } = await supabase.from('analyses').insert([
        {
          issues: results,
        }
      ]);

      if (dbError) {
        console.error("DB 저장 실패 상세:", dbError.message, dbError.details, dbError.hint);
        alert(`저장 실패: ${dbError.message}`);
      } else {
        console.log("DB 저장 성공!");
        fetchHistory(); // 목록 즉시 갱신
      }

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
          {history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer group">
                  <p className="text-[10px] text-slate-400 mb-2">{new Date(item.created_at).toLocaleString('ko-KR')}</p>
                  <div className="flex items-center justify-between">
                     <div className="flex gap-3">
                       <div className="flex flex-col">
                         <span className="text-[10px] text-slate-400 uppercase">Critical</span>
                         <span className="text-sm font-bold text-red-500">
                           {item.summary?.critical ?? item.issues?.filter((i: any) => i.severity === 'CRITICAL').length ?? 0}
                         </span>
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[10px] text-slate-400 uppercase">Warning</span>
                         <span className="text-sm font-bold text-amber-500">
                           {item.summary?.warning ?? item.issues?.filter((i: any) => i.severity === 'WARNING').length ?? 0}
                         </span>
                       </div>
                     </div>
                     <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">기록 보기 →</span>
                  </div>
                </div>
              ))}
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
