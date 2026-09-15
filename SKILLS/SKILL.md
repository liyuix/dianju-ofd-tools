---
name: dianju-ofd-tools
description: An OFD document processing tool that converts PDF/OFD files, converts OFD to images, and supports multiple document formats via the ofd365.com API.
version: 2.0.0
email: support-ofd@dianju.com
---

# OFD Tools Skill

A file conversion MCP server powered by the ofd365.com API. Supports PDF, OFD, Word, Excel, PPT, images and more.

## Quick Start

```bash
# Install globally
npm install -g dianju-ofd-tools

# Configure API Key (get your key from ofd365.com)
export API_KEY=dj_live_your_api_key_here
export API_URL=https://ofd365.com/admin-api

# CLI mode
ofd-tools pdf_to_ofd --filePath=/path/to/input.pdf

# MCP stdio mode (for Claude Desktop etc.)
npm start

# SSE server mode (for remote HTTP access)
npm run start:sse
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `API_KEY` | API Key (format: `dj_live_` + 40 chars) | Required |
| `API_URL` | API base URL | `https://ofd365.com/admin-api` |

Configure via environment variables, `.env` file, or CLI arguments (`--API_KEY=xxx`).

## Features

### 1. PDF to OFD Conversion

- **Tool Name:** `pdf_to_ofd`
- **Description:** Convert local PDF files to OFD format
- **Parameters:**
  ```json
  { "filePath": "string" }
  ```
- **Returns:** Temporary download link for the generated OFD file

### 2. OFD to PDF Conversion

- **Tool Name:** `ofd_to_pdf`
- **Description:** Convert local OFD files to PDF format
- **Parameters:**
  ```json
  { "filePath": "string" }
  ```
- **Returns:** Temporary download link for the generated PDF file

### 3. OFD to Image Conversion

- **Tool Name:** `ofd_to_image`
- **Description:** Convert local OFD files to PNG images
- **Parameters:**
  ```json
  { "filePath": "string" }
  ```
- **Returns:** Temporary download link for the generated image file

### 4. OFD Content Extraction

- **Tool Name:** `get_ofd_content`
- **Description:** Extract OFD file content. Attempts OFD→TXT text extraction first; if unsupported by the API, falls back to OFD→PDF and returns the download URL.
- **Parameters:**
  ```json
  { "filePath": "string" }
  ```
- **Returns:** Extracted text content, or PDF download URL as fallback

### 5. File to Base64

- **Tool Name:** `read_file_as_base64`
- **Description:** Read a local file and return its Base64-encoded content. No API call required (local operation).
- **Parameters:**
  ```json
  { "filePath": "string" }
  ```
- **Returns:** Base64-encoded string of the file content

## Supported Formats

| Category | Formats |
|----------|---------|
| Document | `pdf`, `ofd`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`, `txt` |
| Image | `jpg`, `jpeg`, `png`, `bmp`, `tif`, `tiff`, `gif` |

## Usage Examples

```bash
# CLI mode
ofd-tools pdf_to_ofd --filePath=/path/to/input.pdf
ofd-tools ofd_to_pdf --filePath=/path/to/input.ofd
ofd-tools ofd_to_image --filePath=/path/to/input.ofd
ofd-tools get_ofd_content --filePath=/path/to/input.ofd
ofd-tools read_file_as_base64 --filePath=/path/to/file
```

## Three Running Modes

| Mode | Command | Use Case |
|------|---------|----------|
| **CLI** | `ofd-tools <tool> --filePath=xxx` | Direct API calls from terminal |
| **stdio MCP** | `npm start` | Claude Desktop and other MCP clients |
| **SSE** | `npm run start:sse` | Remote HTTP/SSE access |

## API Details

- **Endpoint:** `POST {API_URL}/convert/common`
- **Authentication:** `X-Api-Key` header
- **Request body:** JSON with `base_data`, `meta_data`, `file_list`
- **File input:** Base64-encoded content (`request_type: "4"`)

## Notes

1. **File Paths:** Use absolute paths for files outside the current directory.
2. **Temporary Links:** Converted file download links may expire; download promptly.
3. **File Size:** Large files may take longer; the default timeout is 30 seconds.
4. **Logging:** Enable with `ENABLE_LOGGING=true`; output to file with `LOG_TO_FILE=true`.

## Error Handling

- **File Not Found:** Ensure the file path is correct and accessible.
- **401 Unauthorized:** Check your API Key is valid.
- **Conversion Failed:** Verify the input file is valid and not corrupted.
- **Network Issues:** Check connectivity to the API server.

## Support

For issues or questions, contact support at support-ofd@dianju.com.
