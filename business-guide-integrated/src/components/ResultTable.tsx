import React, { useState } from 'react';
import './ResultTable.css';

interface ResultTableProps {
  data: any[];
  selectedFields: string[];
}

const ResultTable: React.FC<ResultTableProps> = ({ data, selectedFields }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIdx, startIdx + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  // 固定的字段显示顺序（按照Google Sheet顺序）
  const FIELD_ORDER = [
    'University',
    'Location', 
    'ProgramName',
    'ProgramType',
    'Duration',
    'DeadlineRounds',
    'TestRequiredGRE',
    'TestRequiredGMAT',
    'LanguageTestTOEFL',
    'LanguageTestIELTS',
    'Recommendations',
    'VideoInterview',
    'TuitionFeeLocal',
    'TuitionFeeCNY',
    'QSRank',
    'Notes',
    'ProgramID'
  ];

  // 更新的列优先级（按照用户需求重新排序）
  const getColumnPriority = (field: string): number => {
    // 优先级：1=最重要，5=可隐藏
    const priorityMap: Record<string, number> = {
      // 最重要 - 核心信息
      'University': 1,
      'ProgramName': 1,
      'Duration': 1,
      
      // 很重要 - 申请关键信息  
      'DeadlineRounds': 2,
      'LanguageTestIELTS': 2,
      'LanguageTestTOEFL': 2,
      'TuitionFeeCNY': 2,
      'QSRank': 2,
      'Notes': 2,
      
      // 重要 - 辅助信息
      'Location': 3,
      'ProgramType': 3,
      'TuitionFeeLocal': 3,
      
      // 次要 - 额外信息
      'TestRequiredGRE': 4,
      'TestRequiredGMAT': 4,
      'Recommendations': 4,
      
      // 可隐藏 - 非关键信息
      'VideoInterview': 5,
      'ProgramID': 5
    };
    return priorityMap[field] || 3;
  };

  // 根据固定顺序和优先级获取显示字段
  const getVisibleFields = (): string[] => {
    // 首先按照固定顺序过滤出已选中的字段
    const orderedSelectedFields = FIELD_ORDER.filter(field => selectedFields.includes(field));
    
    if (orderedSelectedFields.length <= 6) {
      return orderedSelectedFields; // 6列以下全显示
    }
    
    if (orderedSelectedFields.length <= 10) {
      // 7-10列：隐藏优先级5的列
      return orderedSelectedFields.filter(field => getColumnPriority(field) <= 4);
    }
    
    // 11列以上：只显示优先级1-2的列
    return orderedSelectedFields.filter(field => getColumnPriority(field) <= 2);
  };

  // 智能列宽分配
  const getColumnClass = (field: string): string => {
    const baseClass = (() => {
      if (field === 'Notes') return 'notes';
      if (field.includes('Fee') || field.includes('CNY') || field.includes('Local')) return 'number';
      if (field === 'QSRank') return 'short-text'; // QS排名使用短文本格式
      if (field === 'Location' || field === 'Duration' || field === 'ProgramType') return 'short-text';
      if (field === 'University' || field === 'ProgramName') return 'medium-text';
      if (field.includes('IELTS') || field.includes('TOEFL') || field.includes('GRE')) return 'short-text';
      return 'medium-text';
    })();

    return isCompactMode ? `${baseClass} compact` : baseClass;
  };

  const formatCellContent = (field: string, value: any): string => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    
    if (field.includes('Fee') || field.includes('CNY') || field.includes('Local')) {
      const numValue = String(value).replace(/[^\d.-]/g, '');
      if (numValue && !isNaN(Number(numValue))) {
        return new Intl.NumberFormat('zh-CN').format(Number(numValue));
      }
    }
    
    // 紧凑模式下截断长文本
    const text = String(value);
    if (isCompactMode && text.length > 20) {
      return text.substring(0, 17) + '...';
    }
    
    return text;
  };

  const visibleFields = getVisibleFields();
  const hiddenFieldsCount = selectedFields.length - visibleFields.length;

  return (
    <div>
      {/* 简化的表格控制区域 - 只保留模式切换 */}
      {selectedFields.length > 0 && (
        <div className="table-info">
          <div>
            <strong>显示结果：</strong>
            共 {data.length} 条记录，显示 {visibleFields.length} 列
            {hiddenFieldsCount > 0 && (
              <span className="hidden-info">（已智能隐藏 {hiddenFieldsCount} 列）</span>
            )}
          </div>
          <div className="control-buttons">
            <button 
              onClick={() => setIsCompactMode(!isCompactMode)}
              className={`mode-toggle ${isCompactMode ? 'active' : ''}`}
            >
              {isCompactMode ? '📋 标准视图' : '📊 紧凑视图'}
            </button>
          </div>
        </div>
      )}

      {selectedFields.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '2px dashed #ddd'
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>📋</p>
          <p>请先选择要显示的字段</p>
        </div>
      ) : data.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '2px dashed #ddd'
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>🔍</p>
          <p>没有找到符合条件的记录</p>
          <p style={{ fontSize: '0.9rem', color: '#999' }}>请尝试调整筛选条件</p>
        </div>
      ) : (
        <>
          {/* 水印表格容器 */}
          <div 
            className={`table-container ${isCompactMode ? 'compact-mode' : ''} watermarked`}
            style={{ position: 'relative', overflow: 'visible' }}
          >
            {/* 表格内容 */}
            <div style={{ 
              position: 'relative', 
              zIndex: 1,
              overflow: 'auto',
              maxHeight: '600px',
              backgroundColor: 'transparent'
            }}>
              <table className="styled-table" style={{ 
                backgroundColor: 'transparent',
                backdropFilter: 'none'
              }}>
                <thead>
                  <tr>
                    {visibleFields.map(field => (
                      <th key={field} className={getColumnClass(field)}>
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((row, index) => (
                    <tr key={index}>
                      {visibleFields.map(field => (
                        <td 
                          key={field} 
                          className={getColumnClass(field)}
                          title={!isCompactMode && field === 'Notes' ? String(row[field] || '') : undefined}
                        >
                          {formatCellContent(field, row[field])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 主水印图片 - 中心位置 */}
            <img 
              src="/annie-watermark.png"
              alt="猿人安妮水印"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '400px',
                height: 'auto',
                opacity: 0.15,
                pointerEvents: 'none',
                zIndex: 5,
                filter: 'grayscale(20%) brightness(1.1)',
                mixBlendMode: 'multiply'
              }}
              onError={(e) => {
                console.error('水印图片加载失败');
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
              onLoad={() => {
                console.log('✅ 水印图片加载成功！');
              }}
            />
            
            {/* 辅助水印图片 - 左上角 */}
            <img 
              src="/annie-watermark.png"
              alt=""
              style={{
                position: 'absolute',
                top: '20%',
                left: '15%',
                transform: 'rotate(-25deg)',
                width: '200px',
                height: 'auto',
                opacity: 0.08,
                pointerEvents: 'none',
                zIndex: 3,
                filter: 'grayscale(50%) brightness(1.2)'
              }}
            />
            
            {/* 辅助水印图片 - 右下角 */}
            <img 
              src="/annie-watermark.png"
              alt=""
              style={{
                position: 'absolute',
                bottom: '15%',
                right: '10%',
                transform: 'rotate(20deg)',
                width: '180px',
                height: 'auto',
                opacity: 0.06,
                pointerEvents: 'none',
                zIndex: 3,
                filter: 'grayscale(60%) brightness(1.3)'
              }}
            />
            
            {/* 简化的文字水印 */}
            <div 
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '12px',
                color: 'rgba(168, 181, 160, 0.6)',
                fontSize: '10px',
                fontWeight: '600',
                pointerEvents: 'none',
                zIndex: 8,
                transform: 'rotate(-5deg)',
                userSelect: 'none',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textShadow: '0 0 2px rgba(255,255,255,0.9)',
                background: 'rgba(250,249,247,0.8)',
                padding: '2px 4px',
                borderRadius: '3px'
              }}
            >
              🐒 猿人安妮
            </div>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={handlePrevPage} disabled={currentPage === 1}>
                ⬅️ 上一页
              </button>
              <span>
                第 <strong>{currentPage}</strong> / {totalPages} 页 
                <small style={{ color: '#666', marginLeft: '0.5rem' }}>
                  (共 {data.length} 条)
                </small>
              </span>
              <button onClick={handleNextPage} disabled={currentPage === totalPages}>
                下一页 ➡️
              </button>
            </div>
          )}
          
          {/* 表格底部版权信息 */}
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            marginTop: '1rem',
            background: 'linear-gradient(135deg, #faf9f7 0%, #f2f0eb 100%)',
            borderRadius: '8px',
            border: '1px solid rgba(168, 181, 160, 0.15)'
          }}>
            <div style={{
              color: 'rgba(168, 181, 160, 0.9)',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              🐒 数据整理与维护：猿人安妮 Anna Cao
            </div>
            <div style={{
              color: 'rgba(107, 99, 90, 0.7)',
              fontSize: '11px'
            }}>
              个人网站：yuanrenannie.com | 小红书：@猿人安妮 | 数据持续更新中
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ResultTable;