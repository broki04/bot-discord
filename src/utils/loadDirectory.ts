import { promises as fs } from 'node:fs';
import path from 'node:path';

interface LoadDirectoryOptions {
  ext: string;
  ignore?: Set<string>;
}

export async function loadDirectory(
  dir: string,
  options: LoadDirectoryOptions,
  onFile: (filePath: string) => Promise<void>,
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const tasks: Promise<void>[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      tasks.push(loadDirectory(fullPath, options, onFile));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(options.ext)) continue;
    if (options.ignore?.has(entry.name)) continue;

    tasks.push(onFile(fullPath));
  }

  await Promise.all(tasks);
}
