/**
 * Motor accessibility components for large targets, voice control, and alternative input methods
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility, useVoiceControl } from '../hooks/useAccessibility';
import { voiceControl } from '../utils/accessibility';

// Large Click Target Wrapper
export interface LargeTargetProps {
  children: React.ReactElement;
  minSize?: number;
  className?: string;
}

export const LargeTarget: React.FC<LargeTargetProps> = ({
  children,
  minSize = 44,
  className = ''
}) => {
  const { preferences } = useAccessibility();

  const targetClasses = preferences.motorAssist
    ? `motor-accessible-target inline-block`
    : '';

  return (
    <div
      className={`${targetClasses} ${className}`}
      style={{
        minWidth: preferences.motorAssist ? `${minSize}px` : undefined,
        minHeight: preferences.motorAssist ? `${minSize}px` : undefined,
        padding: preferences.motorAssist ? '8px' : undefined
      }}
    >
      {React.cloneElement(children, {
        className: `${children.props.className || ''} ${
          preferences.motorAssist ? 'motor-assist-target' : ''
        }`.trim()
      })}
    </div>
  );
};

// Voice Control Component
export interface VoiceControlProps {
  commands?: Record<string, () => void>;
  isActive?: boolean;
  onToggle?: (active: boolean) => void;
}

export const VoiceControlManager: React.FC<VoiceControlProps> = ({
  commands = {},
  isActive: externalActive,
  onToggle
}) => {
  const { preferences, announceMessage } = useAccessibility();
  const {
    isSupported,
    isListening: internalListening,
    startListening,
    stopListening
  } = useVoiceControl();

  const [isActive, setIsActive] = useState(false);
  const isListening = externalActive !== undefined ? externalActive : internalListening;

  const defaultCommands = {
    'open menu': () => {
      const menuButton = document.querySelector('[aria-label*="menu"]') as HTMLElement;
      menuButton?.click();
    },
    'close menu': () => {
      const closeButton = document.querySelector('[aria-label*="close"]') as HTMLElement;
      closeButton?.click();
    },
    'go back': () => {
      window.history.back();
    },
    'scroll up': () => {
      window.scrollBy(0, -200);
    },
    'scroll down': () => {
      window.scrollBy(0, 200);
    },
    'click button': () => {
      const button = document.querySelector('button:focus') as HTMLElement;
      button?.click();
    },
    'select hashtag': () => {
      const hashtag = document.querySelector('[data-hashtag]:focus') as HTMLElement;
      hashtag?.click();
    },
    'clear all': () => {
      const clearButton = document.querySelector('[aria-label*="clear"]') as HTMLElement;
      clearButton?.click();
    }
  };

  const allCommands = { ...defaultCommands, ...commands };

  const handleToggle = useCallback(() => {
    const newActive = !isActive;
    setIsActive(newActive);
    onToggle?.(newActive);

    if (newActive) {
      startListening(allCommands);
      announceMessage('Voice control activated. Speak your commands clearly.');
    } else {
      stopListening();
      announceMessage('Voice control deactivated.');
    }
  }, [isActive, onToggle, startListening, stopListening, allCommands, announceMessage]);

  useEffect(() => {
    if (preferences.voiceControl && !isActive) {
      handleToggle();
    } else if (!preferences.voiceControl && isActive) {
      setIsActive(false);
      stopListening();
    }
  }, [preferences.voiceControl]);

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-400 p-4 bg-gray-800 rounded-lg">
        <p>Voice control is not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-medium">Voice Control</h3>
          <p className="text-gray-400 text-sm">
            Control the application using voice commands
          </p>
        </div>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
            isActive ? 'bg-purple-600' : 'bg-gray-600'
          }`}
          role="switch"
          aria-checked={isActive}
          aria-label="Toggle voice control"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {isActive && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm text-white">
              {isListening ? 'Listening...' : 'Voice control ready'}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-medium text-white mb-2">Available Commands:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.keys(allCommands).map((command) => (
                <div
                  key={command}
                  className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded"
                >
                  "{command}"
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Gesture Control Component
export interface GestureControlProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  children: React.ReactNode;
  className?: string;
}

export const GestureControl: React.FC<GestureControlProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  children,
  className = ''
}) => {
  const { preferences, announceMessage } = useAccessibility();
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const onTouchEndHandler = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
      announceMessage('Swiped left');
    } else if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
      announceMessage('Swiped right');
    } else if (isUpSwipe && onSwipeUp) {
      onSwipeUp();
      announceMessage('Swiped up');
    } else if (isDownSwipe && onSwipeDown) {
      onSwipeDown();
      announceMessage('Swiped down');
    }
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, announceMessage]);

  if (!preferences.motorAssist) {
    return <>{children}</>;
  }

  return (
    <div
      className={`touch-gesture ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
    >
      {children}
    </div>
  );
};

// Sticky Drag Component
export interface StickyDragProps {
  children: React.ReactNode;
  onDragEnd?: (element: HTMLElement) => void;
  dragHandle?: boolean;
  className?: string;
}

export const StickyDrag: React.FC<StickyDragProps> = ({
  children,
  onDragEnd,
  dragHandle = false,
  className = ''
}) => {
  const { preferences, announceMessage } = useAccessibility();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!preferences.motorAssist) return;

    const rect = elementRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
      announceMessage('Drag started. Use arrow keys or mouse to move.');
    }
  }, [preferences.motorAssist, announceMessage]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !elementRef.current) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    elementRef.current.style.left = `${newX}px`;
    elementRef.current.style.top = `${newY}px`;
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.(elementRef.current!);
      announceMessage('Drag ended');
    }
  }, [isDragging, onDragEnd, announceMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!preferences.motorAssist || !elementRef.current) return;

    const step = e.shiftKey ? 10 : 1;
    const rect = elementRef.current.getBoundingClientRect();
    let newX = rect.left;
    let newY = rect.top;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newX -= step;
        break;
      case 'ArrowRight':
        e.preventDefault();
        newX += step;
        break;
      case 'ArrowUp':
        e.preventDefault();
        newY -= step;
        break;
      case 'ArrowDown':
        e.preventDefault();
        newY += step;
        break;
      default:
        return;
    }

    elementRef.current.style.left = `${newX}px`;
    elementRef.current.style.top = `${newY}px`;
  }, [preferences.motorAssist]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!preferences.motorAssist) {
    return <>{children}</>;
  }

  return (
    <div
      ref={elementRef}
      className={`${className} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} relative`}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Draggable element. Use arrow keys to move, Shift+arrow for faster movement"
      style={{
        touchAction: 'none',
        userSelect: 'none'
      }}
    >
      {dragHandle && (
        <div className="absolute top-0 left-0 w-full h-8 bg-gray-600/50 flex items-center justify-center cursor-grab">
          <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </div>
      )}
      {children}
    </div>
  );
};

// One-Handed Mode Component
export interface OneHandedModeProps {
  children: React.ReactNode;
  position?: 'left' | 'right';
  enabled?: boolean;
}

export const OneHandedMode: React.FC<OneHandedModeProps> = ({
  children,
  position = 'right',
  enabled = false
}) => {
  const { preferences } = useAccessibility();

  const shouldApply = enabled && preferences.motorAssist;

  return (
    <div
      className={`${
        shouldApply
          ? `one-handed-mode one-handed-${position} max-w-xs ml-auto mr-0`
          : ''
      }`}
    >
      {children}
    </div>
  );
};

// Alternative Input Method Component
export interface AlternativeInputProps {
  onInput?: (method: 'keyboard' | 'voice' | 'gesture', value: string) => void;
  placeholder?: string;
  value?: string;
}

export const AlternativeInput: React.FC<AlternativeInputProps> = ({
  onInput,
  placeholder = 'Type, speak, or gesture your input',
  value = ''
}) => {
  const { preferences, announceMessage } = useAccessibility();
  const [inputValue, setInputValue] = useState(value);
  const [inputMethod, setInputMethod] = useState<'keyboard' | 'voice' | 'gesture'>('keyboard');
  const { isSupported: voiceSupported, startListening } = useVoiceControl();

  const handleKeyboardInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setInputMethod('keyboard');
    onInput?.('keyboard', newValue);
  }, [onInput]);

  const handleVoiceInput = useCallback(() => {
    if (!voiceSupported) return;

    const commands = {
      '*': (transcript: string) => {
        setInputValue(transcript);
        setInputMethod('voice');
        onInput?.('voice', transcript);
        announceMessage(`Voice input: ${transcript}`);
      }
    };

    startListening(commands);
    announceMessage('Listening for voice input...');
  }, [voiceSupported, startListening, onInput, announceMessage]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleKeyboardInput}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            preferences.motorAssist ? 'min-h-[44px] text-lg' : ''
          }`}
          aria-label="Alternative input field"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
          {voiceSupported && preferences.voiceControl && (
            <button
              onClick={handleVoiceInput}
              className="p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
              aria-label="Use voice input"
              title="Voice input"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 text-xs text-gray-400">
        <span>Input method:</span>
        <span className="capitalize font-medium text-white">{inputMethod}</span>
        {preferences.motorAssist && (
          <span className="ml-2 text-green-400">• Motor assist active</span>
        )}
      </div>
    </div>
  );
};

export default {
  LargeTarget,
  VoiceControlManager,
  GestureControl,
  StickyDrag,
  OneHandedMode,
  AlternativeInput
};