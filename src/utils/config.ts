// 配置文件读取工具

import * as fs from "fs";
import * as path from "path";

export interface Config {
  API_KEY?: string;
  API_URL?: string;
}

export class ConfigManager {
  private static config: Config | null = null;

  public static getConfig(): Config {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config!;
  }

  private static loadConfig(): void {
    // 检查是否存在.env文件
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, "utf8");
        const envLines = envContent.split("\n");
        envLines.forEach((line) => {
          const [key, value] = line.split("=");
          if (key && value) {
            process.env[key.trim()] = value.trim();
          }
        });
      } catch (error) {
        console.warn("读取.env文件失败:", error);
      }
    }

    // 从命令行参数中获取配置
    const argv = process.argv.slice(2);
    argv.forEach((arg) => {
      if (arg.startsWith("--")) {
        const [key, value] = arg.slice(2).split("=");
        if (key && value) {
          process.env[key.toUpperCase()] = value;
        }
      }
    });

    // 合并配置
    this.config = {
      API_KEY: process.env.API_KEY,
      API_URL: process.env.API_URL || "https://ofd365.com/admin-api",
    };
  }

  // 检查配置是否完整
  public static isConfigComplete(): boolean {
    const config = this.getConfig();
    return !!config.API_KEY;
  }

  // 获取缺失的配置项
  public static getMissingConfigs(): string[] {
    const config = this.getConfig();
    const missing: string[] = [];
    if (!config.API_KEY) missing.push("API_KEY");
    return missing;
  }
}

export default ConfigManager;
