import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import './ResultTable.css';
import { 
  Star, 
  StarSolid, 
  Trash, 
  Import, 
  Check, 
  Xmark,
  ClipboardCheck,
  LightBulb,
  Rocket
} from 'iconoir-react';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  // 从 ResultTable.tsx 复制的固定字段显示顺序
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
  ];

  // 从 ResultTable.tsx 复制的字段中文名称映射
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
    // CSV中使用的中文字段名
    '语言特殊要求': '语言特殊要求',
    '申请者背景要求': '申请者背景要求',
    '申请者学位要求': '申请者学位要求',
    '项目特色': '项目特色',
    '课程设置': '课程设置',
    '其他重要信息': '其他重要信息'
  };

  // 从 ResultTable.tsx 复制的列优先级定义
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
    };
    return priorityMap[field] || 3;
  };

  // 从 ResultTable.tsx 复制的显示字段获取逻辑
  const getVisibleFields = (selectedFields: string[]): string[] => {
    // 按照 FIELD_ORDER 排序用户选择的字段
    const orderedSelectedFields = FIELD_ORDER.filter(field => selectedFields.includes(field));
    
    // 收藏页面统一显示所有选中的字段（不做智能隐藏）
    return orderedSelectedFields;
  };

  // 生成项目唯一ID
  const generateProgramId = (item: any): string => {
    return `${item.University}-${item.ProgramName}`.replace(/\s+/g, '-');
  };

  // 移除单个收藏
  const removeFavorite = (item: any) => {
    const programId = generateProgramId(item);
    const savedFavorites = localStorage.getItem('program-favorites');
    
    if (savedFavorites) {
      try {
        const favoriteIds = JSON.parse(savedFavorites);
        const newFavoriteIds = favoriteIds.filter((id: string) => id !== programId);
        localStorage.setItem('program-favorites', JSON.stringify(newFavoriteIds));
        
        // 移除项目数据
        localStorage.removeItem(`program-${programId}`);
        
        // 更新当前显示的收藏列表
        setFavorites(prev => prev.filter(fav => generateProgramId(fav.item) !== programId));
        
        // 如果该项目被选中，从选中列表中移除
        setSelectedItems(prev => prev.filter(id => id !== programId));
      } catch (error) {
        console.error('移除收藏失败:', error);
      }
    }
  };

  // 获取项目显示字段 - 使用 ResultTable 的逻辑
  const getDisplayFields = (favoriteData: any): string[] => {
    // 如果有保存的字段配置，使用 ResultTable 的显示逻辑处理
    if (favoriteData.selectedFields && Array.isArray(favoriteData.selectedFields) && favoriteData.selectedFields.length > 0) {
      return getVisibleFields(favoriteData.selectedFields);
    }
    
    // 否则使用默认的主要字段，按照 FIELD_ORDER 排序
    const defaultFields = [
      'University',
      'ProgramName',
      'Location',
      'ProgramType',
      'Duration',
      'TuitionFeeCNY',
      'QSRank',
      'DeadlineRounds',
      'Notes'
    ];
    return getVisibleFields(defaultFields);
  };

  // 清空所有收藏
  const clearAllFavorites = () => {
    if (window.confirm('确定要清空所有收藏吗？此操作不可撤销。')) {
      localStorage.removeItem('program-favorites');
      // 清除所有存储的项目数据
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('program-') && key !== 'program-favorites') {
          localStorage.removeItem(key);
        }
      });
      setFavorites([]);
      setSelectedItems([]);
      setSelectMode(false);
    }
  };

  // 删除选中的收藏
  const deleteSelectedFavorites = () => {
    if (selectedItems.length === 0) {
      alert('请先选择要删除的项目');
      return;
    }

    if (window.confirm(`确定要删除选中的 ${selectedItems.length} 个项目吗？此操作不可撤销。`)) {
      const savedFavorites = localStorage.getItem('program-favorites');
      
      if (savedFavorites) {
        try {
          const favoriteIds = JSON.parse(savedFavorites);
          const newFavoriteIds = favoriteIds.filter((id: string) => !selectedItems.includes(id));
          localStorage.setItem('program-favorites', JSON.stringify(newFavoriteIds));
          
          // 删除选中项目的数据
          selectedItems.forEach(programId => {
            localStorage.removeItem(`program-${programId}`);
          });
          
          // 更新显示列表
          setFavorites(prev => prev.filter(fav => !selectedItems.includes(generateProgramId(fav.item))));
          setSelectedItems([]);
          setSelectMode(false);
        } catch (error) {
          console.error('删除选中收藏失败:', error);
        }
      }
    }
  };

  // 切换选择模式
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedItems([]);
  };

  // 切换项目选中状态
  const toggleItemSelection = (programId: string) => {
    setSelectedItems(prev => 
      prev.includes(programId)
        ? prev.filter(id => id !== programId)
        : [...prev, programId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.length === favorites.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(favorites.map(fav => generateProgramId(fav.item)));
    }
  };

  // 导入到申请跟踪器
  const importToTracker = () => {
    if (favorites.length === 0) {
      alert('收藏夹为空，无项目可导入');
      return;
    }
    
    if (window.confirm(`确定要将 ${favorites.length} 个收藏项目导入到申请跟踪器吗？\n\n这些项目将被添加到您的申请管理列表中。`)) {
      // 跳转到增强版跟踪器，带上导入标记
      navigate('/enhanced-tracker?imported=true');
    }
  };

  // 加载收藏列表
  useEffect(() => {
    const loadFavorites = () => {
      const savedFavorites = localStorage.getItem('program-favorites');
      
      if (savedFavorites) {
        try {
          const favoriteIds = JSON.parse(savedFavorites);
          const favoriteItems: any[] = [];
          
          favoriteIds.forEach((id: string) => {
            const itemData = localStorage.getItem(`program-${id}`);
            if (itemData) {
              try {
                const favoriteData = JSON.parse(itemData);
                // 修复：确保正确处理数据结构
                if (favoriteData.item) {
                  // 新格式：{item, selectedFields, savedAt}
                  favoriteItems.push(favoriteData);
                } else {
                  // 旧格式：直接是item数据，为兼容性添加默认结构
                  favoriteItems.push({
                    item: favoriteData,
                    selectedFields: [],
                    savedAt: new Date().toISOString()
                  });
                }
              } catch (error) {
                console.error(`加载收藏项目 ${id} 失败:`, error);
              }
            }
          });
          
          setFavorites(favoriteItems);
        } catch (error) {
          console.error('加载收藏列表失败:', error);
        }
      }
      
      setLoading(false);
    };

    loadFavorites();
  }, []);

  // 从 ResultTable.tsx 复制的格式化函数
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
    
    return String(value);
  };

  if (loading) {
    return (
      <div className="selector-app">
        <div className="selector-header">
          <Link to="/" className="back-to-home">← 返回首页</Link>
          <div className="header-content">
            <h2>我的收藏</h2>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="selector-app">
      {/* 页面头部 */}
      <div className="selector-header">
        <Link to="/" className="back-to-home">← 返回首页</Link>
        <div className="header-content">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            我的收藏 <Star width={20} height={20} color="var(--morandi-warning)" />
          </h2>
          <p>你收藏的所有项目都在这里</p>
        </div>
        <Link to="/selector" className="back-to-home">回到筛选器 →</Link>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            <Star width={48} height={48} color="var(--morandi-warning)" />
          </div>
          <h3>还没有收藏任何项目</h3>
          <p>去筛选器中找到心仪的项目，点击 <Star width={16} height={16} style={{display: 'inline', verticalAlign: 'text-bottom'}} /> 按钮收藏吧！</p>
          <Link 
            to="/selector" 
            style={{
              display: 'inline-block',
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #d4c5a9 0%, #c9b896 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            <Rocket width={16} height={16} style={{ marginRight: '0.5rem' }} />
            前往筛选器
          </Link>
        </div>
      ) : (
        <>
          {/* 收藏统计和操作 */}
          <div className="clear-filters">
            <div className="results-count">
              共收藏 {favorites.length} 个项目
              {selectMode && (
                <span style={{ marginLeft: '1rem', color: 'var(--primary-color)' }}>
                  已选中 {selectedItems.length} 个
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* 选择模式切换按钮 */}
              <button 
                onClick={toggleSelectMode}
                className="clear-button"
                style={{ 
                  background: selectMode 
                    ? 'linear-gradient(135deg, #a89478, #9d8869)' 
                    : 'linear-gradient(135deg, #d4c5a9, #c9b896)',
                  minWidth: 'auto'
                }}
              >
                {selectMode ? 
                  <>
                    <Xmark width={16} height={16} style={{ marginRight: '0.5rem' }} />
                    取消选择
                  </> : 
                  <>
                    <Check width={16} height={16} style={{ marginRight: '0.5rem' }} />
                    选择删除
                  </>
                }
              </button>

              {/* 选择模式下的操作按钮 */}
              {selectMode && (
                <>
                  <button 
                    onClick={toggleSelectAll}
                    className="clear-button"
                    style={{ 
                      background: 'linear-gradient(135deg, #d4c5a9, #c9b896)',
                      minWidth: 'auto'
                    }}
                  >
                    {selectedItems.length === favorites.length ? '❌ 取消全选' : '✅ 全选'}
                  </button>
                  
                  <button 
                    onClick={deleteSelectedFavorites}
                    className="clear-button"
                    style={{ 
                      background: selectedItems.length === 0 
                        ? 'linear-gradient(135deg, #e8e0d1, #d4c5a9)' 
                        : 'linear-gradient(135deg, #c49480, #b5845f)',
                      minWidth: 'auto',
                      opacity: selectedItems.length === 0 ? 0.7 : 1,
                      cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                    disabled={selectedItems.length === 0}
                  >
                    <Trash width={16} height={16} style={{ marginRight: '0.5rem' }} />
                    删除选中 ({selectedItems.length})
                  </button>
                </>
              )}

              {/* 导入到跟踪器按钮 */}
              {!selectMode && (
                <button 
                  onClick={importToTracker}
                  className="clear-button"
                  style={{ 
                    background: 'linear-gradient(135deg, #4caf50, #45a049)',
                    minWidth: 'auto'
                  }}
                >
                  <Import width={16} height={16} style={{ marginRight: '0.5rem' }} />
                  导入到申请跟踪器
                </button>
              )}

              {/* 清空所有按钮 */}
              {!selectMode && (
                <button 
                  onClick={clearAllFavorites}
                  className="clear-button"
                  style={{ 
                    background: 'linear-gradient(135deg, #d4907e, #c8806e)',
                    minWidth: 'auto'
                  }}
                >
                  <Trash width={16} height={16} style={{ marginRight: '0.5rem' }} />
                  清空所有收藏
                </button>
              )}
            </div>
          </div>

          {/* 收藏项目列表 */}
          <div className="mobile-cards-container">
            {favorites.map((favoriteData, index) => {
              // 使用 ResultTable 的逻辑获取显示字段
              const displayFields = getDisplayFields(favoriteData);
              const programId = generateProgramId(favoriteData.item);
              const isSelected = selectedItems.includes(programId);
              
              return (
                <div 
                  className={`mobile-card ${selectMode ? 'select-mode' : ''} ${isSelected ? 'selected' : ''}`} 
                  key={index}
                  style={{
                    border: selectMode 
                      ? (isSelected ? '2px solid var(--primary-color)' : '2px solid #dee2e6')
                      : '1px solid rgba(181, 160, 130, 0.1)',
                    background: isSelected ? 'rgba(181, 160, 130, 0.05)' : 'white'
                  }}
                >
                  {/* 卡片水印 */}
                  <img 
                    src="/annie-watermark.png"
                    alt=""
                    className="card-watermark"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                    }}
                  />
                  
                  <div className="card-content">
                    {/* 头部操作区域 */}
                    <div className="card-favorite-header" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      {/* 选择框（选择模式下） */}
                      {selectMode ? (
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          fontSize: '1.1rem'
                        }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItemSelection(programId)}
                            style={{
                              width: '18px',
                              height: '18px',
                              marginRight: '0.5rem',
                              cursor: 'pointer'
                            }}
                          />
                          <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>
                            {isSelected ? '✅ 已选中' : '⬜ 选择'}
                          </span>
                        </label>
                      ) : (
                        <div></div>
                      )}

                      {/* 收藏按钮（非选择模式下） */}
                      {!selectMode && (
                        <button
                          onClick={() => removeFavorite(favoriteData.item)}
                          className="favorite-btn favorited"
                          title="取消收藏"
                        >
                          <StarSolid width={16} height={16} color="var(--morandi-warning)" />
                        </button>
                      )}
                    </div>
                    
                    {/* 按照 ResultTable 的逻辑显示字段 */}
                    {displayFields.map((field) => (
                      <div key={field} className="card-field">
                        <span className="field-label">{FIELD_LABELS[field] || field}：</span>
                        <span className="field-value">{formatCellContent(field, favoriteData.item[field])}</span>
                      </div>
                    ))}
                    
                    {/* 显示字段配置信息 */}
                    <div style={{
                      marginTop: '0.8rem',
                      padding: '0.5rem',
                      background: 'rgba(181, 160, 130, 0.1)',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: '#6b635a'
                    }}>
                      {favoriteData.selectedFields && favoriteData.selectedFields.length > 0 ? (
                        <>
                          <ClipboardCheck width={14} height={14} style={{ marginRight: '0.25rem' }} />
                          显示{displayFields.length}个字段（按重要性排序）
                        </>
                      ) : (
                        <>
                          <ClipboardCheck width={14} height={14} style={{ marginRight: '0.25rem' }} />
                          显示默认主要字段
                        </>
                      )}
                    </div>
                    
                    {/* 收藏时间信息 */}
                    {favoriteData.savedAt && (
                      <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#999',
                        textAlign: 'right'
                      }}>
                        收藏于：{new Date(favoriteData.savedAt).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底部提示 */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(181, 160, 130, 0.1), rgba(168, 148, 120, 0.1))',
            padding: '1.5rem',
            borderRadius: '12px',
            textAlign: 'center',
            marginTop: '2rem',
            color: '#4a453f'
          }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <LightBulb width={16} height={16} style={{ marginRight: '0.25rem' }} />
              <strong>小贴士：</strong>
              {selectMode 
                ? '勾选要删除的收藏项目，支持全选和批量删除'
                : '使用"选择删除"可以精确管理你的收藏列表'
              }
            </p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              清除浏览器数据会导致收藏丢失，建议及时截图或记录重要信息
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default FavoritesPage;