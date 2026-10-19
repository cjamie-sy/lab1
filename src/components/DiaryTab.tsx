import React, { useState, useId } from 'react';
import {
  Calendar,
  CalendarDays,
  Clock,
  Plus,
  BarChart3,
  TrendingUp,
  BrainCircuit,
  Tag,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Heart,
  Smile,
  Frown,
  Activity,
  ArrowRight
} from 'lucide-react';
import { DiaryEntry, MoodType, EmotionReportData } from '../types';
import { MOODS, LAB_TAGS } from '../data/constants';

interface DiaryTabProps {
  entries: DiaryEntry[];
  onSaveEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onResetToSample: () => void;
}

export const DiaryTab: React.FC<DiaryTabProps> = ({
  entries,
  onSaveEntry,
  onDeleteEntry,
  onResetToSample
}) => {
  const gradientId = useId();

  // Active view: 'calendar' | 'analytics' | 'list'
  const [subTab, setSubTab] = useState<'calendar' | 'analytics' | 'list'>('calendar');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [selectedMood, setSelectedMood] = useState<MoodType>('stressed');
  const [stressLevel, setStressLevel] = useState<number>(7);
  const [labHours, setLabHours] = useState<number>(10);
  const [selectedTags, setSelectedTags] = useState<string[]>(['랩미팅']);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [getAiFeedback, setGetAiFeedback] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Expanded Entry IDs for viewing details in list view
  const [expandedId, setExpandedId] = useState<string | null>(entries[0]?.id || null);

  // Emotion Report State
  const [reportData, setReportData] = useState<EmotionReportData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Calendar State
  // Default to the month of the most recent entry or current date
  const [calendarYear, setCalendarYear] = useState(() => {
    if (entries.length > 0) {
      const latest = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return new Date(latest.date).getFullYear();
    }
    return new Date().getFullYear();
  });

  const [calendarMonth, setCalendarMonth] = useState(() => {
    if (entries.length > 0) {
      const latest = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return new Date(latest.date).getMonth(); // 0-indexed
    }
    return new Date().getMonth();
  });

  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>(() => {
    if (entries.length > 0) {
      const latest = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return latest.date;
    }
    return new Date().toISOString().slice(0, 10);
  });

  // Calendar navigation
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear(prev => prev - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear(prev => prev + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCalendarYear(today.getFullYear());
    setCalendarMonth(today.getMonth());
    const dateStr = today.toISOString().slice(0, 10);
    setCalendarSelectedDate(dateStr);
  };

  // Toggle Tag in form
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Submit new diary
  const handleSubmitDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError('제목과 일기 내용을 입력해 주세요.');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    let aiFeedback = undefined;
    if (getAiFeedback) {
      try {
        const res = await fetch('/api/diary-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            mood: MOODS.find(m => m.type === selectedMood)?.label || selectedMood,
            stressLevel,
            tags: selectedTags
          })
        });
        if (res.ok) {
          aiFeedback = await res.json();
        }
      } catch (err) {
        console.error('AI Feedback fetch failed:', err);
      }
    }

    const newEntry: DiaryEntry = {
      id: `diary-${Date.now()}`,
      date: selectedDate,
      time: selectedTime,
      mood: selectedMood,
      stressLevel,
      labHours,
      tags: selectedTags,
      title: title.trim(),
      content: content.trim(),
      aiFeedback,
      createdAt: Date.now()
    };

    onSaveEntry(newEntry);
    setExpandedId(newEntry.id);
    setCalendarSelectedDate(newEntry.date);
    // sync calendar view to the entry date month
    const entryDateObj = new Date(newEntry.date);
    setCalendarYear(entryDateObj.getFullYear());
    setCalendarMonth(entryDateObj.getMonth());

    setIsSubmitting(false);
    setShowForm(false);
    setTitle('');
    setContent('');
  };

  // Open write modal prefilled with clicked calendar date
  const handleOpenFormWithDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowForm(true);
  };

  // Request AI Emotion Pattern Report
  const handleGenerateReport = async () => {
    if (entries.length === 0) return;
    setIsGeneratingReport(true);
    setReportError(null);

    try {
      const res = await fetch('/api/emotion-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diaryHistory: entries.map(e => ({
            date: e.date,
            mood: e.mood,
            stressLevel: e.stressLevel,
            tags: e.tags,
            title: e.title,
            content: e.content.slice(0, 100)
          }))
        })
      });

      if (!res.ok) throw new Error('리포트 생성에 실패했습니다.');
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setReportError(err.message || '리포트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Sorted entries chronologically for charts
  const chronoSorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculations for analytics
  const avgStress = entries.length
    ? (entries.reduce((acc, cur) => acc + cur.stressLevel, 0) / entries.length).toFixed(1)
    : '0';

  const avgHours = entries.length
    ? (entries.reduce((acc, cur) => acc + (cur.labHours || 0), 0) / entries.length).toFixed(1)
    : '0';

  // Mood counts
  const moodCounts = entries.reduce((acc, cur) => {
    acc[cur.mood] = (acc[cur.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Tag stress averages
  const tagStats: Record<string, { totalStress: number; count: number }> = {};
  entries.forEach(e => {
    e.tags.forEach(tag => {
      if (!tagStats[tag]) tagStats[tag] = { totalStress: 0, count: 0 };
      tagStats[tag].totalStress += e.stressLevel;
      tagStats[tag].count += 1;
    });
  });

  const tagAverages = Object.entries(tagStats)
    .map(([tag, stat]) => ({
      tag,
      avg: (stat.totalStress / stat.count).toFixed(1),
      count: stat.count
    }))
    .sort((a, b) => Number(b.avg) - Number(a.avg));

  // Calendar calculations
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();

  // Filter entries in the current calendar month
  const currentMonthPrefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`;
  const currentMonthEntries = entries.filter(e => e.date.startsWith(currentMonthPrefix));

  const monthAvgStress = currentMonthEntries.length
    ? (currentMonthEntries.reduce((acc, cur) => acc + cur.stressLevel, 0) / currentMonthEntries.length).toFixed(1)
    : '0';

  // Find dominant mood for the month
  const monthMoodCounts = currentMonthEntries.reduce((acc, cur) => {
    acc[cur.mood] = (acc[cur.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantMoodForMonth = Object.entries(monthMoodCounts).sort((a, b) => b[1] - a[1])[0];
  const dominantMoodMeta = dominantMoodForMonth ? MOODS.find(m => m.type === dominantMoodForMonth[0]) : null;

  // Selected date entries in calendar
  const selectedDateEntries = entries.filter(e => e.date === calendarSelectedDate);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar: Action Buttons & Subtab toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            연구실 감정 일기 & 마음 패턴 분석
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            오늘 겪은 감정과 사건을 솔직하게 기록하고, 월간 달력과 스트레스 곡선으로 마음 흐름을 추적해 보세요.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Subtab Toggle (3 views: Calendar, Analytics, List) */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setSubTab('calendar')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                subTab === 'calendar'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>월간 감정 달력</span>
            </button>
            <button
              onClick={() => setSubTab('analytics')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                subTab === 'analytics'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>패턴 시각화</span>
            </button>
            <button
              onClick={() => setSubTab('list')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                subTab === 'list'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>일기 목록 ({entries.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().slice(0, 10));
              setShowForm(!showForm);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-medium text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>오늘 일기 쓰기</span>
          </button>
        </div>
      </div>

      {/* Write Diary Modal / Dropdown Form */}
      {showForm && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl relative animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span className="text-xl">✍️</span> 오늘의 연구실 마음 일기 작성
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
            >
              닫기
            </button>
          </div>

          <form onSubmit={handleSubmitDiary} className="space-y-4">
            {/* Date & Time & Lab Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">날짜</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">기록 시각</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">오늘 랩실 체류 시간 (시간)</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={labHours}
                  onChange={e => setLabHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Mood Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                오늘 나의 주된 감정 상태
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MOODS.map(mood => {
                  const isSelected = selectedMood === mood.type;
                  return (
                    <button
                      type="button"
                      key={mood.type}
                      onClick={() => setSelectedMood(mood.type)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                        isSelected
                          ? `${mood.bgColor} border-2 shadow-md scale-[1.02]`
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="text-xl">{mood.emoji}</span>
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold ${isSelected ? mood.textColor : 'text-slate-300'}`}>
                          {mood.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stress Level Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  스트레스 / 마음 압박 지수
                </label>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  stressLevel >= 8
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : stressLevel >= 5
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {stressLevel}점 / 10점 {stressLevel >= 8 ? '(위험/과부하)' : stressLevel >= 5 ? '(주의/피로)' : '(안정)'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stressLevel}
                onChange={e => setStressLevel(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>1 (평온하고 편안함)</span>
                <span>5 (보통/피로감 있음)</span>
                <span>10 (극도의 불안/멘탈 붕괴)</span>
              </div>
            </div>

            {/* Lab Tags */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                관련 사건 / 활동 태그 (다중 선택)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LAB_TAGS.map(tag => {
                  const isChecked = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                        isChecked
                          ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title & Content */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">일기 한 줄 요약</label>
              <input
                type="text"
                placeholder="예: 랩미팅에서 질문 폭격 받고 멘탈 나간 날"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                오늘의 솔직한 마음과 연구실 이야기
              </label>
              <textarea
                rows={4}
                placeholder="누구에게도 말 못 했던 억울함, 실험의 막막함, 교수님의 코멘트, 혹은 오늘 건져낸 작은 보람까지 자유롭게 적어보세요..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                required
              />
            </div>

            {/* AI Feedback Option */}
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <input
                type="checkbox"
                id="aiFeedbackCheck"
                checked={getAiFeedback}
                onChange={e => setGetAiFeedback(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 accent-amber-500 cursor-pointer"
              />
              <label htmlFor="aiFeedbackCheck" className="text-xs text-amber-200 cursor-pointer flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI 선배의 따뜻한 공감 편지와 오늘 밤 꿀팁 답장 받기</span>
              </label>
            </div>

            {formError && (
              <div className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-semibold shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>AI가 따뜻한 답장을 작성하는 중...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>일기 저장하기</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 1. Monthly Calendar View */}
      {subTab === 'calendar' && (
        <div className="space-y-6">
          {/* Calendar Header Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Month Navigation */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title="이전 달"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>{calendarYear}년 {calendarMonth + 1}월</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-normal">
                      감정 캘린더
                    </span>
                  </h3>
                </div>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title="다음 달"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleGoToToday}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  오늘
                </button>
              </div>

              {/* Monthly Overview Badges */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>이번 달 기록:</span>
                  <strong className="text-amber-300 font-mono">{currentMonthEntries.length}일</strong>
                </div>
                {currentMonthEntries.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-rose-400" />
                      <span>평균 스트레스:</span>
                      <strong className={`font-mono ${Number(monthAvgStress) >= 7 ? 'text-red-300' : 'text-emerald-300'}`}>
                        {monthAvgStress} / 10
                      </strong>
                    </div>
                    {dominantMoodMeta && (
                      <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                        <span>주요 감정:</span>
                        <span>{dominantMoodMeta.emoji}</span>
                        <strong className="text-slate-200">{dominantMoodMeta.label}</strong>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quick Mood Legend Pills */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
              <span className="font-medium text-slate-400 shrink-0">감정 범례:</span>
              {MOODS.map(m => (
                <span
                  key={m.type}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/70 border border-slate-800/70 text-slate-300"
                >
                  <span>{m.emoji}</span>
                  <span className="text-[10px]">{m.label}</span>
                </span>
              ))}
            </div>

            {/* 7-column Calendar Grid */}
            <div className="pt-2">
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold mb-2">
                <div className="text-rose-400 py-1">일</div>
                <div className="text-slate-400 py-1">월</div>
                <div className="text-slate-400 py-1">화</div>
                <div className="text-slate-400 py-1">수</div>
                <div className="text-slate-400 py-1">목</div>
                <div className="text-slate-400 py-1">금</div>
                <div className="text-cyan-400 py-1">토</div>
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {/* 1. Leading blank cells from previous month */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                  const prevDayNum = daysInPrevMonth - firstDayOfWeek + i + 1;
                  return (
                    <div
                      key={`prev-${i}`}
                      className="min-h-[75px] sm:min-h-[95px] p-1.5 rounded-xl bg-slate-950/20 border border-slate-900 text-slate-700 flex flex-col justify-between opacity-40 select-none"
                    >
                      <span className="text-[11px] font-mono">{prevDayNum}</span>
                    </div>
                  );
                })}

                {/* 2. Days of current month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayEntries = entries.filter(e => e.date === dateStr);
                  const isSelected = calendarSelectedDate === dateStr;

                  // Check if this date is today
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const isToday = dateStr === todayStr;

                  // Dominant or latest entry
                  const primaryEntry = dayEntries[0];
                  const moodMeta = primaryEntry ? MOODS.find(m => m.type === primaryEntry.mood) : null;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setCalendarSelectedDate(dateStr)}
                      className={`min-h-[75px] sm:min-h-[95px] p-1.5 sm:p-2 rounded-xl border text-left transition-all flex flex-col justify-between relative overflow-hidden group ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-400/30 bg-slate-850 shadow-lg scale-[1.02]'
                          : dayEntries.length > 0
                          ? `${moodMeta?.bgColor || 'bg-slate-900'} hover:border-slate-600 hover:scale-[1.01]`
                          : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      {/* Top row: day number and tags/indicators */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-mono font-semibold ${
                            isToday
                              ? 'text-amber-400 underline underline-offset-2'
                              : isSelected
                              ? 'text-white'
                              : 'text-slate-300'
                          }`}
                        >
                          {dayNum}
                        </span>

                        {isToday && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                            오늘
                          </span>
                        )}

                        {dayEntries.length > 1 && (
                          <span className="text-[9px] px-1 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                            +{dayEntries.length}
                          </span>
                        )}
                      </div>

                      {/* Middle: Emotion Icon and Mood Label */}
                      {dayEntries.length > 0 ? (
                        <div className="flex flex-col items-center justify-center my-auto py-1">
                          <span className="text-2xl sm:text-3xl transition-transform group-hover:scale-110 drop-shadow">
                            {moodMeta?.emoji}
                          </span>
                          <span className={`text-[10px] sm:text-[11px] font-medium truncate max-w-full mt-0.5 ${moodMeta?.textColor}`}>
                            {moodMeta?.label.split('/')[0]}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center my-auto opacity-0 group-hover:opacity-60 transition-opacity">
                          <Plus className="w-4 h-4 text-slate-500" />
                        </div>
                      )}

                      {/* Bottom row: Stress indicator pill */}
                      {dayEntries.length > 0 && (
                        <div className="w-full flex items-center justify-between text-[10px] pt-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                              primaryEntry.stressLevel >= 7
                                ? 'bg-red-500/20 text-red-300'
                                : primaryEntry.stressLevel >= 5
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            ⚡ {primaryEntry.stressLevel}
                          </span>
                          {primaryEntry.labHours !== undefined && (
                            <span className="text-[9px] text-slate-400 font-mono hidden sm:inline">
                              {primaryEntry.labHours}h
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* 3. Trailing blank cells to complete the 7-column grid */}
                {(() => {
                  const totalCellsSoFar = firstDayOfWeek + daysInMonth;
                  const remainder = totalCellsSoFar % 7;
                  const trailingCount = remainder === 0 ? 0 : 7 - remainder;
                  return Array.from({ length: trailingCount }).map((_, i) => (
                    <div
                      key={`next-${i}`}
                      className="min-h-[75px] sm:min-h-[95px] p-1.5 rounded-xl bg-slate-950/20 border border-slate-900 text-slate-700 flex flex-col justify-between opacity-40 select-none"
                    >
                      <span className="text-[11px] font-mono">{i + 1}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Selected Date Detail Inspection Panel */}
          <div className="bg-slate-900/90 border border-amber-500/40 p-5 rounded-2xl shadow-xl space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm sm:text-base text-slate-100">
                  {calendarSelectedDate} 마음 기록
                </h4>
                <span className="text-xs text-slate-400">
                  ({selectedDateEntries.length}편의 일기)
                </span>
              </div>

              <button
                onClick={() => handleOpenFormWithDate(calendarSelectedDate)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>이 날짜로 일기 작성하기</span>
              </button>
            </div>

            {/* Display Selected Date Entries */}
            {selectedDateEntries.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEntries.map(entry => {
                  const meta = MOODS.find(m => m.type === entry.mood);
                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
                    >
                      {/* Title & Metadata */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-2xl p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                            {meta?.emoji}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${meta?.bgColor} ${meta?.textColor}`}>
                                {meta?.label}
                              </span>
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                                entry.stressLevel >= 7
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}>
                                스트레스 {entry.stressLevel}/10
                              </span>
                              {entry.labHours !== undefined && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                                  랩실 {entry.labHours}시간
                                </span>
                              )}
                              <span className="text-xs text-slate-500 font-mono">
                                {entry.time}
                              </span>
                            </div>
                            <h5 className="font-bold text-sm text-slate-100">
                              {entry.title}
                            </h5>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm('이 일기를 삭제하시겠습니까?')) {
                              onDeleteEntry(entry.id);
                            }
                          }}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-800 transition-colors self-end sm:self-auto"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Tags */}
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Content */}
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-xl whitespace-pre-wrap">
                        {entry.content}
                      </p>

                      {/* AI Mentor Feedback */}
                      {entry.aiFeedback && (
                        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-2 text-xs">
                          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI 멘토 선배의 공감 답장</span>
                          </div>
                          <p className="text-slate-200 leading-relaxed">
                            {entry.aiFeedback.empathyMessage}
                          </p>
                          <div className="border-t border-amber-500/20 pt-2 flex items-start gap-1.5 text-amber-200/90 text-[11px]">
                            <span className="font-bold shrink-0">🌙 오늘 밤 팁:</span>
                            <span>{entry.aiFeedback.mindCareTip}</span>
                          </div>
                          <div className="border-t border-amber-500/20 pt-2 text-rose-200 text-[11px] italic font-medium">
                            “{entry.aiFeedback.cheerCheer}”
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2 text-slate-400 text-xs">
                <p>이 날짜({calendarSelectedDate})에는 아직 작성된 감정 일기가 없습니다.</p>
                <p className="text-slate-500">연구실에서 있었던 일이나 당시의 마음을 기록해보세요.</p>
                <div className="pt-2">
                  <button
                    onClick={() => handleOpenFormWithDate(calendarSelectedDate)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>이 날짜로 일기 쓰기</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Analytics Subtab */}
      {subTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                누적 일기 수
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-1">
                {entries.length} <span className="text-xs font-normal text-slate-400">일 기록</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                평균 스트레스 지수
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-1">
                {avgStress} <span className="text-xs font-normal text-slate-400">/ 10</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                평균 랩실 체류 시간
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-1">
                {avgHours} <span className="text-xs font-normal text-slate-400">시간/일</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                가장 잦은 감정
              </div>
              <div className="text-lg font-bold text-slate-100 mt-1 truncate">
                {entries.length > 0 ? (
                  (() => {
                    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
                    const meta = MOODS.find(m => m.type === topMood?.[0]);
                    return (
                      <span className="flex items-center gap-1">
                        <span>{meta?.emoji}</span>
                        <span className="text-sm font-semibold">{meta?.label}</span>
                      </span>
                    );
                  })()
                ) : (
                  '-'
                )}
              </div>
            </div>
          </div>

          {/* Time Series Stress Line Chart */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  시간 경과에 따른 스트레스 패턴 곡선 (Stress Timeline)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  각 날짜별 스트레스 수치 변화와 감정 상태를 한눈에 파악합니다.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> 스트레스 심함 (7~10)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> 안정/성취 (1~4)
                </span>
              </div>
            </div>

            {/* Interactive SVG Chart */}
            {chronoSorted.length > 1 ? (
              <div className="relative pt-2 pb-6">
                <div className="h-56 w-full">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200">
                    <defs>
                      <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {[10, 7, 5, 2].map((lvl, idx) => {
                      const y = 200 - (lvl / 10) * 160 - 20;
                      return (
                        <g key={lvl}>
                          <line
                            x1="40"
                            y1={y}
                            x2="680"
                            y2={y}
                            stroke="#334155"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                          <text x="25" y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">
                            {lvl}
                          </text>
                        </g>
                      );
                    })}

                    {/* Calculate Points */}
                    {(() => {
                      const paddingLeft = 60;
                      const paddingRight = 60;
                      const width = 700 - paddingLeft - paddingRight;
                      const step = width / (chronoSorted.length - 1);

                      const points = chronoSorted.map((e, i) => {
                        const x = paddingLeft + i * step;
                        const y = 200 - (e.stressLevel / 10) * 160 - 20;
                        return { x, y, entry: e };
                      });

                      const pathD = points.reduce((acc, p, idx) => {
                        return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                      }, '');

                      const areaD = `${pathD} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;

                      return (
                        <>
                          {/* Gradient Fill under line */}
                          <path d={areaD} fill={`url(#${gradientId})`} />

                          {/* Line */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Points and Emojis */}
                          {points.map((p, idx) => {
                            const meta = MOODS.find(m => m.type === p.entry.mood);
                            const isHigh = p.entry.stressLevel >= 7;
                            return (
                              <g
                                key={p.entry.id}
                                className="group cursor-pointer"
                                onClick={() => {
                                  setCalendarSelectedDate(p.entry.date);
                                  setSubTab('calendar');
                                }}
                              >
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r={isHigh ? 6 : 5}
                                  fill={isHigh ? '#ef4444' : '#10b981'}
                                  stroke="#0f172a"
                                  strokeWidth="2"
                                  className="transition-transform group-hover:scale-150"
                                />
                                {/* Emoji on top */}
                                <text
                                  x={p.x}
                                  y={p.y - 12}
                                  fontSize="14"
                                  textAnchor="middle"
                                  className="pointer-events-none"
                                >
                                  {meta?.emoji}
                                </text>
                                {/* Date label below */}
                                <text
                                  x={p.x}
                                  y={195}
                                  fill="#94a3b8"
                                  fontSize="10"
                                  textAnchor="middle"
                                >
                                  {p.entry.date.slice(5)}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div className="text-center text-[11px] text-slate-500 mt-2">
                  * 각 포인트를 클릭하면 해당 일자의 감정 달력 상세 내용과 AI 위로 편지를 확인할 수 있습니다.
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                곡선을 보려면 최소 2개 이상의 일기 기록이 필요합니다.
              </div>
            )}
          </div>

          {/* Breakdown: Mood Distribution & Stress Triggers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mood Distribution */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <h3 className="font-bold text-sm text-slate-200 mb-3 flex items-center gap-2">
                <Smile className="w-4 h-4 text-emerald-400" />
                감정 유형별 빈도 분포
              </h3>
              <div className="space-y-2.5">
                {MOODS.map(mood => {
                  const count = moodCounts[mood.type] || 0;
                  const pct = entries.length ? Math.round((count / entries.length) * 100) : 0;
                  return (
                    <div key={mood.type} className="flex items-center gap-2 text-xs">
                      <span className="w-6 text-center">{mood.emoji}</span>
                      <span className="w-24 text-slate-300 font-medium truncate">{mood.label}</span>
                      <div className="flex-1 bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: mood.color
                          }}
                        />
                      </div>
                      <span className="w-12 text-right text-slate-400 font-mono">
                        {count}회 ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tag vs Stress Correlation */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <h3 className="font-bold text-sm text-slate-200 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-rose-400" />
                연구실 활동별 스트레스 상관관계
              </h3>
              <div className="space-y-2">
                {tagAverages.slice(0, 6).map(item => (
                  <div
                    key={item.tag}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-medium">
                        #{item.tag}
                      </span>
                      <span className="text-slate-400 text-[11px]">{item.count}회 기록</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">평균 스트레스:</span>
                      <span
                        className={`font-bold font-mono px-2 py-0.5 rounded ${
                          Number(item.avg) >= 7.5
                            ? 'bg-red-500/20 text-red-300'
                            : Number(item.avg) >= 5
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {item.avg} / 10
                      </span>
                    </div>
                  </div>
                ))}
                {tagAverages.length === 0 && (
                  <p className="text-slate-500 text-xs py-4 text-center">
                    태그 데이터가 아직 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* AI Comprehensive Pattern Report Card */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-amber-950/40 border border-amber-500/30 p-5 rounded-2xl shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    AI 멘토의 감정 흐름 종합 리포트
                  </h3>
                  <p className="text-xs text-slate-400">
                    기록된 일기를 종합 분석해 나의 마음 기후와 대처 방안을 진단합니다.
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || entries.length === 0}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                {isGeneratingReport ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>마음 패턴 분석 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>종합 분석 리포트 생성하기</span>
                  </>
                )}
              </button>
            </div>

            {reportError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-xs mb-3">
                {reportError}
              </div>
            )}

            {reportData ? (
              <div className="space-y-3 bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-xs">
                <div>
                  <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1">
                    🌤️ 마음의 전반적인 기후 요약
                  </div>
                  <p className="text-slate-200 leading-relaxed">{reportData.summary}</p>
                </div>
                <div className="border-t border-slate-800 pt-2.5">
                  <div className="font-semibold text-rose-300 mb-1 flex items-center gap-1">
                    ⚡ 주된 스트레스 트리거
                  </div>
                  <p className="text-slate-300 leading-relaxed">{reportData.triggers}</p>
                </div>
                <div className="border-t border-slate-800 pt-2.5">
                  <div className="font-semibold text-emerald-300 mb-1 flex items-center gap-1">
                    🌱 버텨내고 스스로를 지켜낸 멋진 점
                  </div>
                  <p className="text-slate-300 leading-relaxed">{reportData.growthPoints}</p>
                </div>
                <div className="border-t border-slate-800 pt-2.5 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                  <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1">
                    💌 다음 주를 맞이하기 전 선배의 조언
                  </div>
                  <p className="text-amber-100 leading-relaxed">{reportData.adviceForNextWeek}</p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 bg-slate-950/50 p-4 rounded-xl border border-dashed border-slate-800 text-center">
                위의 '종합 분석 리포트 생성하기' 버튼을 누르면 AI가 지금까지의 일기를 읽고 종합 분석을 제공합니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Diary List Subtab */}
      {subTab === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>총 {entries.length}편의 일기가 보관되어 있습니다.</span>
            <button
              onClick={onResetToSample}
              className="text-slate-400 hover:text-amber-300 underline"
            >
              샘플 일기 다시 채우기
            </button>
          </div>

          <div className="space-y-3">
            {entries.map(entry => {
              const meta = MOODS.find(m => m.type === entry.mood);
              const isExpanded = expandedId === entry.id;

              return (
                <div
                  key={entry.id}
                  className={`bg-slate-900/80 border rounded-2xl transition-all overflow-hidden ${
                    isExpanded ? 'border-amber-500/50 shadow-lg' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Summary Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="text-2xl p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                        {meta?.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs text-slate-400 font-mono">
                            {entry.date} {entry.time}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${meta?.bgColor} ${meta?.textColor}`}>
                            {meta?.label}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                            entry.stressLevel >= 7
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            스트레스 {entry.stressLevel}/10
                          </span>
                          {entry.labHours !== undefined && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                              랩실 {entry.labHours}시간
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm text-slate-100">
                          {entry.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3 text-xs">
                      {/* Tags */}
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {entry.tags.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-3 bg-slate-950/70 rounded-xl text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {entry.content}
                      </div>

                      {/* AI Feedback Box */}
                      {entry.aiFeedback && (
                        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                          <div className="font-semibold text-amber-300 flex items-center gap-1.5 text-xs">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI 멘토 선배의 공감 답장</span>
                          </div>
                          <p className="text-slate-200 leading-relaxed">
                            {entry.aiFeedback.empathyMessage}
                          </p>
                          <div className="border-t border-amber-500/20 pt-2 flex items-start gap-1.5 text-amber-200/90 text-[11px]">
                            <span className="font-bold shrink-0">🌙 오늘 밤 팁:</span>
                            <span>{entry.aiFeedback.mindCareTip}</span>
                          </div>
                          <div className="border-t border-amber-500/20 pt-2 text-rose-200 text-[11px] italic font-medium">
                            “{entry.aiFeedback.cheerCheer}”
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            if (confirm('이 일기를 삭제하시겠습니까?')) {
                              onDeleteEntry(entry.id);
                            }
                          }}
                          className="text-slate-500 hover:text-red-400 flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>일기 삭제</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {entries.length === 0 && (
              <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                작성된 일기가 없습니다. 상단의 '오늘 일기 쓰기' 버튼을 눌러 첫 일기를 남겨보세요.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
