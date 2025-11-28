import React from 'react';

interface NavigationProps {
  currentIndex: number;
  totalCards: number;
  onPrevious: () => void;
  onNext: () => void;
  onShuffle: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  currentIndex,
  totalCards,
  onPrevious,
  onNext,
  onShuffle,
}) => {
  return (
    <>
      {/* 进度指示器 */}
      <div className="progress-row">
        <div className="progress-indicator">
          <span className="current">{currentIndex + 1}</span>
          <span className="divider-slash">/</span>
          <span>{totalCards}</span>
        </div>
        <button 
          className="shuffle-btn" 
          onClick={onShuffle}
          title="随机打乱"
          aria-label="随机打乱卡片顺序"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3h5v5" />
            <path d="M4 20 21 3" />
            <path d="M21 16v5h-5" />
            <path d="M15 15 21 21" />
            <path d="M4 4l5 5" />
          </svg>
        </button>
      </div>

      {/* 导航按钮 */}
      <div className="navigation">
        <button
          className="nav-btn"
          onClick={onPrevious}
          disabled={currentIndex === 0}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          上一张
        </button>
        <button
          className="nav-btn"
          onClick={onNext}
          disabled={currentIndex === totalCards - 1}
        >
          下一张
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </button>
      </div>

      {/* 键盘提示 */}
      <div className="keyboard-hints">
        <div className="hint-item">
          <span className="kbd">←</span>
          <span>上一张</span>
        </div>
        <div className="hint-item">
          <span className="kbd">→</span>
          <span>下一张</span>
        </div>
        <div className="hint-item">
          <span className="kbd">Space</span>
          <span>翻转</span>
        </div>
      </div>
    </>
  );
};

export default Navigation;
