import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HttpUtils, ConfigManager, Logger } from "../utils/index.js";
import * as fs from "fs";
import * as path from "path";
import { ConvertRequest, ConvertResponse } from "../types/convert.js";

const PdfToOfdSchema = z.object({
  filePath: z.string().describe("PDF 文件的本地路径"),
});

export function registerPdfToOfd(server: McpServer) {
  server.registerTool('pdf_to_ofd', {
    description: '将本地 PDF 文件转换为 OFD 格式',
    inputSchema: PdfToOfdSchema,
  }, async (args: unknown) => {
    try {
      const { filePath } = PdfToOfdSchema.parse(args);

      Logger.info(`开始转换 PDF 文件: ${filePath}`);

      // 1. 读取文件并转换为 Base64
      const fileBuffer = await fs.promises.readFile(path.resolve(filePath));
      const base64Str = fileBuffer.toString('base64');

      Logger.debug(`文件读取完成，大小: ${fileBuffer.length} 字节`);

      // 2. 构建请求参数
      const fileName = path.basename(filePath);
      const request = buildConvertRequest(base64Str, fileName, 'pdf', 'ofd');

      // 3. 发送请求
      const config = ConfigManager.getConfig();
      const jsonBody = JSON.stringify(request);

      Logger.debug(`发送转换请求到: ${config.API_URL}/convert/common`);
      Logger.debug(`请求参数: ${jsonBody}`);

      const response = await HttpUtils.post(
        `${config.API_URL}/convert/common`,
        jsonBody,
        { headers: { 'Content-Type': 'application/json' } },
      );

      Logger.debug(`转换请求响应状态: ${response.status}`);
      Logger.debug('响应结果:', response.data);

      // 4. 处理响应
      const result = response.data as ConvertResponse;

      if (result.code === 0 && result.data?.file_info?.ret_code == 1) {
        const fileUrl = result.data.file_info.file_url;
        if (!fileUrl) {
          const errorMsg = '转换成功但未返回文件地址';
          Logger.warn(errorMsg);
          return {
            content: [{ type: 'text' as const, text: `文件处理失败：${errorMsg}` }],
          };
        }
        Logger.info(`PDF 转换成功，OFD 文件地址：${fileUrl}`);
        return {
          content: [
            {
              type: "text" as const,
              text: `转换成功！OFD 文件地址：${fileUrl}`,
            },
          ],
        };
      } else {
        const retMsg = result.data?.ret_msg || result.msg || '转换失败';
        Logger.warn(`PDF 转换失败：${retMsg}`);
        return {
          content: [
            { type: "text" as const, text: `文件处理失败：${retMsg}` },
          ],
        };
      }
    } catch (error: any) {
      Logger.error(`PDF 转换异常：${error.message}`, error);
      return {
        content: [
          { type: "text" as const, text: `转换失败：${error.message}` },
        ],
      };
    }
  });
}

function buildConvertRequest(base64Str: string, fileName: string, fileType: string, convertType: string): ConvertRequest {
  return {
    base_data: {
      serial_number: crypto.randomUUID(),
    },
    meta_data: {
      is_asyn: "false",
    },
    file_list: [
      {
        file_no: fileName,
        file_type: fileType,
        convert_type: convertType,
        request_type: "4",
        responseType: "4",
        file_path: base64Str,
      },
    ],
  };
}
