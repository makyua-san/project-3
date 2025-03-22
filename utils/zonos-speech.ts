// import * as Speech from 'expo-speech';
import { ZyphraClient } from '@zyphra/client';
import { Audio } from 'expo-av';
import { BaseSpeechService, TTSOptions } from './base-speech';
import * as FileSystem from 'expo-file-system';

const apiKey = process.env.EXPO_PUBLIC_ZYPHRA_API_KEY;
if (!apiKey) {
  throw new Error('Missing EXPO_PUBLIC_ZYPHRA_API_KEY environment variable');
}

const client = new ZyphraClient({ apiKey });

// 音声データの型を定義
type AudioData = {
  uri: string;
  mimeType: string;
};

/**
 * Zonosサービスを利用した音声読み上げサービスの実装クラス
 * BaseSpeechServiceを継承し、Zonosのテキスト読み上げAPIを使用して
 * テキストを音声に変換します
 */
export class SpeechService extends BaseSpeechService {
  private soundObject: Audio.Sound | null = null;

  /**
   * 指定されたテキストを音声で読み上げます
   * @param text 読み上げるテキスト
   * @param options 言語設定やコールバック関数を含むオプション
   * @returns 読み上げ処理の完了を表すPromise
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    // TTSが無効化されている場合は何もしない
    if (!this.isEnabled) return;
    
    try {
      // 既に音声を再生中の場合は停止
      await this.stop();

      // 音声読み上げ状態を開始に設定
      this.isSpeaking = true;

      // デバッグ用メッセージを出力
      console.log('🔊 Speaking:', text);
      
      // 音声データを取得
      let audioData: AudioData;
      
      try {
        // APIから直接音声データを取得
        audioData = await this.fetchAudioFromAPI(text, 'ja');
      } catch (error) {
        console.error('音声取得エラー:', error);
        throw error;
      }
      
      console.log('🔍 取得した音声データ:', audioData);
      
      // 生成された音声ファイルをロード
      console.log('🔍 Audio.Sound.createAsyncを呼び出し中...');
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioData.uri },
          { shouldPlay: true },
          (status) => {
            // console.log('🔍 Sound status:', status);
            // 再生が終了したら状態を更新
            if (status.isLoaded && status.didJustFinish) {
              this.isSpeaking = false;
              this.soundObject = null;
              options.onDone?.();
              
              // 一時ファイルを削除
              if (FileSystem.cacheDirectory && audioData.uri.startsWith(FileSystem.cacheDirectory)) {
                FileSystem.deleteAsync(audioData.uri)
                  .then(() => console.log('🧹 一時ファイルを削除しました:', audioData.uri))
                  .catch(e => console.warn('一時ファイル削除エラー:', e));
              }
            }
          }
        );

        console.log('🔍 Audio.Sound.createAsync完了、soundオブジェクト:', sound);
        this.soundObject = sound;

        // 音声を再生
        console.log('🔍 sound.playAsyncを呼び出し中...');
        await sound.playAsync();
        console.log('🔍 音声再生開始');
      } catch (audioError) {
        console.error('🔍 音声処理エラー:', audioError);
        if (audioError instanceof Error) {
          console.error('🔍 エラーメッセージ:', audioError.message);
          console.error('🔍 エラースタック:', audioError.stack);
        }
        throw audioError;
      }
    } catch (error) {
      // エラー処理
      console.error('Zonos speech error:', error);
      this.isSpeaking = false;
      this.soundObject = null;
      options.onError?.(error);
    }
  }
  
  /**
   * APIから音声データを取得します
   * @param text 読み上げるテキスト
   * @param language 言語コード
   * @returns 音声データ
   */
  private async fetchAudioFromAPI(text: string, language: string): Promise<AudioData> {
    // apiKeyが確実に存在することを確認
    if (!apiKey) {
      throw new Error('Missing API key for direct fetch fallback');
    }
    
    console.log('🔍 APIから音声データを取得中...');
    
    // フェッチを直接実行
    const response = await fetch(`http://api.zyphra.com/v1/audio/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        language_iso_code: language,
        mime_type: 'audio/mp3',
        speaking_rate: 15,
        model: 'zonos-v0.1-hybrid',
      }),
    });
    
    if (!response.ok) {
      // エラーレスポンスの場合はテキストとして読み取って表示
      const errorText = await response.text();
      console.error('🔍 API Error Response:', errorText);
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Content-Typeを取得
    const contentType = response.headers.get('Content-Type') || 'audio/mp3';
    console.log('🔍 Content-Type:', contentType);
    
    // 一時ファイルを作成してレスポンスを保存
    try {
      // ファイル名を生成（重複防止のためにタイムスタンプを使用）
      const timestamp = new Date().getTime();
      const fileExt = contentType.includes('mp3') ? 'mp3' : 'mp4';
      const tempFilePath = `${FileSystem.cacheDirectory}audio_${timestamp}.${fileExt}`;
      
      // レスポンスの内容をバイナリとして取得
      const arrayBuffer = await response.arrayBuffer();
      
      // 一時ファイルに書き込み
      await FileSystem.writeAsStringAsync(
        tempFilePath,
        this.arrayBufferToBase64(arrayBuffer),
        { encoding: FileSystem.EncodingType.Base64 }
      );
      
      console.log('🔍 一時ファイル作成完了:', tempFilePath);
      
      // ファイルパスを返す
      return {
        uri: tempFilePath,
        mimeType: contentType
      };
    } catch (fileError) {
      console.error('🔍 一時ファイル作成エラー:', fileError);
      
      // ファイル作成に失敗した場合、Base64エンコードしたデータURIを試す
      try {
        const arrayBuffer = await response.clone().arrayBuffer();
        const base64Data = `data:${contentType};base64,${this.arrayBufferToBase64(arrayBuffer)}`;
        
        console.log('🔍 Base64データURI作成完了 (最初の50文字):', base64Data.substring(0, 50) + '...');
        
        return {
          uri: base64Data,
          mimeType: contentType
        };
      } catch (base64Error) {
        console.error('🔍 Base64エンコードエラー:', base64Error);
        throw new Error('音声データの変換に失敗しました');
      }
    }
  }
  
  /**
   * ArrayBufferをBase64文字列に変換します
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    let binaryString = '';
    uint8Array.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });
    return btoa(binaryString);
  }

  /**
   * 現在再生中の音声を停止します
   * @returns 停止処理の完了を表すPromise
   */
  async stop(): Promise<void> {
    if (!this.isSpeaking) return;

    try {
      if (this.soundObject) {
        await this.soundObject.stopAsync();
        await this.soundObject.unloadAsync();
        this.soundObject = null;
      }
      this.isSpeaking = false;
    } catch (error) {
      console.error('Error stopping Zonos speech:', error);
    }
  }
} 