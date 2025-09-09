import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import SelectorApp from './components/SelectorApp';
import Sidebar from './components/Sidebar';
import ArticleView from './components/ArticleView';
import FavoritesPage from './components/FavoritesPage';
import ApplicationTracker from './components/ApplicationTracker';
import EnhancedApplicationTracker from './components/EnhancedApplicationTracker';
import { Analytics } from '@vercel/analytics/react';
import { 
  Book, 
  Folder, 
  ClipboardCheck, 
  StatsReport, 
  Medal, 
  Star, 
  ArrowUp,
  Menu,
  Home
} from 'iconoir-react';

// 主页组件
const HomePage: React.FC<{ onMenuClick?: () => void }> = ({ onMenuClick }) => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="logo-text">
            <h1 className="site-title">猿人之家 - 硕士留学一站式信息平台</h1>
          </div>
          <div className="hero-description">
            <div className="description-badge">
              <span className="badge-icon"><Medal width={20} height={20} color="var(--morandi-sage)" /></span>
              <span className="badge-text">致力于为申请<span className="highlight">美英港新加坡澳商科硕士项目</span>的同学减少信息差</span>
            </div>
            <div className="programs-note">
              涵盖 Finance、Business Analytics、Economics、Data Science、Management、Fintech、Marketing 等商科交叉项目
            </div>
          </div>
        </div>
      </section>

      {/* 四大核心功能 */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="features-title">四大核心功能</h2>
          
          <div className="features-grid">
            <div 
              className="feature-card clickable"
              onClick={onMenuClick}
            >
              <div className="feature-icon"><Book width={24} height={24} color="var(--morandi-sage)" /></div>
              <h3>文章库</h3>
              <p>申请经验、院校分析、行业调研</p>
            </div>
            
            <div 
              className="feature-card clickable"
              onClick={() => navigate('/selector')}
            >
              <div className="feature-icon"><Folder width={24} height={24} color="var(--morandi-info)" /></div>
              <h3>信息库</h3>
              <p>505+ 项目数据，持续更新</p>
            </div>
            
            <div className="feature-card disabled">
              <div className="feature-icon"><ClipboardCheck width={24} height={24} color="var(--morandi-warning)" /></div>
              <h3>选校报告</h3>
              <p>个性化选校建议与规划</p>
            </div>
            
            <div 
              className="feature-card clickable"
              onClick={() => navigate('/enhanced-tracker')}
            >
              <div className="feature-icon"><StatsReport width={24} height={24} color="var(--morandi-success)" /></div>
              <h3>申请跟踪</h3>
              <p>进度管理，不错过任何截止日期</p>
            </div>
          </div>
        </div>
      </section>

      {/* 网站信息区域 */}
      <section className="site-info">
        <div className="info-section">
          <h3>关于网站内容：</h3>
          <p>是"猿人安妮"账号之前的xhs文章+实时更新的其他同学就读体验整理+实时更新的官网，初衷是让想申请econ以及商科美硕的同学们更加了解项目本身，了解申请流程，从而为自己设计求学之路。（当然我也很高兴以这种方式和大家认识！）</p>
        </div>

        <div className="info-section">
          <h3>关于网站开发：</h3>
          <p>猿人独立开发。我一开始啥也不会只能用本地bracket手写，挂了一个自己喜欢的域名。</p>
          <p>作为上过0节cs课的纯小白，我还在探索网页编辑，会慢慢改进的！</p>
        </div>

        <div className="info-section">
          <h3>关于我 ：）</h3>
          <p>我是Anna, 一个Cornell AEM无名之辈，现在base ⚐，之前是全国一卷英语低分文科生，现在是总写不明白各种代码的⟁</p>
          <p>俺有自己的主业，非各种中介的利益相关方，所以分享内容也没啥利益导向，就是自己做着玩玩～</p>
          <p>如果有朋友需要更详细的问答 / 文书与选校建议，可以在xhs 猿人安妮上私信我，做一些小有偿答疑，服务menu在xhs商城</p>
        </div>

        <div className="contact-section">
          <p>⟐ 欢迎投稿与合作：yuanrenannie@gmail.com</p>
          
          {/* 社交媒体悬浮按钮 */}
          <div className="social-buttons">
            <a 
              href="https://www.linkedin.com/in/mingyuecao/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-btn linkedin"
            >
              ⧨ LinkedIn
            </a>
            <a 
              href="https://www.xiaohongshu.com/user/profile/5d2140e5000000001103bb42?xsec_token=ABOMil5j1znwtivmC_qZCiFFSqp_pX60pRkQHYUOs0UdA%3D&xsec_source=pc_search" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-btn xiaohongshu"
            >
              ⧖ 小红书
            </a>
            <button 
              onClick={() => {
                const wechatId = 'yuanshenanna';
                navigator.clipboard.writeText(wechatId).then(() => {
                  alert('⟡ 微信号已复制到剪贴板！\n\n微信号：yuanshenanna\n（猿神安娜的全拼，是不是很好记？⧬）\n\n请在微信中添加好友时粘贴使用～');
                }).catch(() => {
                  alert('微信号：yuanshenanna\n（猿神安娜的全拼）\n\n请手动复制微信号添加好友～');
                });
              }}
              className="social-btn wechat"
            >
              ⧩ 微信联系
            </button>
            <a 
              href="mailto:yuanrenannie@gmail.com" 
              className="social-btn email"
            >
              ⟐ 邮件联系
            </a>
          </div>
        </div>
      </section>

      {/* 更新提示 */}
      <section className="update-notice">
        <p>本站内容会持续更新，现在网站在试运行阶段，谢谢大家的关注，也欢迎大家分享～</p>
        
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="back-to-top"
        >
          <ArrowUp width={16} height={16} style={{ marginRight: '0.5rem' }} />
          返回顶部
        </button>
      </section>

      {/* 版权信息 */}
      <footer className="site-footer">
        <p>© 2025 猿人之家 · 由 Anna 独立开发与维护</p>
      </footer>
    </div>
  );
};

// 导航组件
const Navigation: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-left">
          <button className="menu-button" onClick={onMenuClick}>
            <Menu width={18} height={18} />
          </button>
          <Link to="/" className="nav-logo">
            <Home width={20} height={20} style={{ marginRight: '0.5rem' }} />
            猿人之家
          </Link>
        </div>
        <div className="nav-center">
          <div className="nav-features">
            <button className="nav-feature" onClick={onMenuClick} title="文章库">
              <Book width={16} height={16} /> <span>文章库</span>
            </button>
            <Link to="/selector" className="nav-feature" title="信息库">
              <Folder width={16} height={16} /> <span>信息库</span>
            </Link>
            <div className="nav-feature disabled" title="选校报告（即将推出）">
              <ClipboardCheck width={16} height={16} /> <span>选校报告</span>
            </div>
            <Link to="/enhanced-tracker" className="nav-feature" title="申请跟踪">
              <StatsReport width={16} height={16} /> <span>申请跟踪</span>
            </Link>
          </div>
        </div>
        <div className="nav-right">
          <Link to="/favorites" className="nav-link favorites-link">
            <Star width={16} height={16} /> <span>收藏</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

// 主应用组件
const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <Router>
      <div className="App">
        <Navigation onMenuClick={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <Routes>
            <Route path="/" element={<HomePage onMenuClick={toggleSidebar} />} />
            <Route path="/selector" element={<SelectorApp />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/article/:category/:filename" element={<ArticleView />} />
            <Route path="/tracker" element={<ApplicationTracker />} />
            <Route path="/enhanced-tracker" element={<EnhancedApplicationTracker />} />
          </Routes>
        </main>
        
        <Analytics />

      </div>
    </Router>
  );
};

export default App;