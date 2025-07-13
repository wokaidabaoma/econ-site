import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import ResultTable from './ResultTable';
import FieldSelector from './FieldSelector';
import { useCSV } from '../useCSV';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { MultiValue } from 'react-select';

const animatedComponents = makeAnimated();

type OptionType = {
  value: string;
  label: string;
};

const SelectorApp: React.FC = () => {
  const csvUrl =
    'https://docs.google.com/spreadsheets/d/1kINLW00e-oPJB-a0M-kejB6PrGAhrKukuBViAHqxyPc/export?format=csv';
  const programData = useCSV(csvUrl);

  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<OptionType[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<OptionType[]>([]);
  const [selectedProgramType, setSelectedProgramType] = useState<OptionType[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<OptionType[]>([]);
  
  const [selectedIELTS, setSelectedIELTS] = useState<number | null>(null);
  const [selectedTOEFL, setSelectedTOEFL] = useState<number | null>(null);
  
  const [selectedGRE, setSelectedGRE] = useState<OptionType[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const allFields = useMemo(
    () => (programData.length > 0 ? Object.keys(programData[0]) : []),
    [programData]
  );

  const getOptions = (field: string): OptionType[] => {
    const values = new Set(
      programData
        .map(item => item[field])
        .filter(value => value !== null && value !== undefined && value !== '')
    );
    
    const optionsArray = Array.from(values).map(v => ({ value: String(v), label: String(v) }));
    return optionsArray.sort();
  };

  const getUniversityOptions = (): OptionType[] => {
    let filteredData = programData;
    
    if (selectedLocation.length > 0) {
      filteredData = programData.filter(item => 
        selectedLocation.some(loc => String(item['Location']) === loc.value)
      );
    }
    
    const values = new Set(
      filteredData
        .map(item => item['University'])
        .filter(value => value !== null && value !== undefined && value !== '')
    );
    
    const optionsArray = Array.from(values).map(v => ({ value: String(v), label: String(v) }));
    return optionsArray.sort();
  };

  const extractScore = (str: string): number => {
    if (!str) return 0;
    const match = str.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const filterData = () => {
    return programData.filter(row => {
      const matchLanguageSlider = (selectedScore: number | null, field: string) => {
        if (selectedScore === null) return true;
        
        const rowValue = String(row[field] || '').trim();
        
        if (!rowValue || 
            rowValue.toLowerCase().includes('not required') ||
            rowValue.toLowerCase().includes('optional') ||
            rowValue.toLowerCase().includes('无要求') ||
            rowValue === '-') {
          return true;
        }
        
        const rowScore = extractScore(rowValue);
        
        if (rowScore === 0) return false;
        
        return rowScore <= selectedScore;
      };

      const matchLanguageTest = () => {
        if (selectedIELTS === null && selectedTOEFL === null) return true;
        
        if (selectedIELTS !== null && selectedTOEFL === null) {
          return matchLanguageSlider(selectedIELTS, 'LanguageTestIELTS');
        }
        if (selectedIELTS === null && selectedTOEFL !== null) {
          return matchLanguageSlider(selectedTOEFL, 'LanguageTestTOEFL');
        }
        
        const ieltsMatch = matchLanguageSlider(selectedIELTS, 'LanguageTestIELTS');
        const toeflMatch = matchLanguageSlider(selectedTOEFL, 'LanguageTestTOEFL');
        return ieltsMatch || toeflMatch;
      };

      const match = (selected: OptionType[], field: string) =>
        selected.length === 0 || selected.some(opt => String(row[field]) === opt.value);

      return (
        match(selectedLocation, 'Location') &&
        match(selectedUniversity, 'University') &&
        match(selectedProgramType, 'ProgramType') &&
        match(selectedDuration, 'Duration') &&
        matchLanguageTest() &&
        match(selectedGRE, 'TestRequiredGRE')
      );
    });
  };

  const filteredData = filterData();
  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedUniversity,
    selectedLocation,
    selectedProgramType,
    selectedDuration,
    selectedIELTS,
    selectedTOEFL,
    selectedGRE
  ]);

  useEffect(() => {
    setSelectedUniversity([]);
  }, [selectedLocation]);

  const handleUniversityChange = (newValue: MultiValue<OptionType>) => {
    setSelectedUniversity(Array.from(newValue));
  };

  const handleLocationChange = (newValue: MultiValue<OptionType>) => {
    setSelectedLocation(Array.from(newValue));
  };

  const handleProgramTypeChange = (newValue: MultiValue<OptionType>) => {
    setSelectedProgramType(Array.from(newValue));
  };

  const handleDurationChange = (newValue: MultiValue<OptionType>) => {
    setSelectedDuration(Array.from(newValue));
  };

  const handleIELTSChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setSelectedIELTS(value);
  };

  const handleTOEFLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    setSelectedTOEFL(value);
  };

  const handleGREChange = (newValue: MultiValue<OptionType>) => {
    setSelectedGRE(Array.from(newValue));
  };

  return (
    <div className="selector-app">
      {/* 页面头部 */}
      <div className="selector-header">
        <Link to="/" className="back-to-home">← 返回首页</Link>
        <div className="header-content">
          <h2>英港新-商科硕士项目-申请数据库</h2>
          <p>猿人安妮 Anna Cao - 独立制作与维护, 持续更新中</p>
        </div>
      </div>

      {/* 筛选器使用说明 */}
      <div className="usage-info">
        <div className="info-title">📖 筛选器使用说明</div>
        <div className="info-content">
          <div style={{marginBottom: '1rem'}}>
            <strong>🎯 如何使用筛选器：</strong>
          </div>
          
          <div style={{marginBottom: '0.8rem'}}>
            <strong>1️⃣ 地区与学校筛选：</strong><br/>
            • 先选择心仪地区（香港/新加坡），学校列表会自动筛选<br/>
            • 可同时选择多个地区和学校进行对比
          </div>
          
          <div style={{marginBottom: '0.8rem'}}>
            <strong>2️⃣ 项目筛选：</strong><br/>
            • <strong>项目类型</strong>：选择感兴趣的专业方向（Finance、BA、Economics等）<br/>
            • <strong>学制</strong>：根据时间安排选择1年制、1.5年制或2年制项目
          </div>
          
          <div style={{marginBottom: '0.8rem'}}>
            <strong>3️⃣ 语言成绩筛选（重要❗）：</strong><br/>
            • 拖动滑块设置你的<strong>实际分数</strong>，系统会显示要求≤你分数的项目<br/>
            • <strong>雅思和托福可同时设置</strong>，满足任一条件的项目都会显示<br/>
            • 包含"不要求"和"可选"的项目会自动显示<br/>
            • 可点击"清除"按钮重置语言筛选
          </div>
          
          <div style={{marginBottom: '0.8rem'}}>
            <strong>4️⃣ 查看结果：</strong><br/>
            • 在"字段选择"中勾选想查看的信息列<br/>
            • 支持"标准视图"和"紧凑视图"切换<br/>
            • <strong>特别关注Notes列</strong>：包含小分要求、申请截止日期等重要细节
          </div>
          
          <div style={{color: '#d4a574', fontWeight: '600'}}>
            💡 <strong>使用技巧</strong>：建议先设置语言成绩，再选择地区和项目类型，这样能快速找到符合条件的项目！
          </div>
        </div>
      </div>

      <div className="filter-group">
        {/* Location */}
        <div className="filter-item">
          <label>📍 地点 Location</label>
          <Select<OptionType, true>
            options={getOptions('Location')}
            isMulti
            value={selectedLocation}
            onChange={handleLocationChange}
            components={animatedComponents}
            placeholder="选择地点..."
            menuPortalTarget={document.body}
            menuPosition="absolute"
            maxMenuHeight={200}
            styles={{ 
              menu: base => ({ 
                ...base, 
                maxHeight: '200px', 
                zIndex: 9999,
                overflowY: 'auto'
              }),
              menuList: base => ({
                ...base,
                maxHeight: '200px',
                overflowY: 'auto'
              }),
              control: base => ({ ...base, minHeight: '40px' }),
              menuPortal: base => ({ ...base, zIndex: 9999 })
            }}
            closeMenuOnSelect={false}
          />
        </div>

        {/* University */}
        <div className="filter-item">
          <label>🎓 学校 University {selectedLocation.length > 0 && <span style={{color: '#666', fontSize: '0.8rem'}}>(已根据地区筛选)</span>}</label>
          <Select<OptionType, true>
            options={getUniversityOptions()}
            isMulti
            value={selectedUniversity}
            onChange={handleUniversityChange}
            components={animatedComponents}
            placeholder={selectedLocation.length > 0 ? "选择该地区的学校..." : "请先选择地点，或直接选择学校..."}
            menuPortalTarget={document.body}
            menuPosition="absolute"
            maxMenuHeight={200}
            styles={{ 
              menu: base => ({ 
                ...base, 
                maxHeight: '200px', 
                zIndex: 9999,
                overflowY: 'auto'
              }),
              menuList: base => ({
                ...base,
                maxHeight: '200px',
                overflowY: 'auto'
              }),
              control: base => ({ ...base, minHeight: '40px' }),
              menuPortal: base => ({ ...base, zIndex: 9999 })
            }}
            closeMenuOnSelect={false}
          />
        </div>

        {/* Program Type */}
        <div className="filter-item">
          <label>📚 项目类型 ProgramType</label>
          <Select<OptionType, true>
            options={getOptions('ProgramType')}
            isMulti
            value={selectedProgramType}
            onChange={handleProgramTypeChange}
            components={animatedComponents}
            placeholder="选择项目类型..."
            menuPortalTarget={document.body}
            menuPosition="absolute"
            maxMenuHeight={200}
            styles={{ 
              menu: base => ({ 
                ...base, 
                maxHeight: '200px', 
                zIndex: 9999,
                overflowY: 'auto'
              }),
              control: base => ({ ...base, minHeight: '40px' }),
              menuPortal: base => ({ ...base, zIndex: 9999 })
            }}
            closeMenuOnSelect={false}
          />
        </div>

        {/* Duration */}
        <div className="filter-item">
          <label>📅 学制 Duration</label>
          <Select<OptionType, true>
            options={getOptions('Duration')}
            isMulti
            value={selectedDuration}
            onChange={handleDurationChange}
            components={animatedComponents}
            placeholder="选择学制..."
            menuPortalTarget={document.body}
            menuPosition="absolute"
            maxMenuHeight={200}
            styles={{ 
              menu: base => ({ 
                ...base, 
                maxHeight: '200px', 
                zIndex: 9999,
                overflowY: 'auto'
              }),
              control: base => ({ ...base, minHeight: '40px' }),
              menuPortal: base => ({ ...base, zIndex: 9999 })
            }}
            closeMenuOnSelect={false}
          />
        </div>

        {/* IELTS 拖动条 */}
        <div className="filter-item">
          <label>📝 我的IELTS分数：{selectedIELTS ? selectedIELTS.toFixed(1) : '未设置'}</label>
          <div className="slider-container">
            <input
              type="range"
              min="5.0"
              max="9.0"
              step="0.5"
              value={selectedIELTS || 5.0}
              onChange={handleIELTSChange}
              className="score-slider"
            />
            <div className="slider-labels">
              <span>5.0</span>
              <span>6.0</span>
              <span>7.0</span>
              <span>8.0</span>
              <span>9.0</span>
            </div>
            {selectedIELTS && (
              <button
                onClick={() => setSelectedIELTS(null)}
                className="clear-score-btn"
              >
                清除IELTS筛选
              </button>
            )}
          </div>
        </div>

        {/* TOEFL 拖动条 */}
        <div className="filter-item">
          <label>📝 我的TOEFL分数：{selectedTOEFL ? selectedTOEFL : '未设置'}</label>
          <div className="slider-container">
            <input
              type="range"
              min="70"
              max="120"
              step="1"
              value={selectedTOEFL || 70}
              onChange={handleTOEFLChange}
              className="score-slider"
            />
            <div className="slider-labels">
              <span>70</span>
              <span>80</span>
              <span>90</span>
              <span>100</span>
              <span>110</span>
              <span>120</span>
            </div>
            {selectedTOEFL && (
              <button
                onClick={() => setSelectedTOEFL(null)}
                className="clear-score-btn"
              >
                清除TOEFL筛选
              </button>
            )}
          </div>
        </div>

        {/* GRE */}
        <div className="filter-item">
          <label>🧪 GRE/GMAT 要求</label>
          <Select<OptionType, true>
            options={getOptions('TestRequiredGRE')}
            isMulti
            value={selectedGRE}
            onChange={handleGREChange}
            components={animatedComponents}
            placeholder="选择GRE/GMAT要求..."
            menuPortalTarget={document.body}
            menuPosition="absolute"
            maxMenuHeight={200}
            styles={{ 
              menu: base => ({ 
                ...base, 
                maxHeight: '200px', 
                zIndex: 9999,
                overflowY: 'auto'
              }),
              control: base => ({ ...base, minHeight: '40px' }),
              menuPortal: base => ({ ...base, zIndex: 9999 })
            }}
            closeMenuOnSelect={false}
          />
        </div>
      </div>

      {/* 清除所有筛选按钮 */}
      <div className="clear-filters">
        <button 
          onClick={() => {
            setSelectedLocation([]);
            setSelectedUniversity([]);
            setSelectedProgramType([]);
            setSelectedDuration([]);
            setSelectedIELTS(null);
            setSelectedTOEFL(null);
            setSelectedGRE([]);
          }}
          className="clear-button"
        >
          🗑️ 清除所有筛选
        </button>
        <div className="results-count">
          共找到 {filteredData.length} 个项目
        </div>
      </div>

      {/* 筛选状态显示 */}
      {(selectedIELTS !== null || selectedTOEFL !== null) && (
        <div className="language-filter-status">
          <div className="status-title">🎯 当前语言测试筛选条件</div>
          <div className="status-content">
            {selectedIELTS !== null && selectedTOEFL !== null && (
              <div><strong>满足以下任一条件即可：</strong></div>
            )}
            {selectedIELTS !== null && (
              <div>• IELTS：显示要求≤{selectedIELTS.toFixed(1)}分的项目</div>
            )}
            {selectedTOEFL !== null && (
              <div>• TOEFL：显示要求≤{selectedTOEFL}分的项目</div>
            )}
            <div className="status-note">
              包含"Not Required"和"Optional"的项目
            </div>
          </div>
        </div>
      )}

      {/* 字段选择器 */}
      <FieldSelector
        allFields={allFields}
        selectedFields={selectedFields}
        onChange={setSelectedFields}
      />

      {/* 结果表格 */}
      <ResultTable data={pagedData} selectedFields={selectedFields} />

      {/* 分页器 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
            disabled={currentPage === 1}
          >
            上一页
          </button>
          <span>
            第 {currentPage} 页 / 共 {totalPages} 页 ({filteredData.length} 条结果)
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
            disabled={currentPage === totalPages}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectorApp;