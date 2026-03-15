#!/bin/bash

# Vercel Deploy Hook Script
# 使用方法: ./deploy.sh

# 替换为你的 Deploy Hook URL
DEPLOY_HOOK_URL="https://api.vercel.com/v1/integrations/deploy/prj_8rS0faUmU9Q6YTIutXgQQvcgFBHW/qh3Yu0r0zQ"

echo "🚀 触发 Vercel 部署..."
echo ""

# 使用 -w 参数获取状态码，-o 保存响应体到临时文件
temp_file=$(mktemp)
http_code=$(curl -X POST "$DEPLOY_HOOK_URL" -s -w "%{http_code}" -o "$temp_file")
response_body=$(cat "$temp_file")
rm "$temp_file"

echo "HTTP 状态码: $http_code"
echo "响应内容: $response_body"
echo ""

if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    echo "✅ 部署已触发成功！"
    echo "📦 Vercel 正在构建和部署你的应用..."
    echo "🔗 查看部署进度: https://vercel.com/evennas-projects"
    echo ""
    echo "💡 提示: 部署通常需要 1-2 分钟完成"
else
    echo "❌ 部署触发失败"
    echo "请检查 Deploy Hook URL 是否正确"
fi

