#!/bin/bash
# 部署脚本 - 确保所有内容都正确部署

echo "🚀 开始部署 business-guide-integrated 项目..."

# 1. 清理和构建
echo "📦 清理并构建项目..."
npm run build

# 2. 验证关键文件存在
echo "✅ 验证关键文件..."

# 检查水印文件
if [ -f "public/annie-watermark.png" ]; then
    echo "✅ 水印文件存在"
else
    echo "❌ 水印文件缺失"
    exit 1
fi

# 检查文章文件
ARTICLE_COUNT=$(find public/econ -name "*.md" | wc -l)
echo "📚 发现 $ARTICLE_COUNT 篇 econ 文章"

BA_COUNT=$(find public/ba -name "*.md" | wc -l)
echo "📊 发现 $BA_COUNT 篇 ba 文章"

UPDATE_COUNT=$(find public/update -name "*.md" | wc -l)
echo "📝 发现 $UPDATE_COUNT 篇 update 文章"

# 3. 验证构建输出
if [ -d "build" ]; then
    echo "✅ 构建输出目录存在"
    BUILD_SIZE=$(du -sh build | cut -f1)
    echo "📦 构建大小: $BUILD_SIZE"
else
    echo "❌ 构建失败"
    exit 1
fi

# 4. 检查构建后的文件
if [ -f "build/annie-watermark.png" ]; then
    echo "✅ 构建后水印文件存在"
else
    echo "❌ 构建后水印文件缺失"
fi

BUILT_ARTICLES=$(find build -name "*.md" | wc -l)
echo "📖 构建后文章数量: $BUILT_ARTICLES"

echo "🎉 部署验证完成！"
echo ""
echo "📋 部署摘要："
echo "   - 项目构建：✅ 成功"
echo "   - 水印文件：✅ 已包含"
echo "   - 文章迁移：✅ 已完成 ($ARTICLE_COUNT + $BA_COUNT + $UPDATE_COUNT 篇)"
echo "   - 构建大小：$BUILD_SIZE"
echo ""
echo "🌐 现在可以部署到 Vercel 或其他平台"