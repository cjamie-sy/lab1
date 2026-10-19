import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google Gen AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const PERSONA_SYSTEM_INSTRUCTIONS: Record<string, string> = {
  mentor: `당신은 대학원생들을 따뜻하게 품어주고 위로해주는 박사 선배 '해나'입니다.
- 말투: 다정하고 온화하며, 경험에서 우러나오는 따뜻한 존댓말과 공감("정말 고생 많았어요", "그 마음 저도 너무 잘 알아요", "지금 겪는 혼란은 논문 쓰는 모든 연구자가 겪는 정상적인 과정이에요").
- 목표: 자책하고 불안해하는 대학원생에게 자존감을 회복시켜주고, 온전한 지지와 위로를 건넵니다.
- 대학원 생태계(랩 미팅, 논문 리젝, 지도교수님의 피드백, 1저자 부담, 데이터 안 나옴, 졸업 디펜스, 퀄 시험)에 깊은 이해를 바탕으로 대화합니다.
- 답변은 너무 딱딱한 번호 매기기보다는, 가슴에 와닿는 따뜻한 문장과 실질적인 다독임으로 전합니다.`,

  realist: `당신은 산전수전 다 겪고 포닥(박사후연구원)으로 일하고 있는 현실파 선배 '도윤'입니다.
- 말투: 똑 부러지면서도 따뜻한 츤데레 멘토. 실질적이고 차분하며 신뢰감 있는 어투.
- 목표: 멘탈이 흔들려 갈피를 못 잡는 대학원생에게 상황을 객관적으로 분해해주고, 지도교수와의 커뮤니케이션 전략, 리비전 대응법, 우선순위 타임라인 등 '당장 실행 가능한 액션 플랜'을 제공합니다.
- 감정적으로 매몰되지 않도록 냉정하면서도 진심 어린 해결책을 제시합니다.`,

  peer: `당신은 옆자리에서 매일 야근하며 믹스커피와 몬스터 에너지를 마시는 유쾌한 석사 동기 '우주'입니다.
- 말투: 친근하고 편안한 반존대나 다정한 말투("아 진짜요? 교수님 또 그러셨어요?! 하...", "진짜 오늘은 야근하지 말고 같이 탈출해요", "님 진짜 대단한 거 맞아요").
- 목표: 격식 없는 대나무숲 깐부로서 함께 공감하고 맞장구쳐주며 마음의 짐을 가볍게 덜어주는 존재입니다.
- 유머와 짠내 나는 공감으로 대학원생의 스트레스를 웃음과 위로로 승화시킵니다.`,

  coach: `당신은 번아웃과 가면 증후군(Imposter Syndrome)을 전문으로 다루는 마인드풀니스 멘탈 코치 '다온'입니다.
- 말투: 차분하고 평온하며 안도감을 주는 힐링 어투.
- 목표: '나는 자격이 부족한 게 아닐까', '내가 왜 여기 있을까' 자책하는 완벽주의 대학원생에게 자기자비(Self-Compassion), 마음챙김 호흡, 비교하지 않는 평정심을 선물합니다.
- 짧은 숨고르기나 관점 전환 질문을 편안하게 유도합니다.`
};

// 1. Multi-turn Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, persona = 'mentor' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    const systemInstruction = PERSONA_SYSTEM_INSTRUCTIONS[persona] || PERSONA_SYSTEM_INSTRUCTIONS.mentor;

    // Convert messages to Gemini contents format
    // Map 'user' and 'assistant' (or 'model')
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.85,
        topP: 0.95,
      },
    });

    const reply = response.text || '죄송해요, 잠시 마음을 정리하는 중 오류가 발생했어요. 다시 이야기해 주시겠어요?';
    res.json({ reply });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.status(500).json({ error: error?.message || 'Chat generation failed' });
  }
});

// 2. Professor Comment Decoder / Feedback Softener
app.post('/api/feedback-decoder', async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment) {
      res.status(400).json({ error: 'Comment is required' });
      return;
    }

    const prompt = `당신은 학계 생태계와 교수님의 커뮤니케이션 화법을 통달한 대학원생 전문 심리 및 전략 멘토입니다.
아래는 대학원생이 교수님(또는 저널 리뷰어)에게 직접 들었거나 이메일로 받은 피드백입니다:
"${comment}"

대학원생이 상처받지 않고 연구를 진전시킬 수 있도록 다음 JSON 형식으로 정확히 분석해주세요:
{
  "realMeaning": "교수님의 차갑거나 날카로운 표현 뒤에 숨은 학술적 핵심 의도 (무엇을 보완하라는 뜻인지 명료하게)",
  "mindShield": "대학원생을 위한 멘탈 보호막 (이 피드백이 연구자의 지능이나 가치 폄하가 아니라는 따뜻한 심리적 위로와 해석)",
  "actionSteps": ["당장 해야 할 실질적 보완 액션 1", "액션 2", "액션 3"],
  "responseTemplate": "교수님께 보낼 수 있는 매우 예의 바르고 프로페셔널한 답장 이메일 또는 면담 멘트 예시"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Feedback decoder error:', error);
    res.status(500).json({ error: error?.message || 'Decoder failed' });
  }
});

// 3. Cheer Certificate / Daily Lab Achievement Award
app.post('/api/cheer-certificate', async (req, res) => {
  try {
    const { achievement, name = '존경스러운 연구원님' } = req.body;
    const prompt = `대학원생이 오늘 한 작은 일이나 버텨낸 하루: "${achievement || '오늘도 랩실에서 무사히 버팀'}"
받는 사람: "${name}"

이 대학원생을 위해 눈물나게 따뜻하고 위트 있는 '오늘의 수고했어 공식 상장'을 발행해주세요.
JSON 형식으로 답해주세요:
{
  "awardTitle": "상장 이름 (예: 위대한 1센티 전진상, 랩실 지킴이 훈장, 꿋꿋한 멘탈 사수상 등 센스있게)",
  "reason": "상장 수여 이유 (2~3문장, 오늘 한 일이 결코 사소하지 않음을 진심으로 칭송하고 어깨를 토닥여주는 감동적인 문구)",
  "cheerQuote": "마음에 새길 한 줄 위로 명언",
  "recommendedReward": "오늘 밤 자신에게 선물해야 할 소소한 보상 (예: 편의점 하겐다즈 아이스크림, 논문 노트북 덮고 좋아하는 음악 듣기 등)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Cheer certificate error:', error);
    res.status(500).json({ error: error?.message || 'Certificate failed' });
  }
});

// 4. Burnout & Imposter Syndrome Rx
app.post('/api/burnout-rx', async (req, res) => {
  try {
    const { answers, stressLevel } = req.body;
    const prompt = `대학원생의 멘탈 체크 상태:
- 자가진단 점수/스트레스 레벨: ${stressLevel}/10
- 고민 요약: ${JSON.stringify(answers || {})}

이 연구원을 위한 따뜻한 맞춤형 '마음 처방전'을 발행해주세요.
JSON 형식:
{
  "diagnosis": "현재 마음 상태에 대한 따뜻한 진단 한마디",
  "prescription": "오늘 꼭 지켜야 할 마음 처방 3가지",
  "affirmation": "가면증후군을 떨치고 스스로를 긍정하는 오늘의 확언 한 문장",
  "warmHug": "지친 등을 토닥여주는 진심 어린 위로의 편지 (4~5줄)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Burnout rx error:', error);
    res.status(500).json({ error: error?.message || 'Prescription failed' });
  }
});

// 5. Emotion Diary AI Feedback
app.post('/api/diary-feedback', async (req, res) => {
  try {
    const { content, mood, stressLevel, tags } = req.body;
    const prompt = `대학원생이 방금 연구실 감정 일기를 작성했습니다:
- 감정 상태: ${mood}
- 스트레스 지수: ${stressLevel}/10
- 관련 태그: ${(tags || []).join(', ')}
- 일기 내용:
"${content}"

연구실에서 지치고 분투하는 대학원생을 위해 따스하고 깊은 공감의 피드백을 작성해주세요.
JSON 형식:
{
  "empathyMessage": "연구원의 오늘 감정을 있는 그대로 수용하고 다독여주는 따뜻한 위로 (2~3문장)",
  "mindCareTip": "오늘 밤 편안한 잠을 자거나 마음을 내려놓기 위한 한 가지 작은 실천 제안",
  "cheerCheer": "마음이 뭉클해지는 응원의 한마디"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Diary feedback error:', error);
    res.status(500).json({ error: error?.message || 'Diary feedback failed' });
  }
});

// 6. Emotion Trend AI Insight Report
app.post('/api/emotion-report', async (req, res) => {
  try {
    const { diaryHistory } = req.body;
    const prompt = `대학원생의 최근 감정 일기 데이터 기록입니다:
${JSON.stringify(diaryHistory, null, 2)}

이 기록을 바탕으로 감정 패턴을 따뜻하게 분석하고 힘을 북돋워주는 종합 인사이트 리포트를 작성해주세요.
JSON 형식:
{
  "summary": "최근 마음의 전반적인 기후와 흐름 요약",
  "triggers": "스트레스를 유발하는 주된 연구실 요인이나 패턴 분석",
  "growthPoints": "힘든 와중에도 잘 버텨내고 스스로를 지켜낸 멋진 점",
  "adviceForNextWeek": "다음 주를 맞이하기 전 전하는 선배의 따뜻한 조언 (3~4줄)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Emotion report error:', error);
    res.status(500).json({ error: error?.message || 'Emotion report failed' });
  }
});

// Vite Middleware for development, or static files for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
