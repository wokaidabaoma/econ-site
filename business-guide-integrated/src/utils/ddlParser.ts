// DDL智能解析工具
// 用于解析和管理申请截止日期的轮次信息

export interface ApplicationRound {
  id: string;
  name: string;
  deadline: Date;
  description?: string;
}

export interface ParsedDDL {
  type: 'single' | 'multiple' | 'rolling' | 'ongoing';
  rounds: ApplicationRound[];
  originalText: string;
  hasMultipleRounds: boolean;
}

export class DDLParser {
  private static currentYear = new Date().getFullYear();
  private static nextYear = DDLParser.currentYear + 1;

  /**
   * 主要解析函数 - 解析各种格式的DDL文本
   */
  static parse(ddlText: string): ParsedDDL {
    if (!ddlText || typeof ddlText !== 'string') {
      return DDLParser.createEmptyResult(ddlText);
    }

    const cleanText = ddlText.trim().toLowerCase();
    
    // 检查滚动招生
    if (DDLParser.isRollingAdmission(cleanText)) {
      return DDLParser.parseRollingAdmission(ddlText);
    }

    // 检查持续招生
    if (DDLParser.isOngoingAdmission(cleanText)) {
      return DDLParser.parseOngoingAdmission(ddlText);
    }

    // 检查多轮次格式 (如: phase1-10/12/25; phase2-11/30/25)
    if (DDLParser.hasMultiplePhases(cleanText)) {
      return DDLParser.parseMultiplePhases(ddlText);
    }

    // 检查简单日期格式 (如: 6/1, 12/15)
    if (DDLParser.isSimpleDate(cleanText)) {
      return DDLParser.parseSimpleDate(ddlText);
    }

    // 检查月份年份格式 (如: november 2024, december 2025)
    if (DDLParser.isMonthYear(cleanText)) {
      return DDLParser.parseMonthYear(ddlText);
    }

    // 如果都不匹配，返回原文本
    return DDLParser.createUnparsedResult(ddlText);
  }

  /**
   * 检查是否为滚动招生
   */
  private static isRollingAdmission(text: string): boolean {
    const rollingKeywords = ['rolling', 'rolling basis', 'rolling admission'];
    return rollingKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * 检查是否为持续招生
   */
  private static isOngoingAdmission(text: string): boolean {
    const ongoingKeywords = ['onwards', 'ongoing', 'open', 'continuous'];
    return ongoingKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * 检查是否包含多个阶段
   */
  private static hasMultiplePhases(text: string): boolean {
    const phasePattern = /(phase|round|tier|batch)\s*\d+/gi;
    const matches = text.match(phasePattern);
    return Boolean(matches && matches.length > 1);
  }

  /**
   * 检查是否为简单日期格式 (月/日)
   */
  private static isSimpleDate(text: string): boolean {
    const simpleDatePattern = /^\d{1,2}\/\d{1,2}$/;
    return simpleDatePattern.test(text.trim());
  }

  /**
   * 检查是否为月份年份格式
   */
  private static isMonthYear(text: string): boolean {
    const monthYearPattern = /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i;
    return monthYearPattern.test(text);
  }

  /**
   * 解析滚动招生
   */
  private static parseRollingAdmission(ddlText: string): ParsedDDL {
    return {
      type: 'rolling',
      rounds: [{
        id: 'rolling',
        name: '滚动招生',
        deadline: new Date(DDLParser.nextYear, 11, 31), // 默认到下一年年底
        description: '申请材料齐全后即可提交，建议尽早申请'
      }],
      originalText: ddlText,
      hasMultipleRounds: false
    };
  }

  /**
   * 解析持续招生
   */
  private static parseOngoingAdmission(ddlText: string): ParsedDDL {
    return {
      type: 'ongoing',
      rounds: [{
        id: 'ongoing',
        name: '持续招生',
        deadline: new Date(DDLParser.nextYear, 11, 31),
        description: '招生持续进行中，建议尽早申请'
      }],
      originalText: ddlText,
      hasMultipleRounds: false
    };
  }

  /**
   * 解析多轮次格式
   */
  private static parseMultiplePhases(ddlText: string): ParsedDDL {
    const rounds: ApplicationRound[] = [];
    
    // 匹配类似 "phase1-10/12/25; phase2-11/30/25" 的格式
    const phasePattern = /(phase|round|tier|batch)\s*(\d+)[^;]*?(\d{1,2}\/\d{1,2}\/\d{2,4})/gi;
    let match;

    while ((match = phasePattern.exec(ddlText)) !== null) {
      const [, phaseType, phaseNumber, dateStr] = match;
      const deadline = DDLParser.parseFlexibleDate(dateStr);
      
      if (deadline) {
        rounds.push({
          id: `${phaseType.toLowerCase()}${phaseNumber}`,
          name: `${phaseType.charAt(0).toUpperCase() + phaseType.slice(1)} ${phaseNumber}`,
          deadline: deadline,
          description: `第${phaseNumber}轮申请截止`
        });
      }
    }

    // 如果没有匹配到标准格式，尝试其他格式
    if (rounds.length === 0) {
      // 匹配用分号分隔的日期
      const datePattern = /(\d{1,2}\/\d{1,2}\/?\d{0,4})/g;
      const dates = ddlText.match(datePattern);
      
      if (dates && dates.length > 1) {
        dates.forEach((dateStr, index) => {
          const deadline = DDLParser.parseFlexibleDate(dateStr);
          if (deadline) {
            rounds.push({
              id: `round${index + 1}`,
              name: `第${index + 1}轮`,
              deadline: deadline,
              description: `第${index + 1}轮申请截止`
            });
          }
        });
      }
    }

    return {
      type: 'multiple',
      rounds: rounds.sort((a, b) => a.deadline.getTime() - b.deadline.getTime()),
      originalText: ddlText,
      hasMultipleRounds: true
    };
  }

  /**
   * 解析简单日期格式 (如: 6/1)
   */
  private static parseSimpleDate(ddlText: string): ParsedDDL {
    const deadline = DDLParser.parseFlexibleDate(ddlText);
    
    if (deadline) {
      return {
        type: 'single',
        rounds: [{
          id: 'main',
          name: '申请截止',
          deadline: deadline,
          description: '主申请截止日期'
        }],
        originalText: ddlText,
        hasMultipleRounds: false
      };
    }

    return DDLParser.createUnparsedResult(ddlText);
  }

  /**
   * 解析月份年份格式
   */
  private static parseMonthYear(ddlText: string): ParsedDDL {
    const monthYearPattern = /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i;
    const match = ddlText.match(monthYearPattern);
    
    if (match) {
      const [, monthName, year] = match;
      const monthIndex = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ].indexOf(monthName.toLowerCase());
      
      const deadline = new Date(parseInt(year), monthIndex, 28); // 默认月末
      
      return {
        type: 'single',
        rounds: [{
          id: 'main',
          name: '申请截止',
          deadline: deadline,
          description: `${monthName} ${year} 申请截止`
        }],
        originalText: ddlText,
        hasMultipleRounds: false
      };
    }

    return DDLParser.createUnparsedResult(ddlText);
  }

  /**
   * 灵活解析日期字符串
   */
  private static parseFlexibleDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // 清理日期字符串
    const cleaned = dateStr.trim().replace(/[^\d\/]/g, '');
    
    // 处理不同的日期格式
    const patterns = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, // MM/DD/YY
      /^(\d{1,2})\/(\d{1,2})$/ // MM/DD (无年份)
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        const [, month, day, year] = match;
        let fullYear: number;

        if (year) {
          fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
        } else {
          // 如果没有年份，智能判断
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth() + 1;
          const targetMonth = parseInt(month);
          
          // 如果目标月份小于当前月份，假设是明年
          fullYear = targetMonth < currentMonth ? DDLParser.nextYear : DDLParser.currentYear;
        }

        const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        
        // 验证日期是否有效
        if (date.getMonth() === parseInt(month) - 1) {
          return date;
        }
      }
    }

    return null;
  }

  /**
   * 创建空结果
   */
  private static createEmptyResult(originalText: string): ParsedDDL {
    return {
      type: 'single',
      rounds: [],
      originalText: originalText || '',
      hasMultipleRounds: false
    };
  }

  /**
   * 创建未解析结果
   */
  private static createUnparsedResult(originalText: string): ParsedDDL {
    return {
      type: 'single',
      rounds: [{
        id: 'unknown',
        name: '截止日期待定',
        deadline: new Date(DDLParser.nextYear, 11, 31),
        description: originalText
      }],
      originalText: originalText,
      hasMultipleRounds: false
    };
  }

  /**
   * 获取用户友好的轮次选项
   */
  static getRoundOptions(parsedDDL: ParsedDDL): Array<{ value: string; label: string; deadline: Date }> {
    if (!parsedDDL.hasMultipleRounds) {
      return parsedDDL.rounds.map(round => ({
        value: round.id,
        label: round.name,
        deadline: round.deadline
      }));
    }

    return parsedDDL.rounds.map(round => ({
      value: round.id,
      label: `${round.name} (${round.deadline.toLocaleDateString()})`,
      deadline: round.deadline
    }));
  }

  /**
   * 根据轮次ID获取特定截止日期
   */
  static getDeadlineByRound(parsedDDL: ParsedDDL, roundId: string): Date | null {
    const round = parsedDDL.rounds.find(r => r.id === roundId);
    return round ? round.deadline : null;
  }
}

// 导出便捷函数
export const parseDDL = DDLParser.parse;
export const getRoundOptions = DDLParser.getRoundOptions;
export const getDeadlineByRound = DDLParser.getDeadlineByRound;