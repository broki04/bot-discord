import { ClientEvents } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { client } from '../client';

export async function registerEvents() {
  const isDev = process.env.NODE_ENV === 'development';
  const ext = isDev ? 'ts' : 'js';
  const eventsPath = path.join(process.cwd(), isDev ? 'src' : 'dist', 'events');

  if (!fs.existsSync(eventsPath)) {
    console.error('[ERROR]: Events folder not found: ', eventsPath);
    return;
  }

  const subFolders = fs.readdirSync(eventsPath).filter((item) => {
    const fullPath = path.join(eventsPath, item);
    return fs.lstatSync(fullPath).isDirectory();
  });

  let loadedCount = 0;
  for (const folder of subFolders) {
    const folderPath = path.join(eventsPath, folder);
    const files = fs
      .readdirSync(folderPath)
      .filter((f) => f.endsWith(`.${ext}`));

    for (const file of files) {
      const filePath = path.join(folderPath, file);

      try {
        const module = await import(filePath);
        if ('name' in module && typeof module.execute === 'function') {
          const event = {
            name: module.name as keyof ClientEvents,
            once: (module.once as boolean) ?? false,
            execute: module.execute as (...args: any[]) => Promise<void> | void,
          };

          if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
          } else {
            client.on(event.name, (...args) => event.execute(...args));
          }

          loadedCount++;
        }
      } catch (err) {
        console.error(`❌ Error while loading event ${folder}/${file}: ${err}`);
      }
    }
  }

  console.log(`✅ Loaded ${loadedCount} events in total.`);
}
