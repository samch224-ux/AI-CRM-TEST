const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 分析聊天记录
app.post('/api/analyze', async (req, res) => {
  try {
    const { chatContent } = req.body;
    
    if (!chatContent || chatContent.trim().length === 0) {
      return res.status(400).json({ error: '请提供聊天记录内容' });
    }

    // 调用 Kimi API
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: `你是一位专业的客户关系分析专家。请分析以下客户聊天记录，并提供：
1. 对话摘要（50字以内）
2. 客户意图（购买/咨询/投诉/其他）
3. 情绪分析（积极/中性/消极）
4. 后续建议（如何跟进）
5. 关键信息提取（产品、价格、时间等）

请用中文回复，格式清晰。`
          },
          {
            role: 'user',
            content: chatContent
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Kimi API 错误:', error);
      return res.status(500).json({ error: 'AI 分析服务暂时不可用' });
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content || '分析失败';

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('服务器错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 API 端点: http://localhost:${PORT}/api/analyze`);
});
