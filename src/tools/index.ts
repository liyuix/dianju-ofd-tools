import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerReadFileAsBase64 } from './ReadFileAsBase64.js';
import { registerPdfToOfd } from './PdfToOfd.js';
import { registerGetOfdContent } from './GetOfdContent.js';
import { registerOfdToPdf } from './OfdToPdf.js';
import { registerOfdToImage } from './OfdToImage.js';
import { registerSpiltFile } from './SpiltFile.js';

export function registerTools(server: McpServer) {
  registerReadFileAsBase64(server);
  registerPdfToOfd(server);
  registerGetOfdContent(server);
  registerOfdToPdf(server);
  registerOfdToImage(server);
  registerSpiltFile(server);
}
