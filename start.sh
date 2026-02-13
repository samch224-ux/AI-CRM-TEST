# 启动脚本

echo "🚀 启动 AI CRM 分析系统..."
cd "$(dirname "$0")/backend"

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
  echo "📦 首次运行，安装依赖..."
  npm install
fi

# 检查 .env 文件是否存在
if [ ! -f ".env" ]; then
  echo "⚠️ 警告: .env 文件不存在，请复制 .env.example 并配置 API Key"
  cp .env.example .env
  echo "✅ 已创建 .env 文件，请编辑它并填入你的 Kimi API Key"
fi

echo "🎯 启动服务..."
npm start
