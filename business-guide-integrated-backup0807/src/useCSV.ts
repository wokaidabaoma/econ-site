import { useEffect, useState, useCallback } from 'react';
import Papa from 'papaparse';
import { 
  sanitizeCSVData, 
  getBackupCSVUrls, 
  delay, 
  checkBrowserCompatibility,
  getBrowserInfo,
  isSafari
} from './utils/csvHelper';

// 定义解析结果的结构
interface PapaParseResult {
  data: any[];
  errors: any[];
  meta: any;
}

// 定义返回的数据结构
interface CSVState {
  data: any[];
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export function useCSV(csvUrl: string) {
  const [state, setState] = useState<CSVState>({
    data: [],
    loading: true,
    error: null,
    retryCount: 0
  });

  const loadCSV = useCallback(async (url: string, retryCount: number = 0) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    // 检查浏览器兼容性
    if (!checkBrowserCompatibility()) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: `您的浏览器版本过低，建议升级浏览器或使用 Chrome/Firefox/Safari 最新版本`,
        retryCount: retryCount
      }));
      return;
    }
    
    const browserInfo = getBrowserInfo();
    const safariMode = isSafari();
    
    try {
      // 获取备用 URLs
      const urls = getBackupCSVUrls(url);
      let lastError: any = null;
      let successfulLoad = false;

      for (let i = 0; i < urls.length && !successfulLoad; i++) {
        const tryUrl = urls[i];
        
        try {
          // 对于 Safari，添加额外的延迟
          if (safariMode && i > 0) {
            await delay(1000 * i);
          }
          
          const currentData = await new Promise<any[]>((resolve, reject) => {
            // 设置超时 - Safari 需要更长时间
            const timeoutDuration = safariMode ? 15000 : 10000;
            const timeoutId = setTimeout(() => {
              reject(new Error(`请求超时 (${timeoutDuration / 1000}秒)`));
            }, timeoutDuration);

            Papa.parse(tryUrl, {
              download: true,
              header: true,
              skipEmptyLines: true,
              dynamicTyping: false, // 保持所有数据为字符串，避免类型转换问题
              encoding: 'UTF-8',
              worker: false, // 禁用 Web Worker，提高兼容性
              complete: (results: PapaParseResult) => {
                clearTimeout(timeoutId);
                
                console.log(`🔍 尝试 URL ${i + 1}/${urls.length}: ${tryUrl}`);
                
                // 验证数据完整性
                if (results.errors && results.errors.length > 0) {
                  console.warn('CSV 解析警告:', results.errors);
                  
                  // 如果有严重错误，跳过这个 URL
                  const hasSerious = results.errors.some(err => 
                    err.type === 'Delimiter' || err.type === 'Quotes'
                  );
                  if (hasSerious) {
                    reject(new Error('CSV 格式错误'));
                    return;
                  }
                }
                
                if (results.data && results.data.length > 0) {
                  // 使用工具函数清理数据
                  const validData = sanitizeCSVData(results.data);
                  
                  if (validData.length > 0) {
                    console.log(`✅ CSV 加载成功 (${browserInfo}):`, validData.length, '条记录');
                    console.log('📊 数据示例:', validData[0]);
                    
                    resolve(validData);
                    return;
                  }
                }
                
                reject(new Error('CSV 数据为空或格式错误'));
              },
              error: (error: any) => {
                clearTimeout(timeoutId);
                console.error('CSV 解析错误:', error);
                reject(error);
              }
            });
          });
          
          // 如果成功获取数据，设置状态并标记成功
          if (currentData && currentData.length > 0) {
            setState({
              data: currentData,
              loading: false,
              error: null,
              retryCount: 0
            });
            successfulLoad = true;
            break;
          }
          
        } catch (error) {
          lastError = error;
          console.warn(`❌ URL ${i + 1}/${urls.length} 失败:`, error);
          
          // 如果不是最后一个 URL，继续尝试
          if (i < urls.length - 1) {
            await delay(500); // 短暂延迟后尝试下一个
          }
        }
      }
      
      // 如果所有 URL 都失败了
      if (!successfulLoad) {
        throw lastError || new Error('所有数据源都无法访问');
      }
      
    } catch (error: any) {
      console.error('❌ CSV 加载失败 (浏览器: ' + browserInfo + '):', error);
      
      // 重试逻辑 - 最多重试 3 次
      if (retryCount < 3) {
        const nextRetryDelay = safariMode ? 2000 * (retryCount + 1) : 1000 * (retryCount + 1);
        console.log(`🔄 正在重试... (${retryCount + 1}/3) [${browserInfo}]`);
        
        setTimeout(() => {
          loadCSV(url, retryCount + 1);
        }, nextRetryDelay);
        
        setState(prev => ({ 
          ...prev, 
          loading: true, 
          error: `加载中... (重试 ${retryCount + 1}/3)`,
          retryCount: retryCount + 1
        }));
      } else {
        const errorMessage = safariMode 
          ? '数据加载失败。Safari 用户请确保未开启"阻止跨站跟踪"功能，或尝试使用 Chrome 浏览器'
          : '数据加载失败，请检查网络连接或稍后重试';
          
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          retryCount: retryCount
        }));
      }
    }
  }, []);

  // 提供手动重试函数
  const retry = useCallback(() => {
    loadCSV(csvUrl, 0);
  }, [csvUrl, loadCSV]);

  useEffect(() => {
    if (csvUrl) {
      loadCSV(csvUrl);
    }
  }, [csvUrl, loadCSV]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    retry
  };
}
