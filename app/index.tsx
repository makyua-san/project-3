import { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { Volume2, VolumeX } from 'lucide-react-native';

// 音声読み上げソフトを選択
// import { SpeechService } from '@/utils/speech';
// import { SpeechService } from '@/utils/expo-speech';
import { SpeechService } from '@/utils/zonos-speech';

type Message = {
  text: string;
  isUser: boolean;
  timestamp: Date;
};

// Get the API key from environment variables
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Ensure API key exists
if (!apiKey) {
  throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY environment variable');
}

// Initialize Gemini client with API key
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const speechService = useRef(new SpeechService());


  const toggleTTS = () => {
    speechService.current.toggle();
    setIsTTSEnabled(speechService.current.isTTSEnabled());
  };

  const sendMessage = async (text: string) => {
    try {
      setIsLoading(true);
      console.log('🚀 Sending message:', text);
      
      // Add user message
      const userMessage: Message = {
        text,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      console.log('📤 Requesting Gemini response...');
      const result = await model.generateContent(text);
      const response = await result.response;
      
      console.log('📥 Received Gemini response:', {
        text: response.text(),
        promptFeedback: response.promptFeedback,
        candidates: response.candidates,
      });
      
      const responseText = response.text();
      const aiMessage: Message = {
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Speak the response if TTS is enabled
      await speechService.current.speak(responseText);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      const errorMessage: Message = {
        text: 'メッセージの送信中にエラーが発生しました。もう一度お試しください。',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('📝 Messages updated:', messages);
  }, [messages]);

  useEffect(() => {
    console.log('⏳ Loading state:', isLoading);
  }, [isLoading]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      speechService.current.stop();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Gemini Chat</Text>
          <TouchableOpacity
            onPress={toggleTTS}
            style={styles.ttsButton}
            disabled={isLoading}
          >
            {isTTSEnabled ? (
              <Volume2 size={24} color="#007AFF" />
            ) : (
              <VolumeX size={24} color="#666666" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
        >
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
        </ScrollView>
        
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
  },
  ttsButton: {
    padding: 8,
  },
});