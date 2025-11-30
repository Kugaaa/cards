import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FlashCard as FlashCardType } from '../types';

interface CardEditorProps {
  onBack: () => void;
  onImport: (cards: FlashCardType[]) => void;
}

interface EditingCard {
  id: string;
  题干: string;
  答案: string[];
  type: 'qa' | 'fill' | 'judge';
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// 填空编辑器组件
interface FillBlankEditorProps {
  value: string;
  onChange: (value: string) => void;
  onInsertBlank: () => void;
}

const FillBlankEditor: React.FC<FillBlankEditorProps> = ({ value, onChange, onInsertBlank }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const historyRef = useRef<string[]>([value]);
  const historyIndexRef = useRef(0);
  const isUndoRedoRef = useRef(false);

  // 将文本转换为带有填空标签的 HTML
  const textToHtml = (text: string): string => {
    const parts = text.split(/(\$\$答案\$\$)/g);
    return parts.map(part => {
      if (part === '$$答案$$') {
        return '<span class="blank-tag" contenteditable="false" data-blank="true">填空</span>';
      }
      return part.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    }).join('');
  };

  // 将 HTML 转换回文本
  const htmlToText = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    let result = '';
    const walkNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.dataset.blank === 'true') {
          result += '$$答案$$';
        } else if (el.tagName === 'BR') {
          result += '\n';
        } else if (el.tagName === 'DIV' && result.length > 0 && !result.endsWith('\n')) {
          result += '\n';
          el.childNodes.forEach(walkNodes);
        } else {
          el.childNodes.forEach(walkNodes);
        }
      }
    };
    temp.childNodes.forEach(walkNodes);
    return result;
  };

  // 同步编辑器内容
  const syncEditorContent = useCallback((text: string, moveCursorToEnd = true) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    const hadFocus = document.activeElement === editorRef.current;
    
    editorRef.current.innerHTML = textToHtml(text);
    
    if (hadFocus && selection && moveCursorToEnd) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, []);

  // 添加到历史记录
  const pushHistory = useCallback((text: string) => {
    if (isUndoRedoRef.current) return;
    
    // 如果当前不在历史末尾，删除后面的记录
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    
    // 避免重复添加相同内容
    if (historyRef.current[historyRef.current.length - 1] !== text) {
      historyRef.current.push(text);
      historyIndexRef.current = historyRef.current.length - 1;
      
      // 限制历史记录长度
      if (historyRef.current.length > 100) {
        historyRef.current.shift();
        historyIndexRef.current--;
      }
    }
  }, []);

  // 撤回
  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      isUndoRedoRef.current = true;
      historyIndexRef.current--;
      const text = historyRef.current[historyIndexRef.current];
      syncEditorContent(text);
      onChange(text);
      setTimeout(() => { isUndoRedoRef.current = false; }, 0);
    }
  }, [onChange, syncEditorContent]);

  // 重做
  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoRef.current = true;
      historyIndexRef.current++;
      const text = historyRef.current[historyIndexRef.current];
      syncEditorContent(text);
      onChange(text);
      setTimeout(() => { isUndoRedoRef.current = false; }, 0);
    }
  }, [onChange, syncEditorContent]);

  // 初始化和外部更新编辑器内容
  useEffect(() => {
    if (editorRef.current && !isUndoRedoRef.current) {
      const currentText = htmlToText(editorRef.current.innerHTML);
      if (currentText !== value) {
        syncEditorContent(value);
      }
    }
  }, [value, syncEditorContent]);

  // 处理输入
  const handleInput = useCallback(() => {
    if (isComposingRef.current || isUndoRedoRef.current) return;
    
    if (editorRef.current) {
      const newText = htmlToText(editorRef.current.innerHTML);
      if (newText !== value) {
        pushHistory(newText);
        onChange(newText);
      }
    }
  }, [value, onChange, pushHistory]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    // 拦截撤回：Ctrl+Z / Cmd+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }

    // 拦截重做：Ctrl+Y / Cmd+Shift+Z / Ctrl+Shift+Z
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
      return;
    }

    // 处理 Backspace 删除填空标签
    if (e.key === 'Backspace') {
      const range = selection.getRangeAt(0);
      
      if (range.collapsed) {
        const container = range.startContainer;
        const offset = range.startOffset;
        
        if (container.nodeType === Node.TEXT_NODE && offset === 0) {
          const prevSibling = container.previousSibling;
          if (prevSibling && (prevSibling as HTMLElement).dataset?.blank === 'true') {
            e.preventDefault();
            prevSibling.parentNode?.removeChild(prevSibling);
            handleInput();
            return;
          }
        }
        
        if (container.nodeType === Node.ELEMENT_NODE && offset > 0) {
          const prevChild = container.childNodes[offset - 1];
          if (prevChild && (prevChild as HTMLElement).dataset?.blank === 'true') {
            e.preventDefault();
            prevChild.parentNode?.removeChild(prevChild);
            handleInput();
            return;
          }
        }
      }
    }

    // 处理 Delete 删除填空标签
    if (e.key === 'Delete') {
      const range = selection.getRangeAt(0);
      
      if (range.collapsed) {
        const container = range.startContainer;
        const offset = range.startOffset;
        
        if (container.nodeType === Node.ELEMENT_NODE) {
          const nextChild = container.childNodes[offset];
          if (nextChild && (nextChild as HTMLElement).dataset?.blank === 'true') {
            e.preventDefault();
            nextChild.parentNode?.removeChild(nextChild);
            handleInput();
            return;
          }
        }
        
        if (container.nodeType === Node.TEXT_NODE && offset === container.textContent?.length) {
          const nextSibling = container.nextSibling;
          if (nextSibling && (nextSibling as HTMLElement).dataset?.blank === 'true') {
            e.preventDefault();
            nextSibling.parentNode?.removeChild(nextSibling);
            handleInput();
            return;
          }
        }
      }
    }
  }, [handleInput, undo, redo]);

  // 处理粘贴 - 只粘贴纯文本
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // 插入填空标签
  const insertBlank = useCallback(() => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    const selection = window.getSelection();
    if (!selection) return;

    const blankTag = document.createElement('span');
    blankTag.className = 'blank-tag';
    blankTag.contentEditable = 'false';
    blankTag.dataset.blank = 'true';
    blankTag.textContent = '填空';

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(blankTag);

    range.setStartAfter(blankTag);
    range.setEndAfter(blankTag);
    selection.removeAllRanges();
    selection.addRange(range);

    handleInput();
    onInsertBlank();
  }, [handleInput, onInsertBlank]);

  return (
    <div className="fill-blank-editor-wrapper">
      <div
        ref={editorRef}
        className="fill-blank-editor"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onCompositionStart={() => { isComposingRef.current = true; }}
        onCompositionEnd={() => { 
          isComposingRef.current = false; 
          handleInput(); 
        }}
        data-placeholder="输入题干，点击下方按钮插入填空..."
        suppressContentEditableWarning
      />
      <button 
        type="button"
        className="insert-blank-btn"
        onClick={insertBlank}
        title="插入填空"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="11" width="18" height="2" rx="1" />
        </svg>
        插入填空
      </button>
    </div>
  );
};

const detectCardType = (question: string, answers: string[]): 'qa' | 'fill' | 'judge' => {
  if (question.includes('$$答案$$')) {
    return 'fill';
  }
  if (answers.length === 1 && (answers[0] === '正确' || answers[0] === '错误')) {
    return 'judge';
  }
  return 'qa';
};

const CardEditor: React.FC<CardEditorProps> = ({ onBack, onImport }) => {
  const [cards, setCards] = useState<EditingCard[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswers, setCurrentAnswers] = useState<string[]>(['']);
  const [currentType, setCurrentType] = useState<'qa' | 'fill' | 'judge'>('qa');
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // 添加新卡片
  const handleAddCard = useCallback(() => {
    if (!currentQuestion.trim()) return;
    
    // 验证填空题答案数量
    if (currentType === 'fill') {
      const blankCount = (currentQuestion.match(/\$\$答案\$\$/g) || []).length;
      if (blankCount !== currentAnswers.filter(a => a.trim()).length) {
        alert(`填空数量 (${blankCount}) 与答案数量 (${currentAnswers.filter(a => a.trim()).length}) 不匹配`);
        return;
      }
    }

    const validAnswers = currentType === 'judge' 
      ? [currentAnswers[0] || '正确']
      : currentAnswers.filter(a => a.trim());

    if (validAnswers.length === 0) {
      alert('请至少填写一个答案');
      return;
    }

    if (editingId) {
      // 更新现有卡片
      setCards(prev => prev.map(card => 
        card.id === editingId 
          ? { ...card, 题干: currentQuestion.trim(), 答案: validAnswers, type: currentType }
          : card
      ));
      setEditingId(null);
    } else {
      // 添加新卡片
      const newCard: EditingCard = {
        id: generateId(),
        题干: currentQuestion.trim(),
        答案: validAnswers,
        type: currentType,
      };
      setCards(prev => [...prev, newCard]);
    }

    // 重置表单
    setCurrentQuestion('');
    setCurrentAnswers(['']);
    setCurrentType('qa');
  }, [currentQuestion, currentAnswers, currentType, editingId]);

  // 编辑卡片
  const handleEditCard = useCallback((card: EditingCard) => {
    setEditingId(card.id);
    setCurrentQuestion(card.题干);
    setCurrentAnswers(card.答案.length > 0 ? card.答案 : ['']);
    setCurrentType(card.type);
  }, []);

  // 删除卡片
  const handleDeleteCard = useCallback((id: string) => {
    setCards(prev => prev.filter(card => card.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setCurrentQuestion('');
      setCurrentAnswers(['']);
      setCurrentType('qa');
    }
  }, [editingId]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setCurrentQuestion('');
    setCurrentAnswers(['']);
    setCurrentType('qa');
  }, []);

  // 添加答案输入框
  const handleAddAnswer = useCallback(() => {
    setCurrentAnswers(prev => [...prev, '']);
  }, []);

  // 删除答案输入框
  const handleRemoveAnswer = useCallback((index: number) => {
    setCurrentAnswers(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 更新答案
  const handleAnswerChange = useCallback((index: number, value: string) => {
    setCurrentAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[index] = value;
      return newAnswers;
    });
  }, []);

  // 切换题型
  const handleTypeChange = useCallback((type: 'qa' | 'fill' | 'judge') => {
    setCurrentType(type);
    if (type === 'judge') {
      setCurrentAnswers(['正确']);
    } else if (currentAnswers.length === 1 && (currentAnswers[0] === '正确' || currentAnswers[0] === '错误')) {
      setCurrentAnswers(['']);
    }
  }, [currentAnswers]);

  // 导出 JSON
  const handleExport = useCallback(() => {
    if (cards.length === 0) {
      alert('没有可导出的卡片');
      return;
    }

    const exportData = cards.map(({ 题干, 答案 }) => ({ 题干, 答案 }));
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 2000);
  }, [cards]);

  // 导入到应用
  const handleImportToApp = useCallback(() => {
    if (cards.length === 0) {
      alert('没有可导入的卡片');
      return;
    }
    const importData = cards.map(({ 题干, 答案 }) => ({ 题干, 答案 }));
    onImport(importData);
  }, [cards, onImport]);

  // 导入 JSON 文件
  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          const importedCards: EditingCard[] = data.map(item => ({
            id: generateId(),
            题干: item.题干 || '',
            答案: Array.isArray(item.答案) ? item.答案 : [item.答案 || ''],
            type: detectCardType(item.题干 || '', item.答案 || []),
          })).filter(card => card.题干);
          setCards(prev => [...prev, ...importedCards]);
        }
      } catch {
        alert('JSON 文件格式错误');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // 上移卡片
  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setCards(prev => {
      const newCards = [...prev];
      [newCards[index - 1], newCards[index]] = [newCards[index], newCards[index - 1]];
      return newCards;
    });
  }, []);

  // 下移卡片
  const handleMoveDown = useCallback((index: number) => {
    setCards(prev => {
      if (index >= prev.length - 1) return prev;
      const newCards = [...prev];
      [newCards[index], newCards[index + 1]] = [newCards[index + 1], newCards[index]];
      return newCards;
    });
  }, []);

  return (
    <div className="editor-container">
      {/* 头部 */}
      <div className="editor-header">
        <button className="back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <h2>题目配置</h2>
        <button 
          className="editor-help-btn" 
          onClick={() => setShowHelp(true)}
          title="查看教程"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r="0.5" fill="currentColor" />
          </svg>
        </button>
        <div className="editor-actions">
          <label className="import-json-btn">
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            导入
          </label>
          <button 
            className="export-btn" 
            onClick={handleExport}
            disabled={cards.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出 JSON
          </button>
        </div>
      </div>

      {/* 导出成功提示 */}
      {showExportSuccess && (
        <div className="export-success-toast">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          导出成功！
        </div>
      )}

      <div className="editor-content">
        {/* 编辑表单 */}
        <div className="editor-form">
          <h3>{editingId ? '编辑题目' : '添加新题目'}</h3>
          
          {/* 题型选择 */}
          <div className="type-selector">
            <button 
              className={`type-btn ${currentType === 'qa' ? 'active' : ''}`}
              onClick={() => handleTypeChange('qa')}
            >
              📚 问答题
            </button>
            <button 
              className={`type-btn ${currentType === 'fill' ? 'active' : ''}`}
              onClick={() => handleTypeChange('fill')}
            >
              ✏️ 填空题
            </button>
            <button 
              className={`type-btn ${currentType === 'judge' ? 'active' : ''}`}
              onClick={() => handleTypeChange('judge')}
            >
              ✅ 判断题
            </button>
          </div>

          {/* 题干输入 */}
          <div className="form-group">
            <label>题干</label>
            {currentType === 'fill' ? (
              <FillBlankEditor
                value={currentQuestion}
                onChange={setCurrentQuestion}
                onInsertBlank={() => {}}
              />
            ) : (
              <div className="question-input-wrapper">
                <textarea
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder="输入题目内容..."
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* 答案输入 */}
          <div className="form-group">
            <label>答案</label>
            {currentType === 'judge' ? (
              <div className="judge-options">
                <button
                  className={`judge-btn ${currentAnswers[0] === '正确' ? 'active correct' : ''}`}
                  onClick={() => setCurrentAnswers(['正确'])}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  正确
                </button>
                <button
                  className={`judge-btn ${currentAnswers[0] === '错误' ? 'active incorrect' : ''}`}
                  onClick={() => setCurrentAnswers(['错误'])}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  错误
                </button>
              </div>
            ) : (
              <div className="answers-list">
                {currentAnswers.map((answer, index) => (
                  <div key={index} className="answer-input-row">
                    <span className="answer-index">{index + 1}</span>
                    <textarea
                      value={answer}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder={currentType === 'fill' ? `第 ${index + 1} 个空的答案` : '输入答案...'}
                      rows={2}
                    />
                    {currentAnswers.length > 1 && (
                      <button
                        className="remove-answer-btn"
                        onClick={() => handleRemoveAnswer(index)}
                        title="删除此答案"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button className="add-answer-btn" onClick={handleAddAnswer}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  添加答案
                </button>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="form-actions">
            {editingId && (
              <button className="cancel-btn" onClick={handleCancelEdit}>
                取消
              </button>
            )}
            <button 
              className="submit-btn"
              onClick={handleAddCard}
              disabled={!currentQuestion.trim()}
            >
              {editingId ? '保存修改' : '添加题目'}
            </button>
          </div>
        </div>

        {/* 卡片列表 */}
        <div className="cards-list-section">
          <div className="cards-list-header">
            <h3>题目列表 ({cards.length})</h3>
            {cards.length > 0 && (
              <button 
                className="use-cards-btn"
                onClick={handleImportToApp}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                开始练习
              </button>
            )}
          </div>
          
          {cards.length === 0 ? (
            <div className="empty-list">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <p>暂无题目，开始添加吧</p>
            </div>
          ) : (
            <div className="cards-list">
              {cards.map((card, index) => (
                <div 
                  key={card.id} 
                  className={`card-item ${editingId === card.id ? 'editing' : ''}`}
                >
                  <div className="card-item-header">
                    <span className="card-number">#{index + 1}</span>
                    <span className={`card-type-badge ${card.type}`}>
                      {card.type === 'qa' && '📚 问答'}
                      {card.type === 'fill' && '✏️ 填空'}
                      {card.type === 'judge' && '✅ 判断'}
                    </span>
                  </div>
                  <div className="card-item-content">
                    <div className="card-question">{card.题干}</div>
                    <div className="card-answers">
                      {card.答案.map((ans, i) => (
                        <span key={i} className="card-answer-tag">
                          {card.type === 'judge' ? (
                            ans === '正确' ? '✓ 正确' : '✗ 错误'
                          ) : (
                            <>答案{card.答案.length > 1 ? i + 1 : ''}：{ans.length > 30 ? ans.slice(0, 30) + '...' : ans}</>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="card-item-actions">
                    <button 
                      className="card-action-btn move"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      title="上移"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </button>
                    <button 
                      className="card-action-btn move"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === cards.length - 1}
                      title="下移"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <button 
                      className="card-action-btn edit"
                      onClick={() => handleEditCard(card)}
                      title="编辑"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button 
                      className="card-action-btn delete"
                      onClick={() => handleDeleteCard(card.id)}
                      title="删除"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 帮助弹窗 */}
      {showHelp && (
        <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-modal-header">
              <h3>📝 创建卡片教程</h3>
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

export default CardEditor;

