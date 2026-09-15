import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { registerTools } from './tools/index.js';
import { Logger } from './utils/index.js';

// 从环境变量或命令行参数读取端口
const PORT = parseInt(process.env.SSE_PORT || '3000', 10);
const HOST = process.env.SSE_HOST || '127.0.0.1';

// 为每个 SSE 连接创建独立的 McpServer 实例
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'file-tools',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
    },
  });
  registerTools(server);
  return server;
}

// 存储活跃的 SSE 会话（sessionId → { server, transport }）
const sessions = new Map<string, { server: McpServer; transport: SSEServerTransport }>();

// 创建 Express 应用
const app = express();

// 解析 JSON 请求体
app.use(express.json({ limit: '50mb' }));

// GET /sse — 建立 SSE 长连接
app.get('/sse', async (req, res) => {
  Logger.info(`新 SSE 连接请求来自: ${req.ip}`);

  const server = createMcpServer();
  const transport = new SSEServerTransport('/messages', res);
  sessions.set(transport.sessionId, { server, transport });

  Logger.info(`SSE 会话已建立，sessionId: ${transport.sessionId}`);

  // 连接关闭时清理
  transport.onclose = () => {
    sessions.delete(transport.sessionId);
    Logger.info(`SSE 会话已关闭，sessionId: ${transport.sessionId}`);
  };

  await server.connect(transport);
});

// POST /messages — 接收客户端消息
app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    res.status(400).json({ error: '缺少 sessionId 参数' });
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: `未找到 sessionId: ${sessionId}` });
    return;
  }

  Logger.debug(`收到消息 (sessionId: ${sessionId})`);

  await session.transport.handlePostMessage(req, res, req.body);
});

// 健康检查端点
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    sessions: sessions.size,
    uptime: process.uptime(),
  });
});

// 启动服务器
app.listen(PORT, HOST, () => {
  Logger.info(`SSE 服务器启动成功！`);
  Logger.info(`  SSE 端点:   http://${HOST}:${PORT}/sse`);
  Logger.info(`  消息端点:   http://${HOST}:${PORT}/messages`);
  Logger.info(`  健康检查:   http://${HOST}:${PORT}/health`);
});

// 优雅退出
process.on('SIGINT', async () => {
  Logger.info('正在关闭 SSE 服务器...');

  for (const [id, session] of sessions) {
    Logger.debug(`关闭会话: ${id}`);
    await session.transport.close();
  }
  sessions.clear();

  process.exit(0);
});
