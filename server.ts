import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { Participant, Buzz, Round, EventSettings } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Trust proxy for Cloud Run and reverse proxies
app.set('trust proxy', 1);

// CORS and Security headers for all API requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json());

// In-Memory Database for Real-Time Event State
const participants = new Map<string, Participant>();
let buzzes: Buzz[] = [];
let roundCounter = 1;

let currentRound: Round = {
  id: 1,
  roundNumber: 1,
  riddleId: 1,
  status: 'idle',
  startedAt: Date.now(),
  buzzerStartedAt: undefined,
};

let eventSettings: EventSettings = {
  registrationOpen: true,
  buzzerActive: false,
  currentRound: 1,
  activeRiddleId: 1,
  buzzerStartedAt: null,
  totalBuzzesCount: 0,
};

let activeWinner: {
  name: string;
  rollNumber?: string;
  riddleTitle?: string;
  timestamp: number;
} | null = null;

// Server-Sent Events (SSE) Client Connections
const sseClients = new Set<Response>();

function broadcast(eventType: string, payload: unknown) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Keep-alive heartbeat every 15s to keep SSE connections open through reverse proxies
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': heartbeat\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);

function getCurrentState() {
  const participantList = Array.from(participants.values());
  return {
    settings: {
      ...eventSettings,
      totalBuzzesCount: buzzes.length,
    },
    participants: participantList,
    participantsCount: participantList.length,
    currentRound,
    buzzes,
    topBuzzes: buzzes.slice(0, 10),
    activeWinner,
  };
}

// --- API ROUTES ---

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: Date.now() });
});

// Full state snapshot
app.get('/api/state', (_req: Request, res: Response) => {
  res.json(getCurrentState());
});

// SSE Stream for Real-Time Updates
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial full state immediately
  res.write(`event: INIT_STATE\ndata: ${JSON.stringify(getCurrentState())}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Participant Registration
app.post('/api/register', (req: Request, res: Response) => {
  const { name, rollNumber, department } = req.body;

  if (!eventSettings.registrationOpen) {
    res.status(400).json({ success: false, message: 'Registration is currently closed by the organizer.' });
    return;
  }

  const cleanName = (name || '').trim();
  const cleanRoll = (rollNumber || '').trim().toUpperCase();
  const cleanDept = (department || 'General').trim();

  if (!cleanName || !cleanRoll) {
    res.status(400).json({ success: false, message: 'Both Full Name and Roll Number are required!' });
    return;
  }

  // Prevent duplicate roll numbers
  for (const p of participants.values()) {
    if (p.rollNumber.toUpperCase() === cleanRoll) {
      // If already registered, return existing profile so they can continue
      res.json({
        success: true,
        participant: p,
        alreadyRegistered: true,
        message: 'Welcome back! You are already registered.',
      });
      return;
    }
  }

  const id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const participant: Participant = {
    id,
    name: cleanName,
    rollNumber: cleanRoll,
    department: cleanDept,
    registeredAt: Date.now(),
    active: true,
  };

  participants.set(id, participant);

  // Broadcast new registration
  broadcast('PARTICIPANT_REGISTERED', {
    participant,
    totalCount: participants.size,
  });

  res.json({
    success: true,
    participant,
    message: "You're In! 🔥 Wait for the host to start the buzzer.",
  });
});

// Submit Buzz
app.post('/api/buzz', (req: Request, res: Response) => {
  const { participantId, rollNumber, roundId } = req.body;

  if (!eventSettings.buzzerActive) {
    res.status(400).json({ success: false, message: "Buzzer is NOT active yet! Wait for host." });
    return;
  }

  if (roundId !== undefined && roundId !== currentRound.roundNumber) {
    res.status(400).json({ success: false, message: "Round has changed. Please refresh." });
    return;
  }

  const participant = participants.get(participantId) || Array.from(participants.values()).find(
    (p) => p.rollNumber.toUpperCase() === (rollNumber || '').toUpperCase()
  );

  if (!participant) {
    res.status(404).json({ success: false, message: "Participant not found. Please register first." });
    return;
  }

  // Prevent multiple buzzes for the same round
  const alreadyBuzzed = buzzes.some(
    (b) => b.participantId === participant.id || b.rollNumber.toUpperCase() === participant.rollNumber.toUpperCase()
  );

  if (alreadyBuzzed) {
    res.status(400).json({ success: false, message: "You already buzzed in this round!" });
    return;
  }

  // Authoritative server timestamp down to the exact millisecond
  const now = Date.now();
  const position = buzzes.length + 1;
  const timeFromStartMs = eventSettings.buzzerStartedAt ? Math.max(0, now - eventSettings.buzzerStartedAt) : 0;

  const newBuzz: Buzz = {
    id: `b_${now}_${position}`,
    roundId: currentRound.roundNumber,
    participantId: participant.id,
    participantName: participant.name,
    rollNumber: participant.rollNumber,
    department: participant.department,
    timestamp: now,
    timeFromStartMs,
    position,
  };

  buzzes.push(newBuzz);

  // Broadcast to all clients (Host, Projector, Phones)
  broadcast('NEW_BUZZ', {
    buzz: newBuzz,
    isFirst: position === 1,
    topBuzzes: buzzes.slice(0, 10),
  });

  res.json({
    success: true,
    buzz: newBuzz,
    position,
    message: position === 1 ? '🏆 FIRST BUZZ! Mic is yours!' : `Buzzed! Position #${position}`,
  });
});

// --- MANAGEMENT API ROUTES ---
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'peace2026';

app.post('/api/management/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if ((username === 'admin' || username === 'organizer' || !username) && password === ADMIN_PASSCODE) {
    res.json({
      success: true,
      token: `mgmt_auth_${Date.now()}`,
      username: username || 'Event Admin',
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials. Default passcode is peace2026' });
  }
});

// Toggle Registration
app.post('/api/management/toggle-registration', (req: Request, res: Response) => {
  const { open } = req.body;
  eventSettings.registrationOpen = typeof open === 'boolean' ? open : !eventSettings.registrationOpen;
  broadcast('SETTINGS_UPDATED', { settings: eventSettings });
  res.json({ success: true, registrationOpen: eventSettings.registrationOpen });
});

// Start Buzzer
app.post('/api/management/start-buzzer', (_req: Request, res: Response) => {
  eventSettings.buzzerActive = true;
  eventSettings.buzzerStartedAt = Date.now();
  currentRound.status = 'buzzing';
  currentRound.buzzerStartedAt = eventSettings.buzzerStartedAt;

  broadcast('BUZZER_STARTED', {
    roundNumber: currentRound.roundNumber,
    buzzerStartedAt: eventSettings.buzzerStartedAt,
  });

  res.json({ success: true, settings: eventSettings, currentRound });
});

// Stop Buzzer
app.post('/api/management/stop-buzzer', (_req: Request, res: Response) => {
  eventSettings.buzzerActive = false;
  currentRound.status = 'stopped';
  currentRound.endedAt = Date.now();

  broadcast('BUZZER_STOPPED', {
    roundNumber: currentRound.roundNumber,
    endedAt: currentRound.endedAt,
  });

  res.json({ success: true, settings: eventSettings, currentRound });
});

// Reset Buzzer for Current Round
app.post('/api/management/reset-buzzer', (_req: Request, res: Response) => {
  eventSettings.buzzerActive = false;
  eventSettings.buzzerStartedAt = null;
  currentRound.status = 'idle';
  buzzes = [];

  broadcast('BUZZER_RESET', {
    roundNumber: currentRound.roundNumber,
  });

  res.json({ success: true, message: 'Buzzer reset for current round' });
});

// Set Active Riddle
app.post('/api/management/set-riddle', (req: Request, res: Response) => {
  const { riddleId } = req.body;
  if (riddleId) {
    eventSettings.activeRiddleId = Number(riddleId);
    currentRound.riddleId = Number(riddleId);
    broadcast('RIDDLE_CHANGED', { activeRiddleId: eventSettings.activeRiddleId });
  }
  res.json({ success: true, activeRiddleId: eventSettings.activeRiddleId });
});

// Advance to New Round
app.post('/api/management/new-round', (req: Request, res: Response) => {
  const { roundNumber, riddleId } = req.body;
  roundCounter = roundNumber ? Number(roundNumber) : roundCounter + 1;
  const nextRiddleId = riddleId ? Number(riddleId) : (eventSettings.activeRiddleId % 18) + 1;

  currentRound = {
    id: roundCounter,
    roundNumber: roundCounter,
    riddleId: nextRiddleId,
    status: 'idle',
    startedAt: Date.now(),
  };

  eventSettings.currentRound = roundCounter;
  eventSettings.activeRiddleId = nextRiddleId;
  eventSettings.buzzerActive = false;
  eventSettings.buzzerStartedAt = null;
  buzzes = [];
  activeWinner = null;

  broadcast('NEW_ROUND', {
    currentRound,
    settings: eventSettings,
  });

  res.json({ success: true, currentRound, settings: eventSettings });
});

// Remove Participant
app.post('/api/management/remove-participant', (req: Request, res: Response) => {
  const { id } = req.body;
  if (participants.has(id)) {
    participants.delete(id);
    buzzes = buzzes.filter((b) => b.participantId !== id);
    broadcast('PARTICIPANT_REMOVED', { id, totalCount: participants.size, buzzes });
    res.json({ success: true, message: 'Participant removed' });
  } else {
    res.status(404).json({ success: false, message: 'Participant not found' });
  }
});

// Reveal Winner
app.post('/api/management/reveal-winner', (req: Request, res: Response) => {
  const { name, rollNumber, riddleTitle } = req.body;
  if (!name) {
    res.status(400).json({ success: false, message: 'Winner name is required' });
    return;
  }

  activeWinner = {
    name: name.trim(),
    rollNumber: rollNumber ? rollNumber.trim().toUpperCase() : undefined,
    riddleTitle: riddleTitle || `Round ${currentRound.roundNumber}`,
    timestamp: Date.now(),
  };

  currentRound.status = 'completed';
  currentRound.winnerName = activeWinner.name;
  currentRound.winnerRollNumber = activeWinner.rollNumber;

  broadcast('WINNER_REVEALED', {
    winner: activeWinner,
    roundNumber: currentRound.roundNumber,
  });

  res.json({ success: true, activeWinner });
});

// Clear Winner
app.post('/api/management/clear-winner', (_req: Request, res: Response) => {
  activeWinner = null;
  broadcast('WINNER_CLEARED', {});
  res.json({ success: true });
});

// Emergency Reset All
app.post('/api/management/reset-all', (_req: Request, res: Response) => {
  participants.clear();
  buzzes = [];
  roundCounter = 1;
  currentRound = {
    id: 1,
    roundNumber: 1,
    riddleId: 1,
    status: 'idle',
    startedAt: Date.now(),
  };
  eventSettings = {
    registrationOpen: true,
    buzzerActive: false,
    currentRound: 1,
    activeRiddleId: 1,
    buzzerStartedAt: null,
    totalBuzzesCount: 0,
  };
  activeWinner = null;

  broadcast('SYSTEM_RESET', getCurrentState());
  res.json({ success: true, message: 'System fully reset' });
});

// Start Server with Vite or Static
async function start() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 Peace Day Gaming Arena server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
