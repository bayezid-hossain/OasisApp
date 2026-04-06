// Shapes returned by native module promises

export interface SaveNoteResult {
  id: string;
}

export interface StartListeningResult {
  sessionId: string;
}

export interface StopListeningResult {
  transcript: string;
  amplitudes: number[]; // normalized 0.0–1.0
}

export interface ScheduleReminderResult {
  requestCode: number;
}

// DeviceEventEmitter event payloads
export interface PartialResultEvent {
  text: string;
}

export interface AmplitudeUpdateEvent {
  amplitude: number; // 0.0–1.0
}

export interface SpeechErrorEvent {
  code: number;
  message: string;
}
