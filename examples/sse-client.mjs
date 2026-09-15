/**
 * 使用 MCP SDK 客户端连接 SSE 服务器
 *
 * 演示完整流程：连接 → 列出工具 → 调用工具 → 获取结果
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const BASE_URL = 'http://127.0.0.1:3000';

async function main() {
  // ========== 步骤 1：建立 SSE 连接 ==========
  console.log('步骤 1: 连接 SSE 服务器...');
  const transport = new SSEClientTransport(new URL(`${BASE_URL}/sse`));
  const client = new Client({ name: 'demo-client', version: '1.0.0' });

  await client.connect(transport);
  console.log('  连接成功！\n');

  // ========== 步骤 2：列出可用工具 ==========
  console.log('步骤 2: 获取工具列表...');
  const tools = await client.listTools();
  for (const tool of tools.tools) {
    console.log(`  - ${tool.name}: ${tool.description}`);
  }
  console.log();

  // ========== 步骤 3：调用工具（示例：read_file_as_base64） ==========
  console.log('步骤 3: 调用 read_file_as_base64 工具...');
  try {
    const result = await client.callTool({
      name: 'read_file_as_base64',
      arguments: { filePath: './package.json' },
    });
    console.log('  调用成功！');
    // 只打印前 100 个字符
    const text = result.content?.[0]?.text || '';
    console.log(`  结果（前100字符）: ${text.substring(0, 100)}...\n`);
  } catch (err) {
    console.log(`  调用失败: ${err.message}\n`);
  }

  // ========== 步骤 4：断开连接 ==========
  console.log('步骤 4: 断开连接');
  await client.close();
  console.log('  完成！');
}

main().catch(console.error);
