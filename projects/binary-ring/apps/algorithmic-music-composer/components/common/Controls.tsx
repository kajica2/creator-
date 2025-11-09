
import React from 'react';

export const ControlContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
    <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
    <div className="space-y-6">
      {children}
    </div>
  </div>
);

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tooltip?: string;
}

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, onChange, tooltip }) => (
  <div className="flex flex-col space-y-2" title={tooltip}>
    <div className="flex justify-between items-center">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <span className="text-sm font-mono bg-gray-700 text-white px-2 py-1 rounded">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
    />
  </div>
);


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}
export const Button: React.FC<ButtonProps> = ({ children, ...props }) => (
    <button
        {...props}
        className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
    >
        {children}
    </button>
);
