import LinuxTerminal from '@/components/LinuxTerminal';
import { registerCommand } from '@/utils/commandSystem';
import { useEffect, useRef } from 'react';

// 把 data.json 引入进来
import data from '@/assets/data.json';
export default function HomePage() {
  const terminalRef = useRef<{ pushCommand: (cmd: string) => void }>(null);

  // 自动执行脚本
  useEffect(() => {
    let idx = 0;
    const timer = setInterval(() => {
      if (idx >= data.length) {
        clearInterval(timer);
        return;
      }
      terminalRef.current?.pushCommand(data[idx].input);
      idx++;
    }, 3000);
    return () => clearInterval(timer);
  }, []);



  return (
    <div style={{ height: '100vh', padding: '20px', backgroundColor: '#1e1e1e' }}>
      <LinuxTerminal
        ref={terminalRef}
        prompt="user@linux:~$ "
        welcomeMessage="欢迎使用自定义 Linux 终端模拟器"
      />
    </div>
  );
}