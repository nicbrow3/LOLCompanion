export interface BaseTheme {
  name: string;
  baseColors: {
    primary: string;    // Main brand color
    secondary: string;  // Secondary brand color  
    accent: string;     // Accent/highlight color
    success: string;    // Success/positive color
    error: string;      // Error/negative color
    neutral: string;    // Neutral/text color
  };
}

export interface Theme {
  name: string;
  colors: {
    // Background colors
    'bg-primary': string;
    'bg-secondary': string;
    'bg-card': string;
    'bg-input': string;
    
    // Text colors
    'text-primary': string;
    'text-secondary': string;
    'text-muted': string;
    
    // Brand colors
    'primary-gold': string;
    'primary-blue': string;
    'primary-teal': string;
    'primary-green': string;
    'primary-red': string;
    
    // UI colors
    'border-primary': string;
    'border-secondary': string;
    'border-accent': string;
  };
}

// Utility functions to generate lighter/darker shades
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function lightenColor(color: string, percentage: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * percentage));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * percentage));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * percentage));
  
  return rgbToHex(r, g, b);
}

function darkenColor(color: string, percentage: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const r = Math.max(0, Math.round(rgb.r * (1 - percentage)));
  const g = Math.max(0, Math.round(rgb.g * (1 - percentage)));
  const b = Math.max(0, Math.round(rgb.b * (1 - percentage)));
  
  return rgbToHex(r, g, b);
}

// Generate a complete theme from base colors
function generateTheme(baseTheme: BaseTheme): Theme {
  const { primary, secondary, accent, success, error, neutral } = baseTheme.baseColors;
  
  const isDark = hexToRgb(neutral)!.r < 128; // Determine if theme is dark or light
  
  return {
    name: baseTheme.name,
    colors: {
      // Background colors - improved contrast
      'bg-primary': isDark ? darkenColor(neutral, 0.6) : lightenColor(neutral, 0.95),
      'bg-secondary': isDark ? darkenColor(neutral, 0.4) : lightenColor(neutral, 0.85),
      'bg-card': isDark ? lightenColor(neutral, 0.15) : darkenColor(neutral, 0.05),
      'bg-input': isDark ? lightenColor(neutral, 0.25) : darkenColor(neutral, 0.1),
      
      // Text colors
      'text-primary': isDark ? lightenColor(neutral, 0.8) : darkenColor(neutral, 0.9),
      'text-secondary': isDark ? lightenColor(neutral, 0.6) : darkenColor(neutral, 0.7),
      'text-muted': isDark ? lightenColor(neutral, 0.4) : darkenColor(neutral, 0.5),
      
      // Brand colors
      'primary-gold': primary,
      'primary-blue': secondary,
      'primary-teal': accent,
      'primary-green': success,
      'primary-red': error,
      
      // UI colors - better contrast
      'border-primary': isDark ? lightenColor(neutral, 0.4) : darkenColor(neutral, 0.2),
      'border-secondary': isDark ? darkenColor(primary, 0.3) : darkenColor(primary, 0.2),
      'border-accent': isDark ? darkenColor(accent, 0.2) : darkenColor(accent, 0.3)
    }
  };
}

// Base theme definitions with 6 colors each
export const baseThemes: Record<string, BaseTheme> = {
  league: {
    name: 'League of Legends',
    baseColors: {
      primary: '#C89B3C',   // Gold
      secondary: '#0596AA', // Blue
      accent: '#0BC5EA',    // Teal
      success: '#00C851',   // Green
      error: '#FF3D57',     // Red
      neutral: '#1E2328'    // Dark base
    }
  },
  
  dark: {
    name: 'Dark Minimal',
    baseColors: {
      primary: '#E6C560',   // Softer gold
      secondary: '#007ACC', // Blue
      accent: '#20B2AA',    // Teal
      success: '#28A745',   // Green
      error: '#DC3545',     // Red
      neutral: '#2A2A2A'    // Lighter dark base
    }
  },
  
  light: {
    name: 'Light Minimal',
    baseColors: {
      primary: '#EA8600',   // Orange
      secondary: '#1A73E8', // Blue
      accent: '#0D7377',    // Teal
      success: '#137333',   // Green
      error: '#D93025',     // Red
      neutral: '#F8F9FA'    // Light base
    }
  },
  
  ocean: {
    name: 'Ocean Blue',
    baseColors: {
      primary: '#FFC107',   // Amber
      secondary: '#29B6F6', // Light Blue
      accent: '#26A69A',    // Teal
      success: '#66BB6A',   // Light Green
      error: '#EF5350',     // Light Red
      neutral: '#132F4C'    // Dark Blue base
    }
  },
  
  forest: {
    name: 'Forest Green',
    baseColors: {
      primary: '#FFC107',   // Amber
      secondary: '#42A5F5', // Blue
      accent: '#4CAF50',    // Green
      success: '#81C784',   // Light Green
      error: '#E57373',     // Light Red
      neutral: '#1A2E1A'    // Dark Green base
    }
  }
};

// Generate complete themes from base themes
export const themes: Record<string, Theme> = Object.fromEntries(
  Object.entries(baseThemes).map(([key, baseTheme]) => [
    key,
    generateTheme(baseTheme)
  ])
);

export const defaultTheme = 'league'; 