// CLI 模式：直接在命令行调用 API，无需 MCP 客户端
// 用法: ofd-tools <tool_name> --filePath=/path/to/file [--splitPages=1-3]

import * as fs from 'fs';
import * as path from 'path';
import HttpUtils from './utils/http-axios.js';
import ConfigManager from './utils/config.js';
import { ConvertRequest, ConvertResponse, SplitRequest } from './types/convert.js';

// 工具名称 → 描述
const TOOLS: Record<string, string> = {
  pdf_to_ofd: '将 PDF 文件转换为 OFD 格式',
  ofd_to_pdf: '将 OFD 文件转换为 PDF 格式',
  ofd_to_image: '将 OFD 文件转换为 PNG 图片',
  get_ofd_content: '提取 OFD 文件的文本内容',
  spilt_file: '将 OFD 文件按页面拆分',
  read_file_as_base64: '将文件转换为 Base64 编码',
};

function printUsage(): void {
  console.log('ofd-tools - OFD 文件处理命令行工具\n');
  console.log('用法: ofd-tools <tool> --filePath=<path> [options]\n');
  console.log('可用工具:');
  for (const [name, desc] of Object.entries(TOOLS)) {
    console.log(`  ${name.padEnd(20)} ${desc}`);
  }
  console.log('\n选项:');
  console.log('  --filePath=<path>       文件路径（必需）');
  console.log('  --splitPages=<pages>    拆分页面范围，如 1-3;5,7（仅 spilt_file）');
  console.log('\n示例:');
  console.log('  ofd-tools pdf_to_ofd --filePath=/path/to/input.pdf');
  console.log('  ofd-tools ofd_to_pdf --filePath=/path/to/input.ofd');
  console.log('  ofd-tools spilt_file --filePath=/path/to/input.ofd --splitPages=1-3');
}

function parseArgs(args: string[]): { tool: string; options: Record<string, string> } {
  const tool = args[0];
  const options: Record<string, string> = {};

  for (const arg of args.slice(1)) {
    if (arg.startsWith('--')) {
      const eqIndex = arg.indexOf('=');
      if (eqIndex > 0) {
        const key = arg.slice(2, eqIndex);
        const value = arg.slice(eqIndex + 1);
        options[key] = value;
      }
    }
  }

  return { tool, options };
}

// 构建通用转换请求
function buildConvertRequest(
  base64Str: string,
  fileName: string,
  fileType: string,
  convertType: string,
): ConvertRequest {
  return {
    base_data: { serial_number: crypto.randomUUID() },
    meta_data: { is_asyn: 'false' },
    file_list: [{
      file_no: fileName,
      file_type: fileType,
      convert_type: convertType,
      request_type: '4',
      responseType: '4',
      file_path: base64Str,
    }],
  };
}

// 构建拆分请求
function buildSplitRequest(
  base64Str: string,
  fileName: string,
  splitPages: string,
): SplitRequest {
  return {
    base_data: { serial_number: crypto.randomUUID() },
    meta_data: { is_asyn: 'false', split_pages: splitPages },
    file_list: [{
      file_no: fileName,
      file_type: 'ofd',
      convert_type: 'zip',
      request_type: '4',
      responseType: '4',
      file_path: base64Str,
    }],
  };
}

// 发送转换请求并处理响应
async function sendConvertRequest(endpoint: string, request: ConvertRequest | SplitRequest): Promise<void> {
  const config = ConfigManager.getConfig();
  const url = `${config.API_URL}${endpoint}`;

  console.log(`请求地址: ${url}`);

  const response = await HttpUtils.post(url, JSON.stringify(request), {
    headers: { 'Content-Type': 'application/json' },
  });

  const result = response.data as ConvertResponse;

  if (result.code === 0 && result.data?.file_info?.ret_code == 1) {
    const fileUrl = result.data.file_info.file_url;
    console.log('✅ 转换成功！');
    console.log(`文件地址: ${fileUrl}`);
  } else {
    const msg = result.data?.ret_msg || result.msg || '转换失败';
    console.log(`❌ 转换失败: ${msg}`);
    process.exit(1);
  }
}

// 主入口
export async function runCli(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    return;
  }

  const { tool, options } = parseArgs(args);

  if (!TOOLS[tool]) {
    console.error(`未知工具: ${tool}\n`);
    printUsage();
    process.exit(1);
  }

  const filePath = options.filePath;
  if (!filePath) {
    console.error('错误: 缺少 --filePath 参数\n');
    printUsage();
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`错误: 文件不存在: ${resolvedPath}`);
    process.exit(1);
  }

  // 检查配置（read_file_as_base64 是本地操作，不需要 API 配置）
  if (tool !== 'read_file_as_base64' && !ConfigManager.isConfigComplete()) {
    const missing = ConfigManager.getMissingConfigs();
    console.error(`错误: 缺少配置项: ${missing.join(', ')}`);
    console.error('请设置 API_KEY 环境变量或在 .env 文件中配置');
    process.exit(1);
  }

  console.log(`工具: ${tool}`);
  console.log(`文件: ${resolvedPath}`);
  console.log('处理中...\n');

  const fileBuffer = await fs.promises.readFile(resolvedPath);
  const base64Str = fileBuffer.toString('base64');
  const fileName = path.basename(filePath);

  switch (tool) {
    case 'pdf_to_ofd': {
      const request = buildConvertRequest(base64Str, fileName, 'pdf', 'ofd');
      await sendConvertRequest('/convert/common', request);
      break;
    }

    case 'ofd_to_pdf': {
      const request = buildConvertRequest(base64Str, fileName, 'ofd', 'pdf');
      await sendConvertRequest('/convert/common', request);
      break;
    }

    case 'ofd_to_image': {
      const request = buildConvertRequest(base64Str, fileName, 'ofd', 'png');
      await sendConvertRequest('/convert/common', request);
      break;
    }

    case 'get_ofd_content': {
      // 先尝试 OFD → TXT 提取纯文本
      const config = ConfigManager.getConfig();
      const url = `${config.API_URL}/convert/common`;
      console.log(`请求地址: ${url}`);

      let textExtracted = false;
      try {
        const txtRequest = buildConvertRequest(base64Str, fileName, 'ofd', 'txt');
        const txtResp = await HttpUtils.post(url, JSON.stringify(txtRequest), {
          headers: { 'Content-Type': 'application/json' },
        });
        const txtResult = txtResp.data as any;
        if (txtResult.code === 0 && txtResult.data?.file_info?.ret_code == 1) {
          const fileUrl = txtResult.data.file_info.file_url;
          if (fileUrl) {
            const txtContent = await HttpUtils.get(fileUrl, { responseType: 'text' });
            const text = typeof txtContent.data === 'string' ? txtContent.data : String(txtContent.data);
            console.log('✅ 文本提取成功！\n');
            console.log(text);
            textExtracted = true;
          }
        }
      } catch {
        // TXT 不支持，退回 PDF
      }

      if (!textExtracted) {
        console.log('直接文本提取不支持，转为 PDF...');
        const pdfRequest = buildConvertRequest(base64Str, fileName, 'ofd', 'pdf');
        const pdfResp = await HttpUtils.post(url, JSON.stringify(pdfRequest), {
          headers: { 'Content-Type': 'application/json' },
        });
        const pdfResult = pdfResp.data as any;
        if (pdfResult.code === 0 && pdfResult.data?.file_info?.ret_code == 1) {
          console.log('✅ 已转为 PDF');
          console.log(`下载地址: ${pdfResult.data.file_info.file_url}`);
        } else {
          console.log(`❌ 处理失败: ${pdfResult.data?.ret_msg || pdfResult.msg || '未知错误'}`);
          process.exit(1);
        }
      }
      break;
    }

    case 'spilt_file': {
      const splitPages = options.splitPages;
      if (!splitPages) {
        console.error('错误: spilt_file 需要 --splitPages 参数，格式如 1-3;5,7');
        process.exit(1);
      }
      console.log(`拆分页面: ${splitPages}`);
      const request = buildSplitRequest(base64Str, fileName, splitPages);
      try {
        await sendConvertRequest('/spiltFile/common', request);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          console.error('❌ 当前 API 不支持文件拆分功能（端点不存在），请联系 API 提供方确认');
        } else {
          throw err;
        }
      }
      break;
    }

    case 'read_file_as_base64': {
      console.log('✅ Base64 编码:');
      console.log(base64Str);
      break;
    }

    default:
      console.error(`未实现的工具: ${tool}`);
      process.exit(1);
  }
}
