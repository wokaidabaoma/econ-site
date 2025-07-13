import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ArticleView: React.FC = () => {
  const { category, filename } = useParams<{ category: string; filename: string }>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 动态导入Markdown文件
        const response = await fetch(`/${category}/${filename}.md`);
        if (!response.ok) {
          throw new Error('文章未找到');
        }
        const text = await response.text();
        
        // 处理版权信息 - 移除HTML版权标志，会在底部统一显示
        const cleanedText = text.replace(
          /<p style="[^"]*">\s*© 2025 猿人之家[\s\S]*?<\/p>\s*$/m,
          ''
        );
        
        setContent(cleanedText);
      } catch (err) {
        console.error('加载文章失败:', err);
        setError('无法加载文章内容');
      } finally {
        setLoading(false);
      }
    };

    if (category && filename) {
      loadArticle();
    }
  }, [category, filename]);

  if (loading) {
    return (
      <div className="article-loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-error">
        <h2>😅 文章暂时无法显示</h2>
        <p>{error}</p>
        <p>文章内容正在从原始网站迁移中，请稍后再试。</p>
        <Link to="/" className="back-home-btn">返回首页</Link>
      </div>
    );
  }

  return (
    <div className="article-view">
      <div className="article-header">
        <Link to="/" className="breadcrumb">首页</Link>
        <span className="breadcrumb-separator"> / </span>
        <span className="breadcrumb-current">{category}</span>
        <span className="breadcrumb-separator"> / </span>
        <span className="breadcrumb-current">{filename}</span>
      </div>
      
      <div className="article-content">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // 自定义链接渲染，确保内部链接使用React Router
            a: ({ href, children, ...props }) => {
              if (href?.startsWith('http')) {
                return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
              }
              return <Link to={href || '#'} {...props}>{children}</Link>;
            },
            // 自定义代码块样式
            code: ({ className, children, ...props }) => {
              return <code className={`code-inline ${className || ''}`} {...props}>{children}</code>;
            },
            pre: ({ children, ...props }) => {
              return <pre className="code-block" {...props}>{children}</pre>;
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      
      <div className="article-footer">
        <Link to="/" className="back-home-btn">返回首页</Link>
        
        {/* 统一的版权信息区域 */}
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem 1rem',
          marginTop: '2rem',
          borderTop: '1px solid #eee',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem'
        }}>
          © 2025 猿人之家 · 由 Anna 独立开发与维护
        </div>
      </div>
    </div>
  );
};

export default ArticleView;