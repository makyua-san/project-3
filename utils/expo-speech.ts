import * as Speech from 'expo-speech';
import { BaseSpeechService, TTSOptions } from './base-speech';

export class SpeechService extends BaseSpeechService {
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking) {
        await this.stop();
      }

      this.isSpeaking = true;
      await Speech.speak(text, {
        language: options.language || 'ja-JP',
        onDone: () => {
          this.isSpeaking = false;
          options.onDone?.();
        },
        onError: (error) => {
          console.error('Speech error:', error);
          this.isSpeaking = false;
          options.onError?.(error);
        },
      });
    } catch (error) {
      console.error('Speech error:', error);
      this.isSpeaking = false;
      options.onError?.(error);
    }
  }

  async stop(): Promise<void> {
    if (this.isSpeaking) {
      await Speech.stop();
      this.isSpeaking = false;
    }
  }
} 