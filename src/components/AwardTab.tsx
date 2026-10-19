import React, { useState } from 'react';
import { Award, Sparkles, Copy, Check, Heart, Trophy, Share2, Star } from 'lucide-react';
import { AwardData } from '../types';
import { auth, saveAwardToFirestore } from '../lib/firebase';

export const AwardTab: React.FC = () => {
  const [researcherName, setResearcherName] = useState(() => auth.currentUser?.displayName || '자랑스러운 연구원');
  const [achievement, setAchievement] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [awardData, setAwardData] = useState<AwardData | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateAward = async (customAchievement?: string) => {
    const text = (customAchievement || achievement).trim();
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/cheer-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          achievement: text || '오늘도 랩실에서 도망치지 않고 끝까지 버텨냄',
          name: researcherName.trim() || '자랑스러운 연구원'
        })
      });

      if (!response.ok) throw new Error('상장 발급에 실패했습니다.');
      const data: AwardData = await response.json();
      setAwardData(data);

      if (auth.currentUser) {
        await saveAwardToFirestore(auth.currentUser.uid, data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!awardData) return;
    const text = `🏆 [${awardData.awardTitle}]\n수여자: ${researcherName}\n\n${awardData.reason}\n\n“${awardData.cheerQuote}”\n오늘의 추천 보상: ${awardData.recommendedReward}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              오늘의 수고했어 상장 (셀프 칭찬 수여식)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              논문 억셉만이 성과가 아닙니다. 오늘 연구실에서 버텨낸 작은 전진도 마땅히 상을 받아야 합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              받는 사람 (이름 or 닉네임)
            </label>
            <input
              type="text"
              value={researcherName}
              onChange={e => setResearcherName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              오늘 내가 해낸 일 (사소해도 좋아요!)
            </label>
            <input
              type="text"
              placeholder="예: 에러 로그 1개 잡음, 논문 1문단 씀, 탈주 마려웠는데 버팀"
              value={achievement}
              onChange={e => setAchievement(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Quick Chips */}
        <div>
          <span className="text-[11px] text-slate-400 mb-1.5 block">
            💡 이런 것도 훌륭한 상장 수여 이유가 됩니다:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              '오늘 랩미팅 무사히 살아남음',
              '실험 데이터는 망했지만 클리닝 완료',
              '논문 레퍼런스 3편 정독함',
              '오늘 야근 안 하고 정시 퇴근 성공',
              '교수님 부르심에 침착하게 대답함'
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAchievement(preset);
                  handleGenerateAward(preset);
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700/60 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => handleGenerateAward()}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>금빛 상장 제작 중...</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span>공식 상장 발급하기</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Certificate Display */}
      {awardData && (
        <div className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-amber-900/20 border-4 border-amber-500/40 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-3 left-3 text-amber-500/40 text-xl font-serif">❖</div>
          <div className="absolute top-3 right-3 text-amber-500/40 text-xl font-serif">❖</div>
          <div className="absolute bottom-3 left-3 text-amber-500/40 text-xl font-serif">❖</div>
          <div className="absolute bottom-3 right-3 text-amber-500/40 text-xl font-serif">❖</div>

          <div className="text-center space-y-4 max-w-2xl mx-auto relative z-10">
            {/* Header Stamp */}
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-500/20 border-2 border-amber-500/50 text-amber-300 mb-2 shadow-inner">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="text-xs uppercase tracking-widest text-amber-400/80 font-mono font-bold">
              대한민국 대학원생 멘탈사수 위원회 공인
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-200 tracking-tight font-serif">
              {awardData.awardTitle}
            </h3>

            <div className="text-sm font-semibold text-slate-300 py-1">
              수여자: <span className="text-amber-300 text-base underline underline-offset-4">{researcherName}</span> 연구원
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/20 text-slate-200 text-xs sm:text-sm leading-relaxed text-left font-sans">
              {awardData.reason}
            </div>

            <div className="py-2">
              <p className="text-xs italic text-amber-300 font-serif">
                “{awardData.cheerQuote}”
              </p>
            </div>

            {/* Recommended reward */}
            <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 text-amber-200">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>오늘 밤 나에게 줄 추천 선물: <strong>{awardData.recommendedReward}</strong></span>
              </div>

              <button
                onClick={handleCopyText}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors flex items-center gap-1 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '상장 텍스트 복사됨!' : '상장 복사/공유'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
