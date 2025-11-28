import React from 'react';
import { ThemeName } from '../types';
import { themes } from '../themes';

interface ThemeSelectorProps {
  currentTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  isDark: boolean;
  onDarkModeToggle: () => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  currentTheme, 
  onThemeChange,
  isDark,
  onDarkModeToggle
}) => {
  return (
    <div className="theme-selector">
      {/* 亮暗模式切换 */}
      <button 
        className="dark-mode-btn"
        onClick={onDarkModeToggle}
        title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
        aria-label={isDark ? '切换到亮色模式' : '切换到暗色模式'}
      >
        {isDark ? (
          // 月亮图标 - 暗色模式
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            <circle cx="17" cy="5" r="1" fill="currentColor" />
            <circle cx="20" cy="8" r="0.5" fill="currentColor" />
          </svg>
        ) : (
          // 太阳图标 - 亮色模式
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M6.34 17.66l-1.41 1.41" />
            <path d="M19.07 4.93l-1.41 1.41" />
          </svg>
        )}
      </button>

      <div className="theme-divider" />

      {/* 配色按钮 */}
      {Object.values(themes).map((theme) => (
        <button
          key={theme.name}
          className={`theme-color-btn ${currentTheme === theme.name ? 'active' : ''}`}
          onClick={() => onThemeChange(theme.name)}
          title={theme.label}
          aria-label={`切换到${theme.label}主题`}
          style={{
            background: theme.colors.primary,
          }}
        />
      ))}
    </div>
  );
};

export default ThemeSelector;
