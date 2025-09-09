// src/components/DraggableKanbanView.tsx

import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import RoundSelector from './RoundSelector';
import { 
  EnhancedApplication,
  ApplicationStatus,
  ApplicationTier,
  SortingCategory,
  APPLICATION_STATUS_LABELS,
  APPLICATION_TIER_LABELS,
  STATUS_COLORS,
  TIER_COLORS
} from '../types/enhancedApplication';

interface DraggableKanbanViewProps {
  applications: EnhancedApplication[];
  sortingCategory: SortingCategory;
  onStatusUpdate: (appId: string, status: ApplicationStatus) => void;
  onApplicationUpdate: (appId: string, updates: Partial<EnhancedApplication>) => void;
  onDeleteApplication: (appId: string) => void;
}

const DraggableKanbanView: React.FC<DraggableKanbanViewProps> = ({
  applications,
  sortingCategory,
  onStatusUpdate,
  onApplicationUpdate,
  onDeleteApplication
}) => {

  const handleOnDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // 根据分类模式处理拖拽
    if (sortingCategory === SortingCategory.TIER) {
      // 按梯队分类时，更新梯队
      const newTier = destination.droppableId as ApplicationTier;
      onApplicationUpdate(draggableId, { tier: newTier });
    } else {
      // 按状态分类时，更新状态
      const newStatus = destination.droppableId as ApplicationStatus;
      onStatusUpdate(draggableId, newStatus);
    }
  };

  // 获取分组
  const getGroups = () => {
    if (sortingCategory === SortingCategory.TIER) {
      return Object.values(ApplicationTier);
    } else if (sortingCategory === SortingCategory.REGION) {
      // 按地区分组
      const regions = Array.from(new Set(applications.map(app => app.location)));
      return regions;
    } else if (sortingCategory === SortingCategory.PROGRAM_TYPE) {
      // 按专业分组
      const types = Array.from(new Set(applications.map(app => app.programType)));
      return types;
    } else {
      // 默认按状态分组
      return Object.values(ApplicationStatus);
    }
  };

  // 获取分组标题
  const getGroupTitle = (group: string) => {
    if (sortingCategory === SortingCategory.TIER) {
      return APPLICATION_TIER_LABELS[group as ApplicationTier] || group;
    } else if (sortingCategory === SortingCategory.REGION || sortingCategory === SortingCategory.PROGRAM_TYPE) {
      return group;
    } else {
      return APPLICATION_STATUS_LABELS[group as ApplicationStatus] || group;
    }
  };

  // 获取分组颜色
  const getGroupColor = (group: string) => {
    if (sortingCategory === SortingCategory.TIER) {
      return TIER_COLORS[group as ApplicationTier] || '#6c757d';
    } else {
      return STATUS_COLORS[group as ApplicationStatus] || '#6c757d';
    }
  };

  // 根据分组筛选应用
  const getApplicationsForGroup = (group: string) => {
    if (sortingCategory === SortingCategory.TIER) {
      return applications.filter(app => app.tier === group);
    } else if (sortingCategory === SortingCategory.REGION) {
      return applications.filter(app => app.location === group);
    } else if (sortingCategory === SortingCategory.PROGRAM_TYPE) {
      return applications.filter(app => app.programType === group);
    } else {
      return applications.filter(app => app.status === group);
    }
  };

  const groups = getGroups();

  return (
    <div style={{ 
      padding: '1rem',
      background: 'var(--morandi-bg-primary)',
      minHeight: '100vh'
    }}>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '1rem',
          width: '100%'
        }}>
          {groups.map((group) => {
            const groupApplications = getApplicationsForGroup(group);
            const groupColor = getGroupColor(group);
            
            return (
              <div key={group} style={{
                background: 'white',
                borderRadius: '12px',
                border: `1px solid rgba(181, 160, 130, 0.15)`,
                minHeight: '200px',
                maxHeight: '600px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(181, 160, 130, 0.08)',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  padding: '1rem',
                  background: `linear-gradient(135deg, ${groupColor}15, ${groupColor}08)`,
                  borderBottom: `1px solid rgba(181, 160, 130, 0.1)`
                }}>
                  <h4 style={{ 
                    margin: 0,
                    color: 'var(--morandi-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.95rem',
                    fontWeight: '600'
                  }}>
                    {getGroupTitle(group)}
                    <span style={{ 
                      background: `linear-gradient(135deg, ${groupColor}, ${groupColor}dd)`,
                      color: 'white',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '15px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      boxShadow: '0 2px 8px rgba(181, 160, 130, 0.2)'
                    }}>
                      {groupApplications.length}
                    </span>
                  </h4>
                </div>

                <Droppable droppableId={group}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        flex: 1,
                        padding: '0.8rem',
                        backgroundColor: snapshot.isDraggingOver ? 'rgba(181, 160, 130, 0.08)' : 'transparent',
                        transition: 'all 0.2s ease',
                        overflow: 'auto'
                      }}
                    >
                      {groupApplications.map((application, index) => (
                        <Draggable 
                          key={application.id} 
                          draggableId={application.id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                marginBottom: '0.5rem'
                              }}
                            >
                              <ApplicationCard 
                                application={application}
                                isDragging={snapshot.isDragging}
                                onDelete={onDeleteApplication}
                                onStatusUpdate={onStatusUpdate}
                                onUpdate={onApplicationUpdate}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

// 应用卡片组件
const ApplicationCard: React.FC<{
  application: EnhancedApplication;
  isDragging: boolean;
  onDelete: (appId: string) => void;
  onStatusUpdate: (appId: string, status: ApplicationStatus) => void;
  onUpdate: (appId: string, updates: Partial<EnhancedApplication>) => void;
}> = ({ application, isDragging, onDelete, onStatusUpdate, onUpdate }) => {
  
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fefcfa 0%, #f9f7f3 100%)',
      borderRadius: '8px',
      padding: '1rem',
      border: '1px solid rgba(181, 160, 130, 0.15)',
      boxShadow: isDragging ? '0 12px 24px rgba(181, 160, 130, 0.25)' : '0 4px 12px rgba(181, 160, 130, 0.1)',
      transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
      transition: 'all 0.3s ease',
      cursor: 'grab',
      position: 'relative'
    }}>
      {/* 删除按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`确定要删除 ${application.university} - ${application.programName} 吗？`)) {
            onDelete(application.id);
          }
        }}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'var(--morandi-danger)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '0.75rem',
          padding: '4px 6px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(199, 160, 160, 0.3)',
          transition: 'all 0.2s ease'
        }}
        title="删除"
      >
        ×
      </button>

      {/* 学校和项目名称 */}
      <div style={{ marginBottom: '0.5rem', paddingRight: '20px' }}>
        <div style={{ 
          fontWeight: '600', 
          fontSize: '0.9rem', 
          color: 'var(--morandi-text-primary)',
          marginBottom: '0.25rem'
        }}>
          {application.university}
        </div>
        <div style={{ 
          fontSize: '0.8rem', 
          color: 'var(--morandi-text-secondary)',
          lineHeight: '1.3'
        }}>
          {application.programName}
        </div>
      </div>

      {/* 状态和梯队标签 */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <span style={{
          padding: '0.15rem 0.4rem',
          borderRadius: '3px',
          backgroundColor: STATUS_COLORS[application.status] + '20',
          color: STATUS_COLORS[application.status],
          fontSize: '0.7rem',
          fontWeight: '500'
        }}>
          {APPLICATION_STATUS_LABELS[application.status]}
        </span>
        
        <span style={{
          padding: '0.15rem 0.4rem',
          borderRadius: '3px',
          backgroundColor: TIER_COLORS[application.tier] + '20',
          color: TIER_COLORS[application.tier],
          fontSize: '0.7rem',
          fontWeight: '500'
        }}>
          {APPLICATION_TIER_LABELS[application.tier]}
        </span>
      </div>

      {/* 智能DDL选择器 */}
      <div style={{ marginBottom: '0.5rem' }}>
        <RoundSelector
          originalDDLText={application.dates.originalDDLText || new Date(application.dates.applicationDeadline).toLocaleDateString()}
          selectedRoundId={application.dates.selectedRoundId}
          onRoundChange={(roundId, deadline) => {
            onUpdate(application.id, {
              dates: {
                ...application.dates,
                selectedRoundId: roundId,
                applicationDeadline: deadline
              }
            });
          }}
        />
      </div>

      {/* 进度指示器 */}
      <div style={{ marginTop: '0.5rem' }}>
        <div style={{
          display: 'flex',
          gap: '2px',
          marginBottom: '0.25rem'
        }}>
          {/* 语言考试状态 */}
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: application.languageTests.some(test => test.status === 'completed') ? 'var(--morandi-success)' : 'var(--morandi-text-muted)'
          }} title="语言考试"></div>
          
          {/* 标化考试状态 */}
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: application.standardizedTests.some(test => test.status === 'completed') ? 'var(--morandi-success)' : 'var(--morandi-text-muted)'
          }} title="标化考试"></div>
          
          {/* 推荐信状态 */}
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: application.recommendationRequirements.some(req => req.status === 'completed') ? 'var(--morandi-success)' : 'var(--morandi-text-muted)'
          }} title="推荐信"></div>
          
          {/* 文书状态 */}
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: application.documents.essays === 'completed' ? 'var(--morandi-success)' : 'var(--morandi-text-muted)'
          }} title="文书"></div>
        </div>
        
        <div style={{ fontSize: '0.6rem', color: 'var(--morandi-text-muted)' }}>
          进度指示: 语言 | 标化 | 推荐 | 文书
        </div>
      </div>
    </div>
  );
};

export default DraggableKanbanView;