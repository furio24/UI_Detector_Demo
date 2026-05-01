import { NextRequest, NextResponse } from 'next/server';
import { analyzeUI } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: "이미지 파일이 필요합니다." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const results = await analyzeUI(buffer, file.type);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: error.message || "분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
