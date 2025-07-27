import LinuxTerminal from '@/components/LinuxTerminal';
import { registerCommand } from '@/utils/commandSystem';

export default function HomePage() {
  // 注册自定义命令
  const customCommands = {
    echo: {
      description: '显示输入内容',
      handler: (args: string[]) => args.join(' ')
    },
    calc: {
      description: '简单计算器',
      handler: (args: string[]) => {
        if (args.length < 3) return 'Usage: calc <num1> <operator> <num2>';
        const [a, op, b] = args;
        const num1 = parseFloat(a);
        const num2 = parseFloat(b);
        
        switch (op) {
          case '+': return `${num1 + num2}`;
          case '-': return `${num1 - num2}`;
          case '*': return `${num1 * num2}`;
          case '/': return num2 !== 0 ? `${num1 / num2}` : 'Error: Division by zero';
          default: return `Error: Invalid operator '${op}'`;
        }
      }
    }
  };

  // 处理命令执行事件
  const handleCommandExecute = (command: string, output: string) => {
    console.log(`命令执行: ${command}`, `输出: ${output}`);
  };

  return (
    <div style={{ height: '100vh', padding: '20px', backgroundColor: '#1e1e1e' }}>
      <LinuxTerminal 
        commands={customCommands}
        onExecute={handleCommandExecute}
        prompt="user@linux:~$ "
        welcomeMessage="欢迎使用自定义 Linux 终端模拟器"
      />
    </div>
  );
}