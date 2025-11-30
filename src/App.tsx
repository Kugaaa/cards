import React, { useState, useEffect, useCallback } from 'react';
import { FlashCard as FlashCardType, ThemeName } from './types';
import { themes, getThemeCSS } from './themes';
import FlashCard from './components/FlashCard';
import ThemeSelector from './components/ThemeSelector';
import ImportSection from './components/ImportSection';
import Navigation from './components/Navigation';
import CardEditor from './components/CardEditor';

// localStorage keys
const STORAGE_KEYS = {
  THEME: 'flashcard-theme',
  DARK_MODE: 'flashcard-dark-mode',
  DATA_SOURCE: 'flashcard-data-source',
  DATA_TYPE: 'flashcard-data-type', // 'url' | 'file'
  CARDS_DATA: 'flashcard-cards-data', // 直接存储卡片数据（文件上传时）
};

const App: React.FC = () => {
  // 状态
  const [cards, setCards] = useState<FlashCardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  
  // 从 localStorage 初始化主题设置
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as ThemeName) || 'blue';
  });
  
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    return saved === 'true';
  });
  
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // 保存主题到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // 保存暗色模式到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDark));
  }, [isDark]);

  // 应用主题
  useEffect(() => {
    const currentTheme = themes[theme];
    document.documentElement.style.cssText = getThemeCSS(currentTheme, isDark);
  }, [theme, isDark]);

  // 首次加载时尝试恢复数据
  useEffect(() => {
    const loadSavedData = async () => {
      setIsLoading(true);
      
      const dataType = localStorage.getItem(STORAGE_KEYS.DATA_TYPE);
      const dataSource = localStorage.getItem(STORAGE_KEYS.DATA_SOURCE);
      
      if (dataType === 'url' && dataSource) {
        // 从 URL 重新获取数据
        try {
          const response = await fetch(dataSource);
          if (!response.ok) {
            throw new Error('请求失败');
          }
          const data = await response.json() as FlashCardType[];
          
          if (Array.isArray(data) && data.length > 0) {
            // 验证数据格式
            for (const card of data) {
              if (typeof card.题干 !== 'string' || !Array.isArray(card.答案)) {
                throw new Error('数据格式不正确');
              }
            }
            setCards(data);
          }
        } catch {
          // 加载失败，清除保存的数据源
          localStorage.removeItem(STORAGE_KEYS.DATA_SOURCE);
          localStorage.removeItem(STORAGE_KEYS.DATA_TYPE);
        }
      } else if (dataType === 'file') {
        // 从 localStorage 读取保存的卡片数据
        const savedCards = localStorage.getItem(STORAGE_KEYS.CARDS_DATA);
        if (savedCards) {
          try {
            const data = JSON.parse(savedCards) as FlashCardType[];
            if (Array.isArray(data) && data.length > 0) {
              setCards(data);
            }
          } catch {
            // 解析失败，清除保存的数据
            localStorage.removeItem(STORAGE_KEYS.CARDS_DATA);
            localStorage.removeItem(STORAGE_KEYS.DATA_TYPE);
          }
        }
      }
      
      setIsLoading(false);
    };
    
    loadSavedData();
  }, []);

  // 导航函数
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setSlideDirection('right');
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setSlideDirection('left');
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, cards.length]);

  // 动画结束后清除方向状态
  const handleAnimationEnd = useCallback(() => {
    setSlideDirection(null);
  }, []);

  const toggleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  // 随机打乱卡片
  const shuffleCards = useCallback(() => {
    if (cards.length <= 1) return;
    
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setCards(shuffled);
    setIsFlipped(false);
  }, [cards]);

  // 键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果没有卡片，不处理
      if (cards.length === 0) return;

      // 如果焦点在输入框，不处理
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          toggleFlip();
          break;
        // 上下键不阻止默认行为，让内容可以滚动
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards.length, goToPrevious, goToNext, toggleFlip]);

  // 处理导入
  const handleImport = (importedCards: FlashCardType[], source?: { type: 'url' | 'file'; url?: string }) => {
    setCards(importedCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    // 保存数据源信息
    if (source?.type === 'url' && source.url) {
      localStorage.setItem(STORAGE_KEYS.DATA_TYPE, 'url');
      localStorage.setItem(STORAGE_KEYS.DATA_SOURCE, source.url);
      localStorage.removeItem(STORAGE_KEYS.CARDS_DATA);
    } else if (source?.type === 'file') {
      localStorage.setItem(STORAGE_KEYS.DATA_TYPE, 'file');
      localStorage.setItem(STORAGE_KEYS.CARDS_DATA, JSON.stringify(importedCards));
      localStorage.removeItem(STORAGE_KEYS.DATA_SOURCE);
    }
  };

  // 从编辑器导入卡片
  const handleEditorImport = (importedCards: FlashCardType[]) => {
    setCards(importedCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowEditor(false);
    
    // 保存为 file 类型
    localStorage.setItem(STORAGE_KEYS.DATA_TYPE, 'file');
    localStorage.setItem(STORAGE_KEYS.CARDS_DATA, JSON.stringify(importedCards));
    localStorage.removeItem(STORAGE_KEYS.DATA_SOURCE);
  };

  // 重新导入
  const handleReimport = () => {
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    // 清除保存的数据
    localStorage.removeItem(STORAGE_KEYS.DATA_SOURCE);
    localStorage.removeItem(STORAGE_KEYS.DATA_TYPE);
    localStorage.removeItem(STORAGE_KEYS.CARDS_DATA);
  };

  // 加载中显示
  if (isLoading) {
    return (
      <div className="app-container">
        <div className="main-content">
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>正在加载...</span>
          </div>
        </div>
      </div>
    );
  }

  // 显示编辑器页面
  if (showEditor) {
    return (
      <div className="app-container">
        <CardEditor 
          onBack={() => setShowEditor(false)} 
          onImport={handleEditorImport}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 头部 */}
      <header className="header">
        <div className="logo" onClick={handleReimport} style={{ cursor: 'pointer' }} title="重新导入">
          <svg className="logo-icon" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-secondary)" />
              </linearGradient>
              <linearGradient id="cardGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-accent)" />
                <stop offset="100%" stopColor="var(--color-contrast)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect x="8" y="12" width="65" height="48" rx="10" fill="url(#cardGrad2)" opacity="0.5" filter="url(#glow)"/>
            <rect x="18" y="22" width="65" height="48" rx="10" fill="url(#cardGrad1)" opacity="0.7"/>
            <rect x="13" y="32" width="65" height="48" rx="10" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            <circle cx="30" cy="50" r="4" fill="var(--color-primary)"/>
            <line x1="42" y1="50" x2="68" y2="50" stroke="var(--color-text-light)" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="30" cy="62" r="4" fill="var(--color-accent)"/>
            <line x1="42" y1="62" x2="60" y2="62" stroke="var(--color-text-light)" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <h1>漫记卡</h1>
        </div>
        <button 
          className="help-btn" 
          onClick={() => setShowHelp(true)}
          title="创建卡片"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r="0.5" fill="currentColor" />
          </svg>
        </button>
        <button 
          className="editor-btn" 
          onClick={() => setShowEditor(true)}
          title="题目配置"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>
        <ThemeSelector 
          currentTheme={theme} 
          onThemeChange={setTheme}
          isDark={isDark}
          onDarkModeToggle={() => setIsDark(!isDark)}
        />
      </header>

      {/* 主内容 */}
      <main className="main-content">
        {cards.length === 0 ? (
          // 导入区域
          <ImportSection onImport={handleImport} />
        ) : (
          // 卡片区域
          <div className="card-section">
            <FlashCard
              card={cards[currentIndex]}
              isFlipped={isFlipped}
              onFlip={toggleFlip}
              slideDirection={slideDirection}
              onAnimationEnd={handleAnimationEnd}
              isLast={currentIndex === cards.length - 1}
            />
            <Navigation
              currentIndex={currentIndex}
              totalCards={cards.length}
              onPrevious={goToPrevious}
              onNext={goToNext}
              onShuffle={shuffleCards}
            />
            <button className="reimport-btn" onClick={handleReimport}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              重新导入
            </button>
          </div>
        )}
      </main>

      {/* 帮助弹窗 */}
      {showHelp && (
        <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-modal-header">
              <h3>📝 创建卡片</h3>
              <button className="help-modal-close" onClick={() => setShowHelp(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="help-modal-content">
              <p>闪卡数据使用 JSON 格式，支持<strong> 问答题</strong>、<strong>填空题 </strong>和<strong> 判断题 </strong>三种类型：</p>
              
              <h4>📚 问答题</h4>
              <pre>{`{
  "题干": "什么是 React？",
  "答案": ["React 是一个用于构建用户界面的 JavaScript 库..."]
}`}</pre>

              <h4>✏️ 填空题</h4>
              <p>使用 <code>$$答案$$</code> 标记填空位置，答案数组按顺序对应：</p>
              <pre>{`{
  "题干": "React 由 $$答案$$ 公司开发，首次发布于 $$答案$$ 年。",
  "答案": ["Meta (Facebook)", "2013"]
}`}</pre>

              <h4>✅ 判断题</h4>
              <p>答案只能是 <code>"正确"</code> 或 <code>"错误"</code>：</p>
              <pre>{`{
  "题干": "React 是由 Google 公司开发的。",
  "答案": ["错误"]
}`}</pre>

              <h4>📄 完整示例</h4>
              <pre>{`[
  {
    "题干": "Vue.js 的作者是谁？",
    "答案": ["尤雨溪（Evan You）"]
  },
  {
    "题干": "JavaScript 中，$$答案$$ 用于声明常量。",
    "答案": ["const"]
  },
  {
    "题干": "JavaScript 是一种强类型语言。",
    "答案": ["错误"]
  }
]`}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
