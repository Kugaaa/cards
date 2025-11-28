export interface FlashCard {
  题干: string;
  答案: string[];
}

export type ThemeName = 'blue' | 'green' | 'purple' | 'orange' | 'pink';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  contrast: string;
  background: string;
  backgroundAlt: string;
  cardFront: string;
  cardBack: string;
  text: string;
  textLight: string;
  highlight: string;
  border: string;
  shadow: string;
  glow: string;
}

export interface Theme {
  name: ThemeName;
  label: string;
  icon: string;
  colors: ThemeColors;
  darkColors: ThemeColors;
}
