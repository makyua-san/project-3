// 基底クラスとインターフェースの定義
export interface TTSOptions {
  language?: string;
  onDone?: () => void;
  onError?: (error: any) => void;
}

export abstract class BaseSpeechService {
  protected isSpeaking: boolean = false;
  protected isEnabled: boolean = true;

  abstract speak(text: string, options?: TTSOptions): Promise<void>;
  abstract stop(): Promise<void>;

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