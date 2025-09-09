import { useState, useEffect } from 'react';

interface UseCSVResult {
  data: any[] | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export const useOptimizedCSV = (url: string): UseCSVResult => {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchCSV = async (attemptNumber = 1) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`开始加载数据 (尝试 ${attemptNumber}/3)...`);

      // 超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      // 构建URL
      const timestamp = Date.now();
      const finalUrl = `${url}&t=${timestamp}&attempt=${attemptNumber}`;
      
      console.log('请求URL:', finalUrl);

      // 发送请求
      const response = await fetch(finalUrl, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const csvText = await response.text();
      console.log('CSV数据长度:', csvText.length);

      if (!csvText || csvText.length < 100) {
        throw new Error('数据为空或过短');
      }

      if (csvText.includes('<html>')) {
        throw new Error('返回了HTML页面，可能是权限问题');
      }

      // 导入并解析CSV
      const Papa = await import('papaparse');
      
      const result = Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => {
          return typeof value === 'string' ? value.trim() : value;
        }
      });

      console.log('CSV解析完成，原始行数:', result.data.length);

      if (result.errors.length > 0) {
        console.warn('解析警告:', result.errors.slice(0, 3));
      }

      // 清理数据
      const cleanData = result.data.filter((item: any) => {
        if (!item || typeof item !== 'object') return false;
        
        return Object.values(item).some(value => 
          value !== null && 
          value !== undefined && 
          String(value).trim() !== ''
        );
      });

      console.log('清理后数据条数:', cleanData.length);
      

      if (cleanData.length === 0) {
        throw new Error('没有有效数据');
      }

      setData(cleanData);
      setError(null);
      console.log('数据加载成功！');

    } catch (err) {
      console.error('加载失败:', err);
      
      let errorMessage = '加载失败';
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = '请求超时';
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = '网络错误';
        } else {
          errorMessage = err.message;
        }
      }

      if (attemptNumber < 3) {
        const delay = 3000 * attemptNumber;
        console.log(`${delay/1000}秒后重试...`);
        setTimeout(() => fetchCSV(attemptNumber + 1), delay);
        setError(`${errorMessage} (重试中 ${attemptNumber}/3)`);
      } else {
        setError(`${errorMessage} - 请刷新页面重试`);
      }
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    fetchCSV(1);
  }, [url, retryCount]);

  return { data, loading, error, retry };
};