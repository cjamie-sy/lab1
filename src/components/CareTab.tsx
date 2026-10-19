import React, { useState, useEffect } from 'react';
import { Wind, Heart, Sparkles, AlertCircle, Play, Square, CheckCircle2 } from 'lucide-react';
import { BurnoutRx } from '../types';
import { BURNOUT_QUESTIONS } from '../data/constants';

export const CareTab: React.FC = () => {
  // Breathing states
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [breathSeconds, setBreathSeconds] = useState(4);

  // Imposter Syndrome & Burnout Check states
  const [scores, setScores] = useState<Record<string, number>>({
    q1: 3,
    q2: 3,
    q3: 3,
    q4: 3,
    q5: 3
  });
  const [isLoadingRx, setIsLoadingRx] = useState(false);
  const [rxResult, setRxResult] = useState<BurnoutRx | null>(null);

  // Breathing Box Timer
  useEffect(() => {
    if (!isBreathing) return;

    const interval = setInterval(() => {
      setBreathSeconds(prev => {
        if (prev <= 1) {
          // Switch phase
          setBreathPhase(curr => {
            if (curr === 'inhale') return 'hold1';
            if (curr === 'hold1') return 'exhale';
            if (curr === 'exhale') return 'hold2';
            return 'inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathing]);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  const handleGenerateRx = async () => {
    setIsLoadingRx(true);
    try {
      const response = await fetch('/api/burnout-rx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: scores,
          stressLevel: Math.round((totalScore / 25) * 10)
        })
      });

      if (!response.ok) throw new Error('처방전 생성 실패');
      const data = await response.json();
      setRxResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRx(false);
    }
  };

  const phaseKorean = {
    inhale: '깊게 들이쉬세요 (Inhale)',
    hold1: '숨을 가만히 멈추세요 (Hold)',
    exhale: '천천히 내쉬세요 (Exhale)',
    hold2: '편안하게 비워두세요 (Rest)'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Box Breathing Section */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-cyan-950/40 border border-indigo-500/30 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                30초 박스 호흡 가이드 (미국 네이비씰 & 심리 안정 호흡법)
              </h3>
              <p className="text-xs text-slate-400">
                심장이 두근거리거나 랩미팅 직전 불안할 때, 4초 호흡으로 자율신경계를 안정시켜 보세요.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsBreathing(!isBreathing);
              setBreathSeconds(4);
              setBreathPhase('inhale');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto ${
              isBreathing
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
            }`}
          >
            {isBreathing ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>호흡 멈추기</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>호흡 시작하기</span>
              </>
            )}
          </button>
        </div>

        {/* Breathing Animation Canvas */}
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Pulsing ring */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                isBreathing && (breathPhase === 'inhale' || breathPhase === 'hold1')
                  ? 'scale-110 bg-cyan-500/20 border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                  : 'scale-90 bg-indigo-500/10 border-2 border-indigo-400/30'
              }`}
            />
            {/* Center Info */}
            <div className="text-center z-10 space-y-1">
              <div className="text-3xl font-bold font-mono text-cyan-300">
                {isBreathing ? breathSeconds : '4'}
              </div>
              <div className="text-xs font-medium text-slate-300">
                {isBreathing ? phaseKorean[breathPhase] : '시작 버튼을 누르세요'}
              </div>
            </div>
          </div>
          <div className="mt-4 text-[11px] text-slate-400 text-center max-w-sm">
            4초 들이마시기 → 4초 멈추기 → 4초 내쉬기 → 4초 비우기를 반복하며 어깨와 턱의 긴장을 풀어줍니다.
          </div>
        </div>
      </div>

      {/* 2. Imposter Syndrome & Burnout Self-Assessment */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              대학원생 번아웃 & 가면 증후군(Imposter Syndrome) 자가진단
            </h3>
            <p className="text-xs text-slate-400">
              대학원생 10명 중 7명이 겪는다는 가면 증후군, 나의 현재 피로도는 어느 정도일까요?
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 pt-2">
          {BURNOUT_QUESTIONS.map((q, idx) => (
            <div key={q.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="text-xs font-medium text-slate-200">
                <span className="text-amber-400 font-bold mr-1.5">{idx + 1}.</span>
                {q.text}
              </div>
              <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 pt-1">
                <span>전혀 아니다 (1)</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(score => (
                    <button
                      key={score}
                      onClick={() => setScores(prev => ({ ...prev, [q.id]: score }))}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        scores[q.id] === score
                          ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <span>매우 그렇다 (5)</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total Score & Generate Rx */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-300">
            총합 점수:{' '}
            <span className="font-bold text-amber-300 text-sm font-mono">{totalScore}</span> / 25점{' '}
            <span className="text-slate-400">
              ({totalScore >= 18 ? '심한 과부하 및 자책감' : totalScore >= 12 ? '주의 단계의 피로' : '비교적 안정'})
            </span>
          </div>

          <button
            onClick={handleGenerateRx}
            disabled={isLoadingRx}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            {isLoadingRx ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>맞춤 마음 처방전 조제 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>AI 맞춤 마음 처방전 받기</span>
              </>
            )}
          </button>
        </div>

        {/* Prescription Result */}
        {rxResult && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-4 animate-in fade-in duration-300 text-xs">
            <div className="font-bold text-sm text-amber-300 flex items-center gap-2 pb-2 border-b border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>오늘의 마음 연구소 맞춤 처방전</span>
            </div>

            <div>
              <div className="font-semibold text-slate-300 mb-1">📋 현재 마음 상태 진단:</div>
              <p className="text-slate-200 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
                {rxResult.diagnosis}
              </p>
            </div>

            <div>
              <div className="font-semibold text-emerald-300 mb-1">💊 오늘 반드시 지켜야 할 처방:</div>
              <div className="text-slate-200 leading-relaxed bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl">
                {rxResult.prescription}
              </div>
            </div>

            <div>
              <div className="font-semibold text-amber-300 mb-1">✨ 오늘의 가면증후군 해독 확언:</div>
              <div className="text-amber-100 font-medium italic bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                “{rxResult.affirmation}”
              </div>
            </div>

            <div>
              <div className="font-semibold text-rose-300 mb-1">💌 선배 멘토의 따뜻한 포옹 편지:</div>
              <p className="text-slate-200 leading-relaxed bg-rose-950/20 border border-rose-500/20 p-3 rounded-xl whitespace-pre-wrap">
                {rxResult.warmHug}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
