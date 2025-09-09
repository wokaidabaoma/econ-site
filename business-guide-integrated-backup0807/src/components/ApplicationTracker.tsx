// src/components/ApplicationTracker.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Application, ApplicationStatus, STATUS_DISPLAY_NAMES, STATUS_COLORS } from '../types/application';
import { ApplicationStorageManager } from '../utils/applicationStorage';
import { Import, Folder } from 'iconoir-react';
import '../App.css';
import './ApplicationTracker.css';

type ViewMode = 'dashboard' | 'kanban' | 'table';

// 统计数据类型定义
interface StatisticsData {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  upcomingDeadlines: Application[];
}

const ApplicationTracker: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const storageManager = useMemo(() => new ApplicationStorageManager(), []);

  useEffect(() => {
    console.log('🚀 ApplicationTracker component mounted');
    loadApplications();
    
    // 检查是否是从收藏夹导入的
    if (searchParams.get('imported') === 'true') {
      console.log('✅ Successfully imported from favorites');
    }
  }, [searchParams, storageManager]);

  const loadApplications = async () => {
    console.log('📋 Loading applications...');
    setLoading(true);
    try {
      const apps = storageManager.getApplications();
      setApplications(apps);
      console.log(`📋 Loaded ${apps.length} applications`);
      
      // 如果没有应用但有收藏，显示提示
      if (apps.length === 0) {
        checkForFavorites();
      }
    } catch (error) {
      console.error('❌ Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // 检查是否有收藏可以导入
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
    console.log('🔄 Starting import from favorites...');
    
    try {
      // 首先检查收藏数据
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

      // 导入收藏项目
      const importedApps = storageManager.importFromFavorites();
      if (importedApps.length === 0) {
        alert('❌ 导入失败：无法解析收藏数据\n\n请检查收藏的项目格式是否正确');
        return;
      }

      console.log(`✅ Successfully imported ${importedApps.length} applications`);

      // 检查重复项目
      const existingProgramIds = new Set(applications.map(app => app.programId).filter(Boolean));
      const newApps = importedApps.filter(app => !existingProgramIds.has(app.programId));
      
      if (newApps.length === 0) {
        alert('ℹ️ 收藏夹中的项目已经全部导入到跟踪器中了');
        return;
      }

      const updatedApps = [...applications, ...newApps];
      setApplications(updatedApps);
      storageManager.saveApplications(updatedApps);
      
      alert(`✅ 成功导入 ${newApps.length} 个新项目到申请跟踪器！\n\n${newApps.map(app => `• ${app.university} - ${app.programName}`).join('\n')}`);
      
      console.log(`🎉 Import completed: ${newApps.length} new applications added`);
    } catch (error) {
      console.error('❌ Import failed:', error);
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
    storageManager.saveApplications(updatedApps);
    
    console.log(`✅ Status updated successfully`);
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

  const getStatistics = (): StatisticsData => {
    return storageManager.getStatistics();
  };

  // 调试功能
  const handleDebug = () => {
    console.log('🔍 Debug: Application Tracker State');
    console.log('Applications:', applications);
    storageManager.debugFavorites();
    
    // 显示localStorage中的所有相关数据
    const relevantKeys = Object.keys(localStorage).filter(key => 
      key.includes('program') || key.includes('application') || key.includes('favorite')
    );
    console.log('Relevant localStorage keys:', relevantKeys);
    relevantKeys.forEach(key => {
      console.log(`${key}:`, localStorage.getItem(key));
    });
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
          <div style={{ fontSize: '1.1rem' }}>正在加载申请数据...</div>
          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
            首次使用可能需要从收藏夹导入数据
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="application-tracker" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 页面头部 */}
      <TrackerHeader 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onImportFavorites={handleImportFromFavorites}
        onGoBack={() => navigate('/')}
        onDebug={handleDebug}
        applicationCount={applications.length}
      />
      
      {/* 主要内容区域 */}
      {applications.length === 0 ? (
        <EmptyState onImportFavorites={handleImportFromFavorites} />
      ) : (
        <TrackerContent
          applications={applications}
          viewMode={viewMode}
          onStatusUpdate={handleStatusUpdate}
          onDeleteApplication={handleDeleteApplication}
          statistics={getStatistics()}
        />
      )}
    </div>
  );
};

// 页面头部组件
interface TrackerHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onImportFavorites: () => void;
  onGoBack: () => void;
  onDebug: () => void;
  applicationCount: number;
}

const TrackerHeader: React.FC<TrackerHeaderProps> = ({
  viewMode,
  onViewModeChange,
  onImportFavorites,
  onGoBack,
  onDebug,
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
          📋 申请跟踪器
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
          管理你的申请进度，追踪重要节点，确保不错过任何截止日期
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
        <div className="view-switcher" style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { mode: 'dashboard' as ViewMode, label: '📊 概览' },
            { mode: 'kanban' as ViewMode, label: '📋 看板' },
            { mode: 'table' as ViewMode, label: '📄 表格' }
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
          
          {/* 开发环境调试按钮 */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={onDebug}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
              title="查看调试信息（开发模式）"
            >
              🔍 调试
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 空状态组件
interface EmptyStateProps {
  onImportFavorites: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onImportFavorites }) => {
  const navigate = useNavigate();
  
  // 检查是否有收藏
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
        开始你的申请管理之旅
      </h2>
      <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
        申请跟踪器可以帮助你：<br/>
        • 管理所有申请项目的状态<br/>
        • 跟踪重要截止日期<br/>
        • 检查材料准备进度<br/>
        • 记录申请过程中的重要节点
      </p>

      {favoritesCount > 0 && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          color: '#2e7d32'
        }}>
          🎉 <strong>太好了！</strong>你有 {favoritesCount} 个收藏项目可以导入
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
        💡 <strong>使用建议：</strong> 
        {favoritesCount > 0 
          ? '点击"导入收藏项目"即可开始管理你的申请进度'
          : '建议先在项目筛选器中收藏一些心仪的项目，然后一键导入到申请跟踪器中开始管理'
        }
      </div>
    </div>
  );
};

// 主要内容区域组件
interface TrackerContentProps {
  applications: Application[];
  viewMode: ViewMode;
  onStatusUpdate: (appId: string, status: ApplicationStatus) => void;
  onDeleteApplication: (appId: string) => void;
  statistics: StatisticsData;
}

const TrackerContent: React.FC<TrackerContentProps> = ({
  applications,
  viewMode,
  onStatusUpdate,
  onDeleteApplication,
  statistics
}) => {
  switch (viewMode) {
    case 'dashboard':
      return (
        <DashboardView 
          applications={applications}
          statistics={statistics}
          onStatusUpdate={onStatusUpdate}
        />
      );
    case 'kanban':
      return (
        <KanbanView 
          applications={applications}
          onStatusUpdate={onStatusUpdate}
          onDeleteApplication={onDeleteApplication}
        />
      );
    case 'table':
      return (
        <TableView 
          applications={applications}
          onStatusUpdate={onStatusUpdate}
          onDeleteApplication={onDeleteApplication}
        />
      );
    default:
      return <div>未知视图模式</div>;
  }
};

// 仪表板视图
const DashboardView: React.FC<{
  applications: Application[];
  statistics: StatisticsData;
  onStatusUpdate: (appId: string, status: ApplicationStatus) => void;
}> = ({ applications, statistics, onStatusUpdate }) => {
  return (
    <div className="dashboard-view">
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {Object.values(ApplicationStatus).map(statusValue => {
          const count = statistics.byStatus[statusValue] || 0;
          return (
            <div key={statusValue} style={{
              padding: '1rem',
              backgroundColor: STATUS_COLORS[statusValue] + '20',
              borderRadius: '8px',
              textAlign: 'center',
              border: `2px solid ${STATUS_COLORS[statusValue]}40`
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold',
                color: STATUS_COLORS[statusValue]
              }}>
                {count}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                {STATUS_DISPLAY_NAMES[statusValue]}
              </div>
            </div>
          );
        })}
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
                </div>
                <div style={{ color: '#856404' }}>
                  {new Date(application.applicationDeadline).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近的申请列表 */}
      <div>
        <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>
          📋 最近更新的申请
        </h3>
        <SimpleApplicationList 
          applications={applications.slice(0, 5)}
          onStatusUpdate={onStatusUpdate}
        />
      </div>
    </div>
  );
};

// 看板视图
const KanbanView: React.FC<{
  applications: Application[];
  onStatusUpdate: (appId: string, status: ApplicationStatus) => void;
  onDeleteApplication: (appId: string) => void;
}> = ({ applications, onStatusUpdate }) => {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '1rem',
      overflowX: 'auto'
    }}>
      {Object.values(ApplicationStatus).map(statusValue => {
        const statusApplications = applications.filter(app => app.status === statusValue);
        return (
          <div key={statusValue} style={{
            backgroundColor: STATUS_COLORS[statusValue] + '10',
            borderRadius: '8px',
            padding: '1rem',
            minHeight: '400px'
          }}>
            <h3 style={{ 
              marginBottom: '1rem',
              color: STATUS_COLORS[statusValue],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              {STATUS_DISPLAY_NAMES[statusValue]}
              <span style={{ 
                backgroundColor: STATUS_COLORS[statusValue],
                color: 'white',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.8rem'
              }}>
                {statusApplications.length}
              </span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {statusApplications.map(application => (
                <ApplicationCard 
                  key={application.id} 
                  application={application} 
                  onStatusUpdate={onStatusUpdate}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 表格视图
const TableView: React.FC<{
  applications: Application[];
  onStatusUpdate: (appId: string, status: ApplicationStatus) => void;
  onDeleteApplication: (appId: string) => void;
}> = ({ applications, onStatusUpdate, onDeleteApplication }) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>学校</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>项目</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>状态</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>截止日期</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(application => (
            <tr key={application.id} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '0.75rem' }}>{application.university}</td>
              <td style={{ padding: '0.75rem' }}>{application.programName}</td>
              <td style={{ padding: '0.75rem' }}>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: STATUS_COLORS[application.status] + '20',
                  color: STATUS_COLORS[application.status],
                  fontSize: '0.8rem'
                }}>
                  {STATUS_DISPLAY_NAMES[application.status]}
                </span>
              </td>
              <td style={{ padding: '0.75rem' }}>
                {new Date(application.applicationDeadline).toLocaleDateString()}
              </td>
              <td style={{ padding: '0.75rem' }}>
                <button
                  onClick={() => onDeleteApplication(application.id)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 简单的申请卡片组件
const ApplicationCard: React.FC<{
  application: Application;
  onStatusUpdate: (appId: string, status: ApplicationStatus) => void;
}> = ({ application, onStatusUpdate }) => {
  return (
    <div style={{
      padding: '0.75rem',
      backgroundColor: 'white',
      borderRadius: '6px',
      border: '1px solid #ddd',
      cursor: 'pointer'
    }}>
      <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
        {application.university}
      </div>
      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
        {application.programName}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#999' }}>
        截止：{new Date(application.applicationDeadline).toLocaleDateString()}
      </div>
    </div>
  );
};

// 简单的申请列表组件
const SimpleApplicationList: React.FC<{
  applications: Application[];
  onStatusUpdate: (appId: string, status: ApplicationStatus) => void;
}> = ({ applications, onStatusUpdate }) => {
  if (applications.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#666',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        暂无申请项目
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {applications.map(application => (
        <ApplicationCard 
          key={application.id} 
          application={application} 
          onStatusUpdate={onStatusUpdate}
        />
      ))}
    </div>
  );
};

export default ApplicationTracker;