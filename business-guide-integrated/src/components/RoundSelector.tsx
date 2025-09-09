// src/components/RoundSelector.tsx
// 智能轮次选择组件

import React, { useState, useEffect } from 'react';
import { DDLParser, ParsedDDL } from '../utils/ddlParser';
import { Calendar, Clock, NavArrowDown } from 'iconoir-react';

interface RoundSelectorProps {
  originalDDLText: string;
  selectedRoundId?: string;
  onRoundChange: (roundId: string, deadline: Date) => void;
  className?: string;
}

const RoundSelector: React.FC<RoundSelectorProps> = ({
  originalDDLText,
  selectedRoundId,
  onRoundChange,
  className = ''
}) => {
  const [parsedDDL, setParsedDDL] = useState<ParsedDDL | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 解析DDL文本
  useEffect(() => {
    if (originalDDLText) {
      const parsed = DDLParser.parse(originalDDLText);
      setParsedDDL(parsed);
      
      // 如果没有选中的轮次，默认选择第一个
      if (!selectedRoundId && parsed.rounds.length > 0) {
        const firstRound = parsed.rounds[0];
        onRoundChange(firstRound.id, firstRound.deadline);
      }
    }
  }, [originalDDLText, selectedRoundId, onRoundChange]);

  if (!parsedDDL || parsedDDL.rounds.length === 0) {
    return (
      <div className={`round-selector-empty ${className}`}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--morandi-text-muted)',
          fontSize: '0.875rem'
        }}>
          <Clock width={16} height={16} />
          <span>DDL待定: {originalDDLText}</span>
        </div>
      </div>
    );
  }

  const selectedRound = parsedDDL.rounds.find(r => r.id === selectedRoundId) || parsedDDL.rounds[0];
  const roundOptions = DDLParser.getRoundOptions(parsedDDL);

  // 计算剩余天数
  const getDaysUntilDeadline = (deadline: Date): number => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilDeadline(selectedRound.deadline);

  const handleRoundSelect = (roundId: string) => {
    const round = parsedDDL.rounds.find(r => r.id === roundId);
    if (round) {
      onRoundChange(roundId, round.deadline);
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className={`round-selector ${className}`} style={{ position: 'relative' }}>
      {/* 单轮次显示 */}
      {!parsedDDL.hasMultipleRounds ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'var(--morandi-bg-secondary)',
          borderRadius: '6px',
          border: '1px solid var(--morandi-border)',
          fontSize: '0.875rem'
        }}>
          <Calendar width={16} height={16} color="var(--morandi-info)" />
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: '500',
              color: 'var(--morandi-text-primary)',
              marginBottom: '0.125rem'
            }}>
              {selectedRound.name}
            </div>
            <div style={{ 
              color: daysLeft < 0 ? 'var(--morandi-danger)' : 
                    daysLeft <= 7 ? '#d4907e' : 
                    daysLeft <= 30 ? 'var(--morandi-warning)' : 'var(--morandi-success)',
              fontSize: '0.75rem'
            }}>
              {selectedRound.deadline.toLocaleDateString()} • 
              {daysLeft > 0 ? ` ${daysLeft}天后` : ` 已过期${Math.abs(daysLeft)}天`}
            </div>
          </div>
        </div>
      ) : (
        /* 多轮次选择器 */
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'var(--morandi-bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--morandi-border)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
              <Calendar width={16} height={16} color="var(--morandi-info)" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ 
                  fontWeight: '500',
                  color: 'var(--morandi-text-primary)',
                  marginBottom: '0.125rem'
                }}>
                  {selectedRound.name}
                </div>
                <div style={{ 
                  color: daysLeft < 0 ? 'var(--morandi-danger)' : 
                        daysLeft <= 7 ? '#d4907e' : 
                        daysLeft <= 30 ? 'var(--morandi-warning)' : 'var(--morandi-success)',
                  fontSize: '0.75rem'
                }}>
                  {selectedRound.deadline.toLocaleDateString()} • 
                  {daysLeft > 0 ? ` ${daysLeft}天后` : ` 已过期${Math.abs(daysLeft)}天`}
                </div>
              </div>
            </div>
            <NavArrowDown 
              width={16} 
              height={16} 
              color="var(--morandi-text-muted)"
              style={{ 
                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </button>

          {/* 下拉选项 */}
          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              background: 'white',
              border: '1px solid var(--morandi-border)',
              borderRadius: '6px',
              boxShadow: '0 4px 20px rgba(181, 160, 130, 0.15)',
              marginTop: '0.25rem',
              overflow: 'hidden'
            }}>
              {roundOptions.map((option) => {
                const optionDaysLeft = getDaysUntilDeadline(option.deadline);
                const isSelected = option.value === selectedRoundId;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleRoundSelect(option.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: isSelected ? 'var(--morandi-bg-tertiary)' : 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      borderBottom: '1px solid var(--morandi-border)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--morandi-bg-secondary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ 
                      fontWeight: isSelected ? '600' : '500',
                      color: 'var(--morandi-text-primary)',
                      marginBottom: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      {option.label}
                    </div>
                    <div style={{ 
                      color: optionDaysLeft < 0 ? 'var(--morandi-danger)' : 
                            optionDaysLeft <= 7 ? '#d4907e' : 
                            optionDaysLeft <= 30 ? 'var(--morandi-warning)' : 'var(--morandi-success)',
                      fontSize: '0.75rem'
                    }}>
                      {option.deadline.toLocaleDateString()} • 
                      {optionDaysLeft > 0 ? ` ${optionDaysLeft}天后` : ` 已过期${Math.abs(optionDaysLeft)}天`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 原始DDL文本显示 */}
      {parsedDDL.type !== 'single' && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--morandi-text-muted)',
          fontStyle: 'italic'
        }}>
          原始信息: {parsedDDL.originalText}
        </div>
      )}

      {/* 点击外部关闭下拉框 */}
      {isDropdownOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default RoundSelector;