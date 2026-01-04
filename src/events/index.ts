import { ClientEvents } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import client from '../client';

interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => void | Promise<void>;
}

export async function registerEvents() {
  const isDev = process.env.NODE_ENV === 'development';
  const ext = isDev ? 'ts' : 'js';
  const eventsPath = path.join(process.cwd(), isDev ? 'src' : 'dist', 'events');

  let loadedCount = 0;
  async function load(dir: string) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.lstatSync(fullPath);

      if (stat.isDirectory()) {
        await load(fullPath);
        continue;
      }

      if (!item.endsWith(`.${ext}`)) continue;

      try {
        const imported = await import(fullPath);
        const event: Event | undefined = imported.default ?? imported.event;

        if (!event?.name || typeof event.execute !== 'function') continue;

        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }

        loadedCount++;
      } catch (err) {
        console.error(`❌ Error loading event ${fullPath}: `, err);
      }
    }
  }

  await load(eventsPath);
  console.log(`✅ Loaded ${loadedCount} events in total`);
}
