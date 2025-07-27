// src/pages/docs.tsx
import LinuxTerminal from '@/components/LinuxTerminal';
import { registerCommand } from '@/utils/commandSystem';

// 注册文档相关命令
registerCommand('open-doc', {
  description: '打开文档',
  handler: (args) => {
    const docName = args[0] || 'getting-started';
    return `打开文档: ${docName}.md`;
  }
});

export default function DocsPage() {
  return (
    <div style={{ height: '80vh' }}>
      <LinuxTerminal 
        prompt="docs@linux:$ "
        welcomeMessage="文档系统终端 - 输入 open-doc <文档名> 查看文档"
      />
    </div>
  );
}