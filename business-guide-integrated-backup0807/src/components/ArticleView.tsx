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
        
        console.log('🔍 正在加载文章:', category, filename);
        
        // 使用和GitHub相同的fetch方式
        const response = await fetch(`/${category}/${filename}.md`);
        
        if (!response.ok) {
          // 如果第一次请求失败，给出更详细的错误信息
          console.error(`请求失败: ${response.status} ${response.statusText}`);
          console.error('请求URL:', `/${category}/${filename}.md`);
          
          // 检查是否返回的是HTML（开发服务器的默认行为）
          const responseText = await response.text();
          if (responseText.includes('<!DOCTYPE html>')) {
            throw new Error(`文章文件未找到。请确保文件存在于 public/${category}/${filename}.md`);
          }
          
          throw new Error(`文章未找到 (${response.status})`);
        }
        
        const text = await response.text();
        
        // 验证返回的内容是Markdown而不是HTML
        if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
          throw new Error(`服务器返回了HTML页面而不是Markdown文件。请确保 public/${category}/${filename}.md 文件存在`);
        }
        
        // 处理版权信息 - 移除HTML版权标志，会在底部统一显示
        const cleanedText = text.replace(
          /<p style="[^"]*">\s*© 2025 猿人之家[\s\S]*?<\/p>\s*$/m,
          ''
        );
        
        console.log('✅ 文章加载成功，内容长度:', cleanedText.length);
        setContent(cleanedText);
      } catch (err) {
        console.error('❌ 加载文章失败:', err);
        setError(`无法加载文章内容: ${err instanceof Error ? err.message : '未知错误'}`);
      } finally {
        setLoading(false);
      }
    };

    if (category && filename) {
      loadArticle();
    }
  }, [category, filename]);

  // 获取分类的中文名称
  const getCategoryName = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'econ': '经济学',
      'ba': '商业分析',
      'finance': '金融', 
      'management': '管理',
      'update': '申请季Updates'
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <div className="article-loading">
        <div className="loading-spinner">📚 正在加载文章...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-error">
        <h2>😅 文章暂时无法显示</h2>
        <p>{error}</p>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #f8f6f0 0%, #f4f2ed 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          margin: '1rem 0',
          border: '1px solid rgba(181, 160, 130, 0.2)'
        }}>
          <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>🔧 本地开发解决方案</h4>
          <p style={{ marginBottom: '0.5rem' }}>请确保文章文件位于正确位置：</p>
          <code style={{
            background: '#f5f5f5',
            padding: '0.5rem',
            borderRadius: '4px',
            display: 'block',
            marginBottom: '1rem'
          }}>
            public/{category}/{filename}.md
          </code>
          
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            <p><strong>解决步骤：</strong></p>
            <p>1. 创建目录：mkdir -p public/{category}</p>
            <p>2. 复制文件：cp src/{category}/{filename}.md public/{category}/</p>
            <p>3. 重启开发服务器：npm start</p>
          </div>
          
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.9rem' }}>
              需要帮助？联系我们：<br/>
              📕 小红书：@猿人安妮 | 📧 邮箱：yuanrenannie@gmail.com
            </p>
          </div>
        </div>
        <Link to="/" className="back-home-btn">返回首页</Link>
      </div>
    );
  }

  return (
    <div className="article-view">
      <div className="article-header">
        <Link to="/" className="breadcrumb">首页</Link>
        <span className="breadcrumb-separator"> / </span>
        <span className="breadcrumb-current">{getCategoryName(category || '')}</span>
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
            },
            // 自定义图片处理
            img: ({ src, alt, ...props }) => {
              return (
                <img 
                  src={src} 
                  alt={alt} 
                  {...props}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    margin: '1rem 0'
                  }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      
      <div className="article-footer">
        <Link to="/" className="back-home-btn">返回首页</Link>
        
        {/* 水印和版权信息区域 */}
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem 1rem',
          marginTop: '2rem',
          borderTop: '1px solid #eee'
        }}>
          {/* 水印图片 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <img 
              src="/annie-watermark.png" 
              alt="猿人安妮水印" 
              style={{
                height: '40px',
                width: 'auto',
                opacity: 0.8,
                filter: 'grayscale(20%)'
              }}
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
            />
          </div>
          
          {/* 版权信息 */}
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            marginBottom: '0.5rem'
          }}>
            © 2025 猿人之家 · 由 Anna 独立开发与维护
          </div>
          
          {/* 附加信息 */}
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            opacity: 0.8
          }}>
            内容原创，转载请注明出处
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleView;