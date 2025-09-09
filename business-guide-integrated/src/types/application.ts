// src/types/application.ts

export enum ApplicationStatus {
    PREPARING = 'preparing',
    ESSAY_WRITING = 'essay_writing',
    SUBMITTED = 'submitted',
    INTERVIEW_RECEIVED = 'interview_received',
    INTERVIEW_COMPLETED = 'interview_completed',
    OFFER_RECEIVED = 'offer_received',
    WAITLIST = 'waitlist',
    REJECTED = 'rejected',
    ACCEPTED = 'accepted'
  }
  
  export interface StatusHistory {
    status: ApplicationStatus;
    date: Date;
    notes: string;
  }
  
  export interface MaterialItem {
    id: string;
    name: string;
    required: boolean;
    completed: boolean;
    deadline?: Date;
    notes?: string;
  }
  
  export interface Application {
    id: string;
    programId?: string;              // 关联收藏夹中的项目
    university: string;
    programName: string;
    programType: string;
    location: string;
    
    // 状态跟踪
    status: ApplicationStatus;
    statusHistory: StatusHistory[];
    
    // 重要日期
    applicationDeadline: Date;
    interviewDate?: Date;
    decisionDate?: Date;
    depositDeadline?: Date;
    
    // 材料清单
    materialChecklist: MaterialItem[];
    
    // 元数据
    createdAt: Date;
    updatedAt: Date;
    notes: string;
  }
  
  export interface ApplicationStorageData {
    version: string;
    applications: Application[];
    lastUpdated: string;
  }
  
  // 状态显示名称映射
  export const STATUS_DISPLAY_NAMES: Record<ApplicationStatus, string> = {
    [ApplicationStatus.PREPARING]: '准备材料',
    [ApplicationStatus.ESSAY_WRITING]: '文书完成',
    [ApplicationStatus.SUBMITTED]: '已提交',
    [ApplicationStatus.INTERVIEW_RECEIVED]: '收到面试',
    [ApplicationStatus.INTERVIEW_COMPLETED]: '面试完成',
    [ApplicationStatus.OFFER_RECEIVED]: '收到Offer',
    [ApplicationStatus.WAITLIST]: 'Waitlist',
    [ApplicationStatus.REJECTED]: '被拒绝',
    [ApplicationStatus.ACCEPTED]: '已接受'
  };
  
  // 状态颜色映射
  export const STATUS_COLORS: Record<ApplicationStatus, string> = {
    [ApplicationStatus.PREPARING]: '#ff9800',
    [ApplicationStatus.ESSAY_WRITING]: '#9c27b0',
    [ApplicationStatus.SUBMITTED]: '#2196f3',
    [ApplicationStatus.INTERVIEW_RECEIVED]: '#ff5722',
    [ApplicationStatus.INTERVIEW_COMPLETED]: '#ff5722',
    [ApplicationStatus.OFFER_RECEIVED]: '#4caf50',
    [ApplicationStatus.WAITLIST]: '#ffc107',
    [ApplicationStatus.REJECTED]: '#f44336',
    [ApplicationStatus.ACCEPTED]: '#4caf50'
  };