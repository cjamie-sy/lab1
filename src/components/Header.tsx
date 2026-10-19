import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Volume2,
  VolumeX,
  Sparkles,
  CloudRain,
  BookOpen,
  Heart,
  LogIn,
  LogOut,
  Database,
  User as UserIcon,
  CloudCheck
} from 'lucide-react';
import { ambientSound } from '../utils/audio';
import { FirebaseUser } from '../lib/firebase';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  diaryCount: number;
  user: any | null;
  onLogin: () => void;
  onLogout: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  diaryCount,
  user,
  onLogin,
  onLogout,
  isSyncing
}) => {
  const [ambientType, setAmbientType] = useState<'off' | 'rain' | 'library'>('off');

  const handleToggleAmbient = (type: 'rain' | 'library') => {
    if (ambientType === type) {
      ambientSound.stop();
      setAmbientType('off');
    } else {
      ambientSound.play(type);
      setAmbientType(type);
    }
  };

  useEffect(() => {
    return () => {
      ambientSound.stop();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-xl shadow-inner shadow-amber-500/10">
            🌱
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-200 via-rose-200 to-indigo-200 bg-clip-text text-transparent">
                랩앤힐 <span className="text-xs font-medium text-slate-400 font-mono">Lab & Heal</span>
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                대학원생 마음연구소
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                🔥 Firestore DB
              </span>
            </div>
            <p className="text-xs text-slate-400">
              지친 당신의 연구실 밤을 위한 다정한 위로와 공감
            </p>
          </div>
        </div>

        {/* User Auth & Ambient Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          {/* Ambient Sound Box */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
            <span className="text-slate-400 px-2 flex items-center gap-1 font-medium text-[11px] hidden sm:flex">
              <Sparkles className="w-3 h-3 text-amber-400" /> 백색소음
            </span>
            <button
              onClick={() => handleToggleAmbient('rain')}
              className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 text-xs ${
                ambientType === 'rain'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="창밖 빗소리 앰비언트"
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>밤비</span>
            </button>
            <button
              onClick={() => handleToggleAmbient('library')}
              className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 text-xs ${
                ambientType === 'library'
                  ? 'bg-amber-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="심야 도서관 따뜻한 백색소음"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>도서관</span>
            </button>
            {ambientType !== 'off' && (
              <button
                onClick={() => {
                  ambientSound.stop();
                  setAmbientType('off');
                }}
                className="px-2 py-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-all"
                title="음소거"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* User Auth Button */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || '사용자'}
                  className="w-5 h-5 rounded-full border border-amber-500/40 object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">
                  <UserIcon className="w-3 h-3" />
                </div>
              )}
              <span className="text-slate-200 font-medium max-w-[100px] truncate hidden sm:inline">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-300 p-1 rounded hover:bg-slate-800 transition-colors"
                title="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500 text-amber-200 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Google 로그인 & 클라우드 저장</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
