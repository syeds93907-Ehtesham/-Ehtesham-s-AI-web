import { ServerState, Participant, Buzz } from '../types';

export class ApiService {
  private eventSource: EventSource | null = null;
  private stateListeners: Set<(state: ServerState) => void> = new Set();
  private buzzListeners: Set<(data: { buzz: Buzz; isFirst: boolean; topBuzzes: Buzz[] }) => void> = new Set();
  private winnerListeners: Set<(data: { winner: ServerState['activeWinner']; roundNumber: number }) => void> = new Set();
  private isConnecting: boolean = false;
  private pollInterval: number | null = null;

  constructor() {
    this.initSse();
    // Safety polling fallback to keep synced even if network drops SSE
    this.startPollingFallback();
  }

  public async fetchState(): Promise<ServerState> {
    try {
      const res = await fetch('/api/state', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        return this.getLastKnownState();
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return this.getLastKnownState();
      }
      const data: ServerState = await res.json();
      this.cachedState = data;
      return data;
    } catch {
      // Offline or network transit error: return cached state without throwing
      return this.getLastKnownState();
    }
  }

  private cachedState: ServerState = {
    settings: {
      registrationOpen: true,
      buzzerActive: false,
      currentRound: 1,
      activeRiddleId: 1,
      buzzerStartedAt: null,
      totalBuzzesCount: 0,
    },
    participants: [],
    participantsCount: 0,
    currentRound: {
      id: 1,
      roundNumber: 1,
      riddleId: 1,
      status: 'idle',
      startedAt: Date.now(),
    },
    buzzes: [],
    topBuzzes: [],
    activeWinner: null,
  };

  private getLastKnownState(): ServerState {
    return this.cachedState;
  }

  private async safeJson<T>(res: Response, fallback: T): Promise<T> {
    try {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return fallback;
      }
      return (await res.json()) as T;
    } catch {
      return fallback;
    }
  }

  private initSse() {
    if (typeof window === 'undefined' || this.isConnecting) return;
    this.isConnecting = true;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource('/api/events');

      this.eventSource.addEventListener('INIT_STATE', (e) => {
        try {
          const state: ServerState = JSON.parse(e.data);
          this.notifyState(state);
        } catch (err) {
          console.error('Error parsing INIT_STATE:', err);
        }
      });

      this.eventSource.addEventListener('NEW_BUZZ', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.buzzListeners.forEach((fn) => fn(data));
          this.fetchState().then((state) => this.notifyState(state));
        } catch (err) {
          console.error('Error parsing NEW_BUZZ:', err);
        }
      });

      this.eventSource.addEventListener('BUZZER_STARTED', () => {
        this.fetchState().then((state) => this.notifyState(state));
      });

      this.eventSource.addEventListener('BUZZER_STOPPED', () => {
        this.fetchState().then((state) => this.notifyState(state));
      });

      this.eventSource.addEventListener('BUZZER_RESET', () => {
        this.fetchState().then((state) => this.notifyState(state));
      });

      this.eventSource.addEventListener('PARTICIPANT_REGISTERED', () => {
        this.fetchState().then((state) => this.notifyState(state));
      });

      this.eventSource.addEventListener('SETTINGS_UPDATED', () => {
        this.fetchState().then((state) => this.notifyState(state));
      });

      this.eventSource.addEventListener('NEW_ROUND', () => {
        this.fetchState().then((state) => this.notifyState(state));
      });

      this.eventSource.addEventListener('WINNER_REVEALED', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.winnerListeners.forEach((fn) => fn(data));
          this.fetchState().then((state) => this.notifyState(state));
        } catch (err) {
          console.error('Error parsing WINNER_REVEALED:', err);
        }
      });

      this.eventSource.addEventListener('WINNER_CLEARED', () => {
        this.fetchState().then((state) => this.notifyState(state));
      });

      this.eventSource.addEventListener('SYSTEM_RESET', (e) => {
        try {
          const state: ServerState = JSON.parse(e.data);
          this.notifyState(state);
        } catch {
          this.fetchState().then((state) => this.notifyState(state));
        }
      });

      this.eventSource.onerror = () => {
        // SSE dropped, will auto-reconnect; fallback poll handles gap
        this.isConnecting = false;
      };

      this.eventSource.onopen = () => {
        this.isConnecting = false;
      };
    } catch (e) {
      console.warn('SSE connection error:', e);
      this.isConnecting = false;
    }
  }

  private startPollingFallback() {
    if (this.pollInterval) return;
    this.pollInterval = window.setInterval(async () => {
      try {
        const state = await this.fetchState();
        this.notifyState(state);
      } catch {
        // Silent catch for polling
      }
    }, 2500);
  }

  private notifyState(state: ServerState) {
    this.stateListeners.forEach((fn) => fn(state));
  }

  public onStateChange(listener: (state: ServerState) => void): () => void {
    this.stateListeners.add(listener);
    // Send immediate state
    this.fetchState().then(listener).catch(() => {});
    return () => this.stateListeners.delete(listener);
  }

  public onBuzz(listener: (data: { buzz: Buzz; isFirst: boolean; topBuzzes: Buzz[] }) => void): () => void {
    this.buzzListeners.add(listener);
    return () => this.buzzListeners.delete(listener);
  }

  public onWinner(listener: (data: { winner: ServerState['activeWinner']; roundNumber: number }) => void): () => void {
    this.winnerListeners.add(listener);
    return () => this.winnerListeners.delete(listener);
  }

  public async register(name: string, rollNumber: string, department: string): Promise<{ success: boolean; participant?: Participant; message?: string }> {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, rollNumber, department }),
      });
      return await this.safeJson(res, { success: false, message: 'Server did not respond' });
    } catch {
      return { success: false, message: 'Network connection error' };
    }
  }

  public async buzz(participantId: string, rollNumber: string, roundId: number): Promise<{ success: boolean; position?: number; buzz?: Buzz; message?: string }> {
    try {
      const res = await fetch('/api/buzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ participantId, rollNumber, roundId }),
      });
      return await this.safeJson(res, { success: false, message: 'Server did not respond' });
    } catch {
      return { success: false, message: 'Network connection error' };
    }
  }

  // Management Methods
  public async managementLogin(password: string, username: string = 'admin'): Promise<{ success: boolean; token?: string; message?: string }> {
    try {
      const res = await fetch('/api/management/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return await this.safeJson(res, { success: false, message: 'Server did not respond' });
    } catch {
      return { success: false, message: 'Network connection error' };
    }
  }

  public async toggleRegistration(open?: boolean) {
    try {
      const res = await fetch('/api/management/toggle-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ open }),
      });
      return await this.safeJson(res, { success: false, registrationOpen: true });
    } catch {
      return { success: false, registrationOpen: true };
    }
  }

  public async startBuzzer() {
    try {
      const res = await fetch('/api/management/start-buzzer', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      return await this.safeJson(res, { success: false });
    } catch {
      return { success: false };
    }
  }

  public async stopBuzzer() {
    try {
      const res = await fetch('/api/management/stop-buzzer', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      return await this.safeJson(res, { success: false });
    } catch {
      return { success: false };
    }
  }

  public async resetBuzzer() {
    try {
      const res = await fetch('/api/management/reset-buzzer', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      return await this.safeJson(res, { success: false });
    } catch {
      return { success: false };
    }
  }

  public async setRiddle(riddleId: number) {
    try {
      const res = await fetch('/api/management/set-riddle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ riddleId }),
      });
      return await this.safeJson(res, { success: false });
    } catch {
      return { success: false };
    }
  }

  public async newRound(roundNumber?: number, riddleId?: number) {
    try {
      const res = await fetch('/api/management/new-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ roundNumber, riddleId }),
      });
      return await this.safeJson(res, { success: false });
    } catch {
      return { success: false };
    }
  }

  public async removeParticipant(id: string) {
    try {
      const res = await fetch('/api/management/remove-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id }),
      });
      return await this.safeJson(res, { success: false });
    } catch {
      return { success: false };
    }
  }

  public async revealWinner(name: string, rollNumber?: string, riddleTitle?: string) {
    try {
      const res = await fetch('/api/management/reveal-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, rollNumber, riddleTitle }),
      });
      return await this.safeJson(res, { success: false });
    } catch {
      return { success: false };
    }
  }

  public async clearWinner() {
    try {
      const res = await fetch('/api/management/clear-winner', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      return await this.safeJson(res, { success: false });
    } catch {
      return { success: false };
    }
  }

  public async resetAll() {
    try {
      const res = await fetch('/api/management/reset-all', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      return await this.safeJson(res, { success: false });
    } catch {
      return { success: false };
    }
  }
}

export const api = new ApiService();
