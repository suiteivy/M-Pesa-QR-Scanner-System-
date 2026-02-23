import React from 'react';

/**
 * Card Component
 * Optimized for AMOLED depth. Uses brand-gray for surfaces.
 */
export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      // 1. Switched to brand-gray for dark mode surfaces
      // 2. Added 'relative' so background watermark icons don't escape the card
      className={`relative bg-white dark:bg-brand-gray shadow-xl rounded-[2rem] border border-zinc-200 dark:border-brand-gray overflow-hidden transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardHeader Component
 * Clean separation. Backgrounds removed so it inherits the parent card's color.
 */
export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div 
      // 3. Removed hardcoded bg so Orange cards stay Orange!
      className={`px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/50 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardContent Component
 * Protected by z-index to keep text readable above watermarks.
 */
export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      // 4. Added relative z-10 so your text always sits on top of decorative icons
      className={`relative z-10 px-6 py-6 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardTitle Component
 * Bold, italicized, and aggressive FinTech typography.
 */
export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 
      // Changed text-zinc-950 to text-inherit so it adapts if the card is orange or black
      className={`text-xl font-black italic uppercase tracking-tighter leading-none ${className}`} 
      {...props}
    >
      {children}
    </h3>
  );
};

/**
 * CardDescription Component
 * High-contrast secondary text for technical context.
 */
export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p 
      // Made slightly more dynamic for dark mode
      className={`text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mt-2 ${className}`} 
      {...props}
    >
      {children}
    </p>
  );
};

export default Card;