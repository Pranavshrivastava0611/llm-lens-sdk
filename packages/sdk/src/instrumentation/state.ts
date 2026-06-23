import { AutopilotSpan } from '../collector/processor.js';

export interface InstrumentationState {
  processor: {
    onEnd: (span: AutopilotSpan) => void;
  };
  debug: boolean;
}

let state: InstrumentationState | null = null;

export function setInstrumentationState(s: InstrumentationState): void {
  state = s;
}

export function getInstrumentationState(): InstrumentationState | null {
  return state;
}
