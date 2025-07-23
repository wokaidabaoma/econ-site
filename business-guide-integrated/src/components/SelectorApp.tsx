import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const { data: programData, loading, error, retry } = useCSV(csvUrl);
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<OptionType[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<OptionType[]>([]);
  const [selectedProgramType, setSelectedProgramType] = useState<OptionType[]>([]);
  const [selectedQSRank, setSelectedQSRank] = useState<OptionType[]>([]);
  
  const [selectedIELTS, setSelectedIELTS] = useState<number | null>(null);
  const [selectedTOEFL, setSelectedTOEFL] = useState<number | null>(null);
  
  const [selectedGRE, setSelectedGRE] = useState<OptionType[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 分享功能相关状态
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isSharedView, setIsSharedView] = useState(false);
  const [shareSource, setShareSource] = useState<string>('');

  const allFields = useMemo(
    () => {
      try {
        return (programData && programData.length > 0 && programData[0]) ? Object.keys(programData[0]) : [];
      } catch (error) {
        console.error('获取字段列表时出错:', error);
        return [];
      }
    },
    [programData]
  );

  // 生成分享URL
  const generateShareUrl = () => {
    const params = new URLSearchParams();
    
    // 编码筛选条件
    if (selectedLocation.length > 0) {
      params.set('locations', selectedLocation.map(opt => opt.value).join(','));
    }
    if (selectedUniversity.length > 0) {
      params.set('universities', selectedUniversity.map(opt => opt.value).join(','));
    }
    if (selectedProgramType.length > 0) {
      params.set('programTypes', selectedProgramType.map(opt => opt.value).join(','));
    }
    if (selectedQSRank.length > 0) {
      params.set('qsRanks', selectedQSRank.map(opt => opt.value).join(','));
    }
    if (selectedIELTS !== null) {
      params.set('ielts', selectedIELTS.toString());
    }
    if (selectedTOEFL !== null) {
      params.set('toefl', selectedTOEFL.toString());
    }
    if (selectedGRE.length > 0) {
      params.set('gre', selectedGRE.map(opt => opt.value).join(','));
    }
    if (selectedFields.length > 0) {
      params.set('fields', selectedFields.join(','));
    }
    
    // 添加分享标识
    params.set('shared', '1');
    params.set('sharedAt', Date.now().toString());
    
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?${params.toString()}`;
  };

  // 从URL解析分享的筛选条件
  const parseSharedFilters = () => {
    const urlParams = new URLSearchParams(location.search);
    
    if (urlParams.get('shared') === '1') {
      setIsSharedView(true);
      setShareSource('一位热心用户');
      
      // 解析并应用筛选条件
      const locations = urlParams.get('locations');
      if (locations) {
        const locationOpts = locations.split(',').map(val => ({ value: val, label: val }));
        setSelectedLocation(locationOpts);
      }
      
      const universities = urlParams.get('universities');
      if (universities) {
        const universityOpts = universities.split(',').map(val => ({ value: val, label: val }));
        setSelectedUniversity(universityOpts);
      }
      
      const programTypes = urlParams.get('programTypes');
      if (programTypes) {
        const programTypeOpts = programTypes.split(',').map(val => ({ value: val, label: val }));
        setSelectedProgramType(programTypeOpts);
      }
      
      const qsRanks = urlParams.get('qsRanks');
      if (qsRanks) {
        const qsRankOpts = qsRanks.split(',').map(val => ({ value: val, label: val === '50' ? '前50名' : val === '100' ? '前100名' : '前200名' }));
        setSelectedQSRank(qsRankOpts);
      }
      
      const ielts = urlParams.get('ielts');
      if (ielts) {
        setSelectedIELTS(parseFloat(ielts));
      }
      
      const toefl = urlParams.get('toefl');
      if (toefl) {
        setSelectedTOEFL(parseInt(toefl));
      }
      
      const gre = urlParams.get('gre');
      if (gre) {
        const greOpts = gre.split(',').map(val => ({ value: val, label: val }));
        setSelectedGRE(greOpts);
      }
      
      const fields = urlParams.get('fields');
      if (fields) {
        setSelectedFields(fields.split(','));
      }
    }
  };

  // 处理分享按钮点击
  const handleShare = () => {
    const url = generateShareUrl();
    setShareUrl(url);
    setShowShareDialog(true);
  };

  // 复制分享链接
  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('✅ 分享链接已复制到剪贴板！\n\n快去分享给你的朋友们吧～');
    } catch (err) {
      // 降级处理
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('✅ 分享链接已复制！');
    }
  };

  // 分享到微信
  const shareToWeChat = () => {
    // 生成一个简短的分享文案
    const filteredCount = filterData().length;
    const shareText = `🎓 我用猿人之家筛选器找到了 ${filteredCount} 个合适的硕士项目！\n\n✨ 筛选条件：\n${selectedLocation.length > 0 ? `📍 地区：${selectedLocation.map(l => l.label).join('、')}\n` : ''}${selectedProgramType.length > 0 ? `📚 专业：${selectedProgramType.map(p => p.label).join('、')}\n` : ''}${selectedIELTS ? `📝 IELTS：${selectedIELTS}\n` : ''}${selectedTOEFL ? `📝 TOEFL：${selectedTOEFL}\n` : ''}\n点击链接查看详细结果：\n${shareUrl}\n\n#硕士申请 #留学规划 #猿人之家`;
    
    // 复制文案和链接
    navigator.clipboard.writeText(shareText).then(() => {
      alert('✅ 分享内容已复制！\n\n包含筛选结果和链接，可以直接粘贴到微信～');
    });
  };

  // 重置筛选条件
  const resetFilters = () => {
    setSelectedLocation([]);
    setSelectedUniversity([]);
    setSelectedProgramType([]);
    setSelectedQSRank([]);
    setSelectedIELTS(null);
    setSelectedTOEFL(null);
    setSelectedGRE([]);
    setSelectedFields([]);
    setIsSharedView(false);
    
    // 清除URL参数
    navigate(location.pathname, { replace: true });
  };

  const getOptions = (field: string): OptionType[] => {
    // 数据未加载完成时返回空数组
    if (!programData || programData.length === 0) {
      return [];
    }
    
    try {
      const values = new Set(
        programData
          .map(item => item && item[field])
          .filter(value => value !== null && value !== undefined && value !== '' && value !== 'undefined')
      );
      
      const optionsArray = Array.from(values).map(v => ({ 
        value: String(v).trim(), 
        label: String(v).trim() 
      }));
      
      return optionsArray.sort((a, b) => a.label.localeCompare(b.label));
    } catch (error) {
      console.error('获取选项时出错:', error);
      return [];
    }
  };

  // QS排名筛选选项
  const getQSRankOptions = (): OptionType[] => {
    return [
      { value: '50', label: '前50名' },
      { value: '100', label: '前100名' },
      { value: '200', label: '前200名' }
    ];
  };

  const getUniversityOptions = (): OptionType[] => {
    // 数据未加载完成时返回空数组
    if (!programData || programData.length === 0) {
      return [];
    }
    
    try {
      let filteredData = programData;
      
      if (selectedLocation.length > 0) {
        filteredData = programData.filter(item => 
          item && selectedLocation.some(loc => String(item['Location']).trim() === loc.value)
        );
      }
      
      const values = new Set(
        filteredData
          .map(item => item && item['University'])
          .filter(value => value !== null && value !== undefined && value !== '' && value !== 'undefined')
      );
      
      const optionsArray = Array.from(values).map(v => ({ 
        value: String(v).trim(), 
        label: String(v).trim() 
      }));
      
      return optionsArray.sort((a, b) => a.label.localeCompare(b.label));
    } catch (error) {
      console.error('获取大学选项时出错:', error);
      return [];
    }
  };

  const extractScore = (str: string): number => {
    if (!str) return 0;
    const match = str.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const extractQSRank = (str: string): number => {
    if (!str) return 999;
    const cleanStr = String(str).trim();
    if (cleanStr === '-' || cleanStr === '' || cleanStr.toLowerCase() === 'n/a') return 999;
    const match = cleanStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 999;
  };

  const filterData = () => {
    // 数据未加载完成时返回空数组
    if (!programData || programData.length === 0) {
      return [];
    }
    
    return programData.filter(row => {
      // 确保 row 存在
      if (!row) return false;
      
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

      const matchQSRank = () => {
        if (selectedQSRank.length === 0) return true;
        
        const rowQSRank = extractQSRank(row['QSRank']);
        
        // 获取选中的最大排名范围
        const maxRank = Math.max(...selectedQSRank.map(option => parseInt(option.value)));
        
        return rowQSRank <= maxRank;
      };

      const match = (selected: OptionType[], field: string) =>
        selected.length === 0 || selected.some(opt => String(row[field]) === opt.value);

      return (
        match(selectedLocation, 'Location') &&
        match(selectedUniversity, 'University') &&
        match(selectedProgramType, 'ProgramType') &&
        matchQSRank() &&
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
    selectedQSRank,
    selectedIELTS,
    selectedTOEFL,
    selectedGRE
  ]);

  useEffect(() => {
    setSelectedUniversity([]);
  }, [selectedLocation]);

  // 页面加载时解析分享参数
  useEffect(() => {
    if (location.search) {
      parseSharedFilters();
    }
  }, [location.search]);

  const handleUniversityChange = (newValue: MultiValue<OptionType>) => {
    setSelectedUniversity(Array.from(newValue));
  };

  const handleLocationChange = (newValue: MultiValue<OptionType>) => {
    setSelectedLocation(Array.from(newValue));
  };

  const handleProgramTypeChange = (newValue: MultiValue<OptionType>) => {
    setSelectedProgramType(Array.from(newValue));
  };

  const handleQSRankChange = (newValue: MultiValue<OptionType>) => {
    setSelectedQSRank(Array.from(newValue));
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

  // 加载状态显示
  if (loading) {
    return (
      <div className="selector-app">
        <div className="selector-header">
          <Link to="/" className="back-to-home">← 返回首页</Link>
          <div className="header-content">
            <h2>英港新-商科硕士项目-申请数据库</h2>
            <p>猿人安妮 Anna Cao - 独立制作与维护, 持续更新中</p>
          </div>
        </div>
        
        <div className="loading-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          minHeight: '300px'
        }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>
            {error || '正在加载项目数据...'}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#888' }}>
            首次加载可能需要几秒钟，请耐心等待
          </p>
        </div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 错误状态显示
  if (error && !loading) {
    return (
      <div className="selector-app">
        <div className="selector-header">
          <Link to="/" className="back-to-home">← 返回首页</Link>
          <div className="header-content">
            <h2>英港新-商科硕士项目-申请数据库</h2>
            <p>猿人安妮 Anna Cao - 独立制作与维护, 持续更新中</p>
          </div>
        </div>
        
        <div className="error-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          minHeight: '300px'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>⚠️</div>
          <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>
            数据加载失败
          </h3>
          <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </p>
          <button
            onClick={retry}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🔄 重新加载
          </button>
          <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '1rem' }}>
            如果问题持续，请尝试刷新页面或稍后再试
          </p>
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
          <h2>英港新-商科硕士项目-申请数据库</h2>
          <p>猿人安妮 Anna Cao - 独立制作与维护, 持续更新中</p>
        </div>
      </div>

      {/* 分享来源提示 */}
      {isSharedView && (
        <div style={{
          background: 'linear-gradient(135deg, #f8f6f0 0%, #f4f2ed 100%)',
          border: '1px solid rgba(181, 160, 130, 0.3)',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          margin: '1rem 0',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            🎉 这是{shareSource}分享的筛选结果
          </div>
          <p style={{ 
            margin: 0, 
            fontSize: '0.9rem', 
            color: 'var(--text-secondary)' 
          }}>
            已为你自动应用筛选条件，你也可以继续调整或分享给其他人
          </p>
          <button
            onClick={resetFilters}
            style={{
              marginTop: '0.5rem',
              padding: '0.4rem 1rem',
              background: 'linear-gradient(135deg, #d4c5a9, #c9b896)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            🔄 重新开始筛选
          </button>
        </div>
      )}

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
            • <strong>QS排名</strong>：按学校排名筛选（前50包含在前100中，前100包含在前200中）
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
            💡 <strong>使用技巧</strong>：建议先设置语言成绩和QS排名，再选择地区和项目类型，这样能快速找到符合条件的项目！
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
            placeholder={loading ? "加载中..." : "选择地点..."}
            noOptionsMessage={() => loading ? "数据加载中..." : "无可用选项"}
            isLoading={loading}
            loadingMessage={() => "正在加载选项..."}
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
            isClearable={true}
            backspaceRemovesValue={true}
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
            placeholder={loading ? "加载中..." : (selectedLocation.length > 0 ? "选择该地区的学校..." : "请先选择地点，或直接选择学校...")}
            noOptionsMessage={() => loading ? "数据加载中..." : (selectedLocation.length > 0 ? "该地区暂无学校数据" : "请先选择地点")}
            isLoading={loading}
            loadingMessage={() => "正在加载选项..."}
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

        {/* QS Rank */}
        <div className="filter-item">
          <label>🏆 QS排名 QSRank</label>
          <Select<OptionType, true>
            options={getQSRankOptions()}
            isMulti
            value={selectedQSRank}
            onChange={handleQSRankChange}
            components={animatedComponents}
            placeholder="选择排名范围..."
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
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            color: '#666',
            fontStyle: 'italic'
          }}>
            💡 提示：前50包含在前100中，前100包含在前200中
          </div>
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

      {/* 清除所有筛选和分享按钮 */}
      <div className="clear-filters">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              setSelectedLocation([]);
              setSelectedUniversity([]);
              setSelectedProgramType([]);
              setSelectedQSRank([]);
              setSelectedIELTS(null);
              setSelectedTOEFL(null);
              setSelectedGRE([]);
            }}
            className="clear-button"
          >
            🗑️ 清除所有筛选
          </button>
          
          {/* 分享按钮 */}
          {filteredData.length > 0 && (
            <button 
              onClick={handleShare}
              className="clear-button"
              style={{ 
                background: 'linear-gradient(135deg, #c8b59c, #b5a082)',
                color: 'white'
              }}
            >
              🔗 分享筛选结果
            </button>
          )}
        </div>
        
        <div className="results-count">
          共找到 {filteredData.length} 个项目
        </div>
      </div>

      {/* 分享对话框 */}
      {showShareDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }} onClick={() => setShowShareDialog(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              color: 'var(--text-primary)',
              textAlign: 'center'
            }}>
              🎉 分享你的筛选结果
            </h3>
            
            <p style={{ 
              textAlign: 'center', 
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem'
            }}>
              已为你生成专属分享链接，包含当前所有筛选条件
            </p>
            
            <div style={{
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              wordBreak: 'break-all',
              fontSize: '0.9rem',
              border: '1px solid #dee2e6'
            }}>
              {shareUrl}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <button
                onClick={copyShareUrl}
                style={{
                  background: 'linear-gradient(135deg, #d4c5a9, #c9b896)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  flex: '1',
                  minWidth: '120px'
                }}
              >
                📋 复制链接
              </button>
              
              <button
                onClick={shareToWeChat}
                style={{
                  background: 'linear-gradient(135deg, #b8a690, #a89478)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  flex: '1',
                  minWidth: '120px'
                }}
              >
                💬 微信分享
              </button>
              
              <button
                onClick={() => setShowShareDialog(false)}
                style={{
                  background: 'linear-gradient(135deg, #9d8869, #8a7653)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  flex: '1',
                  minWidth: '80px'
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QS排名筛选状态显示 */}
      {selectedQSRank.length > 0 && (
        <div className="language-filter-status">
          <div className="status-title">🏆 当前QS排名筛选条件</div>
          <div className="status-content">
            <div>
              <strong>显示排名范围：</strong> 
              QS排名 ≤ {Math.max(...selectedQSRank.map(option => parseInt(option.value)))} 的学校
            </div>
            <div className="status-note">
              已选择：{selectedQSRank.map(option => option.label).join('、')}
            </div>
          </div>
        </div>
      )}

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