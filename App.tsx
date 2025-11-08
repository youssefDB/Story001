import React, { useState, useEffect, useCallback } from 'react';
import { Chapter, GameState } from './types';
import { COVER_DATA, INITIAL_CHAPTER } from './constants';
import { generateImage, generateNextChapter, generateSpeech } from './services/geminiService';
import CoverPage from './components/CoverPage';
import StoryPage from './components/StoryPage';

// Helper function to decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper function to decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const sampleRate = 24000; // Gemini TTS sample rate
  const numChannels = 1;
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('cover');
  const [currentChapter, setCurrentChapter] = useState<Chapter>(INITIAL_CHAPTER);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [storyHistory, setStoryHistory] = useState<{ chapter: Chapter, choice: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);

  const audioContextRef = React.useRef<AudioContext | null>(null);
  const audioSourceRef = React.useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const fetchCoverImage = async () => {
      try {
        const url = await generateImage(COVER_DATA.imagePrompt);
        setCoverImageUrl(url);
      } catch (err) {
        console.error("Failed to load cover image:", err);
        setErrorMessage("لا يمكن تحميل صورة الغلاف. حاول تحديث الصفحة.");
        setGameState('error');
      }
    };
    fetchCoverImage();
  }, []);
  
  // Cleanup audio resources on component unmount
  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleToggleNarration = useCallback(async (scene: string, dialogue: string) => {
    // If it's already narrating, stop it.
    if (isNarrating && audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
      setIsNarrating(false);
      return;
    }

    // Stop any previous sound that might not have been cleaned up
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }

    setIsNarrating(true);

    try {
      // Initialize AudioContext on the first user gesture
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      // Resume context if it was suspended by the browser
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const base64Audio = await generateSpeech(scene, dialogue);
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsNarrating(false);
        audioSourceRef.current = null;
      };

      source.start();
      audioSourceRef.current = source;

    } catch (err) {
      console.error("Failed to narrate story:", err);
      setIsNarrating(false); // Reset state on error
    }
  }, [isNarrating]);

  const handleStartGame = useCallback(async () => {
    setGameState('loading');
    try {
      const imageUrl = await generateImage(INITIAL_CHAPTER.imagePrompt);
      setCurrentChapter({ ...INITIAL_CHAPTER, imageUrl });
      setGameState('playing');
    } catch (err) {
      console.error("Failed to start game:", err);
      setErrorMessage("حدث خطأ أثناء بدء القصة. يرجى المحاولة مرة أخرى.");
      setGameState('error');
    }
  }, []);

  const handleChoice = useCallback(async (choice: string) => {
    // Stop any ongoing narration before proceeding
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      setIsNarrating(false);
    }
    setGameState('loading');
    
    const newHistory = [...storyHistory, { chapter: currentChapter, choice }];
    setStoryHistory(newHistory);
    
    try {
      const nextChapterData = await generateNextChapter(newHistory);
      const imageUrl = await generateImage(nextChapterData.imagePrompt);
      
      setCurrentChapter({ ...nextChapterData, imageUrl });
      setGameState('playing');
    } catch (err) {
      console.error("Failed to advance story:", err);
      setErrorMessage("انقطع الاتصال مع عالم الظلال. يرجى المحاولة مرة أخرى.");
      setGameState('error');
    }
  }, [currentChapter, storyHistory]);


  const renderContent = () => {
    if (errorMessage) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-4">
          <h2 className="text-2xl font-title text-red-500 mb-4">حدث خطأ</h2>
          <p className="text-lg text-center">{errorMessage}</p>
        </div>
      );
    }
    
    switch (gameState) {
      case 'cover':
        return (
          <CoverPage 
            coverData={COVER_DATA} 
            imageUrl={coverImageUrl} 
            isLoading={!coverImageUrl}
            onStart={handleStartGame} 
            isNarrating={isNarrating}
            onToggleNarration={() => handleToggleNarration(COVER_DATA.description, '')}
          />
        );
      case 'playing':
      case 'loading':
        return (
          <StoryPage 
            chapter={currentChapter}
            isLoading={gameState === 'loading'}
            onChoice={handleChoice}
            isNarrating={isNarrating}
            onToggleNarration={() => handleToggleNarration(currentChapter.scene, currentChapter.dialogue)}
          />
        );
      case 'error':
         return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-4 text-center">
          <h2 className="text-3xl font-title text-red-600 mb-4">انقطاع...</h2>
          <p className="text-xl max-w-md">{errorMessage || "فُقد الاتصال بعالم الظلال. حاول تحديث الصفحة لتعاود الدخول."}</p>
        </div>
      );
      default:
        return null;
    }
  };

  return (
    <main className="bg-black w-screen h-screen text-white overflow-hidden">
      {renderContent()}
    </main>
  );
};

export default App;