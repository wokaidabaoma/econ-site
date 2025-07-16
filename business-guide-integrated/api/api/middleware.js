import { readFileSync } from 'fs';
import { join } from 'path';

// 白名单配置
const WHITELIST = {
  ips: ['172.112.150.42', '127.0.0.1', '::1'],
  userAgents: ['AdminBot/1.0', 'Googlebot', 'Bingbot', 'baiduspider'],
  apiKeys: ['admin-key-123']
};

// 可疑特征
const SUSPICIOUS_PATTERNS = {
  userAgents: ['okhttp', 'python-requests', 'curl/', 'wget/', 'scrapy', 'selenium', 'phantomjs'],
  paths: [/\.(env|git|config|backup|sql|log)$/i, /\/\.(well-known|git|env)/i]
};

// 简化的频率限制存储
const rateLimits = new Map();

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.headers['cf-connecting-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const key = `rate_${ip}`;
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, { count: 1, resetTime: now + 60000 });
    return false;
  }
  
  const record = rateLimits.get(key);
  
  if (now > record.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + 60000 });
    return false;
  }
  
  record.count++;
  return record.count > 30; // 30次/分钟限制
}

function serveStaticFile(res, filePath, contentType) {
  try {
    const fullPath = join(process.cwd(), 'build', filePath);
    const content = readFileSync(fullPath);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.status(200).send(content);
  } catch (error) {
    // 如果文件不存在，返回index.html（SPA路由）
    try {
      const indexPath = join(process.cwd(), 'build', 'index.html');
      const indexContent = readFileSync(indexPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(indexContent);
    } catch (indexError) {
      res.status(404).json({ error: 'File not found' });
    }
  }
}

export default function handler(req, res) {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const url = req.url || '/';
  const apiKey = req.headers['x-api-key'] || req.query.api_key || '';
  
  // 清理过期记录
  if (Math.random() < 0.1) {
    const now = Date.now();
    for (const [key, record] of rateLimits.entries()) {
      if (now > record.resetTime + 300000) {
        rateLimits.delete(key);
      }
    }
  }
  
  // 1. API密钥白名单
  if (apiKey && WHITELIST.apiKeys.includes(apiKey)) {
    console.log(`✅ API Key whitelist: ${ip}`);
    return serveStaticFile(res, url === '/' ? 'index.html' : url, 'text/html');
  }
  
  // 2. IP白名单
  if (WHITELIST.ips.includes(ip)) {
    console.log(`✅ IP whitelist: ${ip}`);
    return serveStaticFile(res, url === '/' ? 'index.html' : url, 'text/html');
  }
  
  // 3. User-Agent白名单
  if (WHITELIST.userAgents.some(agent => userAgent.toLowerCase().includes(agent.toLowerCase()))) {
    console.log(`✅ User-Agent whitelist: ${ip} - ${userAgent}`);
    return serveStaticFile(res, url === '/' ? 'index.html' : url, 'text/html');
  }
  
  // 4. 基础验证
  if (!userAgent || userAgent.length < 10) {
    console.log(`❌ Invalid User-Agent: ${ip}`);
    return res.status(400).json({ error: 'Valid User-Agent required' });
  }
  
  // 5. 频率限制
  if (isRateLimited(ip)) {
    console.log(`❌ Rate limited: ${ip}`);
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  // 6. 可疑User-Agent
  if (SUSPICIOUS_PATTERNS.userAgents.some(pattern => userAgent.toLowerCase().includes(pattern))) {
    console.log(`❌ Suspicious User-Agent: ${ip} - ${userAgent}`);
    return res.status(403).json({ error: 'Blocked' });
  }
  
  // 7. 可疑路径
  if (SUSPICIOUS_PATTERNS.paths.some(pattern => pattern.test(url))) {
    console.log(`❌ Suspicious path: ${ip} - ${url}`);
    return res.status(403).json({ error: 'Blocked' });
  }
  
  // 8. 正常请求，返回React应用
  console.log(`✅ Request allowed: ${ip} - ${userAgent.substring(0, 50)}...`);
  
  // 根据文件类型返回相应内容
  if (url.endsWith('.js')) {
    return serveStaticFile(res, url, 'application/javascript');
  } else if (url.endsWith('.css')) {
    return serveStaticFile(res, url, 'text/css');
  } else if (url.endsWith('.png')) {
    return serveStaticFile(res, url, 'image/png');
  } else if (url.endsWith('.jpg') || url.endsWith('.jpeg')) {
    return serveStaticFile(res, url, 'image/jpeg');
  } else if (url.endsWith('.ico')) {
    return serveStaticFile(res, url, 'image/x-icon');
  } else {
    // 默认返回index.html（SPA路由）
    return serveStaticFile(res, 'index.html', 'text/html');
  }
}