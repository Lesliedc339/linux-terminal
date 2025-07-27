// 命令处理器类型
type CommandHandler = (args: string[], context: CommandContext) => string | string[] | Promise<string>;

// 命令配置
export interface CommandConfig {
  description: string;
  handler: CommandHandler;
  validate?: (args: string[]) => boolean;
  outputFormatter?: (result: any) => string;
}

// 命令上下文
export interface CommandContext {
  currentDir: string;
  history: string[];
  output: (content: string) => void;
}

// 命令注册表
const commandRegistry: Record<string, CommandConfig> = {};

// 注册命令
export function registerCommand(name: string, config: CommandConfig) {
  commandRegistry[name] = config;
}

// 获取命令
export function getCommand(name: string): CommandConfig | undefined {
  return commandRegistry[name];
}

// 默认命令注册
registerCommand('help', {
  description: '显示可用命令',
  handler: () => {
    const commands = Object.keys(commandRegistry).map(cmd => 
      `${cmd.padEnd(10)} - ${commandRegistry[cmd].description}`
    );
    return ['可用命令:', ...commands];
  }
});

registerCommand('clear', {
  description: '清除终端内容',
  handler: (_, { output }) => {
    output('\x1Bc'); // ANSI 清屏序列
    return '';
  }
});

