/**
 * Unified capture hook — delegates to voice or text based on active mode.
 */
import {useCaptureStore} from '@/stores';
import {useVoiceCapture} from './useVoiceCapture';
import {useTextCapture} from './useTextCapture';

export function useCapture() {
  const mode = useCaptureStore(s => s.mode);
  const voice = useVoiceCapture();
  const text = useTextCapture();

  return {
    mode,
    voice,
    text,
  };
}
