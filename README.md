# Gemini Chat アプリ

音声読み上げ機能付きのチャットアプリケーションです。Google の Gemini AI を使用して、日本語でのチャットと音声読み上げが可能です。

## 機能

- Gemini AI との日本語チャット
- チャット内容の音声読み上げ（日本語）
- マークダウン形式のメッセージ表示
- 音声読み上げのオン/オフ切り替え

## 技術スタック

- React Native
- Expo
- TypeScript
- Google Generative AI (Gemini)
- expo-speech

## セットアップ

1. リポジトリをクローン
```bash
git clone <repository-url>
cd <project-directory>
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数の設定
`.env`ファイルを作成し、以下の環境変数を設定： 
```
EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

4. アプリの起動
```bash
npx expo start
```

## 使用方法

1. アプリを起動すると、チャット画面が表示されます
2. 画面下部の入力欄にメッセージを入力
3. 送信すると、Gemini AI からの応答が表示されます
4. 応答は自動的に音声で読み上げられます
5. 画面右上のスピーカーアイコンで音声読み上げのオン/オフを切り替えできます

## ライセンス

MIT