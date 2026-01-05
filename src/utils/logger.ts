import chalk from 'chalk';

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

function getCallerFile(): string {
  const err = new Error();
  const stack = err.stack?.split('\n') || [];

  for (const line of stack) {
    if (!line.includes('logger.ts') && line.includes(process.cwd())) {
      const match = line.match(/\((.*):\d+:\d+\)/);
      if (match && match[1]) {
        let filePath = match[1];
        filePath = filePath.replace(/^.*?(src|dist)[\\/]/, '');
        return filePath.replace(/\\/g, '/');
      }
    }
  }
  return 'undefined';
}

export const logger = {
  info: (...args: any[]) =>
    console.log(`🚀 ${chalk.blue(`[${getCallerFile()}]`)}`, ...args),
  warn: (...args: any[]) =>
    console.log(`⚠️ ${chalk.yellow(`[${getCallerFile()}]`)}`, ...args),
  success: (...args: any[]) =>
    console.log(`✅ ${chalk.green(`[${getCallerFile()}]`)}`, ...args),
  error: (...args: any[]) =>
    console.log(`❌ ${chalk.red(`[${getCallerFile()}]`)}`, ...args),

  debug: (...args: any[]) => {
    if (!DEBUG_MODE) return;
    console.log(`🐛 ${chalk.gray(`[${getCallerFile()}]`)}`, ...args);
  },
};
