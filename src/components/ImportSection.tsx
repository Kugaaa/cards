import React, { useState, useRef } from 'react';
import { FlashCard } from '../types';

interface ImportSectionProps {
  onImport: (cards: FlashCard[], source?: { type: 'url' | 'file'; url?: string }) => void;
}

const ImportSection: React.FC<ImportSectionProps> = ({ onImport }) => {
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

      onImport(data, { type: 'file' });
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

    try {
      const response = await fetch(url);
      if (!response.ok) {
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

      onImport(data, { type: 'url', url: url.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'URL 获取失败');
    } finally {
      setLoading(false);
    }
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
    </div>
  );
};

export default ImportSection;
