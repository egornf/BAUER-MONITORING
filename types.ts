export enum AnalysisStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface SectionScore {
  score: number; // 0 to 10
  comment: string;
}

export interface ErrorAnalysis {
  hasError: boolean;
  comment: string;
  severity: 'low' | 'medium' | 'high';
}

export interface TranscriptionLine {
  speaker: string;
  role: 'manager' | 'client' | 'other';
  text: string;
  startTime: number; // Start time in seconds
  error?: ErrorAnalysis;
}

export interface CallAdvice {
  overall: string;
  greeting?: string;
  joining?: string;
  presentation?: string;
  referAFriend?: string;
  consolidation?: string;
  disconnection?: string;
}

export interface CallAnalysis {
  managerName: string;
  clientName: string;
  greeting: SectionScore;
  joining: SectionScore;
  presentation: SectionScore;
  referAFriend: SectionScore;
  consolidation: SectionScore;
  disconnection: SectionScore;
  overallScore: number;
  summary: string;
  transcription: TranscriptionLine[];
  advice: CallAdvice;
}

export interface AudioFile {
  id: string;
  name: string;
  file: File;
  url: string;
  status: AnalysisStatus;
  analysis?: CallAnalysis;
  errorMsg?: string;
  duration?: number;
}

export type TabView = 'audio' | 'summary';

export const CRITERIA_NAMES: Record<keyof Omit<CallAnalysis, 'overallScore' | 'summary' | 'transcription' | 'managerName' | 'clientName' | 'advice'>, string> = {
  greeting: "Приветствие",
  joining: "Присоединение",
  presentation: "Презентация",
  referAFriend: "Приведи друга",
  consolidation: "Закрепление",
  disconnection: "Отсоединение",
};