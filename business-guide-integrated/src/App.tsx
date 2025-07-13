import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import SelectorApp from './components/SelectorApp';
import Sidebar from './components/Sidebar';
import ArticleView from './components/ArticleView';

// 主页组件
const HomePage: React.FC<{ onMenuClick?: () => void }> = ({ onMenuClick }) => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      {/* 主标题区域 */}
      <header className="main-header">
        <h1 id="top">欢迎来到猿人之家-美国商科选校指南！</h1>
        
        <div className="intro-content">
          <p>本站致力于为申请美国商科相关硕士项目（Fin, BA , Econ , DS , Management , Fintech，Marketing 以及其他商科交叉项目）的同学减少信息差，会提供：</p>
          
          <ul className="feature-list">
            <li>项目的基本信息</li>
            <li>项目分类对比 （不同导向）</li>
            <li>26fall申请时间线与准备清单 （等待今年夏秋学校官网信息更新）</li>
            <li>项目录取趋势与就业数据</li>
            <li>看似小众其实很香的项目推荐</li>
          </ul>

          <div className="philosophy">
            <p>🐒 猿人理念："bar"的作用只限于选取保底校，不能因为哪个项目看起来"bar高"就拍脑袋去。</p>
            <p>所以建议同学们，在选校之前，要明确自己的未来导向：留美/回国？读博/找工？</p>
            <p>也需要先考虑学制/区域/预算等因素。</p>
          </div>
        </div>
      </header>

      {/* 筛选器工具展示区域 */}
      <section className="selector-showcase">
        <div className="tool-header">
          <h2>🎓 港新商科硕士项目筛选器</h2>
          <p>香港+新加坡硕士项目一站式筛选，支持多维度筛选对比</p>
        </div>
        
        {/* 筛选器优势文本描述 */}
        <div className="tool-features-text">
          <div className="feature-text-item">
            <strong>🎯 智能筛选：</strong>支持地区、学校、QS排名、语言成绩等多维度筛选，快速定位合适项目
          </div>
          <div className="feature-text-item">
            <strong>📊 实时对比：</strong>学费、申请要求、截止时间一目了然，便于横向比较分析
          </div>
          <div className="feature-text-item">
            <strong>📱 移动优化：</strong>手机、平板、电脑都有完美的使用体验，随时随地查看项目信息
          </div>
        </div>
        
        {/* 主要功能入口卡片 */}
        <div className="main-actions-grid">
          <div 
            className="action-card clickable"
            onClick={() => navigate('/selector')}
          >
            <span className="action-icon">🚀</span>
            <h3>进入信息库</h3>
            <p>港新商科硕士项目筛选器</p>
          </div>
          <div 
            className="action-card clickable"
            onClick={onMenuClick}
          >
            <span className="action-icon">📚</span>
            <h3>浏览猿人所有文章</h3>
            <p>申请指南、项目分析、经验分享</p>
          </div>
          <div className="action-card disabled">
            <span className="action-icon">🤖</span>
            <h3>26fall AI选校定位工具</h3>
            <p>敬请期待</p>
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
          <p>我是Anna, 一个Cornell AEM无名之辈，现在base 🇺🇸，之前是全国一卷英语低分文科生，现在是总写不明白各种代码的🤡</p>
          <p>俺有自己的主业，非各种中介的利益相关方，所以分享内容也没啥利益导向，就是自己做着玩玩～</p>
          <p>如果有朋友需要更详细的问答 / 文书与选校建议，可以在xhs 猿人安妮上私信我，做一些小有偿答疑，服务menu在xhs商城</p>
        </div>

        <div className="contact-section">
          <p>📮欢迎投稿与合作：yuanrenannie@gmail.com</p>
          
          {/* 社交媒体悬浮按钮 */}
          <div className="social-buttons">
            <a 
              href="https://www.linkedin.com/in/mingyuecao/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-btn linkedin"
            >
              🧳 LinkedIn
            </a>
            <a 
              href="https://www.xiaohongshu.com/user/profile/5d2140e5000000001103bb42?xsec_token=ABOMil5j1znwtivmC_qZCiFFSqp_pX60pRkQHYUOs0UdA%3D&xsec_source=pc_search" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-btn xiaohongshu"
            >
              📕 小红书
            </a>
            <a 
              href="mailto:yuanrenannie@gmail.com" 
              className="social-btn email"
            >
              📬 联系猿人
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
          ⬆️ 返回顶部
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
            ☰
          </button>
          <Link to="/" className="nav-logo">
            🐒 猿人之家
          </Link>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link">首页</Link>
          <Link to="/selector" className="nav-link">筛选器工具</Link>
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
            <Route path="/article/:category/:filename" element={<ArticleView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
