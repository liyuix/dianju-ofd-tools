import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HttpUtils, ConfigManager, Logger } from "../utils/index.js";
import * as fs from "fs";
import * as path from "path";
import { SplitRequest, ConvertResponse } from "../types/convert.js";

const SpiltFileSchema = z.object({
  filePath: z.string().describe("OFD 文件的本地路径"),
  splitPages: z.string().describe("拆分页面，格式为 '3-9;7,9,8'"),
});

export function registerSpiltFile(server: McpServer) {
  server.registerTool("spilt_file", {
    description: "将 OFD 文件拆分为多个页面",
    inputSchema: SpiltFileSchema,
  }, async (args: unknown) => {
    try {
      const { filePath, splitPages } = SpiltFileSchema.parse(args);

      Logger.info(`开始拆分 OFD 文件: ${filePath}`);
      Logger.debug(`拆分页面: ${splitPages}`);

      // 1. 读取文件并转换为 Base64
      const fileBuffer = await fs.promises.readFile(path.resolve(filePath));
      const base64Str = fileBuffer.toString("base64");

      Logger.debug(`文件读取完成，大小: ${fileBuffer.length} 字节`);

      // 2. 构建请求参数
      const fileName = path.basename(filePath);
      const request = buildSplitRequest(base64Str, fileName, splitPages);

      // 3. 发送请求
      const config = ConfigManager.getConfig();
      const jsonBody = JSON.stringify(request);

      Logger.debug(`发送拆分请求到: ${config.API_URL}/spiltFile/common`);
      Logger.debug(`请求参数: ${jsonBody}`);

      const response = await HttpUtils.post(
        `${config.API_URL}/spiltFile/common`,
        jsonBody,
        { headers: { 'Content-Type': 'application/json' } },
      );

      Logger.debug(`拆分请求响应状态: ${response.status}`);
      Logger.debug("响应结果:", response.data);

      // 4. 处理响应
      const result = response.data as ConvertResponse;

      if (result.code === 0 && result.data?.file_info?.ret_code == 1) {
        const fileUrl = result.data.file_info.file_url;
        if (!fileUrl) {
          const errorMsg = "拆分成功但未返回文件地址";
          Logger.warn(errorMsg);
          return {
            content: [
              { type: "text" as const, text: `文件处理失败：${errorMsg}` },
            ],
          };
        }
        Logger.info(`OFD 拆分成功，文件地址：${fileUrl}`);
        return {
          content: [
            {
              type: "text" as const,
              text: `拆分成功！文件地址：${fileUrl}`,
            },
          ],
        };
      } else {
        const retMsg = result.data?.ret_msg || result.msg || "拆分失败";
        Logger.warn(`OFD 拆分失败：${retMsg}`);
        return {
          content: [
            {
              type: "text" as const,
              text: `文件处理失败：${retMsg}`,
            },
          ],
        };
      }
    } catch (error: any) {
      Logger.error(`OFD 拆分异常：${error.message}`, error);
      return {
        content: [
          { type: "text" as const, text: `拆分失败：${error.message}` },
        ],
      };
    }
  });
}

function buildSplitRequest(base64Str: string, fileName: string, splitPages: string): SplitRequest {
  return {
    base_data: {
      serial_number: crypto.randomUUID(),
    },
    meta_data: {
      is_asyn: "false",
      split_pages: splitPages,
    },
    file_list: [
      {
        file_no: fileName,
        file_type: "ofd",
        convert_type: "zip",
        request_type: "4",
        responseType: "4",
        file_path: base64Str,
      },
    ],
  };
}
