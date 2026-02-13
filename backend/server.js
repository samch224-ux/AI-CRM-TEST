const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const HISTORY_FILE = path.join(__dirname, 'data', 'history.json');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 确保数据目录存在
async function ensureDataDir() {
  const dataDir = path.dirname(HISTORY_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// 读取历史记录
async function readHistory() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 保存历史记录
async function saveHistory(record) {
  const history = await readHistory();
  history.unshift({
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...record
  });
  // 只保留最近 50 条
  if (history.length > 50) history.pop();
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
  return history[0];
}

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

    // 保存到历史记录
    await saveHistory({
      chatContent: chatContent.substring(0, 200) + (chatContent.length > 200 ? '...' : ''),
      analysis
    });

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

// 获取历史记录
app.get('/api/history', async (req, res) => {
  try {
    const history = await readHistory();
    res.json({ success: true, history });
  } catch (error) {
    console.error('读取历史记录错误:', error);
    res.status(500).json({ error: '读取历史记录失败' });
  }
});

// 删除单条历史记录
app.delete('/api/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let history = await readHistory();
    history = history.filter(item => item.id !== id);
    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('删除历史记录错误:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// 清空历史记录
app.delete('/api/history', async (req, res) => {
  try {
    await fs.writeFile(HISTORY_FILE, JSON.stringify([], null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('清空历史记录错误:', error);
    res.status(500).json({ error: '清空失败' });
  }
});

// 数据统计分析
app.get('/api/statistics', async (req, res) => {
  try {
    const history = await readHistory();
    
    if (history.length === 0) {
      return res.json({
        success: true,
        statistics: {
          totalCount: 0,
          sentimentDistribution: { positive: 0, neutral: 0, negative: 0, unknown: 0 },
          intentDistribution: { purchase: 0, inquiry: 0, complaint: 0, other: 0, unknown: 0 },
          dailyTrend: [],
          keywordFrequency: []
        }
      });
    }

    // 情绪分析统计
    const sentimentDistribution = { positive: 0, neutral: 0, negative: 0, unknown: 0 };
    const intentDistribution = { purchase: 0, inquiry: 0, complaint: 0, other: 0, unknown: 0 };
    const dailyStats = {};
    const keywordCounts = {};

    history.forEach(item => {
      const analysis = item.analysis || '';
      
      // 情绪分析
      if (analysis.includes('积极') || analysis.includes('正面') || analysis.includes('满意')) {
        sentimentDistribution.positive++;
      } else if (analysis.includes('消极') || analysis.includes('负面') || analysis.includes('不满') || analysis.includes('投诉')) {
        sentimentDistribution.negative++;
      } else if (analysis.includes('中性') || analysis.includes('一般')) {
        sentimentDistribution.neutral++;
      } else {
        sentimentDistribution.unknown++;
      }

      // 意图分析
      if (analysis.includes('购买') || analysis.includes('下单') || analysis.includes('付款')) {
        intentDistribution.purchase++;
      } else if (analysis.includes('咨询') || analysis.includes('询问') || analysis.includes('了解')) {
        intentDistribution.inquiry++;
      } else if (analysis.includes('投诉') || analysis.includes('问题') || analysis.includes('退款')) {
        intentDistribution.complaint++;
      } else if (analysis.includes('其他')) {
        intentDistribution.other++;
      } else {
        intentDistribution.unknown++;
      }

      // 按日期统计
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;

      // 关键词提取（简单版本）
      const keywords = ['价格', '产品', '质量', '服务', ' delivery', '退款', '优惠', '折扣'];
      keywords.forEach(keyword => {
        if (analysis.includes(keyword) || item.chatContent.includes(keyword)) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      });
    });

    // 转换日期趋势为数组
    const dailyTrend = Object.entries(dailyStats)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // 最近30天

    // 关键词频率排序
    const keywordFrequency = Object.entries(keywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    res.json({
      success: true,
      statistics: {
        totalCount: history.length,
        sentimentDistribution,
        intentDistribution,
        dailyTrend,
        keywordFrequency
      }
    });

  } catch (error) {
    console.error('统计分析错误:', error);
    res.status(500).json({ error: '统计分析失败' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 API 端点: http://localhost:${PORT}/api/analyze`);
  console.log(`📚 历史记录: http://localhost:${PORT}/api/history`);
});
