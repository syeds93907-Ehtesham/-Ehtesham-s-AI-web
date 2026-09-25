import React from 'react';
import { Sparkles, Play, Flame, Settings, Trophy, QrCode, ArrowRight, ShieldCheck, Zap, Users, Volume2 } from 'lucide-react';
import { EventSettings } from '../types';

interface HomeDashboardProps {
  onNavigate: (view: 'home' | 'riddles' | 'buzzer' | 'management' | 'winner') => void;
  settings?: EventSettings;
  participantsCount?: number;
  onOpenQr: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigate,
  settings,
  participantsCount = 0,
  onOpenQr,
}) => {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="text-center pt-4 pb-8 sm:pb-10 relative">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-64 h-64 bg-pink-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-64 h-64 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Event Category Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-purple-500/40 text-purple-300 text-xs sm:text-sm font-semibold mb-4 shadow-lg shadow-purple-500/10">
          <span className="text-base">☮️</span>
          <span>College Peace Day Special Gaming Event</span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-gaming text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-300 to-amber-200 drop-shadow-sm">
          PEACE DAY GAMING ARENA
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-xl sm:text-2xl md:text-3xl font-bold font-gaming tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
          "Think Fast. Buzz Faster. Have Fun!"
        </p>

        <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Welcome to the high-voltage college battleground! Test your wit with Hyderabadi riddles, scan the QR code from your phone, and smash the live buzzer before anyone else.
        </p>

        {/* Quick Projector QR Launch Pill */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onOpenQr}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-900/60 to-pink-900/60 hover:from-purple-800/80 hover:to-pink-800/80 border border-purple-500/40 text-purple-200 text-xs sm:text-sm font-bold shadow-lg transition transform hover:-translate-y-0.5"
          >
            <QrCode className="w-4 h-4 text-purple-300" />
            <span>Launch Audience QR on Projector</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-[10px] text-white">
              {participantsCount} Joined
            </span>
          </button>

          {settings?.buzzerActive && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-950/70 border border-red-500/60 text-red-300 text-xs sm:text-sm font-bold animate-buzzer-live">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span>ROUND #{settings.currentRound} BUZZER IS LIVE NOW!</span>
            </div>
          )}
        </div>
      </div>

      {/* FOUR LARGE COLOURFUL INTERACTIVE DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 my-auto">
        {/* CARD 1: RIDDLE ARENA */}
        <div
          onClick={() => onNavigate('riddles')}
          role="button"
          tabIndex={0}
          className="group relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-purple-950/40 to-slate-900/90 border border-purple-500/40 hover:border-purple-400 shadow-xl shadow-purple-950/30 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer text-left"
        >
          {/* Neon Corner Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500"></div>

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-purple-600/40 group-hover:scale-110 transition duration-300">
              🧩
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 font-gaming">
              Option 01
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-gaming group-hover:text-purple-300 transition">
            1️⃣ RIDDLE ARENA
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-purple-400 mt-1 uppercase tracking-wider">
            Hyderabadi Riddles & Local Wit
          </p>

          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            18 witty, family-friendly brain-teasers crafted with iconic Hyderabadi slang, chai, biryani, Charminar, and college campus humour. Complete with hints, question cards, and host answer reveals!
          </p>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-purple-500/20">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span>18 Questions Loaded</span>
            </div>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 group-hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition">
              PLAY ARENA
              <Play className="w-4 h-4 fill-white" />
            </span>
          </div>
        </div>

        {/* CARD 2: PLAYER BUZZER */}
        <div
          onClick={() => onNavigate('buzzer')}
          role="button"
          tabIndex={0}
          className="group relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-red-950/40 to-slate-900/90 border border-red-500/40 hover:border-red-400 shadow-xl shadow-red-950/30 hover:shadow-2xl hover:shadow-red-500/25 transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer text-left"
        >
          {/* Neon Corner Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full pointer-events-none group-hover:bg-red-500/20 transition-all duration-500"></div>

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-red-600/40 group-hover:scale-110 transition duration-300">
              🔴
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 font-gaming">
              Option 02
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-gaming group-hover:text-red-300 transition">
            2️⃣ PLAYER BUZZER
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-rose-400 mt-1 uppercase tracking-wider">
            Register & Buzz From Phone
          </p>

          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            The heart of the audience experience! Scan the QR code, register your roll number, and wait for the host's signal. When the buzzer goes live, smash the button with instant millisecond response.
          </p>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-red-500/20">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className={`w-2 h-2 rounded-full ${settings?.buzzerActive ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></span>
              <span>{settings?.buzzerActive ? 'Buzzer Active Right Now!' : 'Ready For Next Round'}</span>
            </div>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 group-hover:from-red-500 group-hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition">
              ENTER BUZZER
              <Flame className="w-4 h-4 fill-white" />
            </span>
          </div>
        </div>

        {/* CARD 3: MANAGEMENT PANEL */}
        <div
          onClick={() => onNavigate('management')}
          role="button"
          tabIndex={0}
          className="group relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-cyan-950/40 to-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 shadow-xl shadow-cyan-950/30 hover:shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer text-left"
        >
          {/* Neon Corner Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500"></div>

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-cyan-600/40 group-hover:scale-110 transition duration-300">
              🎛
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-gaming">
              Option 03
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-gaming group-hover:text-cyan-300 transition">
            3️⃣ MANAGEMENT PANEL
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-cyan-400 mt-1 uppercase tracking-wider">
            Host Control Room & Live Monitor
          </p>

          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            Restricted control deck for event organizers. Start/stop buzzer, display large projector QR code, monitor live ranking of buzzes with millisecond precision, and manage participant registrations.
          </p>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Passcode Protected</span>
            </div>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 group-hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 transition">
              OPEN DASHBOARD
              <Settings className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* CARD 4: WINNER / CORRECT ANSWER */}
        <div
          onClick={() => onNavigate('winner')}
          role="button"
          tabIndex={0}
          className="group relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-amber-950/40 to-slate-900/90 border border-amber-500/40 hover:border-amber-400 shadow-xl shadow-amber-950/30 hover:shadow-2xl hover:shadow-amber-500/25 transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer text-left"
        >
          {/* Neon Corner Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500"></div>

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-amber-500/40 group-hover:scale-110 transition duration-300">
              🏆
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 font-gaming">
              Option 04
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-gaming group-hover:text-amber-300 transition">
            4️⃣ WINNER REVEAL
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-amber-400 mt-1 uppercase tracking-wider">
            Dramatic Curtain Reveal Ceremony
          </p>

          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            Built specifically for the big projector screen! When a student answers correctly, trigger the dramatic theatrical curtain opening, brass trumpet fanfare, and dazzling confetti celebration.
          </p>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-amber-500/20">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Projector Fullscreen Mode</span>
            </div>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 group-hover:from-amber-400 group-hover:to-yellow-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/30 transition">
              REVEAL WINNER
              <Trophy className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* EVENT FLOW BAR (Footer guide) */}
      <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs">
            HOW IT WORKS
          </div>
          <div className="text-xs sm:text-sm text-slate-300 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">1. Host Projector QR</span>
            <span>→</span>
            <span className="font-semibold text-white">2. Students Scan & Register</span>
            <span>→</span>
            <span className="font-semibold text-white">3. Riddle Selected</span>
            <span>→</span>
            <span className="font-semibold text-white">4. Buzzer Starts</span>
            <span>→</span>
            <span className="font-semibold text-amber-300">5. First Buzz Wins!</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>College Peace Day 2026</span>
          <span>•</span>
          <span className="text-purple-400">Hyderabad Edition</span>
        </div>
      </div>
    </div>
  );
};
