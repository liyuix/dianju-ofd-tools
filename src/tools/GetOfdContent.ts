import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HttpUtils, ConfigManager, Logger } from "../utils/index.js";
import * as fs from "fs";
import * as path from "path";
import { ConvertRequest, ConvertResponse } from "../types/convert.js";

const GetOfdContentSchema = z.object({
  filePath: z.string().describe("OFD 文件的本地路径"),
});

export function registerGetOfdContent(server: McpServer) {
  server.registerTool('get_ofd_content', {
    description: '获取 OFD 文件内容：优先提取纯文本（OFD→TXT），不支持时转为 PDF 返回下载地址',
    inputSchema: GetOfdContentSchema,
  }, async (args: unknown) => {
    try {
      const { filePath } = GetOfdContentSchema.parse(args);

      Logger.info(`开始获取 OFD 文件内容: ${filePath}`);

      // 1. 读取文件并转换为 Base64
      const fileBuffer = await fs.promises.readFile(path.resolve(filePath));
      const base64Str = fileBuffer.toString('base64');
      const fileName = path.basename(filePath);

      Logger.debug(`文件读取完成，大小: ${fileBuffer.length} 字节`);

      const config = ConfigManager.getConfig();

      // 2. 先尝试 OFD → TXT 提取纯文本
      Logger.debug('尝试 OFD → TXT 提取文本...');
      try {
        const txtRequest = buildConvertRequest(base64Str, fileName, 'ofd', 'txt');
        const txtResponse = await HttpUtils.post(
          `${config.API_URL}/convert/common`,
          JSON.stringify(txtRequest),
          { headers: { 'Content-Type': 'application/json' } },
        );
        const txtResult = txtResponse.data as ConvertResponse;

        if (txtResult.code === 0 && txtResult.data?.file_info?.ret_code == 1) {
          const fileUrl = txtResult.data.file_info.file_url;
          if (fileUrl) {
            // 下载 TXT 内容
            const txtContent = await HttpUtils.get(fileUrl, { responseType: 'text' });
            const text = typeof txtContent.data === 'string' ? txtContent.data : String(txtContent.data);
            Logger.info('OFD 文本提取成功（TXT）');
            return {
              content: [{ type: 'text' as const, text: `文本提取成功！\n\n${text}` }],
            };
          }
        }
      } catch (err: any) {
        Logger.debug(`OFD → TXT 失败: ${err.message}，退回 OFD → PDF`);
      }

      // 3. 退回：OFD → PDF，返回下载地址
      Logger.debug('退回 OFD → PDF...');
      const pdfRequest = buildConvertRequest(base64Str, fileName, 'ofd', 'pdf');
      const pdfResponse = await HttpUtils.post(
        `${config.API_URL}/convert/common`,
        JSON.stringify(pdfRequest),
        { headers: { 'Content-Type': 'application/json' } },
      );
      const pdfResult = pdfResponse.data as ConvertResponse;

      if (pdfResult.code === 0 && pdfResult.data?.file_info?.ret_code == 1) {
        const fileUrl = pdfResult.data.file_info.file_url;
        if (fileUrl) {
          Logger.info('OFD 转 PDF 成功');
          return {
            content: [{
              type: 'text' as const,
              text: `当前 API 不支持直接提取文本，已将 OFD 转为 PDF。\n下载地址：${fileUrl}`,
            }],
          };
        }
      }

      const retMsg = pdfResult.data?.ret_msg || pdfResult.msg || '处理失败';
      Logger.warn(`OFD 内容获取失败：${retMsg}`);
      return {
        content: [{ type: 'text' as const, text: `文件处理失败：${retMsg}` }],
      };
    } catch (error: any) {
      Logger.error(`OFD 获取内容异常：${error.message}`, error);
      return {
        content: [{ type: 'text' as const, text: `获取内容失败：${error.message}` }],
      };
    }
  });
}

function buildConvertRequest(base64Str: string, fileName: string, fileType: string, convertType: string): ConvertRequest {
  return {
    base_data: { serial_number: crypto.randomUUID() },
    meta_data: { is_asyn: "false" },
    file_list: [{
      file_no: fileName,
      file_type: fileType,
      convert_type: convertType,
      request_type: "4",
      responseType: "4",
      file_path: base64Str,
    }],
  };
}
