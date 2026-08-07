import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AnimatedInputProps {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
}

export default function AnimatedInput({ 
  type, 
  value, 
  onChange, 
  placeholder, 
  className = "", 
  disabled = false 
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [characters, setCharacters] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCharacters(value.split(''));
  }, [value]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newChars = newValue.split('');
    
    // Animate characters shifting
    setCharacters(newChars);
    onChange(e);
  };

  return (
    <div className="relative">
      <div 
        className={`
          relative overflow-hidden rounded-md border border-border bg-input text-foreground
          transition-all duration-300 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary
          ${className}
        `}
        style={{ height: '42px' }}
      >
        {/* Hidden actual input for functionality */}
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-text"
          style={{ caretColor: 'transparent' }}
        />
        
        {/* Visual display */}
        <div className="absolute inset-0 flex items-center justify-center px-3">
          <div className="flex items-center relative">
            {/* Placeholder text */}
            <AnimatePresence>
              {!isFocused && characters.length === 0 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-muted-foreground absolute"
                >
                  {placeholder}
                </motion.span>
              )}
            </AnimatePresence>
            
            {/* Animated characters */}
            <div className="flex">
              <AnimatePresence mode="popLayout">
                {characters.map((char, index) => (
                  <motion.span
                    key={`${char}-${index}`}
                    initial={{ 
                      x: 0, 
                      opacity: 0,
                      scale: 1.2 
                    }}
                    animate={{ 
                      x: index === characters.length - 1 ? 0 : -(characters.length - 1 - index) * 2,
                      opacity: 1,
                      scale: 1
                    }}
                    exit={{ 
                      opacity: 0,
                      scale: 0.8,
                      x: -20
                    }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.2 }
                    }}
                    className="text-foreground relative"
                    style={{
                      transform: `translateX(${-(characters.length * 4)}px)`
                    }}
                  >
                    {type === 'password' ? '•' : char}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Animated cursor */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [1, 0, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1,
                    ease: "easeInOut"
                  }}
                  className="w-0.5 h-5 bg-primary ml-0.5"
                  style={{
                    transform: `translateX(${-(characters.length * 4)}px)`
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}