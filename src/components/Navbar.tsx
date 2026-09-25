import React, { useState } from 'react';
import { Volume2, VolumeX, Maximize, Minimize, QrCode, Sparkles, Shield, Bell } from 'lucide-react';
import { soundEffects } from '../services/audio';
import { EventSettings } from '../types';

interface NavbarProps {
  currentView: 'home' | 'riddles' | 'buzzer' | 'management' | 'winner';
  onNavigate: (view: 'home' | 'riddles' | 'buzzer' | 'management' | 'winner') => void;
  settings?: EventSettings;
  participantsCount?: number;
  onOpenQr: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  settings,
  participantsCount = 0,
  onOpenQr,
}) => {
  const [muted, setMuted] = useState<boolean>(soundEffects.isMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleSound = () => {
    const isNowMuted = soundEffects.toggleMute();
    setMuted(isNowMuted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Logo / Branding */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-400 p-[2px] shadow-lg shadow-purple-500/30 group-hover:scale-105 transition">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl sm:text-2xl font-bold">
              ☮️
            </div>
            {settings?.buzzerActive && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full animate-ping"></span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-white font-gaming group-hover:text-purple-300 transition">
                PEACE DAY GAMING
              </span>
              <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                LIVE ARENA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Think Fast. Buzz Faster. Have Fun!
            </p>
          </div>
        </button>

        {/* Live Status Badges */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Round:</span>
            <span className="font-bold text-amber-400 font-mono">
              #{settings?.currentRound ? String(settings.currentRound).padStart(2, '0') : '01'}
            </span>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              settings?.buzzerActive
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                settings?.buzzerActive ? 'bg-red-500' : 'bg-emerald-400'
              }`}
            ></span>
            {settings?.buzzerActive ? 'BUZZER ACTIVE' : 'BUZZER READY'}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="text-purple-400 font-bold">{participantsCount}</span>
            <span>Players</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onNavigate('riddles')}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              currentView === 'riddles'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            🧩 <span className="hidden sm:inline">Riddle</span> Arena
          </button>

          <button
            onClick={() => onNavigate('buzzer')}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              currentView === 'buzzer'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            🔴 Buzzer
          </button>

          <button
            onClick={() => onNavigate('winner')}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              currentView === 'winner'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            🏆 <span className="hidden md:inline">Winner</span> Reveal
          </button>

          <button
            onClick={() => onNavigate('management')}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              currentView === 'management'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            🎛 <span className="hidden md:inline">Control</span> Panel
          </button>
        </nav>

        {/* Action Utility Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick QR Launch */}
          <button
            onClick={onOpenQr}
            title="Display Projector QR Code"
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-purple-500/30 text-purple-300 hover:bg-purple-600 hover:text-white transition"
          >
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={muted ? 'Unmute Game Sounds' : 'Mute Sounds'}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Projector Fullscreen"
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition hidden sm:flex"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
