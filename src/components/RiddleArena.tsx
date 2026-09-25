import React, { useState } from 'react';
import { RIDDLES_DATA } from '../data/riddles';
import { Riddle, EventSettings } from '../types';
import { soundEffects } from '../services/audio';
import { api } from '../services/api';
import { ChevronLeft, ChevronRight, Lightbulb, Eye, EyeOff, Sparkles, Flame, CheckCircle, Radio, Tag } from 'lucide-react';

interface RiddleArenaProps {
  settings?: EventSettings;
  onNavigateToBuzzer?: () => void;
  onStartBuzzer?: () => void;
}

export const RiddleArena: React.FC<RiddleArenaProps> = ({ settings, onNavigateToBuzzer, onStartBuzzer }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (settings?.activeRiddleId) {
      const idx = RIDDLES_DATA.findIndex((r) => r.id === settings.activeRiddleId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const [showHint, setShowHint] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [isLinking, setIsLinking] = useState<boolean>(false);

  const currentRiddle: Riddle = RIDDLES_DATA[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / RIDDLES_DATA.length) * 100);

  const handleNext = () => {
    if (currentIndex < RIDDLES_DATA.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowHint(false);
      setShowAnswer(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowHint(false);
      setShowAnswer(false);
    }
  };

  const handleToggleHint = () => {
    setShowHint((prev) => !prev);
  };

  const handleToggleAnswer = () => {
    if (!showAnswer) {
      soundEffects.playWinnerFanfare();
    }
    setShowAnswer((prev) => !prev);
  };

  const handleSetAsRoundRiddle = async () => {
    setIsLinking(true);
    try {
      await api.setRiddle(currentRiddle.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLinking(false);
    }
  };

  const isCurrentRoundRiddle = settings?.activeRiddleId === currentRiddle.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Top Breadcrumb & Progress */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-lg">
            🧩
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-gaming text-white">
              HYDERABADI RIDDLE ARENA
            </h2>
            <p className="text-xs text-purple-300">
              Question {currentIndex + 1} of {RIDDLES_DATA.length} • College Peace Day Edition
            </p>
          </div>
        </div>

        {/* Category Pill */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 border border-purple-500/30 text-purple-300 flex items-center gap-1.5 shadow-sm">
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            {currentRiddle.category}
          </span>
          {isCurrentRoundRiddle && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 border border-red-500/40 text-red-300 flex items-center gap-1.5 animate-pulse">
              <Radio className="w-3.5 h-3.5 text-red-400" />
              Active in Round #{settings?.currentRound}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mb-6 border border-slate-800">
        <div
          className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 h-full transition-all duration-300 rounded-full shadow-lg shadow-purple-500/50"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* RIDDLE GAME CARD */}
      <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/40 border-2 border-purple-500/30 p-6 sm:p-10 shadow-2xl shadow-purple-950/50 text-left transition-all duration-300">
        {/* Riddle Badge and Index */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-gaming text-sm font-bold tracking-wider shadow-md shadow-purple-600/30">
              RIDDLE #{String(currentRiddle.number).padStart(2, '0')}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-300 font-gaming">
              {currentRiddle.title}
            </h3>
          </div>

          <div className="text-xs font-mono text-slate-400">
            {currentIndex + 1} / {RIDDLES_DATA.length}
          </div>
        </div>

        {/* Riddle Question Display */}
        <div className="my-6 p-6 sm:p-8 rounded-2xl bg-slate-950/70 border border-purple-500/20 shadow-inner">
          <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-relaxed tracking-wide font-gaming selection:bg-purple-600">
            "{currentRiddle.question}"
          </p>
        </div>

        {/* Optional Hint Section */}
        {showHint && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Hyderabadi Ishaara (Hint):
                </span>
                <p className="text-sm sm:text-base font-medium text-amber-100">
                  {currentRiddle.hint}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Host Show Answer Section */}
        {showAnswer && (
          <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-emerald-950/50 border-2 border-emerald-500/40 text-emerald-100 animate-in zoom-in-95 duration-300 shadow-xl shadow-emerald-950/40">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Jawaab (Official Answer):
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Host Revealed
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-gaming mt-1 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">
                  {currentRiddle.answer}
                </div>
                {currentRiddle.explanation && (
                  <p className="text-sm text-emerald-200/90 mt-2 italic">
                    "{currentRiddle.explanation}"
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Controls for Riddle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleHint}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                showHint
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              {showHint ? 'Hide Hint' : '💡 Need a Hint?'}
            </button>

            <button
              onClick={handleToggleAnswer}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                showAnswer
                  ? 'bg-emerald-600 text-white border border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-400" />}
              {showAnswer ? 'Hide Answer' : '👁️ Show Answer (Host)'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentRoundRiddle ? (
              <button
                onClick={handleSetAsRoundRiddle}
                disabled={isLinking}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-semibold transition"
                title="Sync this riddle with the live buzzer round"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Set for Round #{settings?.currentRound}</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                Current Round Riddle
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Footer for Riddles */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition ${
            currentIndex === 0
              ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500 border border-slate-800'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous Riddle</span>
        </button>

        {/* Quick jump pills */}
        <div className="hidden sm:flex items-center gap-1.5">
          {RIDDLES_DATA.slice(0, 10).map((r, idx) => (
            <button
              key={r.id}
              onClick={() => {
                setCurrentIndex(idx);
                setShowHint(false);
                setShowAnswer(false);
              }}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                currentIndex === idx
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {idx + 1}
            </button>
          ))}
          {RIDDLES_DATA.length > 10 && (
            <span className="text-xs text-slate-500 px-1">...{RIDDLES_DATA.length}</span>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === RIDDLES_DATA.length - 1}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition ${
            currentIndex === RIDDLES_DATA.length - 1
              ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500 border border-slate-800'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
          }`}
        >
          <span>Next Riddle</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
