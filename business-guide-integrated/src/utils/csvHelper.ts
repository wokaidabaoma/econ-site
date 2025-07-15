// CSV 数据处理工具函数
export const sanitizeCSVData = (data: any[]): any[] => {
  if (!Array.isArray(data)) {
    console.warn('CSV 数据不是数组格式');
    return [];
  }

  return data.filter(row => {
    // 过滤掉空行或无效数据
    if (!row || typeof row !== 'object') {
      return false;
    }

    // 检查是否有至少一个有效的字段
    const hasValidData = Object.values(row).some(value => 
      value !== null && 
      value !== undefined && 
      value !== '' && 
      value !== 'undefined' &&
      String(value).trim() !== ''
    );

    return hasValidData;
  });
};

// 清理字符串值
export const cleanStringValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  return String(value).trim();
};

// 检查浏览器兼容性
export const checkBrowserCompatibility = (): boolean => {
  // 检查必需的 API 是否存在
  const requiredAPIs = [
    'fetch',
    'Promise',
    'Array.from',
    'Set',
    'Map',
    'Object.keys',
    'Object.values'
  ];

  for (const api of requiredAPIs) {
    if (typeof window !== 'undefined') {
      const parts = api.split('.');
      let current: any = window;
      
      for (const part of parts) {
        if (current[part] === undefined) {
          console.warn(`浏览器不支持 ${api}`);
          return false;
        }
        current = current[part];
      }
    }
  }

  return true;
};

// 获取备用 CSV URLs
export const getBackupCSVUrls = (originalUrl: string): string[] => {
  const baseUrl = originalUrl.split('?')[0];
  
  return [
    originalUrl,
    `${baseUrl}?format=csv&single=true&output=csv`,
    `${baseUrl}?format=csv&gid=0`,
    `${baseUrl}?format=csv&exportFormat=csv`,
    originalUrl.replace('export?format=csv', 'export?format=csv&single=true'),
    originalUrl + '&timestamp=' + Date.now() // 防止缓存
  ];
};

// 延迟函数
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 检测是否为移动设备
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// 检测 Safari 浏览器
export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

// 获取浏览器信息
export const getBrowserInfo = (): string => {
  if (typeof window === 'undefined') return 'Unknown';
  
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  
  if (userAgent.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
  } else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari';
  } else if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
  } else if (userAgent.indexOf('Edge') > -1) {
    browserName = 'Edge';
  }
  
  return browserName;
};