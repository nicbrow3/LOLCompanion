import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Theme system that works with Mantine and provides base neutral themes + accent color selection

export interface BaseNeutralTheme {
  name: string;
  isDark: boolean;
  colors: {
    // Background colors
    'bg-primary': string;
    'bg-secondary': string;
    'bg-tertiary': string;
    'bg-card': string;
    'bg-input': string;
    
    // Text colors
    'text-primary': string;
    'text-secondary': string;
    'text-muted': string;
    
    // Border colors
    'border-primary': string;
    'border-secondary': string;
  };
}

export interface AccentColorPalette {
  name: string;
  colors: {
    primary: string;     // Main accent color
    secondary: string;   // Secondary accent
    success: string;     // Success/positive
    warning: string;     // Warning/caution  
    error: string;       // Error/negative
    info: string;        // Information/neutral accent
  };
}

export interface CombinedTheme extends BaseNeutralTheme {
  accentPalette: AccentColorPalette;
  // Include accent colors for easy access
  'primary-color': string;
  'secondary-color': string;
  'success-color': string;
  'warning-color': string;
  'error-color': string;
  'info-color': string;
}

// Base neutral themes - just greys, whites, blacks
export const baseNeutralThemes: Record<string, BaseNeutralTheme> = {
  dark: {
    name: 'Dark',
    isDark: true,
    colors: {
      // Dark theme backgrounds
      'bg-primary': '#0a0a0a',      // Darkest - main background
      'bg-secondary': '#1a1a1a',    // Secondary backgrounds
      'bg-tertiary': '#2a2a2a',     // Cards, elevated content
      'bg-card': 'rgba(42, 42, 42, 0.8)',
      'bg-input': 'rgba(60, 60, 60, 0.8)',
      
      // Dark theme text
      'text-primary': '#ffffff',     // Primary text
      'text-secondary': '#d0d0d0',   // Secondary text
      'text-muted': '#a0a0a0',       // Muted text
      
      // Dark theme borders
      'border-primary': '#3a3a3a',   // Primary borders
      'border-secondary': '#4a4a4a', // Secondary borders
    }
  },
  
  light: {
    name: 'Light',
    isDark: false,
    colors: {
      // Light theme backgrounds
      'bg-primary': '#ffffff',      // Lightest - main background
      'bg-secondary': '#f8f9fa',    // Secondary backgrounds
      'bg-tertiary': '#e9ecef',     // Cards, elevated content
      'bg-card': 'rgba(233, 236, 239, 0.8)',
      'bg-input': 'rgba(248, 249, 250, 0.8)',
      
      // Light theme text
      'text-primary': '#212529',     // Primary text
      'text-secondary': '#495057',   // Secondary text
      'text-muted': '#6c757d',       // Muted text
      
      // Light theme borders
      'border-primary': '#dee2e6',   // Primary borders
      'border-secondary': '#adb5bd', // Secondary borders
    }
  }
};

// Accent color palettes - these can be mixed with any base theme
export const accentColorPalettes: Record<string, AccentColorPalette> = {
  league: {
    name: 'League',
    colors: {
      primary: '#C89B3C',   // Gold
      secondary: '#0596AA', // Blue
      success: '#00C851',   // Green
      warning: '#F39C12',   // Orange
      error: '#FF3D57',     // Red
      info: '#0BC5EA',      // Teal
    }
  },
  
  ocean: {
    name: 'Ocean Blue',
    colors: {
      primary: '#1976D2',   // Blue
      secondary: '#0288D1', // Light Blue
      success: '#388E3C',   // Green
      warning: '#F57C00',   // Orange
      error: '#D32F2F',     // Red
      info: '#00ACC1',      // Cyan
    }
  },
  
  forest: {
    name: 'Forest Green',
    colors: {
      primary: '#388E3C',   // Green
      secondary: '#689F38', // Light Green
      success: '#4CAF50',   // Success Green
      warning: '#FF8F00',   // Amber
      error: '#D32F2F',     // Red
      info: '#00796B',      // Teal
    }
  },
  
  sunset: {
    name: 'Sunset Orange',
    colors: {
      primary: '#FF6F00',   // Orange
      secondary: '#FF8F00', // Light Orange
      success: '#4CAF50',   // Green
      warning: '#FFC107',   // Yellow
      error: '#D32F2F',     // Red
      info: '#7B1FA2',      // Purple
    }
  },
  
  royal: {
    name: 'Royal Purple',
    colors: {
      primary: '#7B1FA2',   // Purple
      secondary: '#8E24AA', // Light Purple
      success: '#4CAF50',   // Green
      warning: '#FF8F00',   // Orange
      error: '#D32F2F',     // Red
      info: '#1976D2',      // Blue
    }
  },
  
  minimal: {
    name: 'Minimal Grey',
    colors: {
      primary: '#757575',   // Lighter Grey for better contrast in dark mode
      secondary: '#9E9E9E', // Even lighter Medium Grey
      success: '#4CAF50',   // Green
      warning: '#FF9800',   // Orange
      error: '#F44336',     // Red
      info: '#2196F3',      // Blue
    }
  }
};

// Generate a combined theme from base + accent
export function createCombinedTheme(
  baseKey: string, 
  accentKey: string
): CombinedTheme {
  const baseTheme = baseNeutralThemes[baseKey];
  const accentPalette = accentColorPalettes[accentKey];
  
  if (!baseTheme || !accentPalette) {
    throw new Error(`Invalid theme combination: ${baseKey} + ${accentKey}`);
  }
  
  return {
    ...baseTheme,
    name: `${baseTheme.name} + ${accentPalette.name}`,
    accentPalette,
    'primary-color': accentPalette.colors.primary,
    'secondary-color': accentPalette.colors.secondary,
    'success-color': accentPalette.colors.success,
    'warning-color': accentPalette.colors.warning,
    'error-color': accentPalette.colors.error,
    'info-color': accentPalette.colors.info,
  };
}

// Default theme combinations for backwards compatibility and convenience
export const presetThemes: Record<string, CombinedTheme> = {
  'dark-league': createCombinedTheme('dark', 'league'),
  'light-league': createCombinedTheme('light', 'league'),
  'dark-ocean': createCombinedTheme('dark', 'ocean'),
  'light-ocean': createCombinedTheme('light', 'ocean'),
  'dark-forest': createCombinedTheme('dark', 'forest'),
  'light-forest': createCombinedTheme('light', 'forest'),
  'dark-sunset': createCombinedTheme('dark', 'sunset'),
  'light-sunset': createCombinedTheme('light', 'sunset'),
  'dark-royal': createCombinedTheme('dark', 'royal'),
  'light-royal': createCombinedTheme('light', 'royal'),
  'dark-minimal': createCombinedTheme('dark', 'minimal'),
  'light-minimal': createCombinedTheme('light', 'minimal'),
};

export const defaultTheme = 'dark-league';

// Legacy compatibility - map old theme names to new structure
export const themes = presetThemes;
export const baseThemes = {
  league: { name: 'League of Legends', baseColors: accentColorPalettes.league.colors }
};

// Apply theme to CSS custom properties and create Mantine theme override
export function applyTheme(theme: CombinedTheme) {
  const root = document.documentElement;
  
  // Apply base colors
  Object.entries(theme.colors).forEach(([property, value]) => {
    root.style.setProperty(`--${property}`, value);
  });
  
  // Apply accent colors with multiple naming conventions for compatibility
  const accentColors = theme.accentPalette.colors;
  
  // New naming convention
  root.style.setProperty('--primary-color', accentColors.primary);
  root.style.setProperty('--secondary-color', accentColors.secondary);
  root.style.setProperty('--success-color', accentColors.success);
  root.style.setProperty('--warning-color', accentColors.warning);
  root.style.setProperty('--error-color', accentColors.error);
  root.style.setProperty('--info-color', accentColors.info);
  
  // Legacy naming for backwards compatibility
  root.style.setProperty('--primary-gold', accentColors.primary);
  root.style.setProperty('--primary-blue', accentColors.secondary);
  root.style.setProperty('--primary-teal', accentColors.info);
  root.style.setProperty('--primary-green', accentColors.success);
  root.style.setProperty('--primary-red', accentColors.error);
  
  // Border accent colors
  root.style.setProperty('--border-accent', accentColors.primary);
  
  return {
    primaryColor: accentColors.primary,
    colors: {
      primary: [
        accentColors.primary,
        accentColors.primary,
        accentColors.primary,
        accentColors.primary,
        accentColors.primary,
        accentColors.primary,
        accentColors.primary,
        accentColors.primary,
        accentColors.primary,
        accentColors.primary,
      ],
    },
    defaultRadius: 'md',
    focusRing: 'auto',
    colorScheme: theme.isDark ? 'dark' : 'light',
  };
}

// Create a Mantine-compatible theme object from our combined theme
export function createMantineTheme(theme: CombinedTheme) {
  // A simple way to generate a tuple for the primary color.
  // This is a naive implementation. For a real app, you might want a more
  // sophisticated way to generate shades.
  const primaryTuple: MantineColorsTuple = [
    theme.accentPalette.colors.primary,
    theme.accentPalette.colors.primary,
    theme.accentPalette.colors.primary,
    theme.accentPalette.colors.primary,
    theme.accentPalette.colors.primary,
    theme.accentPalette.colors.primary,
    theme.accentPalette.colors.primary,
    theme.accentPalette.colors.primary,
    theme.accentPalette.colors.primary,
    theme.accentPalette.colors.primary,
  ];

  return createTheme({
    primaryColor: 'primary',
    colors: {
      primary: primaryTuple,
    },
  });
} 