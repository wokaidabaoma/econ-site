// src/components/EnhancedApplicationTracker.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  EnhancedApplication,
  ApplicationStatus,
  ApplicationTier,
  SortingCategory,
  Recommender,
  APPLICATION_STATUS_LABELS,
  APPLICATION_TIER_LABELS,
  APPLICATION_ROUND_LABELS,
  STATUS_COLORS,
  TIER_COLORS
} from '../types/enhancedApplication';
import { EnhancedApplicationStorageManager } from '../utils/enhancedApplicationStorage';
import { Import, Folder } from 'iconoir-react';
import '../App.css';
import './ApplicationTracker.css';
import DetailedTableView from './DetailedTableView';
import DraggableKanbanView from './DraggableKanbanView';

type ViewMode = 'kanban' | 'detailed';

interface StatisticsData {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  byTier: Record<ApplicationTier, number>;
  upcomingDeadlines: EnhancedApplication[];
  testProgress: {
    languageTestsCompleted: number;
    standardizedTestsCompleted: number;
    totalTests: number;
  };
  recommendationProgress: {
    completed: number;
    pending: number;
    notInvited: number;
  };
}

const EnhancedApplicationTracker: React.FC = () => {
  const [applications, setApplications] = useState<EnhancedApplication[]>([]);
  const [recommenders, setRecommenders] = useState<Recommender[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [sortingCategory, setSortingCategory] = useState<SortingCategory>(SortingCategory.TIER);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const storageManager = useMemo(() => new EnhancedApplicationStorageManager(), []);

  useEffect(() => {
    console.log('🚀 Enhanced Application Tracker component mounted');
    loadApplications();
    
    if (searchParams.get('imported') === 'true') {
      console.log('✅ Successfully imported from favorites');
    }
  }, [searchParams, storageManager]);

  const loadApplications = async () => {
    console.log('📋 Loading enhanced applications...');
    setLoading(true);
    try {
      const apps = storageManager.getApplications();
      const recs = storageManager.getRecommenders();
      setApplications(apps);
      setRecommenders(recs);
      console.log(`📋 Loaded ${apps.length} enhanced applications and ${recs.length} recommenders`);
      
      if (apps.length === 0) {
        checkForFavorites();
      }
    } catch (error) {
      console.error('❌ Failed to load enhanced applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForFavorites = () => {
    try {
      const favoritesData = localStorage.getItem('program-favorites');
      if (favoritesData) {
        const favoriteIds = JSON.parse(favoritesData);
        if (Array.isArray(favoriteIds) && favoriteIds.length > 0) {
          console.log(`💡 Found ${favoriteIds.length} favorites available for import`);
        }
      }
    } catch (error) {
      console.error('Error checking favorites:', error);
    }
  };

  const handleImportFromFavorites = () => {
    console.log('🔄 Starting enhanced import from favorites...');
    
    try {
      const favoritesData = localStorage.getItem('program-favorites');
      if (!favoritesData) {
        alert('📭 收藏夹中没有找到可导入的项目\n\n请先在项目筛选器中收藏一些项目！');
        return;
      }

      const favoriteIds = JSON.parse(favoritesData);
      if (!Array.isArray(favoriteIds) || favoriteIds.length === 0) {
        alert('📭 收藏夹中没有找到可导入的项目\n\n请先在项目筛选器中收藏一些项目！');
        return;
      }

      console.log(`📥 Found ${favoriteIds.length} favorites to import`);

      const importedApps = storageManager.importFromFavorites();
      if (importedApps.length === 0) {
        alert('❌ 导入失败：无法解析收藏数据\n\n请检查收藏的项目格式是否正确');
        return;
      }

      console.log(`✅ Successfully imported ${importedApps.length} applications`);

      const existingProgramIds = new Set(applications.map(app => app.programId).filter(Boolean));
      const newApps = importedApps.filter(app => !existingProgramIds.has(app.programId));
      
      if (newApps.length === 0) {
        alert('ℹ️ 收藏夹中的项目已经全部导入到跟踪器中了');
        return;
      }

      const updatedApps = [...applications, ...newApps];
      setApplications(updatedApps);
      storageManager.saveApplications(updatedApps, recommenders);
      
      alert(`✅ 成功导入 ${newApps.length} 个新项目到申请跟踪器！\n\n${newApps.map(app => `• ${app.university} - ${app.programName}`).join('\n')}`);
      
      console.log(`🎉 Enhanced import completed: ${newApps.length} new applications added`);
    } catch (error) {
      console.error('❌ Enhanced import failed:', error);
      alert('❌ 导入失败，请稍后重试\n\n错误详情请查看控制台');
    }
  };

  const handleStatusUpdate = (appId: string, newStatus: ApplicationStatus) => {
    console.log(`🔄 Updating status for ${appId}: ${newStatus}`);
    
    const updatedApps = applications.map(app => 
      app.id === appId 
        ? {
            ...app, 
            status: newStatus,
            updatedAt: new Date(),
            statusHistory: [...app.statusHistory, {
              status: newStatus,
              date: new Date(),
              notes: ''
            }]
          }
        : app
    );
    setApplications(updatedApps);
    storageManager.saveApplications(updatedApps, recommenders);
    
    console.log(`✅ Status updated successfully`);
  };

  const handleApplicationUpdate = (appId: string, updates: Partial<EnhancedApplication>) => {
    console.log(`🔄 Updating application ${appId}:`, updates);
    
    const updatedApps = applications.map(app => 
      app.id === appId 
        ? {
            ...app,
            ...updates,
            updatedAt: new Date()
          }
        : app
    );
    setApplications(updatedApps);
    storageManager.saveApplications(updatedApps, recommenders);
    
    console.log(`✅ Application updated successfully`);
  };

  const handleDeleteApplication = (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    if (window.confirm(`确定要删除这个申请项目吗？\n\n${app.university} - ${app.programName}\n\n此操作无法撤销。`)) {
      try {
        storageManager.deleteApplication(appId);
        setApplications(prev => prev.filter(app => app.id !== appId));
        console.log(`🗑️ Deleted application: ${app.university} - ${app.programName}`);
      } catch (error) {
        console.error('❌ Delete failed:', error);
        alert('删除失败，请稍后重试');
      }
    }
  };

  const handleAddRecommender = (recommender: Omit<Recommender, 'id'>) => {
    const newRecommender = storageManager.addRecommender(recommender);
    setRecommenders(prev => [...prev, newRecommender]);
    return newRecommender;
  };

  const getStatistics = (): StatisticsData => {
    return storageManager.getStatistics();
  };

  if (loading) {
    return (
      <div className="application-tracker">
        <div className="loading-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          color: 'var(--primary-color)'
        }}>
          <div className="loading-spinner" style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>📋</div>
          <div style={{ fontSize: '1.1rem' }}>正在加载增强版申请数据...</div>
          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
            首次使用可能需要从收藏夹导入数据
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="application-tracker" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 页面头部 */}
      <EnhancedTrackerHeader 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortingCategory={sortingCategory}
        onSortingCategoryChange={setSortingCategory}
        onImportFavorites={handleImportFromFavorites}
        onGoBack={() => navigate('/')}
        applicationCount={applications.length}
      />
      
      {/* 主要内容区域 */}
      {applications.length === 0 ? (
        <EnhancedEmptyState onImportFavorites={handleImportFromFavorites} />
      ) : (
        <EnhancedTrackerContent
          applications={applications}
          recommenders={recommenders}
          viewMode={viewMode}
          sortingCategory={sortingCategory}
          onStatusUpdate={handleStatusUpdate}
          onApplicationUpdate={handleApplicationUpdate}
          onDeleteApplication={handleDeleteApplication}
          onAddRecommender={handleAddRecommender}
          statistics={getStatistics()}
        />
      )}
    </div>
  );
};

// 增强版页面头部组件
interface EnhancedTrackerHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortingCategory: SortingCategory;
  onSortingCategoryChange: (category: SortingCategory) => void;
  onImportFavorites: () => void;
  onGoBack: () => void;
  applicationCount: number;
}

const EnhancedTrackerHeader: React.FC<EnhancedTrackerHeaderProps> = ({
  viewMode,
  onViewModeChange,
  sortingCategory,
  onSortingCategoryChange,
  onImportFavorites,
  onGoBack,
  applicationCount
}) => {
  return (
    <div className="tracker-header" style={{ marginBottom: '2rem' }}>
      {/* 面包屑导航 */}
      <div className="breadcrumb" style={{ 
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link 
          to="/"
          style={{
            color: 'var(--primary-color)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ← 返回首页
        </Link>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link 
            to="/favorites"
            style={{
              color: 'var(--primary-color)',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            ⭐ 我的收藏
          </Link>
          <Link 
            to="/selector"
            style={{
              color: 'var(--primary-color)',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            🔍 项目筛选器
          </Link>
        </div>
      </div>

      {/* 主标题 */}
      <div className="header-title-section" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          color: 'var(--primary-color)', 
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📋 增强版申请跟踪器
          {applicationCount > 0 && (
            <span style={{ 
              fontSize: '1rem', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white',
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
              fontWeight: 'normal'
            }}>
              {applicationCount}
            </span>
          )}
        </h1>
        <p style={{ color: '#666', fontSize: '1rem' }}>
          全面管理你的申请进度：轮次选择、考试状态、推荐信跟踪、面试安排等一站式管理
        </p>
      </div>

      {/* 工具栏 */}
      <div className="toolbar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* 视图切换按钮 */}
        <div className="view-switcher" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { mode: 'kanban' as ViewMode, label: '📋 看板' },
            { mode: 'detailed' as ViewMode, label: '🔍 详细表格' }
          ].map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              style={{
                padding: '0.5rem 1rem',
                border: `1px solid ${viewMode === mode ? 'var(--primary-color)' : '#ddd'}`,
                backgroundColor: viewMode === mode ? 'var(--primary-color)' : 'white',
                color: viewMode === mode ? 'white' : 'var(--primary-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 分类选择 */}
        <div className="sorting-selector" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>分类方式:</span>
          <select
            value={sortingCategory}
            onChange={(e) => onSortingCategoryChange(e.target.value as SortingCategory)}
            style={{
              padding: '0.25rem 0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            <option value={SortingCategory.TIER}>申请梯队</option>
            <option value={SortingCategory.REGION}>地区</option>
            <option value={SortingCategory.PROGRAM_TYPE}>专业类型</option>
          </select>
        </div>

        {/* 操作按钮 */}
        <div className="actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={onImportFavorites}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: 'var(--morandi-sage)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(181, 160, 130, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--morandi-taupe)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(181, 160, 130, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--morandi-sage)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(181, 160, 130, 0.2)';
            }}
          >
            <Import width={18} height={18} />
            从收藏夹导入
          </button>
        </div>
      </div>
    </div>
  );
};

// 增强版空状态组件
interface EnhancedEmptyStateProps {
  onImportFavorites: () => void;
}

const EnhancedEmptyState: React.FC<EnhancedEmptyStateProps> = ({ onImportFavorites }) => {
  const navigate = useNavigate();
  const [favoritesCount, setFavoritesCount] = useState(0);
  
  useEffect(() => {
    try {
      const favoritesData = localStorage.getItem('program-favorites');
      if (favoritesData) {
        const favoriteIds = JSON.parse(favoritesData);
        if (Array.isArray(favoriteIds)) {
          setFavoritesCount(favoriteIds.length);
        }
      }
    } catch (error) {
      console.error('Error checking favorites count:', error);
    }
  }, []);

  return (
    <div className="empty-state" style={{
      textAlign: 'center',
      padding: '4rem 2rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      border: '2px dashed #ddd'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
      <h2 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>
        开始你的增强版申请管理之旅
      </h2>
      <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
        增强版申请跟踪器提供全面功能：<br/>
        • 🎯 轮次选择和智能截止日期提醒<br/>
        • 📝 语言和标化考试状态跟踪<br/>
        • 👥 推荐信智能标签管理系统<br/>
        • 📄 文书和简历进度跟踪<br/>
        • 🎭 面试状态和安排管理<br/>
        • 🏆 项目梯队分类和拖拽排序<br/>
        • 📊 全面的申请进度统计分析
      </p>

      {favoritesCount > 0 && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          color: '#2e7d32'
        }}>
          🎉 <strong>太好了！</strong>你有 {favoritesCount} 个收藏项目可以导入到增强版跟踪器
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {favoritesCount > 0 ? (
          <>
            <button
              onClick={onImportFavorites}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              📥 导入 {favoritesCount} 个收藏项目
            </button>
            
            <button
              onClick={() => navigate('/favorites')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'white',
                color: 'var(--primary-color)',
                border: '1px solid var(--primary-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ⭐ 查看我的收藏
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/selector')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              🔍 去项目筛选器收藏项目
            </button>
            
            <button
              onClick={onImportFavorites}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'white',
                color: 'var(--primary-color)',
                border: '1px solid var(--primary-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              📥 检查收藏夹
            </button>
          </>
        )}
      </div>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#1976d2'
      }}>
        💡 <strong>增强版功能预览：</strong> 
        {favoritesCount > 0 
          ? '导入后即可体验全新的轮次管理、考试跟踪、推荐信管理等强大功能'
          : '先收藏一些项目，然后导入到增强版跟踪器中体验全面的申请管理功能'
        }
      </div>
    </div>
  );
};

// 增强版主要内容区域组件
interface EnhancedTrackerContentProps {
  applications: EnhancedApplication[];
  recommenders: Recommender[];
  viewMode: ViewMode;
  sortingCategory: SortingCategory;
  onStatusUpdate: (appId: string, status: ApplicationStatus) => void;
  onApplicationUpdate: (appId: string, updates: Partial<EnhancedApplication>) => void;
  onDeleteApplication: (appId: string) => void;
  onAddRecommender: (recommender: Omit<Recommender, 'id'>) => Recommender;
  statistics: StatisticsData;
}

const EnhancedTrackerContent: React.FC<EnhancedTrackerContentProps> = ({
  applications,
  recommenders,
  viewMode,
  sortingCategory,
  onStatusUpdate,
  onApplicationUpdate,
  onDeleteApplication,
  onAddRecommender,
  statistics
}) => {
  switch (viewMode) {
    case 'kanban':
      return (
        <DraggableKanbanView 
          applications={applications}
          sortingCategory={sortingCategory}
          onStatusUpdate={onStatusUpdate}
          onApplicationUpdate={onApplicationUpdate}
          onDeleteApplication={onDeleteApplication}
        />
      );
    case 'detailed':
      return (
        <DetailedTableView 
          applications={applications}
          recommenders={recommenders}
          onApplicationUpdate={onApplicationUpdate}
          onDeleteApplication={onDeleteApplication}
          onAddRecommender={onAddRecommender}
        />
      );
    default:
      return <div>未知视图模式</div>;
  }
};

// 增强版仪表板视图
const EnhancedDashboardView: React.FC<{
  applications: EnhancedApplication[];
  statistics: StatisticsData;
  onStatusUpdate: (appId: string, status: ApplicationStatus) => void;
}> = ({ applications, statistics, onStatusUpdate }) => {
  return (
    <div className="enhanced-dashboard-view">
      {/* 状态统计 */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>
          📊 申请状态分布
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem'
        }}>
          {Object.entries(statistics.byStatus).map(([status, count]) => (
            <div key={status} style={{
              padding: '1rem',
              backgroundColor: STATUS_COLORS[status as ApplicationStatus] + '20',
              borderRadius: '8px',
              textAlign: 'center',
              border: `2px solid ${STATUS_COLORS[status as ApplicationStatus]}40`
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold',
                color: STATUS_COLORS[status as ApplicationStatus]
              }}>
                {count}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                {APPLICATION_STATUS_LABELS[status as ApplicationStatus]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 梯队分布 */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>
          🏆 申请梯队分布
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem'
        }}>
          {Object.entries(statistics.byTier).map(([tier, count]) => (
            <div key={tier} style={{
              padding: '1rem',
              backgroundColor: TIER_COLORS[tier as ApplicationTier] + '20',
              borderRadius: '8px',
              textAlign: 'center',
              border: `2px solid ${TIER_COLORS[tier as ApplicationTier]}40`
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold',
                color: TIER_COLORS[tier as ApplicationTier]
              }}>
                {count}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                {APPLICATION_TIER_LABELS[tier as ApplicationTier]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 考试进度 */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>
          📝 考试完成进度
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem'
        }}>
          <div style={{
            padding: '1rem',
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>
              {statistics.testProgress.languageTestsCompleted + statistics.testProgress.standardizedTestsCompleted} / {statistics.testProgress.totalTests}
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>考试完成数</div>
          </div>
          
          <div style={{
            padding: '1rem',
            backgroundColor: '#fff3e0',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f57c00' }}>
              {Math.round((statistics.testProgress.languageTestsCompleted + statistics.testProgress.standardizedTestsCompleted) / Math.max(statistics.testProgress.totalTests, 1) * 100)}%
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>完成百分比</div>
          </div>
        </div>
      </div>

      {/* 推荐信进度 */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>
          👥 推荐信状态统计
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem'
        }}>
          <div style={{
            padding: '1rem',
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>
              {statistics.recommendationProgress.completed}
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>已完成</div>
          </div>
          
          <div style={{
            padding: '1rem',
            backgroundColor: '#fff3e0',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f57c00' }}>
              {statistics.recommendationProgress.pending}
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>待提交</div>
          </div>
          
          <div style={{
            padding: '1rem',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d32f2f' }}>
              {statistics.recommendationProgress.notInvited}
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>未发邀请</div>
          </div>
        </div>
      </div>

      {/* 即将到期的申请 */}
      {statistics.upcomingDeadlines.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>
            ⏰ 即将到期的申请 ({statistics.upcomingDeadlines.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {statistics.upcomingDeadlines.map(application => (
              <div key={application.id} style={{
                padding: '1rem',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>{application.university}</strong> - {application.programName}
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {APPLICATION_ROUND_LABELS[application.dates.round]}
                  </div>
                </div>
                <div style={{ color: '#856404', textAlign: 'right' }}>
                  <div>{new Date(application.dates.applicationDeadline).toLocaleDateString()}</div>
                  <div style={{ fontSize: '0.8rem' }}>
                    {Math.ceil((new Date(application.dates.applicationDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} 天后
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};




export default EnhancedApplicationTracker;