// src/types/enhancedApplication.ts

export enum ApplicationRound {
    ROUND_1 = 'round_1',
    ROUND_2 = 'round_2', 
    ROUND_3 = 'round_3',
    ROLLING = 'rolling',
    EARLY_DECISION = 'early_decision'
  }
  
  export enum TestStatus {
    NOT_TAKEN = 'not_taken',           // 在考
    AWAITING_SCORES = 'awaiting_scores', // 等待送分
    SENDING = 'sending',               // 送分中
    COMPLETED = 'completed',           // 已完成
    NOT_SUBMITTING = 'not_submitting'  // 申请者选择不提交
  }
  
  export enum TestRequirement {
    REQUIRED = 'required',
    RECOMMENDED = 'recommended', 
    OPTIONAL = 'optional',
    NOT_REQUIRED = 'not_required'
  }
  
  export enum RecommendationStatus {
    NOT_INVITED = 'not_invited',       // 未发邀请
    PENDING = 'pending',               // 推荐人未提交
    COMPLETED = 'completed'            // 已完成
  }
  
  export enum DocumentStatus {
    IN_PROGRESS = 'in_progress',       // 正在修改
    COMPLETED = 'completed'            // 已完成
  }
  
  export enum ApplicationStatus {
    NOT_OPEN = 'not_open',             // 未开放
    FILLING = 'filling',               // 填写中
    SUBMITTED = 'submitted',           // 已提交
    AWAITING_INTERVIEW = 'awaiting_interview', // 等待面试
    INTERVIEW_COMPLETED = 'interview_completed', // 面试完成
    WAITLIST = 'waitlist',             // Waitlist
    REJECTED = 'rejected',             // 拒绝
    ACCEPTED = 'accepted'              // 录取
  }
  
  export enum InterviewStatus {
    NO_INTERVIEW = 'no_interview',     // 无面试要求
    AWAITING_INVITATION = 'awaiting_invitation', // 等待面试邀请
    SCHEDULED = 'scheduled',           // 已安排
    COMPLETED = 'completed'            // 已完成
  }
  
  export enum ApplicationTier {
    LOTTERY = 'lottery',               // 彩票
    REACH = 'reach',                   // 冲刺
    TARGET = 'target',                 // 主申
    SAFETY = 'safety'                  // 保底
  }
  
  export enum SortingCategory {
    TIER = 'tier',                     // 申请梯队
    REGION = 'region',                 // 地区
    PROGRAM_TYPE = 'program_type'      // 专业
  }
  
  // 语言成绩接口
  export interface LanguageTest {
    type: 'TOEFL' | 'IELTS';
    requirement: TestRequirement;
    minScore: string;
    status: TestStatus;
    actualScore?: string;
    testDate?: Date;
    notes?: string;
  }
  
  // 标化成绩接口
  export interface StandardizedTest {
    type: 'GRE' | 'GMAT';
    requirement: TestRequirement;
    status: TestStatus;
    actualScore?: string;
    testDate?: Date;
    notes?: string;
  }
  
  // 推荐人接口
  export interface Recommender {
    id: string;
    name: string;
    title: string;
    institution?: string;
    email: string;
    relationship: string;
    isBackup?: boolean;
  }
  
  // 推荐信状态接口
  export interface RecommendationRequirement {
    id: string;
    recommenderId: string;
    recommenderName: string;
    status: RecommendationStatus;
    invitedDate?: Date;
    submittedDate?: Date;
    notes?: string;
  }
  
  // 面试信息接口
  export interface InterviewInfo {
    status: InterviewStatus;
    type?: string; // Video interview, Phone interview, etc.
    scheduledDate?: Date;
    completedDate?: Date;
    interviewer?: string;
    notes?: string;
  }
  
  // 重要日期接口
  export interface ImportantDates {
    applicationDeadline: Date;
    round: ApplicationRound;
    // 新增智能DDL字段
    originalDDLText?: string;
    selectedRoundId?: string;
    availableRounds?: Array<{
      id: string;
      name: string;
      deadline: Date;
      description?: string;
    }>;
    earlyDeadline?: Date;
    finalDeadline?: Date;
    decisionDate?: Date;
    depositDeadline?: Date;
  }
  
  // 增强版申请接口
  export interface EnhancedApplication {
    id: string;
    programId?: string;
    
    // 基本信息
    university: string;
    programName: string;
    programType: string;
    location: string;
    
    // 申请轮次和截止日期
    dates: ImportantDates;
    
    // 语言成绩要求（用户只需要填一个）
    languageTests: LanguageTest[];
    
    // 标化成绩要求（用户只需要填一个）
    standardizedTests: StandardizedTest[];
    
    // 推荐信要求
    recommendationRequirements: RecommendationRequirement[];
    totalRecommendationsRequired: number;
    
    // 文书和简历
    documents: {
      resume: DocumentStatus;
      essays: DocumentStatus;
    };
    
    // 面试信息
    interview: InterviewInfo;
    
    // 申请状态
    status: ApplicationStatus;
    statusHistory: Array<{
      status: ApplicationStatus;
      date: Date;
      notes?: string;
    }>;
    
    // 分类信息
    tier: ApplicationTier;
    sortingCategory: SortingCategory;
    customCategory?: string;
    
    // 元数据
    createdAt: Date;
    updatedAt: Date;
    notes: string;
  }
  
  // 状态显示映射
  export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
    [ApplicationStatus.NOT_OPEN]: '未开放',
    [ApplicationStatus.FILLING]: '填写中',
    [ApplicationStatus.SUBMITTED]: '已提交',
    [ApplicationStatus.AWAITING_INTERVIEW]: '等待面试',
    [ApplicationStatus.INTERVIEW_COMPLETED]: '面试完成',
    [ApplicationStatus.WAITLIST]: 'Waitlist',
    [ApplicationStatus.REJECTED]: '拒绝',
    [ApplicationStatus.ACCEPTED]: '录取'
  };
  
  export const TEST_STATUS_LABELS: Record<TestStatus, string> = {
    [TestStatus.NOT_TAKEN]: '在考',
    [TestStatus.AWAITING_SCORES]: '等待送分',
    [TestStatus.SENDING]: '送分中', 
    [TestStatus.COMPLETED]: '已完成',
    [TestStatus.NOT_SUBMITTING]: '不提交'
  };
  
  export const RECOMMENDATION_STATUS_LABELS: Record<RecommendationStatus, string> = {
    [RecommendationStatus.NOT_INVITED]: '未发邀请',
    [RecommendationStatus.PENDING]: '推荐人未提交',
    [RecommendationStatus.COMPLETED]: '已完成'
  };
  
  export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
    [DocumentStatus.IN_PROGRESS]: '正在修改',
    [DocumentStatus.COMPLETED]: '已完成'
  };
  
  export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
    [InterviewStatus.NO_INTERVIEW]: '无面试',
    [InterviewStatus.AWAITING_INVITATION]: '等待面试',
    [InterviewStatus.SCHEDULED]: '已安排',
    [InterviewStatus.COMPLETED]: '已完成'
  };
  
  export const APPLICATION_TIER_LABELS: Record<ApplicationTier, string> = {
    [ApplicationTier.LOTTERY]: '彩票',
    [ApplicationTier.REACH]: '冲刺',
    [ApplicationTier.TARGET]: '主申',
    [ApplicationTier.SAFETY]: '保底'
  };
  
  export const APPLICATION_ROUND_LABELS: Record<ApplicationRound, string> = {
    [ApplicationRound.ROUND_1]: 'Round 1',
    [ApplicationRound.ROUND_2]: 'Round 2',
    [ApplicationRound.ROUND_3]: 'Round 3',
    [ApplicationRound.ROLLING]: 'Rolling',
    [ApplicationRound.EARLY_DECISION]: 'Early Decision'
  };
  
  // 状态颜色映射
  export const STATUS_COLORS: Record<ApplicationStatus, string> = {
    [ApplicationStatus.NOT_OPEN]: '#9e9e9e',
    [ApplicationStatus.FILLING]: '#ff9800',
    [ApplicationStatus.SUBMITTED]: '#2196f3',
    [ApplicationStatus.AWAITING_INTERVIEW]: '#ff5722',
    [ApplicationStatus.INTERVIEW_COMPLETED]: '#9c27b0',
    [ApplicationStatus.WAITLIST]: '#ffc107',
    [ApplicationStatus.REJECTED]: '#f44336',
    [ApplicationStatus.ACCEPTED]: '#4caf50'
  };
  
  export const TIER_COLORS: Record<ApplicationTier, string> = {
    [ApplicationTier.LOTTERY]: '#e91e63',
    [ApplicationTier.REACH]: '#ff5722',
    [ApplicationTier.TARGET]: '#2196f3',
    [ApplicationTier.SAFETY]: '#4caf50'
  };