import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Volume2, VolumeX, Copy, Check, RotateCcw, AlertCircle, Bot, User, Heart } from 'lucide-react';
import { PersonaId, ChatMessage } from '../types';
import { PERSONAS, QUICK_PROMPTS } from '../data/constants';
import { speakKoreanText, stopSpeaking } from '../utils/audio';

export const ChatTab: React.FC = () => {
  const [selectedPersonaId, setSelectedPersonaId] = useState<PersonaId>('mentor');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-1',
      role: 'assistant',
      content: '어서 와요. 오늘 하루도 연구실에서 정말 고생 많았어요. 랩미팅은 괜찮았나요? 데이터나 논문 때문에 마음이 무겁다면, 편하게 털어놓아 봐요. 언제나 당신 편에서 들어줄게요.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activePersona = PERSONAS.find(p => p.id === selectedPersonaId) || PERSONAS[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // When changing persona, provide an initial welcome if needed
  const handlePersonaChange = (newId: PersonaId) => {
    if (newId === selectedPersonaId) return;
    setSelectedPersonaId(newId);
    stopSpeaking();
    setSpeakingMsgId(null);

    const newPersona = PERSONAS.find(p => p.id === newId);
    let intro = '안녕하세요! 오늘 어떤 고민이 있으신가요? 편하게 이야기해주세요.';
    if (newId === 'mentor') {
      intro = '어서 와요. 오늘 하루도 연구실에서 고생 많았어요. 마음에 쌓인 응어리가 있다면 차분히 풀어봐요.';
    } else if (newId === 'realist') {
      intro = '반갑습니다. 논문, 미팅, 리비전, 랩실 갈등까지… 지금 가장 막히는 게 뭔지 말해봐요. 현실적인 돌파구를 같이 찾아봅시다.';
    } else if (newId === 'peer') {
      intro = '야, 왔어? 오늘 교수님이 또 뜬구름 잡는 소리 하셨냐? 믹스커피 한잔 때리고 같이 털어놓자!';
    } else if (newId === 'coach') {
      intro = '숨 한번 크게 들이쉬고, 천천히 내쉬어보세요. 연구실의 무게는 잠시 내려두고 당신의 마음에 집중해보는 시간이에요.';
    }

    setMessages(prev => [
      ...prev,
      {
        id: `persona-switch-${Date.now()}`,
        role: 'assistant',
        content: `[${newPersona?.title} ${newPersona?.name} 멘토로 전환되었습니다]\n${intro}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setErrorMsg(null);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: selectedPersonaId,
          messages: newHistory.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('상담 서버 응답에 문제가 발생했습니다.');
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || '답변을 불러오지 못했습니다.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '메시지 전송에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeak = (content: string, id: string) => {
    if (speakingMsgId === id) {
      stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(id);
      speakKoreanText(content, () => setSpeakingMsgId(null));
    }
  };

  const handleResetChat = () => {
    if (confirm('대화 기록을 초기화하시겠습니까?')) {
      stopSpeaking();
      setSpeakingMsgId(null);
      setMessages([
        {
          id: `init-${Date.now()}`,
          role: 'assistant',
          content: `${activePersona.name} 멘토와의 새로운 상담이 시작되었습니다. 마음에 담아둔 이야기를 편하게 들려주세요.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] max-w-5xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
      {/* Persona Selection Header */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-amber-400" /> 맞춤 멘토 선택
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              (상황에 맞는 멘토와 깊이 있게 이야기 나누세요)
            </span>
          </div>
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1 rounded-lg transition-all"
            title="새 대화 시작"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>대화 비우기</span>
          </button>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PERSONAS.map(persona => {
            const isSelected = persona.id === selectedPersonaId;
            return (
              <button
                key={persona.id}
                onClick={() => handlePersonaChange(persona.id)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? `${persona.bgColor} ${persona.borderColor} border-2 shadow-lg scale-[1.01]`
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 w-full mb-1">
                  <span className="text-xl">{persona.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm truncate text-slate-200">
                      {persona.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {persona.title}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-medium">
                  {persona.badge}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base shadow-md ${
                  isUser
                    ? 'bg-gradient-to-tr from-amber-600 to-rose-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-slate-200'
                }`}
              >
                {isUser ? <User className="w-5 h-5" /> : activePersona.avatar}
              </div>

              {/* Bubble */}
              <div
                className={`group max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm relative ${
                  isUser
                    ? 'bg-amber-600 text-amber-50 rounded-tr-none'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                }`}
              >
                {/* Role Header (Assistant only) */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-700/50">
                    <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                      {activePersona.title} {activePersona.name}
                    </span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggleSpeak(msg.content, msg.id)}
                        className={`p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition-colors ${
                          speakingMsgId === msg.id ? 'text-amber-400 bg-slate-700' : ''
                        }`}
                        title={speakingMsgId === msg.id ? '음성 멈춤' : '목소리로 듣기'}
                      >
                        {speakingMsgId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                        title="메시지 복사"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </div>

                {/* Timestamp */}
                <div
                  className={`text-[10px] mt-1.5 text-right ${
                    isUser ? 'text-amber-200/80' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-base">
              {activePersona.avatar}
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-none p-4 text-sm text-slate-400 flex items-center gap-2">
              <span className="flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="text-xs text-slate-400">
                {activePersona.name} 멘토가 당신의 이야기를 곱씹으며 답을 준비하고 있어요...
              </span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/60 overflow-x-auto scrollbar-none flex items-center gap-1.5 text-xs">
        <span className="text-slate-400 shrink-0 font-medium text-[11px] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> 추천 질문:
        </span>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-amber-200 border border-slate-700/60 transition-colors text-xs disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800/80">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              rows={2}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`${activePersona.name} 멘토에게 마음에 든 생각, 고민, 억울함을 털어놓아 보세요. (Shift+Enter로 줄바꿈)`}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="h-[52px] px-4 sm:px-5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium shadow-md transition-all flex items-center justify-center gap-1.5"
            title="메시지 전송"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-semibold">전송</span>
          </button>
        </form>
      </div>
    </div>
  );
};
