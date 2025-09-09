// src/utils/enhancedApplicationStorage.ts

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
  SortingCategory,
  LanguageTest,
  StandardizedTest,
  RecommendationRequirement,
  Recommender,
  ImportantDates,
  InterviewInfo
} from '../types/enhancedApplication';

export interface EnhancedApplicationStorageData {
  version: string;
  applications: EnhancedApplication[];
  recommenders: Recommender[];
  lastUpdated: string;
}

export class EnhancedApplicationStorageManager {
  private readonly STORAGE_KEY = 'enhanced_application_tracker_data';
  private readonly FAVORITES_KEY = 'program-favorites';
  private readonly RECOMMENDERS_KEY = 'application_recommenders';
  private readonly VERSION = '2.0';

  // 生成唯一ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 获取所有申请数据
  getApplications(): EnhancedApplication[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        console.log('📭 No enhanced tracked applications found');
        return [];
      }
      
      const parsed: EnhancedApplicationStorageData = JSON.parse(data);
      const apps = this.validateAndMigrate(parsed);
      console.log(`✅ Loaded ${apps.length} enhanced applications`);
      return apps;
    } catch (error) {
      console.error('❌ Failed to load enhanced applications:', error);
      return [];
    }
  }

  // 保存申请数据
  saveApplications(applications: EnhancedApplication[], recommenders: Recommender[] = []): void {
    try {
      const dataToSave: EnhancedApplicationStorageData = {
        version: this.VERSION,
        applications: applications.map(app => this.serializeApplication(app)),
        recommenders: recommenders,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
      console.log(`💾 Successfully saved ${applications.length} enhanced applications`);
    } catch (error) {
      console.error('❌ Failed to save enhanced applications:', error);
      throw new Error('保存申请数据失败');
    }
  }

  // 序列化申请数据（处理日期）
  private serializeApplication(app: EnhancedApplication): EnhancedApplication {
    return {
      ...app,
      dates: {
        ...app.dates,
        applicationDeadline: new Date(app.dates.applicationDeadline),
        earlyDeadline: app.dates.earlyDeadline ? new Date(app.dates.earlyDeadline) : undefined,
        finalDeadline: app.dates.finalDeadline ? new Date(app.dates.finalDeadline) : undefined,
        decisionDate: app.dates.decisionDate ? new Date(app.dates.decisionDate) : undefined,
        depositDeadline: app.dates.depositDeadline ? new Date(app.dates.depositDeadline) : undefined,
      },
      languageTests: app.languageTests.map(test => ({
        ...test,
        testDate: test.testDate ? new Date(test.testDate) : undefined
      })),
      standardizedTests: app.standardizedTests.map(test => ({
        ...test,
        testDate: test.testDate ? new Date(test.testDate) : undefined
      })),
      recommendationRequirements: app.recommendationRequirements.map(req => ({
        ...req,
        invitedDate: req.invitedDate ? new Date(req.invitedDate) : undefined,
        submittedDate: req.submittedDate ? new Date(req.submittedDate) : undefined
      })),
      interview: {
        ...app.interview,
        scheduledDate: app.interview.scheduledDate ? new Date(app.interview.scheduledDate) : undefined,
        completedDate: app.interview.completedDate ? new Date(app.interview.completedDate) : undefined
      },
      statusHistory: app.statusHistory.map(history => ({
        ...history,
        date: new Date(history.date)
      })),
      createdAt: new Date(app.createdAt),
      updatedAt: new Date(app.updatedAt)
    };
  }

  // 从收藏夹导入项目（转换为增强版格式）
  importFromFavorites(): EnhancedApplication[] {
    try {
      console.log('🔍 Starting enhanced import from favorites...');
      
      const favoritesData = localStorage.getItem(this.FAVORITES_KEY);
      if (!favoritesData) {
        console.log('📭 No favorites found in localStorage');
        return [];
      }

      const favoriteIds = JSON.parse(favoritesData);
      if (!Array.isArray(favoriteIds) || favoriteIds.length === 0) {
        console.log('📭 Favorites array is empty or invalid');
        return [];
      }

      const convertedApps: EnhancedApplication[] = [];
      
      favoriteIds.forEach((id: string, index: number) => {
        console.log(`🔄 Processing favorite ${index + 1}/${favoriteIds.length}: ${id}`);
        
        const itemData = localStorage.getItem(`program-${id}`);
        if (itemData) {
          try {
            const favoriteData = JSON.parse(itemData);
            let item;
            if (favoriteData.item) {
              item = favoriteData.item;
            } else {
              item = favoriteData;
            }
            
            const application = this.convertFavoriteToEnhancedApplication(item, favoriteData.selectedFields || [], favoriteData.savedAt);
            convertedApps.push(application);
            console.log(`✅ Converted ${application.university} - ${application.programName}`);
          } catch (error) {
            console.error(`❌ Error processing favorite ${id}:`, error);
          }
        }
      });
      
      console.log(`🎉 Successfully converted ${convertedApps.length} favorites to enhanced applications`);
      return convertedApps;
    } catch (error) {
      console.error('❌ Error importing from favorites:', error);
      return [];
    }
  }

  // 将收藏项目转换为增强版申请项目
  private convertFavoriteToEnhancedApplication(
    itemData: any, 
    selectedFields: string[] = [], 
    savedAt?: string
  ): EnhancedApplication {
    const now = new Date();
    
    // 从项目数据中提取基本信息
    const university = itemData.University || 'Unknown University';
    const programName = itemData.ProgramName || 'Unknown Program';
    const programType = itemData.ProgramType || 'Unknown Type';
    const location = itemData.Location || 'Unknown Location';
    
    // 处理截止日期信息
    const deadlineStr = itemData.DeadlineRounds || '';
    const deadline = this.parseDeadline(deadlineStr);
    
    // 从数据中提取考试要求信息
    const languageTests = this.extractLanguageRequirements(itemData);
    const standardizedTests = this.extractStandardizedRequirements(itemData);
    
    // 提取推荐信要求
    const recommendationCount = this.extractRecommendationCount(itemData);
    
    const newApp: EnhancedApplication = {
      id: this.generateId(),
      programId: this.generateProgramId(university, programName),
      university,
      programName,
      programType,
      location,
      
      // 日期信息
      dates: {
        applicationDeadline: deadline,
        round: ApplicationRound.ROLLING, // 默认为rolling，用户可以后续修改
      },
      
      // 语言和标化考试
      languageTests,
      standardizedTests,
      
      // 推荐信要求
      recommendationRequirements: [],
      totalRecommendationsRequired: recommendationCount,
      
      // 文书和简历状态
      documents: {
        resume: DocumentStatus.IN_PROGRESS,
        essays: DocumentStatus.IN_PROGRESS,
      },
      
      // 面试信息
      interview: this.extractInterviewInfo(itemData),
      
      // 申请状态
      status: ApplicationStatus.NOT_OPEN,
      statusHistory: [{
        status: ApplicationStatus.NOT_OPEN,
        date: now,
        notes: '从收藏夹导入'
      }],
      
      // 分类信息
      tier: ApplicationTier.TARGET, // 默认主申，用户可以修改
      sortingCategory: SortingCategory.TIER,
      
      // 元数据
      createdAt: savedAt ? new Date(savedAt) : now,
      updatedAt: now,
      notes: `从收藏夹导入 - ${university} ${programName}`
    };
    
    return newApp;
  }

  // 从项目数据中提取语言考试要求
  private extractLanguageRequirements(itemData: any): LanguageTest[] {
    const tests: LanguageTest[] = [];
    
    // 检查TOEFL要求 - 使用筛选器中的字段名
    if (itemData.LanguageTestTOEFL) {
      tests.push({
        type: 'TOEFL',
        requirement: TestRequirement.REQUIRED, // 默认必需，用户可以修改
        minScore: itemData.LanguageTestTOEFL || 'N/A',
        status: TestStatus.NOT_TAKEN
      });
    }
    
    // 检查IELTS要求 - 使用筛选器中的字段名
    if (itemData.LanguageTestIELTS) {
      tests.push({
        type: 'IELTS',
        requirement: TestRequirement.REQUIRED, // 默认必需，用户可以修改
        minScore: itemData.LanguageTestIELTS || 'N/A',
        status: TestStatus.NOT_TAKEN
      });
    }
    
    // 如果没有找到具体要求，但有语言特殊要求，也添加默认语言考试
    if (tests.length === 0) {
      tests.push({
        type: 'TOEFL',
        requirement: TestRequirement.REQUIRED,
        minScore: 'TBD',
        status: TestStatus.NOT_TAKEN
      });
      tests.push({
        type: 'IELTS',
        requirement: TestRequirement.REQUIRED,
        minScore: 'TBD',
        status: TestStatus.NOT_TAKEN
      });
    }
    
    return tests;
  }

  // 从项目数据中提取标化考试要求
  private extractStandardizedRequirements(itemData: any): StandardizedTest[] {
    const tests: StandardizedTest[] = [];
    
    // 检查GRE要求 - 使用筛选器中的字段名
    if (itemData.TestRequiredGRE) {
      tests.push({
        type: 'GRE',
        requirement: this.parseTestRequirement(itemData.TestRequiredGRE),
        status: TestStatus.NOT_TAKEN
      });
    }
    
    // 检查GMAT要求 - 使用筛选器中的字段名
    if (itemData.TestRequiredGMAT) {
      tests.push({
        type: 'GMAT',
        requirement: this.parseTestRequirement(itemData.TestRequiredGMAT),
        status: TestStatus.NOT_TAKEN
      });
    }
    
    // 如果没有找到具体要求，根据项目类型添加默认要求
    if (tests.length === 0) {
      if (itemData.ProgramType?.toLowerCase().includes('mba') || 
          itemData.ProgramType?.toLowerCase().includes('business')) {
        tests.push({
          type: 'GMAT',
          requirement: TestRequirement.RECOMMENDED,
          status: TestStatus.NOT_TAKEN
        });
      } else {
        tests.push({
          type: 'GRE',
          requirement: TestRequirement.RECOMMENDED,
          status: TestStatus.NOT_TAKEN
        });
      }
    }
    
    return tests;
  }

  // 解析考试要求等级
  private parseTestRequirement(requirementStr: string): TestRequirement {
    if (!requirementStr) return TestRequirement.RECOMMENDED;
    
    const str = requirementStr.toLowerCase();
    if (str.includes('required') || str.includes('必需') || str.includes('必须')) {
      return TestRequirement.REQUIRED;
    } else if (str.includes('recommended') || str.includes('建议') || str.includes('推荐')) {
      return TestRequirement.RECOMMENDED;
    } else if (str.includes('optional') || str.includes('可选')) {
      return TestRequirement.OPTIONAL;
    } else if (str.includes('not required') || str.includes('不需要') || str.includes('不要求')) {
      return TestRequirement.NOT_REQUIRED;
    }
    
    return TestRequirement.RECOMMENDED;
  }

  // 从项目数据中提取推荐信数量要求
  private extractRecommendationCount(itemData: any): number {
    // 使用筛选器中的字段名
    if (itemData.Recommendations) {
      const match = String(itemData.Recommendations).match(/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    // 尝试从其他可能的字段提取推荐信数量
    const fields = ['RecommendationLetters', 'LOR', 'Letters'];
    
    for (const field of fields) {
      if (itemData[field]) {
        const match = String(itemData[field]).match(/(\d+)/);
        if (match) {
          return parseInt(match[1]);
        }
      }
    }
    
    // 默认返回2封推荐信
    return 2;
  }

  // 从项目数据中提取面试信息
  private extractInterviewInfo(itemData: any): InterviewInfo {
    // 检查视频面试要求
    if (itemData.VideoInterview) {
      const videoInterview = itemData.VideoInterview.toLowerCase();
      
      // 根据面试要求设置状态
      if (videoInterview.includes('required') || videoInterview.includes('必需') || videoInterview.includes('必须')) {
        return {
          status: InterviewStatus.AWAITING_INVITATION,
          type: 'Video Interview',
          notes: `面试要求: ${itemData.VideoInterview}`
        };
      } else if (videoInterview.includes('optional') || videoInterview.includes('可选') || 
                 videoInterview.includes('not required') || videoInterview.includes('不需要')) {
        return {
          status: InterviewStatus.NO_INTERVIEW,
          type: 'Optional',
          notes: `面试要求: ${itemData.VideoInterview}`
        };
      } else if (videoInterview !== 'n/a' && videoInterview !== '' && videoInterview !== '-') {
        return {
          status: InterviewStatus.AWAITING_INVITATION,
          type: 'Interview',
          notes: `面试要求: ${itemData.VideoInterview}`
        };
      }
    }
    
    // 默认无面试
    return {
      status: InterviewStatus.NO_INTERVIEW
    };
  }

  // 生成程序ID
  private generateProgramId(university: string, programName: string): string {
    return `${university}-${programName}`.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  }

  // 解析截止日期
  private parseDeadline(deadlineStr: string): Date {
    // 复用现有的parseDeadline逻辑
    if (!deadlineStr || deadlineStr.trim() === '') {
      return new Date(new Date().getFullYear() + 1, 5, 1);
    }

    try {
      const colonIndex = deadlineStr.indexOf(':');
      if (colonIndex !== -1) {
        deadlineStr = deadlineStr.substring(colonIndex + 1).trim();
      }
      
      const directParse = new Date(deadlineStr);
      if (!isNaN(directParse.getTime())) {
        return directParse;
      }

      // 使用更多解析模式...
      const patterns = [
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i,
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{4})/i,
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      ];

      for (const pattern of patterns) {
        const match = deadlineStr.match(pattern);
        if (match) {
          if (pattern.source.includes('Jan|Feb')) {
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                              'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            
            if (match[2]) {
              const day = parseInt(match[1]);
              const monthIndex = monthNames.indexOf(match[2].toLowerCase());
              const year = parseInt(match[3]);
              
              if (monthIndex !== -1) {
                return new Date(year, monthIndex, day);
              }
            } else {
              const monthIndex = monthNames.indexOf(match[1].toLowerCase());
              const day = parseInt(match[2]);
              const year = parseInt(match[3]);
              
              if (monthIndex !== -1) {
                return new Date(year, monthIndex, day);
              }
            }
          } else if (match[3]) {
            let year, month, day;
            
            if (pattern.source.includes('(\\d{4})-(\\d{1,2})-(\\d{1,2})')) {
              year = parseInt(match[1]);
              month = parseInt(match[2]) - 1;
              day = parseInt(match[3]);
            } else {
              month = parseInt(match[1]) - 1;
              day = parseInt(match[2]);
              year = parseInt(match[3]);
            }
            
            return new Date(year, month, day);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing deadline:', error);
    }

    return new Date(new Date().getFullYear() + 1, 5, 1);
  }

  // 数据验证和迁移
  private validateAndMigrate(data: EnhancedApplicationStorageData): EnhancedApplication[] {
    if (!data.applications) return [];
    
    return data.applications.map(app => this.validateApplication(app)).filter(Boolean) as EnhancedApplication[];
  }

  // 验证单个申请数据
  private validateApplication(app: any): EnhancedApplication | null {
    try {
      if (!app.university || !app.programName) {
        console.warn('Invalid enhanced application: missing required fields', app);
        return null;
      }

      const validateDate = (dateStr: any): Date => {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? new Date() : date;
      };

      return {
        id: app.id || this.generateId(),
        programId: app.programId,
        university: app.university,
        programName: app.programName,
        programType: app.programType || 'Unknown',
        location: app.location || 'Unknown',
        
        dates: {
          applicationDeadline: validateDate(app.dates?.applicationDeadline),
          round: app.dates?.round || ApplicationRound.ROLLING,
          earlyDeadline: app.dates?.earlyDeadline ? validateDate(app.dates.earlyDeadline) : undefined,
          finalDeadline: app.dates?.finalDeadline ? validateDate(app.dates.finalDeadline) : undefined,
          decisionDate: app.dates?.decisionDate ? validateDate(app.dates.decisionDate) : undefined,
          depositDeadline: app.dates?.depositDeadline ? validateDate(app.dates.depositDeadline) : undefined,
        },
        
        languageTests: Array.isArray(app.languageTests) ? app.languageTests.map((test: any) => ({
          type: test.type || 'TOEFL',
          requirement: test.requirement || TestRequirement.REQUIRED,
          minScore: test.minScore || 'N/A',
          status: test.status || TestStatus.NOT_TAKEN,
          actualScore: test.actualScore,
          testDate: test.testDate ? validateDate(test.testDate) : undefined,
          notes: test.notes || ''
        })) : [],
        
        standardizedTests: Array.isArray(app.standardizedTests) ? app.standardizedTests.map((test: any) => ({
          type: test.type || 'GRE',
          requirement: test.requirement || TestRequirement.RECOMMENDED,
          status: test.status || TestStatus.NOT_TAKEN,
          actualScore: test.actualScore,
          testDate: test.testDate ? validateDate(test.testDate) : undefined,
          notes: test.notes || ''
        })) : [],
        
        recommendationRequirements: Array.isArray(app.recommendationRequirements) ? app.recommendationRequirements.map((req: any) => ({
          id: req.id || this.generateId(),
          recommenderId: req.recommenderId || '',
          recommenderName: req.recommenderName || '',
          status: req.status || RecommendationStatus.NOT_INVITED,
          invitedDate: req.invitedDate ? validateDate(req.invitedDate) : undefined,
          submittedDate: req.submittedDate ? validateDate(req.submittedDate) : undefined,
          notes: req.notes || ''
        })) : [],
        
        totalRecommendationsRequired: app.totalRecommendationsRequired || 2,
        
        documents: {
          resume: app.documents?.resume || DocumentStatus.IN_PROGRESS,
          essays: app.documents?.essays || DocumentStatus.IN_PROGRESS,
        },
        
        interview: {
          status: app.interview?.status || InterviewStatus.NO_INTERVIEW,
          type: app.interview?.type,
          scheduledDate: app.interview?.scheduledDate ? validateDate(app.interview.scheduledDate) : undefined,
          completedDate: app.interview?.completedDate ? validateDate(app.interview.completedDate) : undefined,
          interviewer: app.interview?.interviewer,
          notes: app.interview?.notes || ''
        },
        
        status: app.status || ApplicationStatus.NOT_OPEN,
        statusHistory: Array.isArray(app.statusHistory) ? app.statusHistory.map((h: any) => ({
          status: h.status || ApplicationStatus.NOT_OPEN,
          date: validateDate(h.date),
          notes: h.notes || ''
        })) : [],
        
        tier: app.tier || ApplicationTier.TARGET,
        sortingCategory: app.sortingCategory || SortingCategory.TIER,
        customCategory: app.customCategory,
        
        createdAt: validateDate(app.createdAt),
        updatedAt: validateDate(app.updatedAt),
        notes: app.notes || ''
      };
    } catch (error) {
      console.error('Error validating enhanced application:', error, app);
      return null;
    }
  }

  // 推荐人管理
  getRecommenders(): Recommender[] {
    try {
      const data = localStorage.getItem(this.RECOMMENDERS_KEY);
      if (!data) return [];
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load recommenders:', error);
      return [];
    }
  }

  saveRecommenders(recommenders: Recommender[]): void {
    try {
      localStorage.setItem(this.RECOMMENDERS_KEY, JSON.stringify(recommenders));
    } catch (error) {
      console.error('Failed to save recommenders:', error);
    }
  }

  addRecommender(recommender: Omit<Recommender, 'id'>): Recommender {
    const newRecommender: Recommender = {
      ...recommender,
      id: this.generateId()
    };

    const currentRecommenders = this.getRecommenders();
    const updatedRecommenders = [...currentRecommenders, newRecommender];
    this.saveRecommenders(updatedRecommenders);
    
    return newRecommender;
  }

  // 申请管理
  addApplication(application: Omit<EnhancedApplication, 'id' | 'createdAt' | 'updatedAt'>): EnhancedApplication {
    const newApp: EnhancedApplication = {
      ...application,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const currentApps = this.getApplications();
    const updatedApps = [...currentApps, newApp];
    this.saveApplications(updatedApps, this.getRecommenders());
    
    return newApp;
  }

  updateApplication(id: string, updates: Partial<EnhancedApplication>): void {
    const applications = this.getApplications();
    const index = applications.findIndex(app => app.id === id);
    
    if (index === -1) {
      throw new Error(`Enhanced application with id ${id} not found`);
    }

    applications[index] = {
      ...applications[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveApplications(applications, this.getRecommenders());
  }

  deleteApplication(id: string): void {
    const applications = this.getApplications();
    const filteredApps = applications.filter(app => app.id !== id);
    this.saveApplications(filteredApps, this.getRecommenders());
  }

  // 获取统计信息
  getStatistics(): {
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
  } {
    const applications = this.getApplications();
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const byStatus = Object.values(ApplicationStatus).reduce((acc, status) => {
      acc[status] = applications.filter(app => app.status === status).length;
      return acc;
    }, {} as Record<ApplicationStatus, number>);

    const byTier = Object.values(ApplicationTier).reduce((acc, tier) => {
      acc[tier] = applications.filter(app => app.tier === tier).length;
      return acc;
    }, {} as Record<ApplicationTier, number>);

    const upcomingDeadlines = applications
      .filter(app => {
        const deadline = new Date(app.dates.applicationDeadline);
        return deadline >= now && deadline <= oneWeekFromNow;
      })
      .sort((a, b) => new Date(a.dates.applicationDeadline).getTime() - new Date(b.dates.applicationDeadline).getTime());

    // 计算考试进度
    let languageTestsCompleted = 0;
    let standardizedTestsCompleted = 0;
    let totalTests = 0;

    applications.forEach(app => {
      app.languageTests.forEach(test => {
        if (test.status !== TestStatus.NOT_SUBMITTING) {
          totalTests++;
          if (test.status === TestStatus.COMPLETED) {
            languageTestsCompleted++;
          }
        }
      });
      
      app.standardizedTests.forEach(test => {
        if (test.status !== TestStatus.NOT_SUBMITTING) {
          totalTests++;
          if (test.status === TestStatus.COMPLETED) {
            standardizedTestsCompleted++;
          }
        }
      });
    });

    // 计算推荐信进度
    let recommendationCompleted = 0;
    let recommendationPending = 0;
    let recommendationNotInvited = 0;

    applications.forEach(app => {
      app.recommendationRequirements.forEach(req => {
        switch (req.status) {
          case RecommendationStatus.COMPLETED:
            recommendationCompleted++;
            break;
          case RecommendationStatus.PENDING:
            recommendationPending++;
            break;
          case RecommendationStatus.NOT_INVITED:
            recommendationNotInvited++;
            break;
        }
      });
    });

    return {
      total: applications.length,
      byStatus,
      byTier,
      upcomingDeadlines,
      testProgress: {
        languageTestsCompleted,
        standardizedTestsCompleted,
        totalTests
      },
      recommendationProgress: {
        completed: recommendationCompleted,
        pending: recommendationPending,
        notInvited: recommendationNotInvited
      }
    };
  }
}