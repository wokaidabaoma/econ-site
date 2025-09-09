import React, { useState, useEffect } from 'react';
import './ResultTable.css';

interface ResultTableProps {
  data: any[];
  selectedFields: string[];
}

const ResultTable: React.FC<ResultTableProps> = ({ data, selectedFields }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const itemsPerPage = 10;

  // 检测设备类型
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 加载收藏列表
  useEffect(() => {
    const savedFavorites = localStorage.getItem('program-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('加载收藏列表失败:', error);
      }
    }
  }, []);

  // 生成项目唯一ID
  const generateProgramId = (item: any): string => {
    return `${item.University}-${item.ProgramName}`.replace(/\s+/g, '-');
  };

  // 切换收藏状态
  const toggleFavorite = (item: any) => {
    const programId = generateProgramId(item);
    const newFavorites = favorites.includes(programId)
      ? favorites.filter(id => id !== programId)
      : [...favorites, programId];
    
    setFavorites(newFavorites);
    localStorage.setItem('program-favorites', JSON.stringify(newFavorites));
    
    if (newFavorites.includes(programId)) {
      // 添加收藏：保存项目数据和用户当前选择的字段，确保数据格式正确
      const favoriteData = {
        item: item,                    // 项目数据
        selectedFields: selectedFields, // 用户当前选择的字段
        savedAt: new Date().toISOString() // 收藏时间
      };
      localStorage.setItem(`program-${programId}`, JSON.stringify(favoriteData));
    } else {
      // 移除收藏：删除项目数据
      localStorage.removeItem(`program-${programId}`);
    }
  };

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
    // CSV中使用的中文字段名
    '语言特殊要求',
    '申请者背景要求',
    '申请者学位要求',
    '项目特色',
    '课程设置',
    '其他重要信息'
    // ProgramID 已移除，不在表格中显示
  ];

  // 字段中文名称映射
  const FIELD_LABELS: Record<string, string> = {
    'University': '学校',
    'Location': '地区',
    'ProgramName': '项目名称',
    'ProgramType': '项目类型',
    'Duration': '学制',
    'DeadlineRounds': '申请截止',
    'TestRequiredGRE': 'GRE要求',
    'TestRequiredGMAT': 'GMAT要求',
    'LanguageTestTOEFL': 'TOEFL要求',
    'LanguageTestIELTS': 'IELTS要求',
    'Recommendations': '推荐信',
    'VideoInterview': '面试要求',
    'TuitionFeeLocal': '学费(当地)',
    'TuitionFeeCNY': '学费(人民币)',
    'QSRank': 'QS排名',
    'Notes': '备注',
    // CSV中使用的中文字段名（映射到自己）
    '语言特殊要求': '语言特殊要求',
    '申请者背景要求': '申请者背景要求',
    '申请者学位要求': '申请者学位要求',
    '项目特色': '项目特色',
    '课程设置': '课程设置',
    '其他重要信息': '其他重要信息'
    // ProgramID 已移除
  };

  // 更新的列优先级（按照用户需求重新排序）
  const getColumnPriority = (field: string): number => {
    const priorityMap: Record<string, number> = {
      'University': 1,
      'ProgramName': 1,
      'Duration': 1,
      'DeadlineRounds': 2,
      'LanguageTestIELTS': 2,
      'LanguageTestTOEFL': 2,
      'TuitionFeeCNY': 2,
      'QSRank': 2,
      'Notes': 2,
      // 六个新备注字段设为第二级重要性（使用中文字段名）
      '语言特殊要求': 2,
      '申请者背景要求': 2,
      '申请者学位要求': 2,
      '项目特色': 2,
      '课程设置': 2,
      '其他重要信息': 2,
      'Location': 3,
      'ProgramType': 3,
      'TuitionFeeLocal': 3,
      'TestRequiredGRE': 4,
      'TestRequiredGMAT': 4,
      'Recommendations': 4,
      'VideoInterview': 5
      // ProgramID 已移除
    };
    return priorityMap[field] || 3;
  };

  // 根据固定顺序和优先级获取显示字段
  const getVisibleFields = (): string[] => {
    const orderedSelectedFields = FIELD_ORDER.filter(field => selectedFields.includes(field));
    
    // 手机端显示所有选中的字段
    if (isMobile) {
      return orderedSelectedFields;
    }
    
    // 桌面端智能隐藏逻辑保持不变
    if (orderedSelectedFields.length <= 6) {
      return orderedSelectedFields;
    }
    
    if (orderedSelectedFields.length <= 10) {
      return orderedSelectedFields.filter(field => getColumnPriority(field) <= 4);
    }
    
    return orderedSelectedFields.filter(field => getColumnPriority(field) <= 2);
  };

  // 智能列宽分配
  const getColumnClass = (field: string): string => {
    const baseClass = (() => {
      if (field === 'Notes') return 'notes';
      // 新增备注字段使用notes类样式（使用中文字段名）
      if (field === '语言特殊要求' || 
          field === '申请者背景要求' || 
          field === '申请者学位要求' || 
          field === '项目特色' || 
          field === '课程设置' || 
          field === '其他重要信息') return 'notes';
      if (field.includes('Fee') || field.includes('CNY') || field.includes('Local')) return 'number';
      if (field === 'QSRank') return 'short-text';
      if (field === 'Location' || field === 'Duration' || field === 'ProgramType') return 'short-text';
      // University和ProgramName使用新的可换行样式
      if (field === 'University') return 'university-text';
      if (field === 'ProgramName') return 'program-text';
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
    
    const text = String(value);
    if (isCompactMode && text.length > 20) {
      return text.substring(0, 17) + '...';
    }
    
    return text;
  };

  const visibleFields = getVisibleFields();
  const hiddenFieldsCount = selectedFields.length - visibleFields.length;

  // 手机端卡片组件
  const MobileCard: React.FC<{ item: any, index: number }> = ({ item, index }) => {
    const programId = generateProgramId(item);
    const isFavorited = favorites.includes(programId);

    return (
      <div className="mobile-card" key={index}>
        {/* 卡片水印 */}
        <img 
          src="/annie-watermark.png"
          alt=""
          className="card-watermark"
          onError={(e) => {
            console.error('手机端水印图片加载失败');
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
          onLoad={() => {
            console.log('✅ 手机端水印图片加载成功！');
          }}
        />
        
        <div className="card-content">
          {/* 收藏按钮 */}
          <div className="card-favorite-header">
            <button
              onClick={() => toggleFavorite(item)}
              className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
              title={isFavorited ? '取消收藏' : '添加到收藏'}
            >
              {isFavorited ? '⟡' : '☆'}
            </button>
          </div>
          
          {visibleFields.map((field) => (
            <div key={field} className="card-field">
              <span className="field-label">{FIELD_LABELS[field] || field}：</span>
              <span className="field-value">{formatCellContent(field, item[field])}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 桌面端表格组件
  const DesktopTable: React.FC = () => (
    <div 
      className={`table-container ${isCompactMode ? 'compact-mode' : ''} watermarked`}
      style={{ position: 'relative', overflow: 'visible' }}
    >
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
              <th className="favorite-column">收藏</th>
              {visibleFields.map(field => (
                <th key={field} className={getColumnClass(field)}>
                  {FIELD_LABELS[field] || field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, index) => {
              const programId = generateProgramId(row);
              const isFavorited = favorites.includes(programId);
              
              return (
                <tr key={index}>
                  <td className="favorite-column">
                    <button
                      onClick={() => toggleFavorite(row)}
                      className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
                      title={isFavorited ? '取消收藏' : '添加到收藏'}
                    >
                      {isFavorited ? '⟡' : '☆'}
                    </button>
                  </td>
                  {visibleFields.map(field => (
                    <td 
                      key={field} 
                      className={getColumnClass(field)}
                      title={!isCompactMode && (field === 'Notes' || 
                        field === '语言特殊要求' || 
                        field === '申请者背景要求' || 
                        field === '申请者学位要求' || 
                        field === '项目特色' || 
                        field === '课程设置' || 
                        field === '其他重要信息') ? String(row[field] || '') : undefined}
                    >
                      {formatCellContent(field, row[field])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 桌面端水印 */}
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
      />
      
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
        ⟣ 猿人安妮
      </div>
    </div>
  );

  return (
    <div>
      {/* 表格控制区域 */}
      {selectedFields.length > 0 && (
        <div className="table-info">
          <div>
            <strong>显示结果：</strong>
            共 {data.length} 条记录，显示 {visibleFields.length + 1} 列（含收藏列）
            {!isMobile && hiddenFieldsCount > 0 && (
              <span className="hidden-info">（已智能隐藏 {hiddenFieldsCount} 列）</span>
            )}
          </div>
          {/* 手机端不显示模式切换按钮 */}
          {!isMobile && (
            <div className="control-buttons">
              <button 
                onClick={() => setIsCompactMode(!isCompactMode)}
                className={`mode-toggle ${isCompactMode ? 'active' : ''}`}
              >
                {isCompactMode ? '⧨ 标准视图' : '⧪ 紧凑视图'}
              </button>
            </div>
          )}
        </div>
      )}

      {selectedFields.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>⧨</p>
          <p>请先选择要显示的字段</p>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>🔍</p>
          <p>没有找到符合条件的记录</p>
          <p style={{ fontSize: '0.9rem', color: '#999' }}>请尝试调整筛选条件</p>
        </div>
      ) : (
        <>
          {/* 根据设备类型显示不同的布局 */}
          {isMobile ? (
            <div className="mobile-cards-container">
              {currentData.map((item, index) => (
                <MobileCard key={index} item={item} index={index} />
              ))}
            </div>
          ) : (
            <DesktopTable />
          )}

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
          <div className="copyright-info">
            <div className="copyright-main">
              ⟣ 数据整理与维护：猿人安妮 Anna Cao
            </div>
            <div className="copyright-sub">
              个人网站：yuanrenannie.com | 小红书：@猿人安妮 | 数据持续更新中
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ResultTable;