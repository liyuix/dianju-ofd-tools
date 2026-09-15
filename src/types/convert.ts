// 转换请求参数结构（匹配 ofd365 API 格式）

export interface BaseData {
  serial_number?: string;
}

export interface MetaData {
  is_asyn?: string;
}

export interface FileItem {
  file_no?: string;
  file_type?: string;
  convert_type?: string;
  request_type?: string;
  responseType?: string;
  file_path?: string;
}

export interface ConvertRequest {
  base_data: BaseData;
  meta_data: MetaData;
  file_list: FileItem[];
}

export interface ConvertResponseFileInfo {
  ret_code?: number | string;
  serial_number?: string;
  file_msg?: string;
  file_url?: string;
}

export interface ConvertResponseData {
  ret_code?: number | string;
  ret_msg?: string;
  file_info?: ConvertResponseFileInfo;
}

export interface ConvertResponse {
  code?: number;
  data?: ConvertResponseData;
  msg?: string;
}

// OFD 内容提取响应
export interface OfdContentResponse {
  code?: number;
  data?: {
    ret_code?: number | string;
    ret_msg?: string;
    file_info?: {
      ret_code?: number | string;
      serial_number?: string;
      file_msg?: string;
      txt_list?: string[];
    };
  };
  msg?: string;
}

// 文件拆分请求（扩展 ConvertRequest，增加 split_pages）
export interface SplitMetaData extends MetaData {
  split_pages?: string;
}

export interface SplitRequest {
  base_data: BaseData;
  meta_data: SplitMetaData;
  file_list: FileItem[];
}
