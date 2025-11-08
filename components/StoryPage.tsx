import React, { useState, useEffect, useRef } from 'react';
import { Chapter } from '../types';
import Spinner from './Spinner';

interface StoryPageProps {
  chapter: Chapter;
  isLoading: boolean;
  onChoice: (choice: string) => void;
  isNarrating: boolean;
  onToggleNarration: () => void;
}

const SpeakerIcon = ({ isNarrating }: { isNarrating: boolean }) => {
  if (isNarrating) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/>
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
};

const StoryPage: React.FC<StoryPageProps> = ({ chapter, isLoading, onChoice, isNarrating, onToggleNarration }) => {
  const isEnding = chapter.choices.length === 0;
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  useEffect(() => {
    // Reset scroll to top when chapter changes
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    setScrollTop(0);
  }, [chapter]);


  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {isLoading && <Spinner message="الظلال تتهامس..." />}
      
      {/* --- BACKGROUND IMAGE --- */}
      <div 
        className="absolute top-0 left-0 w-full h-2/3 md:h-3/5 transition-transform duration-100 ease-out"
        style={{
          transform: `translateY(${scrollTop * 0.4}px) scale(${1 + scrollTop / 5000})`,
          opacity: Math.max(0.2, 1 - scrollTop / 400),
          willChange: 'transform, opacity',
        }}
      >
        <div className="absolute inset-0 bg-black z-0"></div>
        {chapter.imageUrl && (
          <img
            key={chapter.imageUrl}
            src={chapter.imageUrl}
            alt={chapter.title}
            className="absolute inset-0 w-full h-full object-cover z-10 animate-fadeIn"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-20"></div>
      </div>

      {/* --- SCROLLING CONTENT --- */}
      <div 
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto hide-scrollbar"
        onScroll={handleScroll}
      >
        {/* Spacer div to push the content down */}
        <div className="h-2/3 md:h-3/5 flex-shrink-0" />
        
        {/* The actual content container that appears to slide up */}
        <div className="relative bg-gradient-to-t from-black via-black/90 to-black/70 z-30">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
                <h2 className="text-white text-3xl md:text-4xl font-title text-shadow shadow-black">
                  {chapter.title}
                </h2>
                <button
                  onClick={onToggleNarration}
                  disabled={isLoading}
                  aria-label={isNarrating ? "إيقاف السرد" : "بدء السرد"}
                  className="bg-black/30 hover:bg-black/60 text-white p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SpeakerIcon isNarrating={isNarrating} />
                </button>
            </div>
            
            <p className="text-lg text-gray-300 leading-relaxed mb-4">{chapter.scene}</p>
            {chapter.dialogue && (
              <p className="text-xl text-red-300 italic border-r-4 border-red-500 pr-4 my-6">
                {chapter.dialogue}
              </p>
            )}
            
            {!isEnding && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 text-center">ماذا ستفعل؟</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {chapter.choices.map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => onChoice(choice)}
                      disabled={isLoading}
                      className="w-full bg-gray-800 hover:bg-red-900 border border-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-wait"
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {isEnding && !isLoading && (
               <div className="mt-8 text-center">
                 <p className="text-2xl text-red-500 font-title">النهاية</p>
               </div>
            )}
          </div>
        </div>
      </div>

       <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 1.5s ease-in-out;
        }
        .text-shadow {
            text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
        }
        /* For better scroll performance on some browsers */
        .overflow-y-auto {
            -webkit-overflow-scrolling: touch;
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .hide-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default StoryPage;