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

interface AppProps {
  log: (message: string) => void;
}

const App: React.FC<AppProps> = ({ log }) => {
  const [gameState, setGameState] = useState<GameState>('cover');
  const [currentChapter, setCurrentChapter] = useState<Chapter>(INITIAL_CHAPTER);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [storyHistory, setStoryHistory] = useState<{ chapter: Chapter, choice: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);

  const audioContextRef = React.useRef<AudioContext | null>(null);
  const audioSourceRef = React.useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    log('App component has mounted. Initializing cover image fetch.');
    const fetchCoverImage = async () => {
      try {
        log('Calling generateImage for cover...');
        const url = await generateImage(COVER_DATA.imagePrompt, log);
        log('Cover image URL received successfully.');
        setCoverImageUrl(url);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        log(`ERROR fetching cover image: ${errorMsg}`);
        console.error("Failed to load cover image:", err);
        setErrorMessage("لا يمكن تحميل صورة الغلاف. حاول تحديث الصفحة.");
        setGameState('error');
      }
    };
    fetchCoverImage();
  }, [log]);
  
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
      log('Stopping current narration.');
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
    log('Starting narration...');

    try {
      if (!audioContextRef.current) {
        log('Creating new AudioContext.');
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        log('Resuming suspended AudioContext.');
        await audioContextRef.current.resume();
      }

      log('Calling generateSpeech...');
      const base64Audio = await generateSpeech(scene, dialogue, log);
      log('Speech audio received.');
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        log('Narration finished.');
        setIsNarrating(false);
        audioSourceRef.current = null;
      };

      source.start();
      audioSourceRef.current = source;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log(`ERROR during narration: ${errorMsg}`);
      console.error("Failed to narrate story:", err);
      setIsNarrating(false); // Reset state on error
    }
  }, [isNarrating, log]);

  const handleStartGame = useCallback(async () => {
    log('Start game button clicked.');
    setGameState('loading');
    try {
      log('Generating initial chapter image...');
      const imageUrl = await generateImage(INITIAL_CHAPTER.imagePrompt, log);
      log('Initial chapter image received.');
      setCurrentChapter({ ...INITIAL_CHAPTER, imageUrl });
      setGameState('playing');
      log('Game state set to "playing".');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log(`ERROR starting game: ${errorMsg}`);
      console.error("Failed to start game:", err);
      setErrorMessage("حدث خطأ أثناء بدء القصة. يرجى المحاولة مرة أخرى.");
      setGameState('error');
    }
  }, [log]);

  const handleChoice = useCallback(async (choice: string) => {
    log(`Player chose: "${choice}"`);
    if (audioSourceRef.current) {
      log('Stopping narration before advancing chapter.');
      audioSourceRef.current.stop();
      setIsNarrating(false);
    }
    setGameState('loading');
    
    const newHistory = [...storyHistory, { chapter: currentChapter, choice }];
    setStoryHistory(newHistory);
    
    try {
      log('Generating next chapter data...');
      const nextChapterData = await generateNextChapter(newHistory, log);
      log('Next chapter data received. Generating image...');
      const imageUrl = await generateImage(nextChapterData.imagePrompt, log);
      log('Next chapter image received.');
      
      setCurrentChapter({ ...nextChapterData, imageUrl });
      setGameState('playing');
      log('Game state set to "playing" for new chapter.');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log(`ERROR advancing story: ${errorMsg}`);
      console.error("Failed to advance story:", err);
      setErrorMessage("انقطع الاتصال مع عالم الظلال. يرجى المحاولة مرة أخرى.");
      setGameState('error');
    }
  }, [currentChapter, storyHistory, log]);


  const renderContent = () => {
    if (errorMessage && gameState === 'error') {
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
        log(`Warning: Unknown gameState "${gameState}"`);
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
