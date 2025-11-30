import React, { useState, useRef } from 'react';
import { FlashCard, HistoryRecord } from '../types';

interface ImportSectionProps {
  onImport: (cards: FlashCard[], source?: { type: 'url' | 'file'; url?: string; name?: string }) => void;
  history?: HistoryRecord[];
  onLoadHistory?: (record: HistoryRecord) => void;
  onDeleteHistory?: (id: string) => void;
}

// 获取网站 favicon URL
const getFaviconUrl = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
};

// Favicon 组件，加载失败时显示默认图标
const FaviconIcon: React.FC<{ url: string }> = ({ url }) => {
  const [hasError, setHasError] = useState(false);
  const faviconUrl = getFaviconUrl(url);

  if (hasError || !faviconUrl) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    );
  }

  return (
    <img 
      src={faviconUrl} 
      alt="favicon"
      className="history-favicon"
      onError={() => setHasError(true)}
    />
  );
};

const ImportSection: React.FC<ImportSectionProps> = ({ 
  onImport, 
  history = [], 
  onLoadHistory,
  onDeleteHistory 
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as FlashCard[];
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('JSON 格式不正确，需要一个非空数组');
      }

      // 验证数据格式
      for (const card of data) {
        if (typeof card.题干 !== 'string' || !Array.isArray(card.答案)) {
          throw new Error('闪卡格式不正确，每张卡片需要包含"题干"和"答案"字段');
        }
      }

      // 获取文件名（去掉扩展名）
      const fileName = file.name.replace(/\.json$/i, '') || '本地文件';
      onImport(data, { type: 'file', name: fileName });
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件解析失败');
    } finally {
      setLoading(false);
      // 重置文件输入以允许重新选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 处理 URL 获取
  const handleFetchUrl = async () => {
    if (!url.trim()) return;

    setError(null);
    setLoading(true);

    const targetUrl = url.trim();

    try {
      let response: Response;
      let usedProxy = false;

      // 首先尝试直接请求
      try {
        response = await fetch(targetUrl);
      } catch (fetchError) {
        // 如果直接请求失败（可能是 CORS 问题），尝试使用代理
        console.log('直接请求失败，尝试使用 CORS 代理...');
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        response = await fetch(proxyUrl);
        usedProxy = true;
      }

      if (!response.ok) {
        if (response.status === 0 || response.type === 'opaque') {
          throw new Error('跨域请求被阻止，请确保服务器允许跨域访问，或下载文件后使用本地导入');
        }
        throw new Error(`请求失败: ${response.status}`);
      }

      const data = await response.json() as FlashCard[];
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('JSON 格式不正确，需要一个非空数组');
      }

      // 验证数据格式
      for (const card of data) {
        if (typeof card.题干 !== 'string' || !Array.isArray(card.答案)) {
          throw new Error('闪卡格式不正确，每张卡片需要包含"题干"和"答案"字段');
        }
      }

      // 保存原始 URL（不是代理 URL）
      onImport(data, { type: 'url', url: targetUrl });
      
      if (usedProxy) {
        console.log('通过 CORS 代理成功获取数据');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'URL 获取失败';
      // 检查是否是网络/CORS 错误
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError('网络请求失败，可能是跨域限制。建议：下载 JSON 文件后使用「选择 JSON 文件」导入');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
    
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="import-section">
      <h2>导入闪卡数据</h2>
      
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>正在加载...</span>
        </div>
      ) : (
        <div className="import-options">
          {/* 文件上传 */}
          <div className="file-input-wrapper">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="file-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="file-input-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              选择 JSON 文件
            </label>
          </div>

          <div className="divider">或</div>

          {/* URL 输入 */}
          <div className="url-input-group">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="输入 JSON 文件 URL"
              className="url-input"
              onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
            />
            <button
              onClick={handleFetchUrl}
              disabled={!url.trim()}
              className="fetch-btn"
            >
              获取
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {/* 历史记录 */}
      {history.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>历史记录</span>
          </div>
          <div className="history-list">
            {history.map((record) => (
              <div key={record.id} className="history-item">
                <div 
                  className="history-item-content"
                  onClick={() => onLoadHistory?.(record)}
                >
                  <div className="history-item-icon">
                    {record.type === 'url' && record.url ? (
                      <FaviconIcon url={record.url} />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                  </div>
                  <div className="history-item-info">
                    <div className="history-item-name">{record.name}</div>
                    <div className="history-item-meta">
                      <span>{record.cardCount} 张卡片</span>
                      <span>·</span>
                      <span>{formatTime(record.lastAccess)}</span>
                    </div>
                  </div>
                </div>
                <button 
                  className="history-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteHistory?.(record.id);
                  }}
                  title="删除"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportSection;
