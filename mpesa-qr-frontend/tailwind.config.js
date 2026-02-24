/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // <--- Critical for the Toggle to work
  theme: {
    extend: {
      colors: {
        brand: {
          // --- PRIMARY ACTIONS ---
          orange: '#FF6B00',       // Main CTA button
          orangeHover: '#E66000',  // Active/Hover states
          orangeLight: '#FFF0E5',  // Light mode subtle backgrounds (e.g., active tabs)
          orangeDark: '#331500',   // Dark mode subtle backgrounds (e.g., active tabs)

          // --- DARK MODE THEME (OLED Optimized) ---
          black: '#121212',        // True AMOLED background (saves battery, creates infinite contrast)
          gray: '#1E1E1E',         // Base card surface (distinguishes cards from the background)
          grayHover: '#2A2A2A',    // Interactive card/row hover state (gives physical depth when tapped)
          borderDark: '#27272A',   // Crisp, low-glare dividers that don't distract

          // --- LIGHT MODE THEME (Eye-Strain Optimized) ---
          light: '#FAFAFA',        // FIXED: Off-white app background. Reduces "snow blindness"
          surface: '#FFFFFF',      // FIXED: Pure white for cards to pop physically off the #FAFAFA background
          borderLight: '#E4E4E7',  // Soft borders that don't compete with typography
          
          // --- INVERTED ACTIONS (For Buttons) ---
          buttonBase: '#121212',     // Light Mode button color (Almost Black)
          buttonText: '#FFFFFF',     // Light Mode button text (White)
          buttonDark: '#FFFFFF',     // Dark Mode button color (White)
          buttonTextDark: '#121212', // Dark Mode button text (Almost Black)
        },
        
        // --- TEXT HIERARCHY (Readability & Contrast) ---
        content: {
          main: '#09090B',         // Light mode primary text (Almost black)
          mainDark: '#F4F4F5',     // Dark mode primary text (Off-white: prevents OLED halation/glowing)
          muted: '#71717A',        // Secondary labels (Light Mode - passes WCAG contrast)
          mutedDark: '#A1A1AA',    // Secondary labels (Dark Mode - bumped up to zinc-400 for better visibility)
        },

        // --- TRANSACTION STATUSES (Color-blind safe & accessible) ---
        status: {
          success: '#10B981',       // Emerald 500
          successBg: '#10B9811A',   // Emerald at exactly 10% opacity for perfect badge tinting
          
          pending: '#F59E0B',       // Amber 500
          pendingBg: '#F59E0B1A',   // Amber at 10% opacity
          
          error: '#EF4444',         // Red 500
          errorBg: '#EF44441A',     // Red at 10% opacity

          neutral: '#71717A',       // Zinc 500 (Used for Cancelled/Walk-in status)
          neutralBg: '#71717A1A',   // Zinc at 10% opacity
        },

        // --- TOOLTIPS (High Contrast Overlays) ---
        tooltip: {
          bg: '#121212',            // Light Mode: Dark background for pop
          text: '#FAFAFA',          // Light Mode: Light text
          border: '#27272A',        // Light Mode: Subtle dark border
          
          bgDark: '#1E1E1E',        // Dark Mode: Elevated gray (so it doesn't vanish into the black app background)
          textDark: '#F4F4F5',      // Dark Mode: Off-white text
          borderDark: '#27272A',    // Dark Mode: Crisp border to separate from underlying cards
        }
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}