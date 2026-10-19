export type PersonaId = 'mentor' | 'realist' | 'peer' | 'coach';

export interface Persona {
  id: PersonaId;
  name: string;
  title: string;
  tagline: string;
  avatar: string;
  badge: string;
  bgColor: string;
  borderColor: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FeedbackAnalysis {
  realMeaning: string;
  mindShield: string;
  actionSteps: string[];
  responseTemplate: string;
}

export interface AwardData {
  awardTitle: string;
  reason: string;
  cheerQuote: string;
  recommendedReward: string;
}

export interface BurnoutRx {
  diagnosis: string;
  prescription: string;
  affirmation: string;
  warmHug: string;
}

export type MoodType =
  | 'burnout'     // 🌧️ 번아웃/우울
  | 'anxious'     // 🌪️ 불안/초조
  | 'stressed'    // ⚡ 교수님/랩 스트레스
  | 'frustrated'  // 🥀 좌절/실패 (실험/리젝)
  | 'numb'        // ☁️ 무기력/멍함
  | 'calm'        // 🌤️ 잔잔함/평온
  | 'proud'       // ✨ 뿌듯함/성취
  | 'motivated';  // 🔥 열정/몰입

export interface MoodMeta {
  type: MoodType;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export interface DiaryEntry {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mood: MoodType;
  stressLevel: number; // 1 to 10
  labHours?: number; // Hours in lab
  tags: string[]; // e.g. ['논문작성', '랩미팅', '실험실패', '교수님면담']
  title: string;
  content: string;
  aiFeedback?: {
    empathyMessage: string;
    mindCareTip: string;
    cheerCheer: string;
  };
  createdAt: number;
}

export interface EmotionReportData {
  summary: string;
  triggers: string;
  growthPoints: string;
  adviceForNextWeek: string;
}
