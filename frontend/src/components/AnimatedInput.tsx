import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AnimatedInputProps {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onFocus?: () => void;
}

export default function AnimatedInput({ 
  type, 
  value, 
  onChange, 
  placeholder, 
  className = "", 
  disabled = false,
  inputRef,
  onFocus,
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [displayChars, setDisplayChars] = useState<string[]>([]);
  const internalRef = inputRef ?? useRef<HTMLInputElement>(null);

  useEffect(() => {
    const chars = value.split('');
    setDisplayChars(chars);
  }, [value]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleInputClick = () => {
    if (internalRef.current && !disabled) {
      internalRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <div 
        className={`
          relative overflow-hidden rounded-md border border-border bg-input text-foreground
          transition-all duration-300 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary
          hover:border-primary/50 cursor-text
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        style={{ height: '48px' }}
        onClick={handleInputClick}
      >
        {/* Hidden actual input for functionality */}
        <input
          ref={internalRef}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={(e) => {
            handleFocus();
            onFocus?.();
          }}
          onBlur={handleBlur}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-text"
          autoComplete="off"
          style={{ caretColor: 'transparent' }}
        />
        
        {/* Visual display container */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="relative flex items-center justify-center min-h-[20px] w-full">
            
            {/* Placeholder text */}
            <AnimatePresence>
              {!isFocused && displayChars.length === 0 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-muted-foreground text-center select-none absolute whitespace-nowrap"
                >
                  {placeholder}
                </motion.span>
              )}
            </AnimatePresence>
            
            {/* Text and cursor display */}
            {(displayChars.length > 0 || isFocused) && (
              <div className="relative flex items-center justify-center w-full">
                
                {/* Text container with natural character flow */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center">
                    <AnimatePresence mode="popLayout">
                      {displayChars.map((char, index) => (
                        // Use a non-breaking space so single spaces remain visually present
                        <motion.span
                          key={`char-${index}-${char}-${displayChars.length}`}
                          initial={{ 
                            opacity: 0,
                            scale: 1.3,
                            y: -8
                          }}
                          animate={{ 
                            opacity: 1,
                            scale: 1,
                            y: 0
                          }}
                          exit={{ 
                            opacity: 0,
                            scale: 0.8,
                            y: 4
                          }}
                          transition={{ 
                            duration: 0.25,
                            ease: "easeOut",
                            delay: index * 0.03
                          }}
                          className="text-foreground font-medium select-none"
                          style={{ 
                            userSelect: 'none',
                            fontFamily: 'Arial, sans-serif'
                          }}
                        >
                          {type === 'password' ? '•' : char === ' ' ? '\u00A0' : char}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  {/* Simple bold cursor */}
                  <AnimatePresence mode="wait">
                    {isFocused && (
                      <motion.div
                        key="cursor"
                        initial={{ 
                          opacity: 0, 
                          scaleY: 0.5
                        }}
                        animate={{ 
                          opacity: [1, 0.3, 1],
                          scaleY: 1
                        }}
                        exit={{ 
                          opacity: 0, 
                          scaleY: 0
                        }}
                        transition={{ 
                          opacity: {
                            repeat: isFocused ? Infinity : 0, 
                            duration: 1.0,
                            ease: "easeInOut"
                          },
                          scaleY: {
                            duration: 0.1,
                            ease: "easeOut"
                          },
                          exit: {
                            duration: 0.08
                          }
                        }}
                        className="w-0.5 h-5 bg-primary origin-bottom ml-0.5 rounded-full"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Simple focus effect */}
        <motion.div
          className="absolute inset-0 rounded-md pointer-events-none border border-primary/30"
          initial={{ 
            opacity: 0,
            scale: 1
          }}
          animate={{ 
            opacity: isFocused ? 1 : 0,
            scale: isFocused ? 1.005 : 1
          }}
          transition={{ 
            duration: 0.15,
            ease: "easeOut"
          }}
        />
      </div>
    </div>
  );
}