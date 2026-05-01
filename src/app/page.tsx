'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import AnalyzerSection from '@/components/AnalyzerSection';
import ResultDisplay from '@/components/ResultDisplay';
import SummaryCards from '@/components/SummaryCards';
import ResultList from '@/components/ResultList';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [issues, setIssues] = useState<any[]>([]);

  const handleScan = async (data: { type: 'url' | 'image'; value: string | File }) => {
    setIsLoading(true);
    setHasResult(false);
    setIssues([]);
    
    try {
      let fileToAnalyze: File;

      if (data.type === 'url') {
        // In a real app, you might use a proxy or screenshot service
        // For this demo, we'll ask the user to upload a screenshot of the URL
        alert("URL 직접 스캔은 현재 스크린샷 업로드로 대체됩니다.");
        setIsLoading(false);
        return;
      } else {
        fileToAnalyze = data.value as File;
      }

      // Create preview
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
        throw new Error('분석 실패');
      }

      const results = await response.json();
      setIssues(results);
      setHasResult(true);
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
      </div>
    </main>
  );
}
