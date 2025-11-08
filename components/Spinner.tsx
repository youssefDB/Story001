
import React from 'react';

interface SpinnerProps {
  message: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50 transition-opacity duration-300">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-600 border-t-red-700 rounded-full animate-spin"></div>
      <p className="text-white text-xl mt-4 font-title tracking-wider">{message}</p>
    </div>
  );
};

export default Spinner;
