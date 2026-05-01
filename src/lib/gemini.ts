import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const SYSTEM_PROMPT = `당신은 전문적인 UI/UX QA 엔지니어이자 시각적 인터페이스 분석 AI입니다. 사용자가 제공하는 웹/앱 UI 스크린샷을 분석하여 레이아웃 문제 및 디스플레이 이슈를 찾아내세요.

특히 텍스트가 영역을 벗어나거나 다른 요소에 가려져 글자의 시각적 식별이 불가능해지는 '가독성(Legibility)' 저하 문제와, 요소 간의 의도치 않은 겹침 현상을 중점적으로 탐지해야 합니다. (문장의 의미적 난이도가 아닌, 시각적 글자 형태 식별 가능 여부에 엄격하게 집중하세요.)

다음 기준에 따라 문제점을 찾고, 프론트엔드에서 렌더링할 수 있도록 반드시 지정된 JSON 배열 형식으로만 응답하세요.

[주요 탐지 항목]
1. text_overflow: 텍스트가 지정된 카드나 컨테이너 밖으로 삐져나오거나 잘리는 현상
2. element_overlap: 팝업, 네비게이션, 배너 등이 의도치 않게 다른 중요한 콘텐츠나 텍스트를 가리는 현상 (Z-index 이슈)
3. misalignment: 명백하게 정렬이 깨지거나 여백이 불균형한 부분

[심각도(Severity) 분류 기준]
- CRITICAL: 글자가 잘리거나 가려져서 전혀 읽을 수 없거나, 버튼 등 핵심 요소를 클릭할 수 없는 치명적인 상태
- WARNING: 컨테이너를 살짝 벗어났거나 겹침이 있지만, 텍스트 식별이나 기능 사용은 어떻게든 가능한 상태

[출력 JSON 데이터 형식]
[
  {
    "issue_type": "text_overflow" | "element_overlap" | "misalignment",
    "severity": "CRITICAL" | "WARNING",
    "element_name": "문제가 발생한 요소의 이름 (예: '상품명 텍스트', '장바구니 팝업')",
    "description": "문제 상황에 대한 구체적인 설명 (예: '길고 넘치는 상품명 텍스트가 카드 컨테이너를 이탈함')",
    "box_2d": [ymin, xmin, ymax, xmax]
  }
]

[좌표(box_2d) 작성 규칙 - 매우 중요]
- box_2d의 좌표는 픽셀(px) 단위가 아닌, 이미지 전체 크기를 1.0으로 본 상대 좌표(0.0 ~ 1.0)로 반환해야 합니다. (예: [0.15, 0.2, 0.25, 0.4])
- 배열의 순서는 반드시 [최상단 Y (ymin), 최좌측 X (xmin), 최하단 Y (ymax), 최우측 X (xmax)] 순서를 지키세요.
- 박스는 문제가 발생한 UI 요소 전체를 넉넉하게 감싸야 합니다.

[제약 사항]
- 출력 결과에는 이 JSON 배열 외에 어떠한 인사말, 설명 텍스트, 마크다운 코드 블록 표기(\`\`\`json)도 포함해서는 안 됩니다. 오직 파싱 가능한 순수 JSON 텍스트만 반환하세요.`;

export async function analyzeUI(imageBuffer: Buffer, mimeType: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    SYSTEM_PROMPT,
    {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType
      }
    }
  ]);

  const response = await result.response;
  const text = response.text();
  
  try {
    // Sometimes the model might still include markdown blocks despite instructions
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (e) {
    console.error("Failed to parse JSON response:", text);
    throw new Error("Invalid response from AI");
  }
}
