import { Theme } from '../types';

export const themes: Record<string, Theme> = {
  // 蓝白
  blue: {
    name: 'blue',
    label: '天空蓝',
    icon: '💙',
    colors: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      accent: '#3B82F6',
      contrast: '#2563EB',
      background: '#F8FAFC',
      backgroundAlt: '#FFFFFF',
      cardFront: '#FFFFFF',
      cardBack: '#F1F5F9',
      text: '#1E293B',
      textLight: '#64748B',
      highlight: '#3B82F6',
      border: '#1E293B',
      shadow: '#94A3B8',
      glow: 'rgba(59, 130, 246, 0.1)',
    },
    darkColors: {
      primary: '#60A5FA',
      secondary: '#3B82F6',
      accent: '#60A5FA',
      contrast: '#93C5FD',
      background: '#0F172A',
      backgroundAlt: '#1E293B',
      cardFront: '#1E293B',
      cardBack: '#334155',
      text: '#F1F5F9',
      textLight: '#94A3B8',
      highlight: '#60A5FA',
      border: '#F1F5F9',
      shadow: '#0F172A',
      glow: 'rgba(96, 165, 250, 0.2)',
    },
  },
  // 清新绿
  green: {
    name: 'green',
    label: '薄荷绿',
    icon: '💚',
    colors: {
      primary: '#10B981',
      secondary: '#34D399',
      accent: '#10B981',
      contrast: '#059669',
      background: '#F0FDF4',
      backgroundAlt: '#FFFFFF',
      cardFront: '#FFFFFF',
      cardBack: '#ECFDF5',
      text: '#14532D',
      textLight: '#4D7C5C',
      highlight: '#10B981',
      border: '#14532D',
      shadow: '#86EFAC',
      glow: 'rgba(16, 185, 129, 0.1)',
    },
    darkColors: {
      primary: '#34D399',
      secondary: '#10B981',
      accent: '#34D399',
      contrast: '#6EE7B7',
      background: '#052E16',
      backgroundAlt: '#14532D',
      cardFront: '#14532D',
      cardBack: '#166534',
      text: '#ECFDF5',
      textLight: '#86EFAC',
      highlight: '#34D399',
      border: '#ECFDF5',
      shadow: '#052E16',
      glow: 'rgba(52, 211, 153, 0.2)',
    },
  },
  // 优雅紫
  purple: {
    name: 'purple',
    label: '梦幻紫',
    icon: '💜',
    colors: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      accent: '#8B5CF6',
      contrast: '#7C3AED',
      background: '#FAF5FF',
      backgroundAlt: '#FFFFFF',
      cardFront: '#FFFFFF',
      cardBack: '#F5F3FF',
      text: '#3B0764',
      textLight: '#6B5B7A',
      highlight: '#8B5CF6',
      border: '#3B0764',
      shadow: '#C4B5FD',
      glow: 'rgba(139, 92, 246, 0.1)',
    },
    darkColors: {
      primary: '#A78BFA',
      secondary: '#8B5CF6',
      accent: '#A78BFA',
      contrast: '#C4B5FD',
      background: '#1E1033',
      backgroundAlt: '#2E1065',
      cardFront: '#2E1065',
      cardBack: '#3B0764',
      text: '#F5F3FF',
      textLight: '#C4B5FD',
      highlight: '#A78BFA',
      border: '#F5F3FF',
      shadow: '#1E1033',
      glow: 'rgba(167, 139, 250, 0.2)',
    },
  },
  // 活力橙
  orange: {
    name: 'orange',
    label: '元气橙',
    icon: '🧡',
    colors: {
      primary: '#F97316',
      secondary: '#FB923C',
      accent: '#F97316',
      contrast: '#EA580C',
      background: '#FFFBEB',
      backgroundAlt: '#FFFFFF',
      cardFront: '#FFFFFF',
      cardBack: '#FFF7ED',
      text: '#7C2D12',
      textLight: '#9A6B4C',
      highlight: '#F97316',
      border: '#7C2D12',
      shadow: '#FDBA74',
      glow: 'rgba(249, 115, 22, 0.1)',
    },
    darkColors: {
      primary: '#FB923C',
      secondary: '#F97316',
      accent: '#FB923C',
      contrast: '#FDBA74',
      background: '#1C0A00',
      backgroundAlt: '#431407',
      cardFront: '#431407',
      cardBack: '#7C2D12',
      text: '#FFF7ED',
      textLight: '#FDBA74',
      highlight: '#FB923C',
      border: '#FFF7ED',
      shadow: '#1C0A00',
      glow: 'rgba(251, 146, 60, 0.2)',
    },
  },
  // 可爱粉
  pink: {
    name: 'pink',
    label: '樱花粉',
    icon: '💗',
    colors: {
      primary: '#EC4899',
      secondary: '#F472B6',
      accent: '#EC4899',
      contrast: '#DB2777',
      background: '#FDF2F8',
      backgroundAlt: '#FFFFFF',
      cardFront: '#FFFFFF',
      cardBack: '#FCE7F3',
      text: '#831843',
      textLight: '#9B5675',
      highlight: '#EC4899',
      border: '#831843',
      shadow: '#F9A8D4',
      glow: 'rgba(236, 72, 153, 0.1)',
    },
    darkColors: {
      primary: '#F472B6',
      secondary: '#EC4899',
      accent: '#F472B6',
      contrast: '#F9A8D4',
      background: '#1F0511',
      backgroundAlt: '#500724',
      cardFront: '#500724',
      cardBack: '#831843',
      text: '#FCE7F3',
      textLight: '#F9A8D4',
      highlight: '#F472B6',
      border: '#FCE7F3',
      shadow: '#1F0511',
      glow: 'rgba(244, 114, 182, 0.2)',
    },
  },
};

export const getThemeCSS = (theme: Theme, isDark: boolean = false): string => {
  const colors = isDark ? theme.darkColors : theme.colors;
  return `
    --color-primary: ${colors.primary};
    --color-secondary: ${colors.secondary};
    --color-accent: ${colors.accent};
    --color-contrast: ${colors.contrast};
    --color-background: ${colors.background};
    --color-background-alt: ${colors.backgroundAlt};
    --color-card-front: ${colors.cardFront};
    --color-card-back: ${colors.cardBack};
    --color-text: ${colors.text};
    --color-text-light: ${colors.textLight};
    --color-highlight: ${colors.highlight};
    --color-border: ${colors.border};
    --color-shadow: ${colors.shadow};
    --color-glow: ${colors.glow};
  `;
};
