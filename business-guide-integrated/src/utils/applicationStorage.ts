// src/utils/applicationStorage.ts

import { 
    Application, 
    ApplicationStatus, 
    MaterialItem, 
    ApplicationStorageData,
    StatusHistory 
  } from '../types/application';
  
export class ApplicationStorageManager {
  private readonly STORAGE_KEY = 'application_tracker_data';
  private readonly FAVORITES_KEY = 'program-favorites'; // 修正：使用正确的收藏键名
  private readonly VERSION = '1.0';

  // 生成唯一ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 获取所有申请数据
  getApplications(): Application[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        console.log('📭 No tracked applications found, checking for favorites to convert...');
        return [];
      }
      
      const parsed: ApplicationStorageData = JSON.parse(data);
      const apps = this.validateAndMigrate(parsed);
      console.log(`✅ Loaded ${apps.length} tracked applications`);
      return apps;
    } catch (error) {
      console.error('❌ Failed to load applications:', error);
      return [];
    }
  }

  // 保存申请数据
  saveApplications(applications: Application[]): void {
    try {
      const dataToSave: ApplicationStorageData = {
        version: this.VERSION,
        applications: applications.map(app => ({
          ...app,
          // 确保日期对象被正确序列化
          createdAt: new Date(app.createdAt),
          updatedAt: new Date(app.updatedAt),
          applicationDeadline: new Date(app.applicationDeadline),
          interviewDate: app.interviewDate ? new Date(app.interviewDate) : undefined,
          decisionDate: app.decisionDate ? new Date(app.decisionDate) : undefined,
          depositDeadline: app.depositDeadline ? new Date(app.depositDeadline) : undefined,
          statusHistory: app.statusHistory.map(history => ({
            ...history,
            date: new Date(history.date)
          }))
        })),
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
      console.log(`💾 Successfully saved ${applications.length} applications`);
    } catch (error) {
      console.error('❌ Failed to save applications:', error);
      throw new Error('保存申请数据失败');
    }
  }

  // 从收藏夹导入项目
  importFromFavorites(): Application[] {
    try {
      console.log('🔍 Starting import from favorites...');
      
      // 检查收藏列表
      const favoritesData = localStorage.getItem(this.FAVORITES_KEY);
      console.log('🔍 Raw favorites data:', favoritesData);
      
      if (!favoritesData) {
        console.log('📭 No favorites found in localStorage');
        return [];
      }

      const favoriteIds = JSON.parse(favoritesData);
      console.log('📋 Favorite IDs:', favoriteIds);
      
      if (!Array.isArray(favoriteIds) || favoriteIds.length === 0) {
        console.log('📭 Favorites array is empty or invalid');
        return [];
      }

      const convertedApps: Application[] = [];
      
      // 遍历每个收藏ID，获取详细数据
      favoriteIds.forEach((id: string, index: number) => {
        console.log(`🔄 Processing favorite ${index + 1}/${favoriteIds.length}: ${id}`);
        
        const itemData = localStorage.getItem(`program-${id}`);
        if (itemData) {
          try {
            const favoriteData = JSON.parse(itemData);
            console.log(`📄 Favorite data for ${id}:`, favoriteData);
            
            // 处理不同的数据格式
            let item;
            if (favoriteData.item) {
              // 新格式：{item, selectedFields, savedAt}
              item = favoriteData.item;
            } else {
              // 旧格式：直接是item数据
              item = favoriteData;
            }
            
            const application = this.convertFavoriteToApplication(item, favoriteData.selectedFields || [], favoriteData.savedAt);
            convertedApps.push(application);
            console.log(`✅ Converted ${application.university} - ${application.programName}`);
          } catch (error) {
            console.error(`❌ Error processing favorite ${id}:`, error);
          }
        } else {
          console.warn(`⚠️ No data found for favorite: program-${id}`);
        }
      });
      
      console.log(`🎉 Successfully converted ${convertedApps.length} favorites to applications`);
      return convertedApps;
    } catch (error) {
      console.error('❌ Error importing from favorites:', error);
      return [];
    }
  }

  // 将收藏项目转换为申请项目
  private convertFavoriteToApplication(
    itemData: any, 
    selectedFields: string[] = [], 
    savedAt?: string
  ): Application {
    const now = new Date();
    
    console.log('🔄 Converting item to application:', {
      university: itemData.University,
      programName: itemData.ProgramName,
      deadline: itemData.DeadlineRounds
    });
    
    // 从项目数据中提取字段
    const university = itemData.University || 'Unknown University';
    const programName = itemData.ProgramName || 'Unknown Program';
    const programType = itemData.ProgramType || 'Unknown Type';
    const location = itemData.Location || 'Unknown Location';
    
    // 处理截止日期
    const deadlineStr = itemData.DeadlineRounds || '';
    const deadline = this.parseDeadline(deadlineStr);
    
    console.log('📅 Deadline conversion:', `"${deadlineStr}" → ${deadline.toLocaleDateString()}`);
    
    // 生成程序ID（用于重复检测）
    const programId = this.generateProgramId(university, programName);
    
    const newApp: Application = {
      id: this.generateId(),
      programId: programId,
      university: university,
      programName: programName,
      programType: programType,
      location: location,
      status: ApplicationStatus.PREPARING,
      statusHistory: [{
        status: ApplicationStatus.PREPARING,
        date: now,
        notes: '从收藏夹导入'
      }],
      applicationDeadline: deadline,
      materialChecklist: this.generateDefaultChecklist(programType),
      createdAt: savedAt ? new Date(savedAt) : now,
      updatedAt: now,
      notes: `从收藏夹导入 - ${university} ${programName}`
    };
    
    console.log('✅ Created application:', {
      id: newApp.id,
      university: newApp.university,
      programName: newApp.programName,
      deadline: newApp.applicationDeadline.toLocaleDateString(),
      status: newApp.status
    });
    
    return newApp;
  }

  // 生成程序ID（用于重复检测）
  private generateProgramId(university: string, programName: string): string {
    return `${university}-${programName}`.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
  }

  // 解析申请截止日期
  private parseDeadline(deadlineStr: string): Date {
    console.log('📅 Parsing deadline string:', deadlineStr);
    
    if (!deadlineStr || deadlineStr.trim() === '') {
      const defaultDate = new Date(new Date().getFullYear() + 1, 5, 1); // 明年6月1日
      console.log('📅 Using default deadline:', defaultDate);
      return defaultDate;
    }

    try {
      // 处理 "Standard Deadline: 01 Feb 2025" 格式
      const colonIndex = deadlineStr.indexOf(':');
      if (colonIndex !== -1) {
        deadlineStr = deadlineStr.substring(colonIndex + 1).trim();
      }
      
      // 尝试直接解析
      const directParse = new Date(deadlineStr);
      if (!isNaN(directParse.getTime())) {
        console.log('📅 Direct parse successful:', directParse);
        return directParse;
      }

      // 处理各种格式
      const patterns = [
        // "01 Feb 2025", "1 Feb 2025"
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i,
        // "Feb 01 2025", "Feb 1 2025"  
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{4})/i,
        // "2025-02-01"
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        // "02/01/2025"
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        // "12月15日"
        /(\d{1,2})月(\d{1,2})日/,
        // "12/15", "12-15"
        /(\d{1,2})[\/\-](\d{1,2})$/
      ];

      for (const pattern of patterns) {
        const match = deadlineStr.match(pattern);
        if (match) {
          console.log('📅 Pattern matched:', pattern, match);
          
          if (pattern.source.includes('Jan|Feb')) {
            // 处理月份名称格式
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                              'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            
            if (match[2]) {
              // "01 Feb 2025" 格式
              const day = parseInt(match[1]);
              const monthIndex = monthNames.indexOf(match[2].toLowerCase());
              const year = parseInt(match[3]);
              
              if (monthIndex !== -1) {
                const result = new Date(year, monthIndex, day);
                console.log('📅 Month name format parsed:', result);
                return result;
              }
            } else {
              // "Feb 01 2025" 格式
              const monthIndex = monthNames.indexOf(match[1].toLowerCase());
              const day = parseInt(match[2]);
              const year = parseInt(match[3]);
              
              if (monthIndex !== -1) {
                const result = new Date(year, monthIndex, day);
                console.log('📅 Month name format parsed:', result);
                return result;
              }
            }
          } else if (pattern.source.includes('月')) {
            // 中文格式：12月15日
            const month = parseInt(match[1]) - 1;
            const day = parseInt(match[2]);
            const currentYear = new Date().getFullYear();
            const year = month < new Date().getMonth() ? currentYear + 1 : currentYear;
            
            const result = new Date(year, month, day);
            console.log('📅 Chinese format parsed:', result);
            return result;
          } else if (match[3]) {
            // 其他有年份的格式
            let year, month, day;
            
            if (pattern.source.includes('(\\d{4})-(\\d{1,2})-(\\d{1,2})')) {
              // YYYY-MM-DD
              year = parseInt(match[1]);
              month = parseInt(match[2]) - 1;
              day = parseInt(match[3]);
            } else {
              // MM/DD/YYYY
              month = parseInt(match[1]) - 1;
              day = parseInt(match[2]);
              year = parseInt(match[3]);
            }
            
            const result = new Date(year, month, day);
            console.log('📅 Date format parsed:', result);
            return result;
          } else {
            // 只有月日，没有年份
            const month = parseInt(match[1]) - 1;
            const day = parseInt(match[2]);
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            
            const year = month < currentMonth ? currentYear + 1 : currentYear;
            const result = new Date(year, month, day);
            console.log('📅 Month/day format parsed:', result);
            return result;
          }
        }
      }
    } catch (error) {
      console.error('📅 Error parsing deadline:', error);
    }

    // 如果无法解析，返回默认日期
    const defaultDate = new Date(new Date().getFullYear() + 1, 5, 1);
    console.warn('📅 Could not parse deadline, using default:', deadlineStr, '→', defaultDate);
    return defaultDate;
  }

  // 生成默认材料清单
  private generateDefaultChecklist(programType: string): MaterialItem[] {
    const baseMaterials = [
      { name: '成绩单', required: true },
      { name: '学位证明', required: true },
      { name: 'Personal Statement', required: true },
      { name: '简历/CV', required: true },
      { name: '推荐信', required: true },
      { name: '语言成绩单(托福/雅思)', required: true }
    ];

    // 根据项目类型添加特殊材料
    const additionalMaterials: Array<{ name: string; required: boolean }> = [];
    
    if (programType?.toLowerCase().includes('mba') || 
        programType?.toLowerCase().includes('business')) {
      additionalMaterials.push(
        { name: 'GMAT成绩', required: false },
        { name: '工作经验证明', required: false }
      );
    } else if (programType?.toLowerCase().includes('finance') ||
               programType?.toLowerCase().includes('economics')) {
      additionalMaterials.push(
        { name: 'GRE成绩', required: false },
        { name: '量化背景证明', required: false }
      );
    } else {
      additionalMaterials.push(
        { name: 'GRE/GMAT成绩', required: false }
      );
    }

    // 如果是艺术或设计相关项目
    if (programType?.toLowerCase().includes('design') ||
        programType?.toLowerCase().includes('art')) {
      additionalMaterials.push(
        { name: '作品集', required: true }
      );
    }

    const allMaterials = [...baseMaterials, ...additionalMaterials];
    
    return allMaterials.map(material => ({
      id: this.generateId(),
      name: material.name,
      required: material.required,
      completed: false,
      notes: ''
    }));
  }

  // 数据验证和迁移
  private validateAndMigrate(data: ApplicationStorageData): Application[] {
    if (!data.applications) return [];
    
    return data.applications.map(app => this.validateApplication(app)).filter(Boolean) as Application[];
  }

  // 验证单个申请数据
  private validateApplication(app: any): Application | null {
    try {
      // 必填字段验证
      if (!app.university || !app.programName) {
        console.warn('Invalid application: missing required fields', app);
        return null;
      }

      // 确保日期对象正确
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
        status: app.status || ApplicationStatus.PREPARING,
        statusHistory: Array.isArray(app.statusHistory) ? app.statusHistory.map((h: any) => ({
          status: h.status || ApplicationStatus.PREPARING,
          date: validateDate(h.date),
          notes: h.notes || ''
        })) : [],
        applicationDeadline: validateDate(app.applicationDeadline),
        interviewDate: app.interviewDate ? validateDate(app.interviewDate) : undefined,
        decisionDate: app.decisionDate ? validateDate(app.decisionDate) : undefined,
        depositDeadline: app.depositDeadline ? validateDate(app.depositDeadline) : undefined,
        materialChecklist: Array.isArray(app.materialChecklist) ? app.materialChecklist : [],
        createdAt: validateDate(app.createdAt),
        updatedAt: validateDate(app.updatedAt),
        notes: app.notes || ''
      };
    } catch (error) {
      console.error('Error validating application:', error, app);
      return null;
    }
  }

  // 添加新申请
  addApplication(application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Application {
    const newApp: Application = {
      ...application,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const currentApps = this.getApplications();
    const updatedApps = [...currentApps, newApp];
    this.saveApplications(updatedApps);
    
    return newApp;
  }

  // 更新申请
  updateApplication(id: string, updates: Partial<Application>): void {
    const applications = this.getApplications();
    const index = applications.findIndex(app => app.id === id);
    
    if (index === -1) {
      throw new Error(`Application with id ${id} not found`);
    }

    applications[index] = {
      ...applications[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveApplications(applications);
  }

  // 删除申请
  deleteApplication(id: string): void {
    const applications = this.getApplications();
    const filteredApps = applications.filter(app => app.id !== id);
    this.saveApplications(filteredApps);
  }

  // 获取统计信息
  getStatistics(): {
    total: number;
    byStatus: Record<ApplicationStatus, number>;
    upcomingDeadlines: Application[];
  } {
    const applications = this.getApplications();
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const byStatus = Object.values(ApplicationStatus).reduce((acc, status) => {
      acc[status] = applications.filter(app => app.status === status).length;
      return acc;
    }, {} as Record<ApplicationStatus, number>);

    const upcomingDeadlines = applications
      .filter(app => {
        const deadline = new Date(app.applicationDeadline);
        return deadline >= now && deadline <= oneWeekFromNow;
      })
      .sort((a, b) => new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime());

    return {
      total: applications.length,
      byStatus,
      upcomingDeadlines
    };
  }

  // 调试：检查收藏数据格式
  debugFavorites(): void {
    console.log('🔍 Debug: Checking favorites data structure...');
    
    const favoritesData = localStorage.getItem(this.FAVORITES_KEY);
    console.log('Raw favorites:', favoritesData);
    
    if (favoritesData) {
      try {
        const favoriteIds = JSON.parse(favoritesData);
        console.log('Favorite IDs:', favoriteIds);
        
        if (Array.isArray(favoriteIds)) {
          favoriteIds.slice(0, 3).forEach((id, index) => {
            const itemData = localStorage.getItem(`program-${id}`);
            console.log(`Sample favorite ${index + 1} (${id}):`, itemData);
          });
        }
      } catch (error) {
        console.error('Error parsing favorites:', error);
      }
    }
    
    // 检查所有 program- 开头的键
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('program-'));
    console.log('All program- keys:', allKeys);
  }
}