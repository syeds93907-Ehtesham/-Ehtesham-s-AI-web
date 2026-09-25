import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../services/audio';
import { api } from '../services/api';
import { EventSettings, Round, Buzz } from '../types';
import { Trophy, Sparkles, PlusCircle, RotateCcw, Volume2, ArrowLeft, Check, Flame } from 'lucide-react';

interface WinnerRevealProps {
  initialWinnerName?: string;
  initialRollNumber?: string;
  settings?: EventSettings;
  currentRound?: Round;
  topBuzzes?: Buzz[];
  onNextRound?: () => void;
  onBackToArena?: () => void;
}

export const WinnerReveal: React.FC<WinnerRevealProps> = ({
  initialWinnerName = '',
  initialRollNumber = '',
  settings,
  currentRound,
  topBuzzes = [],
  onNextRound,
  onBackToArena,
}) => {
  const [winnerName, setWinnerName] = useState<string>(initialWinnerName);
  const [winnerRoll, setWinnerRoll] = useState<string>(initialRollNumber);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [curtainsOpen, setCurtainsOpen] = useState<boolean>(false);
  const [showCelebrationText, setShowCelebrationText] = useState<boolean>(false);

  // Sync if initial props change
  useEffect(() => {
    if (initialWinnerName) {
      setWinnerName(initialWinnerName);
    }
    if (initialRollNumber) {
      setWinnerRoll(initialRollNumber);
    }
  }, [initialWinnerName, initialRollNumber]);

  // Trigger high density confetti
  const triggerConfettiCelebration = () => {
    // Left side burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
    });

    // Right side burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
    });

    // Center grand shower
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.4 },
        colors: ['#ffd700', '#ff69b4', '#00ffff', '#ffffff'],
      });
    }, 400);
  };

  const handleRevealWinner = async () => {
    const cleanName = winnerName.trim();
    if (!cleanName) {
      alert('Please enter or select the student name who answered correctly!');
      return;
    }

    // Step 1: Start drumroll sound effect
    soundEffects.playWinnerFanfare();

    // Step 2: Show curtains closed first
    setIsRevealed(true);
    setCurtainsOpen(false);
    setShowCelebrationText(false);

    // Save to server
    try {
      await api.revealWinner(cleanName, winnerRoll);
    } catch (e) {
      console.error(e);
    }

    // Step 3: Animate curtains open after brief suspense
    setTimeout(() => {
      setCurtainsOpen(true);
    }, 600);

    // Step 4: Reveal dramatic text and confetti once curtains part
    setTimeout(() => {
      setShowCelebrationText(true);
      triggerConfettiCelebration();
    }, 1800);
  };

  const handleResetForNext = async () => {
    setIsRevealed(false);
    setCurtainsOpen(false);
    setShowCelebrationText(false);
    setWinnerName('');
    setWinnerRoll('');

    try {
      await api.clearWinner();
    } catch (e) {
      console.error(e);
    }

    if (onNextRound) {
      onNextRound();
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center px-4 py-8 overflow-hidden">
      {/* THEATRICAL CURTAIN OVERLAY (When Revealed) */}
      {isRevealed && (
        <div className="fixed inset-0 z-50 overflow-hidden flex pointer-events-auto bg-slate-950">
          {/* LEFT CURTAIN */}
          <div
            className={`w-1/2 h-full curtain-left shadow-2xl relative border-r-4 border-amber-400/80 transition-all duration-[2000ms] ${
              curtainsOpen ? 'curtain-open-left' : ''
            }`}
          >
            {/* Velvet Folds & Gold Tassels */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-amber-400/30 to-transparent pointer-events-none" />
          </div>

          {/* RIGHT CURTAIN */}
          <div
            className={`w-1/2 h-full curtain-right shadow-2xl relative border-l-4 border-amber-400/80 transition-all duration-[2000ms] ${
              curtainsOpen ? 'curtain-open-right' : ''
            }`}
          >
            {/* Velvet Folds & Gold Tassels */}
            <div className="absolute inset-0 bg-gradient-to-l from-black/50 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-amber-400/30 to-transparent pointer-events-none" />
          </div>

          {/* STAGE SPOTLIGHT & REVEAL CONTENT BEHIND THE CURTAINS */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-auto">
            {/* Dramatic Spotlight Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-b from-amber-500/20 via-purple-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />

            {showCelebrationText && (
              <div className="relative z-20 max-w-4xl mx-auto space-y-6 animate-in zoom-in-75 duration-700">
                {/* Correct Answer Header */}
                <div className="inline-block px-8 py-3 rounded-full bg-amber-400/20 border-2 border-amber-400/80 text-amber-300 font-extrabold text-xl sm:text-3xl font-gaming tracking-widest shadow-2xl shadow-amber-400/30 animate-bounce">
                  🎉 CORRECT ANSWER! 🎉
                </div>

                {/* Golden Trophy Icon */}
                <div className="my-4">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 p-1 shadow-2xl shadow-amber-400/50 flex items-center justify-center animate-pulse">
                    <Trophy className="w-14 h-14 sm:w-20 sm:h-20 text-slate-950 fill-slate-950" />
                  </div>
                </div>

                {/* Champion Name in Massive Projector Font */}
                <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-gaming tracking-tight text-white uppercase drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-yellow-400">
                  {winnerName}
                </h1>

                {/* Roll Number & Department Badge */}
                {winnerRoll && (
                  <div className="text-xl sm:text-2xl font-mono font-bold text-amber-300 tracking-wider">
                    ROLL NO: <span className="bg-slate-900/90 px-4 py-1.5 rounded-xl border border-amber-400/40">{winnerRoll}</span>
                  </div>
                )}

                {/* Congratulations Text */}
                <div className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-200 to-cyan-300 font-gaming">
                  👏 Congratulations! 👏
                </div>

                <p className="text-base sm:text-xl text-slate-300 font-medium">
                  Correct Answer by <span className="text-amber-300 font-bold">{winnerName}</span> in Round #{currentRound?.roundNumber || 1}!
                </p>

                {/* Stage Controls */}
                <div className="pt-8 flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={triggerConfettiCelebration}
                    className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm font-gaming shadow-xl shadow-amber-500/30 transition transform hover:scale-105 flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>MORE CONFETTI!</span>
                  </button>

                  <button
                    onClick={handleResetForNext}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-sm tracking-wider font-gaming shadow-xl shadow-purple-600/30 transition transform hover:scale-105 flex items-center gap-2"
                  >
                    <span>NEXT ROUND</span>
                    <PlusCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WINNER ENTRY FORM (Auditorium / Host Screen) */}
      <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-amber-950/40 text-left">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 font-gaming flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            Projector Winner Ceremony
          </span>
          <span className="text-xs font-mono text-slate-400">
            Round #{String(currentRound?.roundNumber || 1).padStart(2, '0')}
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-white font-gaming">
          WINNER / CORRECT ANSWER
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          When a student answers a riddle correctly, trigger the theatrical curtain reveal and celebration sound effects on the auditorium screen!
        </p>

        {/* Quick select from top buzzers */}
        {topBuzzes.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-gaming block mb-2">
              ⚡ Quick Select From Live Buzzers:
            </span>
            <div className="flex flex-wrap gap-2">
              {topBuzzes.slice(0, 5).map((b, idx) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setWinnerName(b.participantName);
                    setWinnerRoll(b.rollNumber);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    winnerName === b.participantName
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
                  }`}
                >
                  <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                  <span>{b.participantName}</span>
                  <span className="font-mono text-[10px] opacity-75">({b.rollNumber})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-gaming">
              Who answered correctly? <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={winnerName}
              onChange={(e) => setWinnerName(e.target.value)}
              placeholder="e.g. Ahmed Khan"
              required
              className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-base font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-gaming">
              Student Roll Number (Optional)
            </label>
            <input
              type="text"
              value={winnerRoll}
              onChange={(e) => setWinnerRoll(e.target.value)}
              placeholder="e.g. 23IT104"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm font-mono uppercase"
            />
          </div>

          {/* Reveal Button */}
          <button
            onClick={handleRevealWinner}
            className="w-full mt-4 py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-lg tracking-wider font-gaming shadow-2xl shadow-amber-500/30 transition transform hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-3 cursor-pointer"
          >
            <Sparkles className="w-6 h-6 fill-slate-950" />
            <span>🎉 REVEAL WINNER (CURTAIN CEREMONY)</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Projector Mode: Press F11 for Fullscreen</span>
          {onBackToArena && (
            <button
              onClick={onBackToArena}
              className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Arena</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
