import React from 'react';

interface Props {
  allFields: string[];
  selectedFields: string[];
  onChange: (fields: string[]) => void;
}

export default function FieldSelector({ allFields, selectedFields, onChange }: Props) {
  // 字段中文名称映射（与 ResultTable.tsx 保持一致）
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
    // 新增六个备注字段的中文标签
    'LanguageSpecialRequirements': '语言特殊要求',
    'ApplicantBackgroundRequirements': '申请者背景要求',
    'ApplicantDegreeRequirements': '申请者学位要求',
    'ProgramFeatures': '项目特色',
    'CurriculumSetup': '课程设置',
    'OtherImportantInfo': '其他重要信息'
  };

  // 固定的字段显示顺序（与 ResultTable.tsx 保持一致）
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
    // 新增的六个备注字段
    'LanguageSpecialRequirements',
    'ApplicantBackgroundRequirements',
    'ApplicantDegreeRequirements',
    'ProgramFeatures',
    'CurriculumSetup',
    'OtherImportantInfo'
  ];

  // 过滤掉 ProgramID，并按照固定顺序排列
  const displayFields = FIELD_ORDER.filter(field => allFields.includes(field));

  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      onChange(selectedFields.filter(f => f !== field));
    } else {
      onChange([...selectedFields, field]);
    }
  };

  // 全选功能（不包括 ProgramID）
  const selectAll = () => {
    onChange(displayFields);
  };

  // 全不选功能
  const selectNone = () => {
    onChange([]);
  };

  // 判断是否全选（不包括 ProgramID）
  const isAllSelected = selectedFields.length === displayFields.length && 
    displayFields.every(field => selectedFields.includes(field));

  // 快捷选择功能
  const selectBasicFields = () => {
    const basicFields = [
      'University',
      'ProgramName',
      'Duration',
      'DeadlineRounds',
      'LanguageTestIELTS',
      'LanguageTestTOEFL',
      'TuitionFeeCNY',
      'QSRank',
      'Notes'
    ];
    onChange(basicFields.filter(field => displayFields.includes(field)));
  };

  const selectDetailedFields = () => {
    const detailedFields = [
      'University',
      'Location',
      'ProgramName',
      'ProgramType',
      'Duration',
      'DeadlineRounds',
      'LanguageTestIELTS',
      'LanguageTestTOEFL',
      'TuitionFeeCNY',
      'QSRank',
      'Notes',
      'LanguageSpecialRequirements',
      'ApplicantBackgroundRequirements',
      'ApplicantDegreeRequirements',
      'ProgramFeatures'
    ];
    onChange(detailedFields.filter(field => displayFields.includes(field)));
  };

  return (
    <div style={{ margin: '1rem 0' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '0.5rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <strong>选择要显示的字段：</strong>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ 
            fontSize: '0.9rem', 
            color: '#666',
            marginRight: '1rem'
          }}>
            已选择 {selectedFields.length} / {displayFields.length} 个字段
          </span>
          <button 
            onClick={selectAll}
            disabled={isAllSelected}
            style={{
              padding: '4px 8px',
              fontSize: '0.8rem',
              border: '1px solid #007bff',
              backgroundColor: isAllSelected ? '#e9ecef' : '#007bff',
              color: isAllSelected ? '#6c757d' : 'white',
              borderRadius: '4px',
              cursor: isAllSelected ? 'not-allowed' : 'pointer'
            }}
          >
            全选
          </button>
          <button 
            onClick={selectNone}
            disabled={selectedFields.length === 0}
            style={{
              padding: '4px 8px',
              fontSize: '0.8rem',
              border: '1px solid #dc3545',
              backgroundColor: selectedFields.length === 0 ? '#e9ecef' : '#dc3545',
              color: selectedFields.length === 0 ? '#6c757d' : 'white',
              borderRadius: '4px',
              cursor: selectedFields.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            全不选
          </button>
          <button 
            onClick={selectBasicFields}
            style={{
              padding: '4px 8px',
              fontSize: '0.8rem',
              border: '1px solid #28a745',
              backgroundColor: '#28a745',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            基础信息
          </button>
          <button 
            onClick={selectDetailedFields}
            style={{
              padding: '4px 8px',
              fontSize: '0.8rem',
              border: '1px solid #17a2b8',
              backgroundColor: '#17a2b8',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            详细信息
          </button>
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '0.5rem',
        padding: '1rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa'
      }}>
        {displayFields.map((field) => {
          // 为新增的六个备注字段添加特殊标记
          const isNewNoteField = [
            'LanguageSpecialRequirements',
            'ApplicantBackgroundRequirements',
            'ApplicantDegreeRequirements',
            'ProgramFeatures',
            'CurriculumSetup',
            'OtherImportantInfo'
          ].includes(field);
          
          return (
            <label 
              key={field}
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '2px',
                transition: 'background-color 0.2s',
                backgroundColor: isNewNoteField ? 'rgba(23, 162, 184, 0.1)' : 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isNewNoteField ? 'rgba(23, 162, 184, 0.2)' : '#e9ecef'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isNewNoteField ? 'rgba(23, 162, 184, 0.1)' : 'transparent'}
            >
              <input
                type="checkbox"
                checked={selectedFields.includes(field)}
                onChange={() => toggleField(field)}
                style={{ marginRight: '0.5rem' }}
              />
              <span style={{ 
                fontSize: '0.9rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: selectedFields.includes(field) ? '600' : 'normal',
                color: isNewNoteField ? '#0c5460' : 'inherit'
              }}>
                {FIELD_LABELS[field] || field}
                {isNewNoteField && <span style={{ marginLeft: '4px', fontSize: '0.75rem' }}>📌</span>}
              </span>
            </label>
          );
        })}
      </div>
      
      <div style={{
        marginTop: '0.5rem',
        padding: '0.5rem',
        backgroundColor: 'rgba(23, 162, 184, 0.1)',
        borderRadius: '4px',
        fontSize: '0.85rem',
        color: '#0c5460'
      }}>
        💡 提示：带有 📌 标记的是新增的详细备注字段，包含语言特殊要求、申请者背景要求、学位要求、项目特色、课程设置等重要信息。
      </div>
    </div>
  );
}