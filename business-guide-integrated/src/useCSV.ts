import { useEffect, useState } from 'react';
import Papa from 'papaparse';

// 定义解析结果的结构（你也可以自定义具体字段）
interface PapaParseResult {
  data: any[];
  errors: any[];
  meta: any;
}

export function useCSV(csvUrl: string) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results: PapaParseResult) => {
        console.log('✅ CSV 加载成功:', results.data);
        setData(results.data);
      },
      error: (error: any) => {
        console.error('❌ CSV 加载失败: ', error);
      },
    });
  }, [csvUrl]);

  return data;
}
