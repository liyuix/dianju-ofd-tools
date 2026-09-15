// HTTP 请求工具类（基于 Axios）
// @ts-ignore
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigManager } from './config.js';

export interface HttpRequestOptions extends AxiosRequestConfig {
  // 可以添加自定义配置
}

export interface HttpResponse<T = any> extends AxiosResponse<T> {
  // 可以扩展响应类型
}

class HttpUtils {
  private static axiosInstance: AxiosInstance;

  static {
    // 创建 Axios 实例
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器：自动注入 X-Api-Key 请求头
    this.axiosInstance.interceptors.request.use(
      (config: any) => {
        const apiKey = ConfigManager.getConfig().API_KEY;
        if (apiKey) {
          config.headers['X-Api-Key'] = apiKey;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response: any) => {
        // 可以在响应返回后添加逻辑
        return response;
      },
      (error: any) => {
        // 统一处理错误
        if (error.response) {
          // 请求已发出，服务器返回状态码不是 2xx
          console.error('Response error:', error.response.status, error.response.data);
        } else if (error.request) {
          // 请求已发出，但没有收到响应
          console.error('Request error:', error.request);
        } else {
          // 发生了一些错误，导致请求无法发送
          console.error('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  static async request<T>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.axiosInstance.request<T>(options);
  }

  static async get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.axiosInstance.get<T>(url, options);
  }

  static async post<T>(url: string, data?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.axiosInstance.post<T>(url, data, options);
  }

  static async put<T>(url: string, data?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.axiosInstance.put<T>(url, data, options);
  }

  static async delete<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.axiosInstance.delete<T>(url, options);
  }

  static async patch<T>(url: string, data?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.axiosInstance.patch<T>(url, data, options);
  }
}

export default HttpUtils;
