// src/components/SelectorApp-new.tsx - 完全重构版本，1:1复刻设计稿
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../App.css';
import './SelectorApp.css';
import { useOptimizedCSV } from '../hooks/useOptimizedCSV';

type ProjectType = {
  University: string;
  Location: string;
  ProgramName: string;
  ProgramType: string;
  Duration: string;
  DeadlineRounds: string;
  TestRequiredGRE: string;
  TestRequiredGMAT: string;
  LanguageTestTOEFL: string;
  LanguageTestIELTS: string;
  Recommendations: string;
  VideoInterview: string;
  'WritingSample/作品集要求': string;
  TuitionFeeLocal: string;
  TuitionFeeCNY: string;
  QSRank: string;
  语言特殊要求: string;
  申请者背景要求: string;
  申请者学位要求: string;
  项目特色: string;
  课程设置: string;
  其他重要信息: string;
  [key: string]: any;
};

const SelectorApp: React.FC = () => {
  const csvUrl = 'https://docs.google.com/spreadsheets/d/1kINLW00e-oPJB-a0M-kejB6PrGAhrKukuBViAHqxyPc/export?format=csv&gid=0&single=true&output=csv';
  const { data: programData, loading, error, retry } = useOptimizedCSV(csvUrl);
  
  // 筛选状态
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [selectedProgramTypes, setSelectedProgramTypes] = useState<string[]>([]);
  const [selectedQSRanks, setSelectedQSRanks] = useState<string[]>([]);
  const [ieltsMin, setIeltsMin] = useState<number>(0);
  const [ieltsMax, setIeltsMax] = useState<number>(9);
  const [toeflMin, setToeflMin] = useState<number>(0);
  const [toeflMax, setToeflMax] = useState<number>(120);
  const [selectedGRE, setSelectedGRE] = useState<string[]>([]);
  
  // 字母索引筛选
  const [selectedLetterIndex, setSelectedLetterIndex] = useState<string>('');
  
  // 显示设置
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('QSRank');
  
  // 详情模态框
  const [selectedProgram, setSelectedProgram] = useState<ProjectType | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 收藏功能状态
  const [favorites, setFavorites] = useState<string[]>([]);

  // 获取选项数据
  const getUniqueOptions = (field: string) => {
    if (!programData) return [];
    return Array.from(new Set(programData.map(item => item[field]).filter(Boolean))).sort();
  };

  const locations = useMemo(() => getUniqueOptions('Location'), [programData]);
  const universities = useMemo(() => getUniqueOptions('University'), [programData]);
  const programTypes = useMemo(() => getUniqueOptions('ProgramType'), [programData]);
  const qsRanks = useMemo(() => getUniqueOptions('QSRank'), [programData]);
  const greOptions = useMemo(() => getUniqueOptions('GRE'), [programData]);

  // 获取筛选后的学校列表（基于选中的地区和字母索引）
  const filteredUniversities = useMemo(() => {
    if (!programData) return [];
    let unis = programData;
    
    // 如果选择了地区，先按地区筛选
    if (selectedLocations.length > 0) {
      unis = unis.filter(item => selectedLocations.includes(item.Location));
    }
    
    let universityList = Array.from(new Set(unis.map(item => item.University).filter(Boolean))).sort();
    
    // 如果选择了字母索引，按字母筛选
    if (selectedLetterIndex) {
      universityList = universityList.filter(uni => 
        uni.charAt(0).toUpperCase() === selectedLetterIndex
      );
    }
    
    return universityList;
  }, [programData, selectedLocations, selectedLetterIndex]);
  
  // 获取所有学校的首字母索引
  const letterIndexes = useMemo(() => {
    if (!programData) return [];
    let unis = programData;
    
    // 如果选择了地区，先按地区筛选
    if (selectedLocations.length > 0) {
      unis = unis.filter(item => selectedLocations.includes(item.Location));
    }
    
    const allUniversities = Array.from(new Set(unis.map(item => item.University).filter(Boolean)));
    const letters = Array.from(new Set(
      allUniversities.map(uni => uni.charAt(0).toUpperCase())
    )).sort();
    
    return letters;
  }, [programData, selectedLocations]);

  // 筛选逻辑
  const filteredData = useMemo(() => {
    if (!programData) return [];
    
    return programData.filter((item: ProjectType) => {
      // 地区筛选
      if (selectedLocations.length > 0 && !selectedLocations.includes(item.Location)) {
        return false;
      }
      
      // 学校筛选
      if (selectedUniversities.length > 0 && !selectedUniversities.includes(item.University)) {
        return false;
      }
      
      // 项目类型筛选
      if (selectedProgramTypes.length > 0 && !selectedProgramTypes.includes(item.ProgramType)) {
        return false;
      }
      
      // QS排名筛选
      if (selectedQSRanks.length > 0 && !selectedQSRanks.includes(item.QSRank)) {
        return false;
      }
      
      return true;
    });
  }, [programData, selectedLocations, selectedUniversities, selectedProgramTypes, selectedQSRanks]);

  // 分页数据
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 重置筛选
  const resetFilters = () => {
    setSelectedLocations([]);
    setSelectedUniversities([]);
    setSelectedProgramTypes([]);
    setSelectedQSRanks([]);
    setIeltsMin(0);
    setIeltsMax(9);
    setToeflMin(0);
    setToeflMax(120);
    setSelectedGRE([]);
    setSelectedLetterIndex('');
    setCurrentPage(1);
  };

  // 处理筛选变更
  const handleCheckboxChange = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
    setCurrentPage(1);
  };

  // 生成项目唯一ID
  const generateProgramId = (program: ProjectType): string => {
    return `${program.University}-${program.ProgramName}`.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
  };

  // 加载收藏列表
  useEffect(() => {
    const savedFavorites = localStorage.getItem('program-favorites');
    if (savedFavorites) {
      try {
        const favoriteIds = JSON.parse(savedFavorites);
        if (Array.isArray(favoriteIds)) {
          setFavorites(favoriteIds);
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }
  }, []);

  // 切换收藏状态
  const toggleFavorite = (program: ProjectType) => {
    const programId = generateProgramId(program);
    const isFavorited = favorites.includes(programId);

    let newFavorites: string[];
    if (isFavorited) {
      // 取消收藏
      newFavorites = favorites.filter(id => id !== programId);
      localStorage.removeItem(`program-${programId}`);
    } else {
      // 添加收藏
      newFavorites = [...favorites, programId];
      
      // 保存项目详细数据
      const favoriteData = {
        item: program,
        selectedFields: [], // 使用默认字段
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`program-${programId}`, JSON.stringify(favoriteData));
    }

    // 更新收藏ID列表
    localStorage.setItem('program-favorites', JSON.stringify(newFavorites));
    setFavorites(newFavorites);
    
    // 显示提示信息
    if (isFavorited) {
      console.log('已取消收藏:', program.University, program.ProgramName);
    } else {
      console.log('已收藏:', program.University, program.ProgramName);
    }
  };

  // 检查是否已收藏
  const isFavorited = (program: ProjectType): boolean => {
    const programId = generateProgramId(program);
    return favorites.includes(programId);
  };

  // 加载状态
  if (loading) {
    return (
      <div className="selector-app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在加载项目数据...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="selector-app">
        <div className="error-container">
          <h3>数据加载失败</h3>
          <p>{error}</p>
          <button onClick={retry}>重试</button>
        </div>
      </div>
    );
  }

  // 调试信息
  console.log('SelectorApp 渲染 - 数据状态:', {
    loading,
    error,
    dataLength: programData?.length,
    filteredLength: filteredData?.length,
    locations: locations.length,
    universities: universities.length
  });

  return (
    <div className="selector-app">
      {/* 页面头部 */}
      <div className="database-header">
        <div className="database-title-section">
          <h1 className="database-title">英港新商科硕士项目申请数据库</h1>
          <p className="database-subtitle">
            涵盖美英香港新加坡等地区商科交叉项目，持续更新维护中
          </p>
          {/* 调试信息 */}
          {programData && (
            <div style={{color: '#666', fontSize: '0.9rem', marginTop: '1rem'}}>
              调试: 已加载 {programData.length} 条数据，筛选后 {filteredData.length} 条
            </div>
          )}
        </div>
      </div>

      {/* 主要内容区域：左侧筛选 + 右侧结果 */}
      <div className="database-content">
        
        {/* 左侧筛选面板 */}
        <div className="filter-panel">
          <div className="filter-header">
            <h2>
              <span className="filter-icon">🔍</span>
              筛选条件
            </h2>
            <button className="reset-filters" onClick={resetFilters}>
              重置
            </button>
          </div>


          {/* 地区筛选 */}
          <div className="filter-group">
            <label className="filter-label">地区</label>
            <div className="checkbox-grid">
              {locations.map(location => (
                <div key={location} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`location-${location}`}
                    checked={selectedLocations.includes(location)}
                    onChange={() => handleCheckboxChange(location, setSelectedLocations)}
                  />
                  <label htmlFor={`location-${location}`}>{location}</label>
                </div>
              ))}
            </div>
          </div>

          {/* 学校筛选 - 带字母索引 */}
          <div className="filter-group">
            <label className="filter-label">学校</label>
            
            {/* 字母索引 */}
            {letterIndexes.length > 0 && (
              <div className="letter-index">
                <div className="letter-index-label">按字母筛选：</div>
                <div className="letter-buttons">
                  <button 
                    className={`letter-btn ${selectedLetterIndex === '' ? 'active' : ''}`}
                    onClick={() => setSelectedLetterIndex('')}
                  >
                    全部
                  </button>
                  {letterIndexes.map(letter => (
                    <button 
                      key={letter}
                      className={`letter-btn ${selectedLetterIndex === letter ? 'active' : ''}`}
                      onClick={() => setSelectedLetterIndex(letter)}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <select 
              className="filter-select-multiple" 
              multiple
              value={selectedUniversities}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedUniversities(values);
                setCurrentPage(1);
              }}
            >
              {filteredUniversities.map(university => (
                <option key={university} value={university}>
                  {university}
                </option>
              ))}
            </select>
            <div className="filter-note">
              {selectedLetterIndex 
                ? `显示以 "${selectedLetterIndex}" 开头的 ${filteredUniversities.length} 所学校`
                : selectedLocations.length > 0 
                  ? `已根据地区筛选，显示 ${filteredUniversities.length} 所学校`
                  : `可选择 ${filteredUniversities.length} 所学校，支持多选`
              }
            </div>
          </div>

          {/* 项目类型筛选 - 两列布局 */}
          <div className="filter-group">
            <label className="filter-label">项目类型</label>
            <div className="checkbox-grid">
              {programTypes.map(type => (
                <div key={type} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`type-${type}`}
                    checked={selectedProgramTypes.includes(type)}
                    onChange={() => handleCheckboxChange(type, setSelectedProgramTypes)}
                  />
                  <label htmlFor={`type-${type}`}>{type}</label>
                </div>
              ))}
            </div>
          </div>

          {/* QS排名筛选 */}
          <div className="filter-group">
            <label className="filter-label">QS排名</label>
            <select 
              className="filter-select" 
              value={selectedQSRanks[0] || ''}
              onChange={(e) => setSelectedQSRanks(e.target.value ? [e.target.value] : [])}
            >
              <option value="">所有排名</option>
              <option value="前50">前50</option>
              <option value="前100">前100</option>
              <option value="前200">前200</option>
            </select>
          </div>

          {/* GRE要求筛选 */}
          <div className="filter-group">
            <label className="filter-label">GRE要求</label>
            <div className="checkbox-list">
              {Array.from(new Set(programData?.map(item => item.TestRequiredGRE).filter(Boolean))).map(gre => (
                <div key={gre} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`gre-${gre}`}
                    checked={selectedGRE.includes(gre)}
                    onChange={() => handleCheckboxChange(gre, setSelectedGRE)}
                  />
                  <label htmlFor={`gre-${gre}`}>{gre}</label>
                </div>
              ))}
            </div>
          </div>

          {/* 应用筛选按钮 */}
          <button className="apply-filters-btn">
            应用筛选 ({filteredData.length} 个结果)
          </button>
        </div>

        {/* 右侧结果区域 */}
        <div className="results-section">
          {/* 结果头部 */}
          <div className="results-header">
            <div className="sort-controls">
              <span className="sort-label">排序：</span>
              <select 
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="QSRank">QS排名</option>
                <option value="University">学校名称</option>
                <option value="Location">地区</option>
              </select>
            </div>
          </div>

          {/* 结果统计 */}
          <div className="results-stats">
            <div className="results-count">
              找到 {filteredData.length} 个项目
            </div>
            <div className="results-subtitle">
              显示第 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} 个结果
            </div>
          </div>

          {/* 项目列表 */}
          <div className="programs-list">
            {paginatedData.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#666'
              }}>
                <div style={{fontSize: '2rem', marginBottom: '1rem'}}>🔍</div>
                <p>没有找到符合条件的项目</p>
                <p style={{fontSize: '0.9rem'}}>尝试调整筛选条件或重置所有筛选</p>
              </div>
            ) : (
              paginatedData.map((program, index) => (
              <div key={index} className="program-card">
                {/* 卡片头部 */}
                <div className="program-header">
                  <div className="university-info">
                    <div>
                      <div className="university-name">{program.University}</div>
                      <div className="qs-ranking">
                        {program.QSRank && <span className="qs-label">QS {program.QSRank}</span>}
                        <span className="program-highlight">{program.Location}</span>
                      </div>
                    </div>
                    <button 
                      className={`bookmark-btn ${isFavorited(program) ? 'favorited' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(program);
                      }}
                      title={isFavorited(program) ? '取消收藏' : '收藏项目'}
                    >
                      {isFavorited(program) ? '★' : '☆'}
                    </button>
                  </div>
                  <h3 className="program-title">{program.ProgramName}</h3>
                  <div className="program-meta">
                    <span>📚 {program.ProgramType}</span>
                    {program.Duration && <span>⏱️ {program.Duration}</span>}
                  </div>
                </div>

                {/* 重要信息网格 */}
                <div className="program-key-info">
                  <div className="info-row">
                    <div className="info-group">
                      <div className="info-label">申请截止</div>
                      <div className="info-value">{program.DeadlineRounds || 'TBA'}</div>
                    </div>
                    <div className="info-group">
                      <div className="info-label">学费(人民币)</div>
                      <div className="info-value">{program.TuitionFeeCNY || 'TBA'}</div>
                    </div>
                  </div>
                </div>

                {/* 考试要求 */}
                <div className="program-requirements">
                  <div className="requirement-item">
                    <div className="req-label">托福</div>
                    <div className="req-value">
                      {program.LanguageTestTOEFL || 'N/A'}
                    </div>
                  </div>
                  <div className="requirement-item">
                    <div className="req-label">雅思</div>
                    <div className="req-value">
                      {program.LanguageTestIELTS || 'N/A'}
                    </div>
                  </div>
                  <div className="requirement-item">
                    <div className="req-label">GRE</div>
                    <div className="req-value">
                      {program.TestRequiredGRE || 'N/A'}
                    </div>
                  </div>
                  <div className="requirement-item">
                    <div className="req-label">GMAT</div>
                    <div className="req-value">
                      {program.TestRequiredGMAT || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* 特色信息 */}
                {program.项目特色 && (
                  <div className="program-highlights">
                    <div className="highlight-label">项目特色</div>
                    <div className="highlight-content">{program.项目特色}</div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="program-actions">
                  <button 
                    className="view-details-btn"
                    onClick={() => {
                      setSelectedProgram(program);
                      setShowModal(true);
                    }}
                  >
                    查看详情
                  </button>
                </div>
              </div>
              ))
            )}
          </div>

          {/* 加载更多 / 分页 */}
          {totalPages > 1 && (
            <div className="load-more-section">
              <button
                className="load-more-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
              >
                {currentPage >= totalPages ? '已显示全部结果' : '加载更多项目'}
              </button>
              <div className="pagination-info">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 详情模态框 */}
      {showModal && selectedProgram && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProgram.ProgramName}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h3>基本信息</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">学校:</span>
                    <span className="detail-value">{selectedProgram.University}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">地区:</span>
                    <span className="detail-value">{selectedProgram.Location}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">项目类型:</span>
                    <span className="detail-value">{selectedProgram.ProgramType}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">学制:</span>
                    <span className="detail-value">{selectedProgram.Duration}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">QS排名:</span>
                    <span className="detail-value">{selectedProgram.QSRank}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>申请要求</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">申请截止:</span>
                    <span className="detail-value">{selectedProgram.DeadlineRounds}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">托福:</span>
                    <span className="detail-value">{selectedProgram.LanguageTestTOEFL}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">雅思:</span>
                    <span className="detail-value">{selectedProgram.LanguageTestIELTS}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">GRE:</span>
                    <span className="detail-value">{selectedProgram.TestRequiredGRE}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">GMAT:</span>
                    <span className="detail-value">{selectedProgram.TestRequiredGMAT}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">推荐信:</span>
                    <span className="detail-value">{selectedProgram.Recommendations}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">视频面试:</span>
                    <span className="detail-value">{selectedProgram.VideoInterview}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">写作样本/作品集:</span>
                    <span className="detail-value">{selectedProgram['WritingSample/作品集要求']}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>费用信息</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">学费(本地):</span>
                    <span className="detail-value">{selectedProgram.TuitionFeeLocal}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">学费(人民币):</span>
                    <span className="detail-value">{selectedProgram.TuitionFeeCNY}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>详细要求</h3>
                <div className="detail-list">
                  {selectedProgram.语言特殊要求 && (
                    <div className="detail-item-full">
                      <span className="detail-label">语言特殊要求:</span>
                      <span className="detail-value">{selectedProgram.语言特殊要求}</span>
                    </div>
                  )}
                  {selectedProgram.申请者背景要求 && (
                    <div className="detail-item-full">
                      <span className="detail-label">申请者背景要求:</span>
                      <span className="detail-value">{selectedProgram.申请者背景要求}</span>
                    </div>
                  )}
                  {selectedProgram.申请者学位要求 && (
                    <div className="detail-item-full">
                      <span className="detail-label">申请者学位要求:</span>
                      <span className="detail-value">{selectedProgram.申请者学位要求}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>项目信息</h3>
                <div className="detail-list">
                  {selectedProgram.项目特色 && (
                    <div className="detail-item-full">
                      <span className="detail-label">项目特色:</span>
                      <span className="detail-value">{selectedProgram.项目特色}</span>
                    </div>
                  )}
                  {selectedProgram.课程设置 && (
                    <div className="detail-item-full">
                      <span className="detail-label">课程设置:</span>
                      <span className="detail-value">{selectedProgram.课程设置}</span>
                    </div>
                  )}
                  {selectedProgram.其他重要信息 && (
                    <div className="detail-item-full">
                      <span className="detail-label">其他重要信息:</span>
                      <span className="detail-value">{selectedProgram.其他重要信息}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectorApp;