import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarItem {
  title: string;
  path?: string;
  children?: SidebarItem[];
  icon?: string;
}

const sidebarData: SidebarItem[] = [
  {
    title: '⌂ 首页',
    path: '/',
  },
  {
    title: '⚏ 申请季Tips',
    children: [
      { title: '◯ 申请季前期- 心态与准备', path: '/article/update/update-1' },
      { title: '⚞ 申请季中期- 网申注意事项', path: '/article/update/update-2' },
    ],
  },
  {
    title: '⟋ ECON',
    children: [
      { title: '⌘ 目录 – 经济学方向 Intro', path: '/article/econ/intro' },
      { title: '⚇ Chapter 0. 过来人的 econ 申请总结', path: '/article/econ/econ-0' },
      { title: '◉ Chapter 1. Econ 项目拆解总纲', path: '/article/econ/econ-1' },
      {
        title: '⧇ Chapter 2. "跳板硕"系列',
        children: [
          { title: '2.0 跳板硕前言', path: '/article/econ/econ-2.0' },
          { title: '2.1 Uchi - MAPSS', path: '/article/econ/econ-2.1' },
          { title: '2.2 Uchi - MACSS', path: '/article/econ/econ-2.2' },
          { title: '2.3 Yale IDE', path: '/article/econ/econ-2.3' },
          { title: '2.4 Duke MAE', path: '/article/econ/econ-2.4' },
          { title: '2.5 Duke MSEC', path: '/article/econ/econ-2.5' },
          { title: '2.6 Duke MAPE', path: '/article/econ/econ-2.6' },
          { title: '2.7 Columbia MAE', path: '/article/econ/econ-2.7' },
          { title: '2.8 Cornell MS AEM', path: '/article/econ/econ-2.8' },
          { title: '2.9 NYU MSQE', path: '/article/econ/econ-2.9' },
          { title: '2.10 NYU MAE', path: '/article/econ/econ-2.10' },
          { title: '2.11 UT Austin MAE', path: '/article/econ/econ-2.11' },
          { title: '2.12 Wisc Econ三专业', path: '/article/econ/econ-2.12' },
          { title: '2.13 UCD - ARE', path: '/article/econ/econ-2.13' },
        ],
      },
      {
        title: '⟐ Chapter 3. 偏就业导向econ硕',
        children: [
          { title: '3.1 UCLA - MQE', path: '/article/econ/econ-3.1' },
          { title: '3.2 JHU MIEF', path: '/article/econ/econ-3.2' },
          { title: '3.3 Cornell MPS AEM -- 猿人所在', path: '/article/econ/econ-3.3' },
          { title: '3.4 Umich MAE', path: '/article/econ/econ-3.4' },
        ],
      },
    ],
  },
  {
    title: '⧪ BA',
    children: [
      { title: '⧗ 前言建设中...', path: '#' },
      {
        title: 'Chapter 1. "更多元背景"系列',
        children: [
          { title: '1.1 Columbia - MSBA', path: '/article/ba/ba-1.1' },
          { title: '1.2 Duke - MQM', path: '/article/ba/ba-1.2' },
          { title: '1.3 CMU - MISM BIDA', path: '/article/ba/ba-1.3' },
        ],
      },
    ],
  },
  {
    title: '⟐ Finance',
    children: [
      { title: '⧗ 内容建设中...', path: '#' },
    ],
  },
  {
    title: '⧉ Management',
    children: [
      { title: '⧗ 内容建设中...', path: '#' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (title: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedItems(newExpanded);
  };

  const renderSidebarItem = (item: SidebarItem, level: number = 0): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.title);
    const isActive = item.path === location.pathname;

    return (
      <div key={item.title} className={`sidebar-item level-${level}`}>
        {hasChildren ? (
          <button
            className={`sidebar-toggle ${isExpanded ? 'expanded' : ''}`}
            onClick={() => toggleExpanded(item.title)}
          >
            <span className="sidebar-icon">{isExpanded ? '▼' : '▶'}</span>
            <span className="sidebar-title">{item.title}</span>
          </button>
        ) : (
          <Link
            to={item.path || '#'}
            className={`sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar-title">{item.title}</span>
          </Link>
        )}
        
        {hasChildren && isExpanded && (
          <div className="sidebar-children">
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>⟣ 导航目录</h3>
          <button className="sidebar-close" onClick={onClose}>×</button>
        </div>
        <div className="sidebar-content">
          {sidebarData.map(item => renderSidebarItem(item))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;