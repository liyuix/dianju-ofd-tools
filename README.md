<!-- markdownlint-disable MD060 -->
# OFD文件处理工具

一个基于MCP（Model Context Protocol）的OFD文件处理工具包，调用 ofd365.com 文件转换 API，提供PDF与OFD格式互转、OFD文件内容提取、OFD转图片、文件拆分等功能。

## 功能特性

- 📄 **PDF转OFD**：将PDF文件转换为OFD格式
- 📑 **OFD转PDF**：将OFD文件转换为PDF格式
- 🖼️ **OFD转图片**：将OFD文件转换为PNG图片格式
- 📝 **OFD内容提取**：提取OFD文件的文本内容
- 📂 **文件拆分**：将OFD文件按页面拆分为多个文件
- 📤 **Base64编码**：将文件转换为Base64编码

## 安装方式

### 通过npm安装

```bash
npm install -g dianju-ofd-tools
```

### 本地开发安装

```bash
git clone https://github.com/your-repo/dianju-ofd-tools.git
cd dianju-ofd-tools
npm install
npm run build
```

## 使用方法

### 命令行方式

```bash
# PDF转OFD
ofd-tools pdf_to_ofd --filePath=/path/to/input.pdf

# OFD转PDF
ofd-tools ofd_to_pdf --filePath=/path/to/input.ofd

# OFD转图片
ofd-tools ofd_to_image --filePath=/path/to/input.ofd

# 提取OFD内容
ofd-tools get_ofd_content --filePath=/path/to/input.ofd

# 文件拆分
ofd-tools spilt_file --filePath=/path/to/input.ofd --splitPages="1-3;5,7"

# 文件转Base64
ofd-tools read_file_as_base64 --filePath=/path/to/file
```

### 配置方式

#### 环境变量配置

```bash
export API_KEY=dj_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export API_URL=https://ofd365.com/admin-api
```

#### 命令行参数配置

```bash
ofd-tools --API_KEY=dj_live_xxx --API_URL=https://ofd365.com/admin-api pdf_to_ofd --filePath=/path/to/input.pdf
```

#### .env文件配置

创建`.env`文件：

```env
API_KEY=dj_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API_URL=https://ofd365.com/admin-api
```

## API文档

### 后端接口

所有文件转换功能通过统一的 HTTP API 实现：

```http
POST {API_URL}/convert/common
```

#### 认证方式

在请求头中传入 `X-Api-Key`：

```http
X-Api-Key: dj_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 请求格式

```json
{
    "base_data": {
        "serial_number": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    },
    "meta_data": {
        "is_asyn": "false"
    },
    "file_list": [
        {
            "file_no": "文件名",
            "file_type": "pdf",
            "convert_type": "ofd",
            "request_type": "4",
            "responseType": "4",
            "file_path": "<Base64编码的文件内容>"
        }
    ]
}
```

#### 请求参数说明

| 名称             | 类型     | 必选 | 说明                                                                 |
| ---------------- | -------- | ---- | -------------------------------------------------------------------- |
| base_data        | object   | 是   | 基础信息                                                             |
| └ serial_number  | string   | 是   | 请求流水号（UUID 格式），不填则自动生成                              |
| meta_data        | object   | 是   | 元信息                                                               |
| └ is_asyn        | string   | 否   | 是否异步转换，可选值：`true` / `false`                               |
| file_list        | object[] | 是   | 文件列表（不能为空）                                                 |
| └ file_no        | string   | 否   | 文档名称或编号                                                       |
| └ file_type      | string   | 否   | 源文件格式                                                           |
| └ convert_type   | string   | 否   | 目标转换格式                                                         |
| └ request_type   | string   | 否   | `1` = 通过 HTTP URL 传入文件；`4` = 通过 Base64 编码传入文件         |
| └ responseType   | string   | 否   | 响应类型                                                             |
| └ file_path      | string   | 否   | `request_type=4` 时为文件 Base64 内容                                |

#### 支持的文件格式

| 类别 | 支持的格式                                                        |
| ---- | ----------------------------------------------------------------- |
| 文档 | `pdf`, `ofd`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`, `txt` |
| 图片 | `jpg`, `jpeg`, `png`, `bmp`, `tif`, `tiff`, `gif`                |

#### 成功响应（200）

```json
{
    "code": 0,
    "data": {
        "ret_code": "1",
        "ret_msg": "success",
        "file_info": {
            "ret_code": "1",
            "serial_number": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "file_msg": "文件合成成功",
            "file_url": "http://example.com/download/file"
        }
    },
    "msg": ""
}
```

#### 响应字段说明

| 名称                    | 类型    | 说明                     |
| ----------------------- | ------- | ------------------------ |
| code                    | integer | 业务状态码，`0` 表示成功 |
| data.ret_code           | string  | 返回码，`1` 表示成功     |
| data.ret_msg            | string  | 返回信息                 |
| data.file_info.ret_code | string  | 文件处理结果码           |
| data.file_info.file_url | string  | 转换后文件的下载地址     |
| msg                     | string  | 错误信息（成功时为空）   |

#### 错误码

| 状态码 | 含义                  | 说明                                             |
| ------ | --------------------- | ------------------------------------------------ |
| 200    | OK                    | 请求成功                                         |
| 400    | Bad Request           | 参数校验失败                                     |
| 401    | Unauthorized          | API Key 无效或已过期                             |
| 403    | Forbidden             | API Key 未授权访问该接口路径                     |
| 500    | Internal Server Error | 服务内部错误或转换平台异常                       |

### MCP 工具列表

| 工具名称            | 描述                 | 参数                                                              |
| ------------------- | -------------------- | ----------------------------------------------------------------- |
| `pdf_to_ofd`        | 将PDF文件转换为OFD格式 | `filePath`: PDF文件路径                                           |
| `ofd_to_pdf`        | 将OFD文件转换为PDF格式 | `filePath`: OFD文件路径                                           |
| `ofd_to_image`      | 将OFD文件转换为PNG图片 | `filePath`: OFD文件路径                                           |
| `get_ofd_content`   | 提取OFD文件的文本内容   | `filePath`: OFD文件路径                                           |
| `spilt_file`        | 拆分OFD文件为多个页面   | `filePath`: OFD文件路径, `splitPages`: 拆分页面（如 `3-9;7,9,8`） |
| `read_file_as_base64` | 文件转Base64         | `filePath`: 文件路径                                              |

### 使用示例

```javascript
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function convertPdfToOfd() {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['ofd-tools'],
  });

  const client = new McpClient({ transport });
  await client.connect();

  const result = await client.callTool('pdf_to_ofd', {
    filePath: '/path/to/input.pdf',
  });

  console.log('转换结果:', result);
}
```

## 开发指南

### 项目结构

```text
src/
├── tools/          # 工具模块
│   ├── GetOfdContent.ts    # OFD内容提取
│   ├── OfdToImage.ts       # OFD转图片
│   ├── OfdToPdf.ts         # OFD转PDF
│   ├── PdfToOfd.ts         # PDF转OFD
│   ├── ReadFileAsBase64.ts # 文件转Base64
│   ├── SpiltFile.ts        # 文件拆分
│   └── index.ts            # 工具导出
├── types/          # 类型定义
│   └── convert.ts  # 转换相关类型（匹配 ofd365 API 格式）
├── utils/          # 工具函数
│   ├── config.ts   # 配置管理（API_KEY / API_URL）
│   ├── http-axios.ts # HTTP请求工具（自动注入 X-Api-Key）
│   ├── logger.ts   # 日志工具
│   └── index.ts    # 工具导出
├── index.ts        # CLI 入口文件
├── server.ts       # stdio MCP 服务器（本地使用）
└── sse-server.ts   # SSE MCP 服务器（HTTP 远程调用）
```

### 三种运行模式

#### 1. CLI 模式（命令行直接调用）

```bash
# 查看帮助
ofd-tools --help

# 直接调用工具
ofd-tools pdf_to_ofd --filePath=/path/to/input.pdf
ofd-tools ofd_to_pdf --filePath=/path/to/input.ofd
ofd-tools read_file_as_base64 --filePath=/path/to/file
```

安装为全局命令：

```bash
npm link
# 之后可在任意目录使用 ofd-tools 命令
```

#### 2. stdio MCP 服务器（用于 Claude Desktop 等 MCP 客户端）

```bash
npm start
```

Claude Desktop 配置示例：

```json
{
  "mcpServers": {
    "ofd-tools": {
      "command": "node",
      "args": ["D:\\path\\to\\dianju-ofd-tools\\dist\\index.js"],
      "env": {
        "API_KEY": "dj_live_xxx",
        "API_URL": "https://ofd365.com/admin-api"
      }
    }
  }
}
```

#### 3. SSE 服务器（用于 HTTP/SSE 远程调用）

```bash
npm run start:sse
```

#### SSE 服务器配置

| 环境变量 | 说明 | 默认值 |
| -------- | ---- | ------ |
| `SSE_PORT` | SSE 服务器监听端口 | `3000` |
| `SSE_HOST` | SSE 服务器绑定地址 | `127.0.0.1` |

```bash
# 自定义端口和地址
SSE_PORT=8080 SSE_HOST=0.0.0.0 npm run start:sse
```

#### SSE 服务器端点

| 端点 | 方法 | 说明 |
| ---- | ---- | ---- |
| `/sse` | GET | 建立 SSE 长连接，返回 EventSource 流 |
| `/messages` | POST | 接收客户端 JSON-RPC 消息（需传 `sessionId` 参数） |
| `/health` | GET | 健康检查，返回服务器状态 |

### 构建项目

```bash
npm run build
```

### 类型检查

```bash
npm run typecheck
```

## 配置说明

### 配置项

| 配置项    | 说明                                    | 默认值                          |
| --------- | --------------------------------------- | ------------------------------- |
| `API_KEY` | API Key，格式为 `dj_live_` + 40位字符 | 无                              |
| `API_URL` | API基础地址                             | `https://ofd365.com/admin-api`  |

### 配置优先级

1. 命令行参数（最高优先级）
2. 环境变量
3. `.env`文件
4. 默认值（最低优先级）

## 技术栈

- **框架**: Node.js + TypeScript
- **协议**: MCP (Model Context Protocol)
- **HTTP客户端**: Axios
- **类型验证**: Zod
- **构建工具**: TypeScript Compiler
- **认证方式**: X-Api-Key 请求头认证

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题或建议，请通过以下方式联系：

- 邮箱: dianju@gmail.com
