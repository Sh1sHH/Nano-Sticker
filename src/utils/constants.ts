export const COLORS = {
  primary: '#6366f1',
  secondary: '#64748b',
  success: '#059669',
  warning: '#f59e0b',
  error: '#dc2626',
  background: '#f8fafc',
  white: '#ffffff',
  black: '#1e293b',
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const ARTISTIC_STYLES = {
  POP_ART: 'pop-art',
  JAPANESE_MATCHBOX: 'japanese-matchbox',
  CARTOON_DINO: 'cartoon-dino',
  PIXEL_ART: 'pixel-art',
  ROYAL: 'royal',
  FOOTBALL_STICKER: 'football-sticker',
  CLAYMATION: 'claymation',
  VINTAGE_BOLLYWOOD: 'vintage-bollywood',
  STICKER_BOMB: 'sticker-bomb',
} as const;

export const EMOTIONS = [
  { key: 'Happy', en: 'Happy', tr: 'Mutlu' },
  { key: 'Sad', en: 'Sad', tr: 'Üzgün' },
  { key: 'Angry', en: 'Angry', tr: 'Kızgın' },
  { key: 'Surprised', en: 'Surprised', tr: 'Şaşkın' },
  { key: 'Laughing', en: 'Laughing', tr: 'Gülen' },
  { key: 'Love', en: 'Love', tr: 'Aşık' },
  { key: 'Winking', en: 'Winking', tr: 'Göz Kırpan' },
  { key: 'Confused', en: 'Confused', tr: 'Kafası Karışık' },
] as const;

export const CREDIT_COSTS = {
  STICKER_GENERATION: 1,
  PREMIUM_EFFECTS: 0.5,
} as const;

export const FREE_CREDITS = 10;