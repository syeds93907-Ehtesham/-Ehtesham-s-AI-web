export interface Participant {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  registeredAt: number;
  active: boolean;
}

export interface Buzz {
  id: string;
  roundId: number;
  participantId: string;
  participantName: string;
  rollNumber: string;
  department: string;
  timestamp: number;
  timeFromStartMs: number;
  position: number;
}

export interface Round {
  id: number;
  roundNumber: number;
  riddleId: number;
  status: 'idle' | 'buzzing' | 'stopped' | 'completed';
  startedAt?: number;
  buzzerStartedAt?: number;
  endedAt?: number;
  winnerName?: string;
  winnerRollNumber?: string;
}

export interface EventSettings {
  registrationOpen: boolean;
  buzzerActive: boolean;
  currentRound: number;
  activeRiddleId: number;
  buzzerStartedAt: number | null;
  totalBuzzesCount: number;
}

export interface ServerState {
  settings: EventSettings;
  participants: Participant[];
  participantsCount: number;
  currentRound: Round;
  buzzes: Buzz[];
  topBuzzes: Buzz[];
  activeWinner?: {
    name: string;
    rollNumber?: string;
    riddleTitle?: string;
    timestamp: number;
  } | null;
}

export interface Riddle {
  id: number;
  number: number;
  title: string;
  question: string;
  hint: string;
  answer: string;
  explanation?: string;
  category: 'Hyderabadi Slang' | 'Food & Chai' | 'Campus Life' | 'City Landmarks' | 'Peace & Wit';
}
