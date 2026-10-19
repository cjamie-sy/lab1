import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Send, Copy, Check, MessageSquare, AlertCircle, ArrowRight, Lightbulb, Mail } from 'lucide-react';
import { FeedbackAnalysis } from '../types';
import { PROF_COMMENT_PRESETS } from '../data/constants';

export const DecoderTab: React.FC = () => {
  const [commentInput, setCommentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FeedbackAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleDecode = async (textToDecode?: string) => {
    const text = (textToDecode || commentInput).trim();
    if (!text || isLoading) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/feedback-decoder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: text })
      });

      if (!response.ok) {
        throw new Error('피드백 분석에 실패했습니다.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '피드백 분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              교수님 피드백 순화기 & 멘탈 보호막
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              날카롭고 가시 돋친 코멘트에서 감정적 상처는 걸러내고, 진짜 학술적 의도와 프로페셔널한 답장 문구를 얻어가세요.
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            교수님 또는 Reviewer에게 들은 코멘트를 그대로 적어주세요:
          </label>
          <textarea
            rows={3}
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            placeholder='예: "이게 최선인가요? 논리가 전혀 안 보이는데 뭘 하고 싶은 건지 모르겠네요."'
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none transition-all"
          />
        </div>

        {/* Preset quick buttons */}
        <div>
          <span className="text-[11px] text-slate-400 mb-1.5 block font-medium">
            💡 자주 겪는 멘붕 코멘트 예시:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PROF_COMMENT_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCommentInput(preset);
                  handleDecode(preset);
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-amber-300 transition-colors"
              >
                "{preset.slice(0, 24)}..."
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => handleDecode()}
            disabled={isLoading || !commentInput.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>피드백 해독 & 멘탈 보호막 생성 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>멘탈 보호막 & 속뜻 해독하기</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Analysis Result */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* 1. Mind Shield (Emotional Protection) */}
          <div className="bg-gradient-to-br from-rose-950/40 via-slate-900 to-amber-950/40 border border-rose-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm mb-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>[1] 연구원을 위한 멘탈 보호막 (자책 금지!)</span>
            </div>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              {result.mindShield}
            </p>
          </div>

          {/* 2. Real Meaning */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>[2] 감정을 걷어낸 진짜 학술적 의도</span>
            </div>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              {result.realMeaning}
            </p>
          </div>

          {/* 3. Action Steps */}
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm mb-3">
              <ArrowRight className="w-4 h-4 text-indigo-400" />
              <span>[3] 당장 실천할 구체적 액션 스텝</span>
            </div>
            <ul className="space-y-2">
              {result.actionSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Polite Response Template */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>[4] 교수님께 보낼 정중하고 프로페셔널한 답장 예시</span>
              </div>
              <button
                onClick={() => handleCopy(result.responseTemplate, 'email')}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors"
              >
                {copiedKey === 'email' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>문구 복사</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
              {result.responseTemplate}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
