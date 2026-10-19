import React, { useState, useEffect } from 'react';
import {
  MessageCircleHeart,
  BookOpen,
  ShieldCheck,
  Award,
  Heart,
  TrendingUp,
  Activity,
  Smile,
  Sparkles,
  CloudCheck,
  LogIn,
  CheckCircle2,
  Database
} from 'lucide-react';
import { Header } from './components/Header';
import { ChatTab } from './components/ChatTab';
import { DiaryTab } from './components/DiaryTab';
import { DecoderTab } from './components/DecoderTab';
import { AwardTab } from './components/AwardTab';
import { CareTab } from './components/CareTab';
import { DiaryEntry } from './types';
import { INITIAL_DIARY_ENTRIES } from './data/constants';
import {
  auth,
  db,
  loginWithGoogle,
  logoutUser,
  saveDiaryToFirestore,
  deleteDiaryFromFirestore,
  loadUserDiaries,
  handleFirestoreError,
  OperationType
} from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'lab_heal_diaries_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'diary' | 'decoder' | 'award' | 'care'>('chat');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load diary entries from localStorage or fallback to sample
  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load diaries from localStorage', e);
    }
    return INITIAL_DIARY_ENTRIES;
  });

  // Save diary entries to localStorage as backup
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save diaries to localStorage', e);
    }
  }, [entries]);

  // Firebase Auth State Listener & Realtime Firestore Synchronization
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsSyncing(true);
        try {
          // 1. Fetch initial cloud diaries
          const cloudDiaries = await loadUserDiaries(user.uid);
          if (cloudDiaries.length > 0) {
            setEntries(cloudDiaries);
          } else {
            // First time login: sync existing local entries to Firestore
            for (const item of entries) {
              await saveDiaryToFirestore(user.uid, item);
            }
          }

          // 2. Realtime listener on Firestore subcollection
          const q = query(collection(db, 'users', user.uid, 'diaries'), orderBy('date', 'desc'));
          const colPath = `users/${user.uid}/diaries`;
          unsubscribeSnapshot = onSnapshot(
            q,
            (snapshot) => {
              const liveList: DiaryEntry[] = [];
              snapshot.forEach(docSnap => {
                liveList.push(docSnap.data() as DiaryEntry);
              });
              if (liveList.length > 0) {
                setEntries(liveList);
              }
              setIsSyncing(false);
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, colPath);
              setIsSyncing(false);
            }
          );
        } catch (err) {
          console.error('Error syncing cloud diaries:', err);
          setIsSyncing(false);
        }
      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        setIsSyncing(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const handleSaveEntry = async (newEntry: DiaryEntry) => {
    // Optimistic UI update
    setEntries(prev => [newEntry, ...prev.filter(e => e.id !== newEntry.id)]);

    // If authenticated, persist directly to Firestore
    if (currentUser) {
      try {
        await saveDiaryToFirestore(currentUser.uid, newEntry);
      } catch (err) {
        console.error('Firestore save error:', err);
      }
    }
  };

  const handleDeleteEntry = async (id: string) => {
    // Optimistic UI update
    setEntries(prev => prev.filter(e => e.id !== id));

    // If authenticated, delete from Firestore
    if (currentUser) {
      try {
        await deleteDiaryFromFirestore(currentUser.uid, id);
      } catch (err) {
        console.error('Firestore delete error:', err);
      }
    }
  };

  const handleResetToSample = async () => {
    if (confirm('샘플 일기 데이터로 다시 채우시겠습니까?')) {
      setEntries(INITIAL_DIARY_ENTRIES);
      if (currentUser) {
        for (const item of INITIAL_DIARY_ENTRIES) {
          await saveDiaryToFirestore(currentUser.uid, item);
        }
      }
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      alert('Google 로그인 중 오류가 발생했습니다. 브라우저 팝업 차단을 확인해주세요.');
    }
  };

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await logoutUser();
    }
  };

  const tabs = [
    {
      id: 'chat',
      label: 'AI 마음 상담실',
      icon: MessageCircleHeart,
      badge: 'Gemini 3.8',
      desc: '선배·포닥·동기 맞춤 멘토링'
    },
    {
      id: 'diary',
      label: '감정 일기 & 패턴 분석',
      icon: TrendingUp,
      badge: `${entries.length}일 기록`,
      desc: '월간 달력 & 스트레스 곡선'
    },
    {
      id: 'decoder',
      label: '교수님 피드백 순화기',
      icon: ShieldCheck,
      badge: '멘탈 방패',
      desc: '날카로운 코멘트 속뜻 & 답장'
    },
    {
      id: 'award',
      label: '오늘의 수고했어 상장',
      icon: Award,
      badge: '셀프 칭찬',
      desc: '작은 성취 공식 상장 수여식'
    },
    {
      id: 'care',
      label: '멘탈 쉼터 & 번아웃 케어',
      icon: Heart,
      badge: '마음챙김',
      desc: '30초 박스호흡 & 가면증후군 처방'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        diaryCount={entries.length}
        user={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isSyncing={isSyncing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Cloud DB Connection Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-amber-400" />
            {currentUser ? (
              <span className="text-slate-300">
                <strong>{currentUser.displayName || currentUser.email}</strong> 연구원님의 자료가{' '}
                <span className="text-emerald-300 font-medium">Firebase Firestore DB</span>에 실시간 영구 동기화되고 있습니다.
              </span>
            ) : (
              <span className="text-slate-400">
                Firebase Firestore 데이터베이스가 연결되었습니다. Google 로그인 시 클라우드 영구 저장이 활성화됩니다.
              </span>
            )}
          </div>

          {!currentUser && (
            <button
              onClick={handleLogin}
              className="text-amber-300 hover:text-amber-200 underline font-medium flex items-center gap-1 self-start sm:self-auto"
            >
              <LogIn className="w-3 h-3" />
              <span>지금 로그인하고 클라우드 동기화</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-br from-slate-900 to-slate-850 border-amber-500/60 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/40'
                    : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  </div>
                  <div className={`font-bold text-xs sm:text-sm ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>
                    {tab.label}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">
                  {tab.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="transition-all duration-200">
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'diary' && (
            <DiaryTab
              entries={entries}
              onSaveEntry={handleSaveEntry}
              onDeleteEntry={handleDeleteEntry}
              onResetToSample={handleResetToSample}
            />
          )}
          {activeTab === 'decoder' && <DecoderTab />}
          {activeTab === 'award' && <AwardTab />}
          {activeTab === 'care' && <CareTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/60 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            랩앤힐 (Lab & Heal) — 늦은 밤까지 연구실에 불을 밝히는 모든 대학원생 연구원들을 진심으로 응원합니다.
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            Firebase Firestore DB • Gemini AI • Made with warmth
          </p>
        </div>
      </footer>
    </div>
  );
}
