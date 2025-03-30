'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  onStart?: () => void;
  isTyping?: boolean;
}

export function TypewriterText({
  text,
  speed = 5,
  className,
  onComplete,
  onStart,
  isTyping = true,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);
  const isFirstRenderRef = useRef(true);

  // Reset state when text changes
  useEffect(() => {
    if (!isFirstRenderRef.current) {
      setDisplayedText('');
      setCurrentIndex(0);
      hasStartedRef.current = false;
    }
    isFirstRenderRef.current = false;
  }, [text]);

  // Handle typing animation
  useEffect(() => {
    // If not typing, show full text immediately
    if (!isTyping) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      if (currentIndex === text.length) {
        onComplete?.();
      }
      return;
    }

    // Start typing
    if (currentIndex === 0 && !hasStartedRef.current) {
      hasStartedRef.current = true;
      onStart?.();
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If still typing
    if (currentIndex < text.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
      }, speed * 10);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else if (currentIndex === text.length) {
      onComplete?.();
    }
  }, [currentIndex, text, speed, isTyping, onComplete, onStart]);

  return (
    <span className={cn('inline-block', className)}>
      {displayedText}
      {currentIndex < text.length && isTyping && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
} 