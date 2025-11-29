import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FlashCard as FlashCardType } from '../types';

interface FlashCardProps {
  card: FlashCardType;
  isFlipped: boolean;
  onFlip: () => void;
  slideDirection: 'left' | 'right' | null;
  onAnimationEnd: () => void;
  isLast: boolean;
}

const FlashCard: React.FC<FlashCardProps> = ({ card, isFlipped, onFlip, slideDirection, onAnimationEnd, isLast }) => {
  // 检查是否为填空题（包含 $$答案$$ 标记）
  const isFillInBlank = card.题干.includes('$$答案$$');
  
  // 检查是否为判断题（答案只有一个且为"正确"或"错误"）
  const isJudgment = !isFillInBlank && 
    card.答案.length === 1 && 
    (card.答案[0] === '正确' || card.答案[0] === '错误');
  
  // 判断题的答案是否正确
  const isCorrect = isJudgment && card.答案[0] === '正确';

  // 处理正面内容（显示下划线）
  const frontContent = useMemo(() => {
    if (!isFillInBlank) {
      return null;
    }

    const parts: (string | React.ReactNode)[] = [];
    let remaining = card.题干;
    let answerIndex = 0;
    let keyIndex = 0;

    while (remaining.includes('$$答案$$') && answerIndex < card.答案.length) {
      const index = remaining.indexOf('$$答案$$');
      // 添加答案标记前的文本
      if (index > 0) {
        parts.push(remaining.substring(0, index));
      }
      // 添加下划线占位符
      parts.push(
        <span key={keyIndex++} className="blank-space"></span>
      );
      remaining = remaining.substring(index + 6); // $$答案$$ 长度为 6
      answerIndex++;
    }
    // 添加剩余文本
    if (remaining) {
      parts.push(remaining);
    }

    return parts;
  }, [card, isFillInBlank]);

  // 处理背面内容（显示答案）
  const backContent = useMemo(() => {
    if (!isFillInBlank) {
      return null;
    }

    const parts: (string | React.ReactNode)[] = [];
    let remaining = card.题干;
    let answerIndex = 0;
    let keyIndex = 0;

    while (remaining.includes('$$答案$$') && answerIndex < card.答案.length) {
      const index = remaining.indexOf('$$答案$$');
      // 添加答案标记前的文本
      if (index > 0) {
        parts.push(remaining.substring(0, index));
      }
      // 添加答案
      parts.push(
        <span key={keyIndex++} className="blank-space revealed">
          {card.答案[answerIndex]}
        </span>
      );
      remaining = remaining.substring(index + 6);
      answerIndex++;
    }
    // 添加剩余文本
    if (remaining) {
      parts.push(remaining);
    }

    return parts;
  }, [card, isFillInBlank]);

  // 渲染填空题内容
  const renderFillInBlank = (content: (string | React.ReactNode)[] | null) => {
    if (!content) return null;
    return (
      <div className="card-content card-content--fill">
        <div className="fill-blank-content">{content}</div>
      </div>
    );
  };

  // 渲染问答题内容
  const renderQuestion = () => {
    return (
      <div className="card-content card-content--center">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {card.题干}
        </ReactMarkdown>
      </div>
    );
  };

  // 渲染答案（问答题，答案只有一个元素）
  const renderAnswer = () => {
    return (
      <div className="card-content card-content--answer">
        <div className="answer-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {card.答案[0]}
          </ReactMarkdown>
        </div>
      </div>
    );
  };

  // 渲染判断题答案（对勾或叉号）
  const renderJudgmentAnswer = () => {
    return (
      <div className="card-content card-content--center">
        <div className={`judgment-result ${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          <span>{isCorrect ? '正确' : '错误'}</span>
        </div>
      </div>
    );
  };

  const slideClass = slideDirection ? `slide-in-${slideDirection}` : '';
  const stackClass = isLast ? '' : 'has-next';
  
  // 在滑入动画期间，强制显示正面，防止答案泄露
  const shouldFlip = slideDirection ? false : isFlipped;

  // 获取题目类型标签
  const getCardLabel = () => {
    if (isFillInBlank) {
      return (
        <>
          <svg className="card-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
          填空
        </>
      );
    }
    if (isJudgment) {
      return (
        <>
          <svg className="card-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          判断
        </>
      );
    }
    return (
      <>
        <svg className="card-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" />
        </svg>
        问答
      </>
    );
  };

  // 渲染正面内容
  const renderFrontContent = () => {
    if (isFillInBlank) {
      return renderFillInBlank(frontContent);
    }
    // 判断题和问答题正面都显示题干
    return renderQuestion();
  };

  // 渲染背面内容
  const renderBackContent = () => {
    if (isFillInBlank) {
      return renderFillInBlank(backContent);
    }
    if (isJudgment) {
      return renderJudgmentAnswer();
    }
    return renderAnswer();
  };

  return (
    <div 
      className={`flashcard-container ${slideClass} ${stackClass}`} 
      onClick={onFlip}
      onAnimationEnd={onAnimationEnd}
    >
      <div className={`flashcard ${shouldFlip ? 'flipped' : ''}`}>
        {/* 正面 - 题干 */}
        <div className="flashcard-face flashcard-front">
          <div className="card-label">
            {getCardLabel()}
          </div>
          {renderFrontContent()}
          <div className="card-hint">点击卡片查看答案</div>
        </div>

        {/* 背面 - 答案 */}
        <div className="flashcard-face flashcard-back">
          <div className="card-label">
            <svg className="card-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
            </svg>
            答案
          </div>
          {renderBackContent()}
          <div className="card-hint">点击卡片返回题目</div>
        </div>
      </div>
    </div>
  );
};

export default FlashCard;
