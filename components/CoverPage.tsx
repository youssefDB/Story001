import React from 'react';
import { CoverData } from '../types';
import Spinner from './Spinner';

interface CoverPageProps {
  coverData: CoverData;
  imageUrl: string | null;
  isLoading: boolean;
  onStart: () => void;
  isNarrating: boolean;
  onToggleNarration: () => void;
}

const SpeakerIcon = ({ isNarrating }: { isNarrating: boolean }) => {
  if (isNarrating) {
    // Stop Icon
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/>
      </svg>
    );
  }
  // Play/Speaker Icon
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
};


const CoverPage: React.FC<CoverPageProps> = ({ coverData, imageUrl, isLoading, onStart, isNarrating, onToggleNarration }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {isLoading && <Spinner message="البيت يستيقظ..." />}
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Cover"
          className="absolute top-0 left-0 w-full h-full object-cover z-0 transition-opacity duration-1000"
        />
      )}
      <button
          onClick={onToggleNarration}
          disabled={isLoading}
          aria-label={isNarrating ? "إيقاف السرد" : "بدء السرد"}
          className="absolute top-5 right-5 z-30 bg-black/50 hover:bg-black/75 text-white p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
          <SpeakerIcon isNarrating={isNarrating} />
      </button>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10"></div>
      
      <div className="relative z-20 text-center text-white p-8 flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-bold font-title mb-4 text-shadow-lg shadow-black/50">
          {coverData.title}
        </h1>
        <p className="max-w-2xl text-lg md:text-xl mb-8 text-gray-300 leading-relaxed text-shadow shadow-black/50">
          {coverData.description}
        </p>
        <button
          onClick={onStart}
          disabled={isLoading}
          className="bg-red-800 hover:bg-red-700 text-white font-bold text-xl py-3 px-12 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg shadow-black/50"
        >
          ابدأ القصة
        </button>
      </div>

      <div className="absolute bottom-4 left-0 right-0 z-20 text-center">
        <a 
          href="https://www.instagram.com/youssefdebba.gh?igsh=MTlveXFjdGdiZ2hmbw==" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
            من تطوير يوسف الدباغ
        </a>
      </div>
      
    </div>
  );
};

export default CoverPage;