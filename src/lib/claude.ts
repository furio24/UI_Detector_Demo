import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const modelName = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

// ── 1단계 프롬프트: 이슈 탐지만 ──────────────────────────────────
const DETECT_PROMPT = `당신은 UI/UX 분석 전문가입니다.
이 스크린샷에서 실제 display issue만 탐지하세요.

[탐지 대상]
- text_overflow: 텍스트가 컨테이너 밖으로 나오거나 잘림
- element_overlap: 요소끼리 의도치 않게 겹침
- misalignment: 정렬 불량 또는 여백 불균형

[판단 기준]
- 명백하게 깨진 경우만 포함하세요
- 정상적인 UI 요소는 절대 포함하지 마세요
- 확신이 없으면 제외하세요

순수 JSON 배열만 반환:
[
  {
    "issue_type": "text_overflow" | "element_overlap" | "misalignment",
    "severity": "CRITICAL" | "WARNING",
    "element_name": "요소 이름",
    "description": "결함 설명",
    "location_hint": "이 요소가 화면의 어느 영역에 있는지 (예: 상단 검색바, 중앙 카드 목록 등)"
  }
]

이슈가 없으면 []을 반환하세요.
마크다운 없이 순수 JSON만 반환하세요.`;

// ── 2단계 프롬프트: 좌표만 추출 ──────────────────────────────────
const COORDINATE_PROMPT = (issues: DetectedIssue[]) => `
이 이미지에서 아래 UI 이슈들의 정확한 위치를 찾아주세요.

[찾아야 할 이슈 목록]
${issues
    .map(
      (iss, i) =>
        `${i + 1}. ${iss.element_name} (${iss.location_hint})\n   설명: ${iss.description}`
    )
    .join("\n")}

[좌표 규칙]
- 이미지를 1000x1000 그리드로 간주 (0~1000 정수)
- [ymin, xmin, ymax, xmax] 순서
- 결함이 발생한 요소의 정확한 경계만 지정
- 박스를 절대 부풀리지 마세요

순수 JSON 배열만 반환:
[
  {
    "index": 1,
    "box_2d": [ymin, xmin, ymax, xmax]
  }
]

반드시 위 이슈 목록의 번호(index)와 매칭해서 반환하세요.
마크다운 없이 순수 JSON만 반환하세요.`;

// ── 타입 정의 ─────────────────────────────────────────────────────
interface DetectedIssue {
  issue_type: "text_overflow" | "element_overlap" | "misalignment";
  severity: "CRITICAL" | "WARNING";
  element_name: string;
  description: string;
  location_hint: string;
}

interface CoordinateResult {
  index: number;
  box_2d: [number, number, number, number];
}

export interface UIIssue extends DetectedIssue {
  x_percent: number;
  y_percent: number;
  width_percent: number;
  height_percent: number;
}

// ── JSON 안전 추출 ────────────────────────────────────────────────
function extractJsonArray(text: string): any[] {
  const cleaned = text
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("[");
  if (start === -1) return [];

  let depth = 0;
  let end = -1;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "[") depth++;
    else if (cleaned[i] === "]") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  if (end === -1) return [];

  try {
    const parsed = JSON.parse(cleaned.substring(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── 좌표 검증 ────────────────────────────────────────────────────
function isValidBox(box: any): box is [number, number, number, number] {
  if (!Array.isArray(box) || box.length !== 4) return false;
  const [ymin, xmin, ymax, xmax] = box;
  if ([ymin, xmin, ymax, xmax].some((v) => typeof v !== "number")) return false;
  if (ymin >= ymax || xmin >= xmax) return false;
  if (ymin < 0 || ymax > 1000 || xmin < 0 || xmax > 1000) return false;
  const area = ((ymax - ymin) / 1000) * ((xmax - xmin) / 1000);
  if (area > 0.5 || area < 0.0001) return false;
  return true;
}

// ── 1단계: 이슈 탐지 ────────────────────────────────────────────
async function step1_detectIssues(
  imageBuffer: Buffer,
  mimeType: string
): Promise<DetectedIssue[]> {
  console.log("[Step 1] 이슈 탐지 시작...");

  const response = await client.messages.create({
    model: modelName,
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
            data: imageBuffer.toString("base64"),
          },
        },
        { type: "text", text: DETECT_PROMPT },
      ],
    }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  console.log("[Step 1] Raw:", textBlock.text);

  const parsed = extractJsonArray(textBlock.text);
  console.log(`[Step 1] 탐지된 이슈 수: ${parsed.length}`);
  return parsed as DetectedIssue[];
}

// ── 2단계: 좌표 추출 ────────────────────────────────────────────
async function step2_getCoordinates(
  imageBuffer: Buffer,
  mimeType: string,
  issues: DetectedIssue[]
): Promise<CoordinateResult[]> {
  console.log("[Step 2] 좌표 추출 시작...");

  const response = await client.messages.create({
    model: modelName,
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
            data: imageBuffer.toString("base64"),
          },
        },
        { type: "text", text: COORDINATE_PROMPT(issues) },
      ],
    }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  console.log("[Step 2] Raw:", textBlock.text);

  const parsed = extractJsonArray(textBlock.text);
  console.log(`[Step 2] 좌표 반환된 수: ${parsed.length}`);
  return parsed as CoordinateResult[];
}

// ── 메인 함수 ────────────────────────────────────────────────────
export async function analyzeUI(
  imageBuffer: Buffer,
  mimeType: string
): Promise<UIIssue[]> {
  try {
    // 1단계: 이슈 탐지
    const issues = await step1_detectIssues(imageBuffer, mimeType);
    if (issues.length === 0) {
      console.log("[analyzeUI] 탐지된 이슈 없음");
      return [];
    }

    // 2단계: 좌표 추출
    const coordinates = await step2_getCoordinates(imageBuffer, mimeType, issues);

    // 두 결과 결합
    const result: UIIssue[] = issues
      .map((issue, i) => {
        const coord = coordinates.find((c) => c.index === i + 1);

        // 좌표가 없거나 유효하지 않으면 제외
        if (!coord || !isValidBox(coord.box_2d)) {
          console.warn(`[analyzeUI] 좌표 없음 또는 유효하지 않음: ${issue.element_name}`);
          return null;
        }

        const [ymin, xmin, ymax, xmax] = coord.box_2d;

        return {
          ...issue,
          x_percent: xmin / 10,
          y_percent: ymin / 10,
          width_percent: (xmax - xmin) / 10,
          height_percent: (ymax - ymin) / 10,
        };
      })
      .filter(Boolean) as UIIssue[];

    console.log(`[analyzeUI] 최종 이슈 수: ${result.length}`);
    return result;

  } catch (e: any) {
    console.error("분석 오류:", e);
    throw new Error(e.message || "분석 중 오류 발생");
  }
}