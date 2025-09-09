// src/components/DetailedTableView.tsx

import React, { useState, useEffect } from 'react';
import { 
  EnhancedApplication,
  ApplicationStatus,
  ApplicationRound,
  TestStatus,
  TestRequirement,
  RecommendationStatus,
  DocumentStatus,
  InterviewStatus,
  ApplicationTier,
  Recommender,
  APPLICATION_STATUS_LABELS,
  TEST_STATUS_LABELS,
  RECOMMENDATION_STATUS_LABELS,
  DOCUMENT_STATUS_LABELS,
  INTERVIEW_STATUS_LABELS,
  APPLICATION_TIER_LABELS,
  APPLICATION_ROUND_LABELS,
  STATUS_COLORS,
  TIER_COLORS
} from '../types/enhancedApplication';
import { StatsReport, ClipboardCheck } from 'iconoir-react';
import './DetailedTableView.css';
import './ApplicationTracker.css';

interface DetailedTableViewProps {
  applications: EnhancedApplication[];
  recommenders: Recommender[];
  onApplicationUpdate: (appId: string, updates: Partial<EnhancedApplication>) => void;
  onDeleteApplication: (appId: string) => void;
  onAddRecommender: (recommender: Omit<Recommender, 'id'>) => Recommender;
}

const DetailedTableView: React.FC<DetailedTableViewProps> = ({
  applications,
  recommenders,
  onApplicationUpdate,
  onDeleteApplication,
  onAddRecommender
}) => {
  const [editingCell, setEditingCell] = useState<{appId: string, field: string} | null>(null);
  const [showRecommenderModal, setShowRecommenderModal] = useState(false);
  const [currentAppId, setCurrentAppId] = useState<string>('');
  const [newRecommender, setNewRecommender] = useState({
    name: '',
    title: '',
    institution: '',
    email: '',
    relationship: ''
  });

  // 计算截止日期的剩余天数
  const getDaysUntilDeadline = (deadline: Date): number => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 获取截止日期的显示样式
  const getDeadlineStyle = (deadline: Date) => {
    const days = getDaysUntilDeadline(deadline);
    if (days < 0) return { color: '#dc3545', fontWeight: 'bold' }; // 已过期 - 红色
    if (days <= 7) return { color: '#fd7e14', fontWeight: 'bold' }; // 一周内 - 橙色
    if (days <= 30) return { color: '#ffc107', fontWeight: 'bold' }; // 一月内 - 黄色
    return { color: '#28a745' }; // 充足时间 - 绿色
  };

  // 处理推荐人状态更新
  const handleRecommendationStatusUpdate = (appId: string, reqIndex: number, newStatus: RecommendationStatus) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const updatedRequirements = [...app.recommendationRequirements];
    if (updatedRequirements[reqIndex]) {
      updatedRequirements[reqIndex] = {
        ...updatedRequirements[reqIndex],
        status: newStatus,
        invitedDate: newStatus !== RecommendationStatus.NOT_INVITED && !updatedRequirements[reqIndex].invitedDate 
          ? new Date() : updatedRequirements[reqIndex].invitedDate,
        submittedDate: newStatus === RecommendationStatus.COMPLETED 
          ? new Date() : undefined
      };
    }

    onApplicationUpdate(appId, { recommendationRequirements: updatedRequirements });
  };

  // 处理推荐人分配
  const handleRecommenderAssignment = (appId: string, reqIndex: number, recommenderId: string) => {
    const app = applications.find(a => a.id === appId);
    const recommender = recommenders.find(r => r.id === recommenderId);
    if (!app || !recommender) return;

    const updatedRequirements = [...app.recommendationRequirements];
    
    // 确保有足够的推荐信位置
    while (updatedRequirements.length <= reqIndex) {
      updatedRequirements.push({
        id: `req_${Date.now()}_${updatedRequirements.length}`,
        recommenderId: '',
        recommenderName: '',
        status: RecommendationStatus.NOT_INVITED
      });
    }

    updatedRequirements[reqIndex] = {
      ...updatedRequirements[reqIndex],
      recommenderId: recommender.id,
      recommenderName: recommender.name
    };

    onApplicationUpdate(appId, { recommendationRequirements: updatedRequirements });
  };

  // 添加或更新语言考试
  const handleAddLanguageTest = (appId: string, testType: 'TOEFL' | 'IELTS') => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    // 检查是否已存在该类型的考试
    const existingTestIndex = app.languageTests.findIndex(test => test.type === testType);
    
    if (existingTestIndex >= 0) {
      // 如果已存在，不添加新的，提示用户
      alert(`${testType}考试要求已存在，请在现有项目中修改`);
      return;
    }

    const newTest = {
      type: testType,
      requirement: TestRequirement.REQUIRED,
      minScore: 'TBD',
      status: TestStatus.NOT_TAKEN
    };

    const updatedTests = [...app.languageTests, newTest];
    onApplicationUpdate(appId, { languageTests: updatedTests });
  };

  // 删除语言考试
  const handleRemoveLanguageTest = (appId: string, testIndex: number) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const updatedTests = app.languageTests.filter((_, idx) => idx !== testIndex);
    onApplicationUpdate(appId, { languageTests: updatedTests });
  };

  // 添加或更新标化考试
  const handleAddStandardizedTest = (appId: string, testType: 'GRE' | 'GMAT') => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    // 检查是否已存在该类型的考试
    const existingTestIndex = app.standardizedTests.findIndex(test => test.type === testType);
    
    if (existingTestIndex >= 0) {
      // 如果已存在，不添加新的，提示用户
      alert(`${testType}考试要求已存在，请在现有项目中修改`);
      return;
    }

    const newTest = {
      type: testType,
      requirement: TestRequirement.RECOMMENDED,
      status: TestStatus.NOT_TAKEN
    };

    const updatedTests = [...app.standardizedTests, newTest];
    onApplicationUpdate(appId, { standardizedTests: updatedTests });
  };

  // 删除标化考试
  const handleRemoveStandardizedTest = (appId: string, testIndex: number) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const updatedTests = app.standardizedTests.filter((_, idx) => idx !== testIndex);
    onApplicationUpdate(appId, { standardizedTests: updatedTests });
  };

  // 添加新推荐人
  const handleAddRecommender = () => {
    if (!newRecommender.name || !newRecommender.email) {
      alert('请填写推荐人姓名和邮箱');
      return;
    }

    const addedRecommender = onAddRecommender(newRecommender);
    
    // 如果有当前应用ID，自动分配给该应用
    if (currentAppId) {
      const app = applications.find(a => a.id === currentAppId);
      if (app) {
        const emptyIndex = app.recommendationRequirements.findIndex(req => !req.recommenderId);
        if (emptyIndex !== -1) {
          handleRecommenderAssignment(currentAppId, emptyIndex, addedRecommender.id);
        }
      }
    }

    // 重置表单
    setNewRecommender({
      name: '',
      title: '',
      institution: '',
      email: '',
      relationship: ''
    });
    setShowRecommenderModal(false);
    setCurrentAppId('');
  };

  // 渲染下拉选择器
  const renderSelect = (
    appId: string,
    field: string,
    currentValue: any,
    options: Record<string, string>,
    onChange: (value: any) => void
  ) => (
    <select
      value={currentValue}
      onChange={(e) => onChange(e.target.value)}
      style={{
        border: 'none',
        background: 'transparent',
        width: '100%',
        padding: '2px',
        fontSize: '0.8rem'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {Object.entries(options).map(([value, label]) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );

  // 渲染推荐人单元格
  const renderRecommenderCell = (app: EnhancedApplication, reqIndex: number) => {
    // 确保推荐信要求数组有足够的长度
    const requirements = [...app.recommendationRequirements];
    while (requirements.length < 3) {
      requirements.push({
        id: `req_${Date.now()}_${requirements.length}`,
        recommenderId: '',
        recommenderName: '',
        status: RecommendationStatus.NOT_INVITED
      });
    }

    const req = requirements[reqIndex];
    const recommender = recommenders.find(r => r.id === req.recommenderId);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
        {/* 推荐人选择 */}
        <select
          value={req.recommenderId || ''}
          onChange={(e) => {
            if (e.target.value === 'add_new') {
              setCurrentAppId(app.id);
              setShowRecommenderModal(true);
            } else {
              handleRecommenderAssignment(app.id, reqIndex, e.target.value);
            }
          }}
          style={{
            fontSize: '0.7rem',
            padding: '2px',
            border: '1px solid #ddd',
            borderRadius: '3px'
          }}
        >
          <option value="">选择推荐人</option>
          {recommenders.map(rec => (
            <option key={rec.id} value={rec.id}>
              {rec.name} ({rec.title})
            </option>
          ))}
          <option value="add_new">+ 添加新推荐人</option>
        </select>

        {/* 状态选择 */}
        {req.recommenderId && (
          <select
            value={req.status}
            onChange={(e) => handleRecommendationStatusUpdate(app.id, reqIndex, e.target.value as RecommendationStatus)}
            style={{
              fontSize: '0.7rem',
              padding: '2px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              backgroundColor: req.status === RecommendationStatus.COMPLETED ? '#d4edda' : 
                             req.status === RecommendationStatus.PENDING ? '#fff3cd' : '#f8f9fa'
            }}
          >
            {Object.entries(RECOMMENDATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        )}

        {/* 显示推荐人信息 */}
        {recommender && (
          <div style={{ fontSize: '0.6rem', color: '#666' }}>
            {recommender.institution && `${recommender.institution}`}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="detailed-table-view application-tracker">
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatsReport width={20} height={20} color="var(--morandi-success)" />
          详细表格视图
        </h3>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          总计 {applications.length} 个申请项目
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
        <table className="tracker-table" style={{ 
          minWidth: '1800px' // 确保表格有足够宽度
        }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '120px', maxWidth: '120px', fontSize: '0.8rem', fontWeight: 'bold' }}>学校名称</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '150px', maxWidth: '150px', fontSize: '0.8rem', fontWeight: 'bold' }}>项目名称</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '100px', fontSize: '0.8rem', fontWeight: 'bold' }}>申请轮次</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '120px', fontSize: '0.8rem', fontWeight: 'bold' }}>截止日期 (DDL)</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '120px', fontSize: '0.8rem', fontWeight: 'bold' }}>语言成绩要求</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '100px', fontSize: '0.8rem', fontWeight: 'bold' }}>语言成绩状态</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '120px', fontSize: '0.8rem', fontWeight: 'bold' }}>标化成绩要求</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '100px', fontSize: '0.8rem', fontWeight: 'bold' }}>标化送分状态</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', minWidth: '130px', fontSize: '0.8rem', fontWeight: 'bold' }}>推荐人1</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', minWidth: '130px', fontSize: '0.8rem', fontWeight: 'bold' }}>推荐人2</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', minWidth: '130px', fontSize: '0.8rem', fontWeight: 'bold' }}>推荐人3</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '100px', fontSize: '0.8rem', fontWeight: 'bold' }}>Resume 状态</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '100px', fontSize: '0.8rem', fontWeight: 'bold' }}>文书状态</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '100px', fontSize: '0.8rem', fontWeight: 'bold' }}>面试状态</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '120px', fontSize: '0.8rem', fontWeight: 'bold' }}>申请总状态</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '100px', fontSize: '0.8rem', fontWeight: 'bold' }}>申请梯队</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', minWidth: '80px', fontSize: '0.8rem', fontWeight: 'bold' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, index) => (
              <tr key={app.id} style={{ 
                borderBottom: '1px solid #dee2e6',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
              }}>
                {/* 学校名称 */}
                <td style={{ 
                  padding: '8px', 
                  fontSize: '0.8rem', 
                  fontWeight: '500',
                  maxWidth: '120px',
                  wordWrap: 'break-word',
                  whiteSpace: 'normal',
                  lineHeight: '1.2'
                }}>
                  {app.university}
                </td>

                {/* 项目名称 */}
                <td style={{ 
                  padding: '8px', 
                  fontSize: '0.8rem',
                  maxWidth: '150px',
                  wordWrap: 'break-word',
                  whiteSpace: 'normal',
                  lineHeight: '1.2'
                }}>
                  {app.programName}
                </td>

                {/* 申请轮次 */}
                <td style={{ padding: '8px' }}>
                  {renderSelect(
                    app.id,
                    'round',
                    app.dates.round,
                    APPLICATION_ROUND_LABELS,
                    (value) => onApplicationUpdate(app.id, {
                      dates: { ...app.dates, round: value as ApplicationRound }
                    })
                  )}
                </td>

                {/* 截止日期 */}
                <td style={{ padding: '8px', fontSize: '0.8rem', ...getDeadlineStyle(app.dates.applicationDeadline) }}>
                  <div>{new Date(app.dates.applicationDeadline).toLocaleDateString()}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                    {getDaysUntilDeadline(app.dates.applicationDeadline) > 0 
                      ? `${getDaysUntilDeadline(app.dates.applicationDeadline)}天后`
                      : `已过期${Math.abs(getDaysUntilDeadline(app.dates.applicationDeadline))}天`
                    }
                  </div>
                </td>

                {/* 语言成绩要求 */}
                <td style={{ padding: '8px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {app.languageTests.map((test, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '2px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '3px'
                      }}>
                        <span style={{ fontWeight: '500', fontSize: '0.7rem' }}>{test.type}</span>
                        <span style={{ fontSize: '0.7rem' }}>: {test.minScore}</span>
                        <button
                          onClick={() => handleRemoveLanguageTest(app.id, idx)}
                          className="delete-btn"
                          title="删除"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    {/* 智能添加考试按钮 - 只显示未添加的考试类型 */}
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {!app.languageTests.some(test => test.type === 'TOEFL') && (
                        <button
                          onClick={() => handleAddLanguageTest(app.id, 'TOEFL')}
                          className="add-test-btn add-test-toefl"
                        >
                          +TOEFL
                        </button>
                      )}
                      {!app.languageTests.some(test => test.type === 'IELTS') && (
                        <button
                          onClick={() => handleAddLanguageTest(app.id, 'IELTS')}
                          className="add-test-btn add-test-ielts"
                        >
                          +IELTS
                        </button>
                      )}
                      {app.languageTests.length >= 2 && (
                        <div className="all-tests-added">
                          所有考试已添加
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* 语言成绩状态 */}
                <td style={{ padding: '8px' }}>
                  {app.languageTests.map((test, idx) => (
                    <div key={idx} style={{ marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.6rem', color: '#666', marginBottom: '2px' }}>
                        {test.type}
                      </div>
                      <select
                        value={test.status}
                        onChange={(e) => {
                          const updatedTests = [...app.languageTests];
                          updatedTests[idx] = { ...test, status: e.target.value as TestStatus };
                          onApplicationUpdate(app.id, { languageTests: updatedTests });
                        }}
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px',
                          border: '1px solid #ddd',
                          borderRadius: '3px',
                          width: '100%',
                          backgroundColor: test.status === TestStatus.COMPLETED ? '#d4edda' : '#ffffff'
                        }}
                      >
                        {Object.entries(TEST_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </td>

                {/* 标化成绩要求 */}
                <td style={{ padding: '8px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {app.standardizedTests.map((test, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '2px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '3px'
                      }}>
                        <span style={{ fontWeight: '500', fontSize: '0.7rem' }}>{test.type}</span>
                        <div style={{ fontSize: '0.6rem', color: '#666' }}>
                          {test.requirement === TestRequirement.REQUIRED ? 'Req' :
                           test.requirement === TestRequirement.RECOMMENDED ? 'Rec' :
                           test.requirement === TestRequirement.OPTIONAL ? 'Opt' : 'N/A'}
                        </div>
                        <button
                          onClick={() => handleRemoveStandardizedTest(app.id, idx)}
                          className="delete-btn"
                          title="删除"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    {/* 智能添加考试按钮 - 只显示未添加的考试类型 */}
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {!app.standardizedTests.some(test => test.type === 'GRE') && (
                        <button
                          onClick={() => handleAddStandardizedTest(app.id, 'GRE')}
                          className="add-test-btn add-test-gre"
                        >
                          +GRE
                        </button>
                      )}
                      {!app.standardizedTests.some(test => test.type === 'GMAT') && (
                        <button
                          onClick={() => handleAddStandardizedTest(app.id, 'GMAT')}
                          className="add-test-btn add-test-gmat"
                        >
                          +GMAT
                        </button>
                      )}
                      {app.standardizedTests.length >= 2 && (
                        <div className="all-tests-added">
                          所有考试已添加
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* 标化送分状态 */}
                <td style={{ padding: '8px' }}>
                  {app.standardizedTests.map((test, idx) => (
                    <div key={idx} style={{ marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.6rem', color: '#666', marginBottom: '2px' }}>
                        {test.type}
                      </div>
                      <select
                        value={test.status}
                        onChange={(e) => {
                          const updatedTests = [...app.standardizedTests];
                          updatedTests[idx] = { ...test, status: e.target.value as TestStatus };
                          onApplicationUpdate(app.id, { standardizedTests: updatedTests });
                        }}
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px',
                          border: '1px solid #ddd',
                          borderRadius: '3px',
                          width: '100%',
                          backgroundColor: test.status === TestStatus.COMPLETED ? '#d4edda' : '#ffffff'
                        }}
                        disabled={test.requirement === TestRequirement.NOT_REQUIRED}
                      >
                        {Object.entries(TEST_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </td>

                {/* 推荐人 1 */}
                <td style={{ padding: '8px' }}>
                  {renderRecommenderCell(app, 0)}
                </td>

                {/* 推荐人 2 */}
                <td style={{ padding: '8px' }}>
                  {renderRecommenderCell(app, 1)}
                </td>

                {/* 推荐人 3 */}
                <td style={{ padding: '8px' }}>
                  {renderRecommenderCell(app, 2)}
                </td>

                {/* Resume 状态 */}
                <td style={{ padding: '8px' }}>
                  {renderSelect(
                    app.id,
                    'resume',
                    app.documents.resume,
                    DOCUMENT_STATUS_LABELS,
                    (value) => onApplicationUpdate(app.id, {
                      documents: { ...app.documents, resume: value as DocumentStatus }
                    })
                  )}
                </td>

                {/* 文书状态 */}
                <td style={{ padding: '8px' }}>
                  {renderSelect(
                    app.id,
                    'essays',
                    app.documents.essays,
                    DOCUMENT_STATUS_LABELS,
                    (value) => onApplicationUpdate(app.id, {
                      documents: { ...app.documents, essays: value as DocumentStatus }
                    })
                  )}
                </td>

                {/* 面试状态 */}
                <td style={{ padding: '8px' }}>
                  {renderSelect(
                    app.id,
                    'interview',
                    app.interview.status,
                    INTERVIEW_STATUS_LABELS,
                    (value) => onApplicationUpdate(app.id, {
                      interview: { ...app.interview, status: value as InterviewStatus }
                    })
                  )}
                </td>

                {/* 申请总状态 */}
                <td style={{ padding: '8px' }}>
                  <select
                    value={app.status}
                    onChange={(e) => onApplicationUpdate(app.id, { status: e.target.value as ApplicationStatus })}
                    style={{
                      fontSize: '0.8rem',
                      padding: '4px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: STATUS_COLORS[app.status] + '20',
                      color: STATUS_COLORS[app.status],
                      fontWeight: '500',
                      width: '100%'
                    }}
                  >
                    {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </td>

                {/* 申请梯队 */}
                <td style={{ padding: '8px' }}>
                  <select
                    value={app.tier}
                    onChange={(e) => onApplicationUpdate(app.id, { tier: e.target.value as ApplicationTier })}
                    style={{
                      fontSize: '0.8rem',
                      padding: '4px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: TIER_COLORS[app.tier] + '20',
                      color: TIER_COLORS[app.tier],
                      fontWeight: '500',
                      width: '100%'
                    }}
                  >
                    {Object.entries(APPLICATION_TIER_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </td>

                {/* 操作 */}
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <button
                    onClick={() => onDeleteApplication(app.id)}
                    className="tracker-btn-danger"
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem'
                    }}
                    title="删除申请"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 添加推荐人模态框 */}
      {showRecommenderModal && (
        <div className="tracker-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="tracker-modal-content" style={{
            padding: '2rem',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--primary-color)' }}>添加新推荐人</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                placeholder="推荐人姓名 *"
                value={newRecommender.name}
                onChange={(e) => setNewRecommender({...newRecommender, name: e.target.value})}
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              
              <input
                type="text"
                placeholder="职位/头衔"
                value={newRecommender.title}
                onChange={(e) => setNewRecommender({...newRecommender, title: e.target.value})}
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              
              <input
                type="text"
                placeholder="机构/公司"
                value={newRecommender.institution}
                onChange={(e) => setNewRecommender({...newRecommender, institution: e.target.value})}
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              
              <input
                type="email"
                placeholder="邮箱地址 *"
                value={newRecommender.email}
                onChange={(e) => setNewRecommender({...newRecommender, email: e.target.value})}
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              
              <input
                type="text"
                placeholder="关系 (如: 导师、上司、教授等)"
                value={newRecommender.relationship}
                onChange={(e) => setNewRecommender({...newRecommender, relationship: e.target.value})}
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowRecommenderModal(false);
                  setCurrentAppId('');
                  setNewRecommender({
                    name: '',
                    title: '',
                    institution: '',
                    email: '',
                    relationship: ''
                  });
                }}
                className="tracker-btn-primary"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px'
                }}
              >
                取消
              </button>
              
              <button
                onClick={handleAddRecommender}
                className="tracker-btn-success"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px'
                }}
              >
                添加推荐人
              </button>
            </div>
          </div>
        </div>
      )}

      {applications.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            <ClipboardCheck width={48} height={48} color="var(--morandi-text-muted)" />
          </div>
          <p>暂无申请项目</p>
          <p style={{ fontSize: '0.9rem' }}>从收藏夹导入项目开始使用详细表格功能</p>
        </div>
      )}
    </div>
  );
};

export default DetailedTableView;