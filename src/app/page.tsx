'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import AnalyzerSection from '@/components/AnalyzerSection';
import ResultDisplay from '@/components/ResultDisplay';
import SummaryCards from '@/components/SummaryCards';
import ResultList from '@/components/ResultList';
import { Clock } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // 페이지 로드 시 히스토리 불러오기
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) setHistory(data);
  };

  const handleScan = async (data: { type: 'url' | 'image'; value: string | File }) => {
    setIsLoading(true);
    setHasResult(false);
    setIssues([]);
    
    try {
      let fileToAnalyze: File;

      if (data.type === 'url') {
        alert("URL 직접 스캔은 현재 스크린샷 업로드로 대체됩니다.");
        setIsLoading(false);
        return;
      } else {
        fileToAnalyze = data.value as File;
      }

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

      if (!response.ok) throw new Error('분석 실패');

      const results = await response.json();
      setIssues(results);
      setHasResult(true);

      // Supabase에 저장
      const { error: dbError } = await supabase.from('analyses').insert([
        {
          issues: results,
          summary: {
            critical: results.filter((i: any) => i.severity === 'CRITICAL').length,
            warning: results.filter((i: any) => i.severity === 'WARNING').length,
          }
        }
      ]);

      if (dbError) console.error("DB 저장 실패:", dbError);
      fetchHistory(); // 목록 갱신

    } catch (error) {
      console.error(error);
      alert("분석 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <Header />
      
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <AnalyzerSection onScan={handleScan} isLoading={isLoading} />
          <ResultDisplay 
            isLoading={isLoading} 
            hasResult={hasResult} 
            imagePreview={imagePreview} 
            issues={issues}
          />
        </div>

        {hasResult && (
          <div className="space-y-6">
            <SummaryCards 
              critical={issues.filter(i => i.severity === 'CRITICAL').length}
              warning={issues.filter(i => i.severity === 'WARNING').length}
              pass={1}
              total={issues.length + 1}
            />
            <ResultList issues={issues} />
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-6 text-slate-700">
              <Clock className="w-5 h-5 text-emerald-500" />
              <h2 className="font-bold">최근 분석 기록</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer">
                  <p className="text-[10px] text-slate-400 mb-2">{new Date(item.created_at).toLocaleString('ko-KR')}</p>
                  <div className="flex gap-4">
                     <div className="flex flex-col">
                       <span className="text-xs font-bold text-red-500">Critical: {item.summary?.critical || 0}</span>
                       <span className="text-xs font-bold text-amber-500">Warning: {item.summary?.warning || 0}</span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
