'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterEffectProps {
  text: string;
  typingSpeed?: number;
  randomPause?: boolean;
  className?: string;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  text,
  typingSpeed = 40,
  randomPause = true,
  className,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    setDisplayedText('');
    setIsTypingComplete(false);

    const typeNextCharacter = () => {
      if (currentIndex < text.length) {
        const nextChar = text[currentIndex];
        setDisplayedText((prev) => prev + nextChar);
        currentIndex++;

        // Calculate delay for next character
        let delay = typingSpeed;
        if (randomPause && Math.random() < 0.1) {
          // 10% chance of a longer pause
          delay += Math.random() * 100;
        }

        setTimeout(typeNextCharacter, delay);
      } else {
        setIsTypingComplete(true);
      }
    };

    typeNextCharacter();
  }, [text, typingSpeed, randomPause]);

  return (
    <span className={cn('inline-block', className)}>
      {displayedText}
      {!isTypingComplete && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

export default TypewriterEffect; 