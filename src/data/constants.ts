import { Persona, MoodMeta, DiaryEntry } from '../types';

export const PERSONAS: Persona[] = [
  {
    id: 'mentor',
    name: '해나',
    title: '따스한 박사 선배',
    tagline: '“그 혼란과 불안은 네 탓이 아니야. 나도 다 겪어봤어.”',
    avatar: '👩‍🔬',
    badge: '온화한 공감 & 지지',
    bgColor: 'bg-amber-500/10 text-amber-300',
    borderColor: 'border-amber-500/30'
  },
  {
    id: 'realist',
    name: '도윤',
    title: '사이다 포닥 선배',
    tagline: '“감정은 덜어내고, 당장 써먹을 액션 플랜을 짜보자.”',
    avatar: '👨‍🏫',
    badge: '현실 전략 & 해결책',
    bgColor: 'bg-indigo-500/10 text-indigo-300',
    borderColor: 'border-indigo-500/30'
  },
  {
    id: 'peer',
    name: '우주',
    title: '익명 동기 깐부',
    tagline: '“교수님이 또 그러셨어? 하… 같이 믹스커피 한잔 때리자.”',
    avatar: '🧑‍💻',
    badge: '대나무숲 찐공감',
    bgColor: 'bg-emerald-500/10 text-emerald-300',
    borderColor: 'border-emerald-500/30'
  },
  {
    id: 'coach',
    name: '다온',
    title: '마인드풀니스 코치',
    tagline: '“완벽하지 않아도 괜찮아. 잠시 숨을 고르고 나를 돌보자.”',
    avatar: '🧘‍♀️',
    badge: '가면증후군 & 번아웃 케어',
    bgColor: 'bg-rose-500/10 text-rose-300',
    borderColor: 'border-rose-500/30'
  }
];

export const QUICK_PROMPTS = [
  '오늘 랩미팅에서 질문에 대답을 못해서 너무 부끄럽고 위축돼요',
  '수개월간 반복한 실험 데이터가 가설과 정반대로 나왔어요',
  '남들은 다 논문 쓰고 척척 해내는데 저만 뒤처진 것 같아요 (가면 증후군)',
  '교수님께서 논문 초안에 "논리가 전혀 안 보인다"고 하셨어요',
  '연구실 사람들과의 인간관계 때문에 에너지가 다 빨려요',
  '졸업 디펜스가 다가오는데 과연 무사히 통과할 수 있을지 두려워요',
  '하루 종일 논문 모니터만 쳐다보고 있었는데 한 줄도 못 썼어요'
];

export const MOODS: MoodMeta[] = [
  {
    type: 'burnout',
    label: '번아웃/탈진',
    emoji: '🌧️',
    color: '#6366f1',
    bgColor: 'bg-indigo-950/60 border-indigo-500/40',
    textColor: 'text-indigo-300'
  },
  {
    type: 'anxious',
    label: '불안/초조',
    emoji: '🌪️',
    color: '#f59e0b',
    bgColor: 'bg-amber-950/60 border-amber-500/40',
    textColor: 'text-amber-300'
  },
  {
    type: 'stressed',
    label: '교수님/랩 스트레스',
    emoji: '⚡',
    color: '#ef4444',
    bgColor: 'bg-red-950/60 border-red-500/40',
    textColor: 'text-red-300'
  },
  {
    type: 'frustrated',
    label: '좌절/실험실패',
    emoji: '🥀',
    color: '#ec4899',
    bgColor: 'bg-pink-950/60 border-pink-500/40',
    textColor: 'text-pink-300'
  },
  {
    type: 'numb',
    label: '무기력/멍함',
    emoji: '☁️',
    color: '#94a3b8',
    bgColor: 'bg-slate-900/60 border-slate-500/40',
    textColor: 'text-slate-300'
  },
  {
    type: 'calm',
    label: '잔잔함/평온',
    emoji: '🌤️',
    color: '#06b6d4',
    bgColor: 'bg-cyan-950/60 border-cyan-500/40',
    textColor: 'text-cyan-300'
  },
  {
    type: 'proud',
    label: '뿌듯함/성취',
    emoji: '✨',
    color: '#10b981',
    bgColor: 'bg-emerald-950/60 border-emerald-500/40',
    textColor: 'text-emerald-300'
  },
  {
    type: 'motivated',
    label: '열정/몰입',
    emoji: '🔥',
    color: '#f97316',
    bgColor: 'bg-orange-950/60 border-orange-500/40',
    textColor: 'text-orange-300'
  }
];

export const LAB_TAGS = [
  '랩미팅',
  '교수님면담',
  '실험실패',
  '실험성공',
  '논문작성',
  '저널투고',
  '리비전(R1)',
  '데이터분석',
  '디펜스준비',
  '야근/철야',
  '세미나/발표',
  '동기/선후배',
  '연구과제보고서'
];

export const INITIAL_DIARY_ENTRIES: DiaryEntry[] = [
  {
    id: 'sample-1',
    date: '2026-10-01',
    time: '22:30',
    mood: 'stressed',
    stressLevel: 8,
    labHours: 13,
    tags: ['랩미팅', '교수님면담', '야근/철야'],
    title: '랩미팅에서 질문 폭격 받고 멘탈 나간 날',
    content: '슬라이드 5번째 장에서 교수님이 "이게 무슨 의미가 있는지 본인도 모르고 발표하는 거죠?"라고 하셨다. 순간 숨이 턱 막히고 얼굴이 화끈거렸다. 집에 오는 길에 버스에서 울컥했다.',
    aiFeedback: {
      empathyMessage: '그 말 한마디에 얼마나 가슴이 철렁하고 눈물이 핑 돌았을지 느껴져요. 교수님의 날 선 화법은 발표자의 인격이나 능력이 부족해서가 아니라, 본인의 조급함이나 학술적 엄밀함을 투박하게 표현한 것뿐이에요.',
      mindCareTip: '오늘 밤은 슬라이드 파일 열지 말고 따뜻한 물로 샤워하고 푹 쉬어요. 오늘 버텨낸 것만으로도 대단해요.',
      cheerCheer: '연구의 가치는 그날 랩미팅 5분이 아니라 수많은 밤을 지새운 당신의 끈기 속에 있어요.'
    },
    createdAt: 1727827800000
  },
  {
    id: 'sample-2',
    date: '2026-10-02',
    time: '23:15',
    mood: 'frustrated',
    stressLevel: 7,
    labHours: 11,
    tags: ['실험실패', '데이터분석'],
    title: '3주 동안 돌린 시뮬레이션 결과가 수렴 안 함',
    content: '파라미터 튜닝을 몇 번이나 했는데 결과 그래프가 계속 발산한다. 어디서부터 잘못된 건지 막막하다. 박사과정 진학한 게 내 인생 최대의 실수인가 하는 생각까지 든다.',
    aiFeedback: {
      empathyMessage: '연구에서 "안 되는 결과"를 마주하는 건 누구에게나 가장 외롭고 지치는 순간이에요. 하지만 실패한 시뮬레이션도 무엇이 작동하지 않는지 밝혀낸 엄연한 연구의 한 조각입니다.',
      mindCareTip: '내일 아침 커피 한잔 마시고 선배나 포닥에게 코드 파이프라인 한번만 봐달라고 가볍게 물어보세요. 혼자 끙끙 앓지 말아요.',
      cheerCheer: '실패가 쌓여야 비로소 단단한 디스커션이 완성됩니다. 당신은 지금 지름길이 아닌 진짜 연구를 하고 있어요.'
    },
    createdAt: 1727914500000
  },
  {
    id: 'sample-3',
    date: '2026-10-04',
    time: '20:45',
    mood: 'numb',
    stressLevel: 6,
    labHours: 8,
    tags: ['논문작성', '동기/선후배'],
    title: '동기 논문 억셉 소식 듣고 묘했던 날',
    content: '동기가 Q1 저널에 퍼스트로 실렸다고 랩실에 빵을 돌렸다. 축하해주면서도 내 논문은 아직 인트로도 못 끝냈다는 생각에 마음이 무거웠다. 비교하지 말자고 다짐하지만 쉽지 않다.',
    aiFeedback: {
      empathyMessage: '동기를 축하하면서도 남몰래 찾아오는 그 서글픈 비교의 감정, 대학원생이라면 누구나 품어본 자연스럽고 솔직한 마음이에요. 당신이 못나서가 아니에요.',
      mindCareTip: '연구는 같은 트랙을 달리는 100m 달리기가 아니라 각자 자기만의 봉우리를 오르는 등산이에요. 당신의 산은 다른 산일 뿐이에요.',
      cheerCheer: '당신의 논문도 당신만의 속도로 차곡차곡 여물어가고 있습니다.'
    },
    createdAt: 1728079500000
  },
  {
    id: 'sample-4',
    date: '2026-10-06',
    time: '21:00',
    mood: 'proud',
    stressLevel: 3,
    labHours: 9,
    tags: ['실험성공', '데이터분석'],
    title: '버그 원인 찾고 원하는 경향성 나옴!',
    content: '전처리 스크립트에서 인덱싱 하나 꼬였던 걸 드디어 찾아냈다. 다시 돌리니까 원하던 트렌드가 예쁘게 그려졌다. 별거 아닌 한 줄이었는데 하루 종일 가슴 졸였던 게 사르르 녹는 기분이다.',
    aiFeedback: {
      empathyMessage: '그 짜릿한 쾌감! 끝까지 포기하지 않고 그 작은 인덱스 버그를 집요하게 찾아낸 집념에 진심으로 박수를 보냅니다.',
      mindCareTip: '오늘은 퇴근길에 맛있는 야식을 사서 스스로에게 확실한 보상을 해주세요!',
      cheerCheer: '이 작은 성공의 도파민이 당신을 졸업까지 이끌 원동력입니다. 정말 고생했어요!'
    },
    createdAt: 1728252000000
  }
];

export const PROF_COMMENT_PRESETS = [
  '이게 최선인가요? 논리가 전혀 안 보이는데요.',
  '다른 논문들은 이렇게 안 쓰던데, 선행 연구 제대로 읽고 쓰는 거 맞나요?',
  '데이터 경향성이 이상한데 실험 다시 처음부터 세팅해서 돌려보세요.',
  '이 수준으로 학회 투고하면 리젝 100%입니다. 구조 전부 뜯어고치세요.',
  '본인이 연구자인지 오퍼레이터인지 잘 생각해보세요.'
];

export const BURNOUT_QUESTIONS = [
  {
    id: 'q1',
    text: '아침에 눈을 떠서 랩실에 갈 생각을 하면 가슴이 답답하고 무기력하다.',
    category: 'exhaustion'
  },
  {
    id: 'q2',
    text: '내가 이 연구실에 들어온 건 운이 좋았을 뿐이고, 곧 내 밑천이 드러날 것 같아 두렵다 (가면 증후군).',
    category: 'imposter'
  },
  {
    id: 'q3',
    text: '주말이나 퇴근 후에도 논문/실험 생각 때문에 죄책감이 들고 온전히 쉬지 못한다.',
    category: 'guilt'
  },
  {
    id: 'q4',
    text: '지도교수님이나 선배의 피드백을 들을 때 나 자신의 존재 자체가 부정당하는 느낌이 든다.',
    category: 'sensitivity'
  },
  {
    id: 'q5',
    text: '연구에 대한 최초의 호기심이나 열정은 사라지고 그저 하루하루 버티는 느낌이다.',
    category: 'alienation'
  }
];
