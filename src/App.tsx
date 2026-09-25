import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { soundEffects } from './services/audio';
import { ServerState, Participant, Buzz, Round, EventSettings } from './types';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { RiddleArena } from './components/RiddleArena';
import { PlayerBuzzer } from './components/PlayerBuzzer';
import { ManagementPanel } from './components/ManagementPanel';
import { WinnerReveal } from './components/WinnerReveal';
import { QrModal } from './components/QrModal';

export default function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<'home' | 'riddles' | 'buzzer' | 'management' | 'winner'>('home');

  // Server Authoritative Synchronized State
  const [serverState, setServerState] = useState<ServerState | null>(null);

  // QR Modal State
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);

  // Winner Reveal Pre-fill State
  const [pendingWinner, setPendingWinner] = useState<{ name: string; rollNumber?: string }>({
    name: '',
    rollNumber: '',
  });

  // Check URL on load (supports QR code scanning direct to buzzer)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const hash = window.location.hash.replace('#', '');

      if (viewParam === 'buzzer' || hash === 'buzzer') {
        setCurrentView('buzzer');
      } else if (viewParam === 'riddles' || hash === 'riddles') {
        setCurrentView('riddles');
      } else if (viewParam === 'management' || hash === 'management') {
        setCurrentView('management');
      } else if (viewParam === 'winner' || hash === 'winner') {
        setCurrentView('winner');
      }
    }
  }, []);

  // Subscribe to real-time events & initial state
  useEffect(() => {
    const unsubState = api.onStateChange((state) => {
      setServerState(state);
    });

    const unsubBuzz = api.onBuzz((data) => {
      if (data.isFirst) {
        soundEffects.playFirstBuzzAlert();
      }
    });

    const unsubWinner = api.onWinner((data) => {
      if (data.winner) {
        setPendingWinner({
          name: data.winner.name,
          rollNumber: data.winner.rollNumber,
        });
      }
    });

    return () => {
      unsubState();
      unsubBuzz();
      unsubWinner();
    };
  }, []);

  const handleNavigate = (view: 'home' | 'riddles' | 'buzzer' | 'management' | 'winner') => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectWinnerFromBuzzer = (name: string, rollNumber?: string) => {
    setPendingWinner({ name, rollNumber });
    setCurrentView('winner');
  };

  const handleNextRoundFromWinner = async () => {
    try {
      const nextNum = (serverState?.currentRound.roundNumber || 1) + 1;
      await api.newRound(nextNum);
      setCurrentView('riddles');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        settings={serverState?.settings}
        participantsCount={serverState?.participantsCount || 0}
        onOpenQr={() => setIsQrOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full">
        {currentView === 'home' && (
          <HomeDashboard
            onNavigate={handleNavigate}
            settings={serverState?.settings}
            participantsCount={serverState?.participantsCount || 0}
            onOpenQr={() => setIsQrOpen(true)}
          />
        )}

        {currentView === 'riddles' && (
          <RiddleArena
            settings={serverState?.settings}
            onNavigateToBuzzer={() => handleNavigate('buzzer')}
          />
        )}

        {currentView === 'buzzer' && (
          <PlayerBuzzer
            settings={serverState?.settings}
            currentRound={serverState?.currentRound}
            buzzes={serverState?.buzzes || []}
          />
        )}

        {currentView === 'management' && (
          <ManagementPanel
            settings={serverState?.settings}
            participants={serverState?.participants || []}
            currentRound={serverState?.currentRound}
            buzzes={serverState?.buzzes || []}
            topBuzzes={serverState?.topBuzzes || []}
            onOpenQr={() => setIsQrOpen(true)}
            onNavigateToWinner={handleSelectWinnerFromBuzzer}
          />
        )}

        {currentView === 'winner' && (
          <WinnerReveal
            initialWinnerName={pendingWinner.name}
            initialRollNumber={pendingWinner.rollNumber}
            settings={serverState?.settings}
            currentRound={serverState?.currentRound}
            topBuzzes={serverState?.topBuzzes || []}
            onNextRound={handleNextRoundFromWinner}
            onBackToArena={() => handleNavigate('riddles')}
          />
        )}
      </main>

      {/* Auditorium Projector QR Modal */}
      <QrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        registeredCount={serverState?.participantsCount || 0}
      />
    </div>
  );
}
