import * as Speech from 'expo-speech';

export class SpeechService {
  private isSpeaking: boolean = false;
  private isEnabled: boolean = true;

  constructor() {
    // コンストラクタの戻り値を削除
  }

  async speak(text: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // 既存の音声を停止
      const speaking = await Speech.isSpeakingAsync();
      if (speaking) {
        await this.stop();
      }

      this.isSpeaking = true;
      await Speech.speak(text, {
        language: 'ja-JP',
        onDone: () => {
          this.isSpeaking = false;
        },
        onError: (error) => {
          console.error('Speech error:', error);
          this.isSpeaking = false;
        },
      });
    } catch (error) {
      console.error('Speech error:', error);
      this.isSpeaking = false;
    }
  }

  async stop(): Promise<void> {
    if (this.isSpeaking) {
      await Speech.stop();
      this.isSpeaking = false;
    }
  }

  toggle(): void {
    if (this.isSpeaking) {
      this.stop();
    }
    this.isEnabled = !this.isEnabled;
  }

  isTTSEnabled(): boolean {
    return this.isEnabled;
  }
} 