import chalk from 'chalk';

function getCallerFile(): string {
  const err = new Error();
  const stack = err.stack?.split('\n') || [];

  for (const line of stack) {
    if (!line.includes('logger')) {
      const match =
        line.match(/\((.*):\d+:\d+\)/) || line.match(/at (.*):\d+:\d+/);
      if (match && match[1]) {
        let filePath = match[1];
        filePath = filePath.replace(/\\/g, '/');

        const idxSrc = filePath.indexOf('src/');
        const idxDist = filePath.indexOf('dist/');

        if (idxSrc > 0) filePath = filePath.slice(idxSrc + 4);
        else filePath = filePath.slice(idxDist + 5);
        return filePath;
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

  debug: (...args: any[]) =>
    console.log(`🐛 ${chalk.gray(`[${getCallerFile()}]`)}`, ...args),

  color: (color: string, msg: string) => {
    if ((chalk as any)[color]) return (chalk as any)[color](msg);
    return msg;
  },
};
