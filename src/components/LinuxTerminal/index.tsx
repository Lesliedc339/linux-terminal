import React, {
    useEffect,
    useRef,
    useImperativeHandle,
    forwardRef
} from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import data from '@/assets/data.json';

// 类型 
type CommandHandler = (
    args: string[],
    context: CommandContext
) => string | string[] | Promise<string | string[]>;

interface CommandContext {
    currentDir: string;
    history: string[];
    output: (content: string) => void;
}

interface CommandConfig {
    description: string;
    handler: CommandHandler;
    validate?: (args: string[]) => boolean;
}

interface LinuxTerminalProps {
    commands?: Record<string, CommandConfig>;
    onExecute?: (command: string, output: string) => void;
    prompt?: string;
    welcomeMessage?: string;
}

export interface LinuxTerminalHandle {
    pushCommand: (cmd: string) => void;
}
// -------------------------

const LinuxTerminal = forwardRef<LinuxTerminalHandle, LinuxTerminalProps>(
    ({ commands = {}, prompt = '$ ', welcomeMessage = 'Welcome!' }, ref) => {
        const terminalRef = useRef<HTMLDivElement>(null);
        const termRef = useRef<Terminal>();
        const fitAddonRef = useRef<FitAddon>();
        const commandRegistry = useRef<Record<string, CommandConfig>>({});
        const executeCommandRef = useRef<(input: string) => Promise<void>>();
        const showPromptRef = useRef<() => void>();

        // 暴露给父组件的方法
        useImperativeHandle(ref, () => ({
            pushCommand: (cmd: string) => {
                if (!termRef.current) return;
                termRef.current.writeln(`\r\n${prompt}${cmd}`);
                executeCommandRef.current?.(cmd);
            }
        }));

        useEffect(() => {
            if (!terminalRef.current) return;

            const term = new Terminal({
                cursorBlink: true,
                fontFamily: 'Consolas, "Courier New", monospace',
                theme: { background: '#000' },
                fontSize: 14,
                allowProposedApi: true
            });

            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.open(terminalRef.current);
            fitAddon.fit();
            termRef.current = term;
            fitAddonRef.current = fitAddon;

            // 内置命令
            commandRegistry.current = {
                help: {
                    description: '显示所有可用命令',
                    handler(): string[] {
                        const list = Object.keys(commandRegistry.current).map(
                            cmd => `${cmd.padEnd(8)} - ${commandRegistry.current[cmd].description}`
                        );
                        return ['可用命令:', ...list];
                    }
                },
                clear: {
                    description: '清除终端内容',
                    handler(_, { output }) {
                        output('\x1Bc');
                        return '';
                    }
                },
                date: { description: '显示当前日期时间', handler: () => new Date().toLocaleString() },
                countdown: {
                    description: '倒计时 5 秒',
                    async handler(_, { output }) {
                        for (let i = 5; i >= 0; i--) {
                            output(String(i || 'BOOM!'));
                            await new Promise(r => setTimeout(r, 1000));
                        }
                        return '';
                    }
                },

                ...commands
            };

            term.writeln(welcomeMessage);
            const showPrompt = () => term.write(`\r${prompt}`);
            showPromptRef.current = showPrompt;
            let currentCommand = '';
            const history: string[] = [];
            let historyIndex = -1;
            async function executeCommand(input: string) {
                const trimmed = input.trim();
                if (!trimmed) {
                    showPrompt();
                    return;
                }

                // 先在 data.json 中匹配
                const found = data.find(d => d.input === trimmed);
                if (found) {
                    found.out.split('\n').forEach(l => term.writeln(l));
                    return;
                }

                // 走自定义命令
                const [cmd, ...args] = trimmed.split(/\s+/);
                const config = commandRegistry.current[cmd];

                try {
                    if (!config) {
                        term.writeln(`\x1B[31mCommand not found: ${cmd}\x1B[0m`);
                        return;
                    }

                    const context: CommandContext = {
                        currentDir: '/',
                        history: [...history],
                        output: str => term.writeln(str)
                    };

                    const result = await config.handler(args, context);
                    const lines = Array.isArray(result) ? result : [result];
                    lines.forEach(l => term.writeln(l));
                } catch (err) {
                    term.writeln(`\x1B[31mError: ${(err as Error).message}\x1B[0m`);
                } finally {
                    
                }
            }

            executeCommandRef.current = executeCommand;

            term.onKey(({ key, domEvent }) => {
                const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

                switch (domEvent.key) {
                    case 'Enter':
                        term.write('\r\n');
                        executeCommand(currentCommand);
                        currentCommand = '';
                        break;

                    case 'Backspace':
                        if (currentCommand.length > 0) {
                            currentCommand = currentCommand.slice(0, -1);
                            term.write('\b \b');
                        }
                        break;

                    case 'ArrowUp':
                        if (historyIndex < history.length - 1) {
                            historyIndex++;
                            const prev = history[historyIndex];
                            term.write('\x1B[2K\r');
                            term.write(`${prompt}${prev}`);
                            currentCommand = prev;
                        }
                        break;

                    case 'ArrowDown':
                        if (historyIndex > 0) {
                            historyIndex--;
                            const next = history[historyIndex];
                            term.write('\x1B[2K\r');
                            term.write(`${prompt}${next}`);
                            currentCommand = next;
                        } else if (historyIndex === 0) {
                            historyIndex = -1;
                            term.write('\x1B[2K\r');
                            term.write(prompt);
                            currentCommand = '';
                        }
                        break;

                    case 'Tab':
                        if (currentCommand) {
                            const matches = Object.keys(commandRegistry.current).filter(c =>
                                c.startsWith(currentCommand)
                            );
                            if (matches.length === 1) {
                                const rest = matches[0].slice(currentCommand.length);
                                term.write(rest);
                                currentCommand = matches[0];
                            }
                        }
                        break;

                    default:
                        if (printable && key.length === 1) {
                            currentCommand += key;
                            term.write(key);
                        }
                }
            });

            const resizeHandler = () => fitAddonRef.current?.fit();
            window.addEventListener('resize', resizeHandler);

            return () => {
                term.dispose();
                window.removeEventListener('resize', resizeHandler);
            };
        }, [commands, prompt, welcomeMessage]);

        return (
            <div
                ref={terminalRef}
                style={{
                    width: '100%',
                    height: '100%',
                    background: '#000',
                    padding: '10px',
                    boxSizing: 'border-box'
                }}
            />
        );
    }
);

export default LinuxTerminal;