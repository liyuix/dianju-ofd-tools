#!/usr/bin/env node

// 判断运行模式：
// - 有工具名称参数 → CLI 模式（直接调用 API）
// - 无参数 → MCP stdio 服务器模式

import { ConfigManager } from './utils/config.js';

// 过滤掉 --APP_KEY=, --API_KEY=, --API_URL= 等配置参数，看是否还有工具名称
const nonConfigArgs = process.argv.slice(2).filter(
  (arg) => !arg.match(/^--(API_KEY|API_URL|SSE_PORT|SSE_HOST)=/i)
);

if (nonConfigArgs.length > 0) {
  // CLI 模式
  ConfigManager.getConfig(); // 预加载配置
  const { runCli } = await import('./cli.js');
  await runCli(nonConfigArgs);
} else {
  // MCP stdio 服务器模式
  const { createServer } = await import('./server.js');
  const server = createServer();
  await server.start();
}
