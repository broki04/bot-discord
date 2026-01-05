"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("./client");
const events_1 = require("./events");
const commands_1 = require("./commands");
const deploy_commands_1 = require("./commands/deploy-commands");
const logger_1 = require("./utils/logger");
async function initBot() {
    try {
        await (0, commands_1.registerCommands)();
        await (0, events_1.registerEvents)();
        await (0, deploy_commands_1.deployCommands)();
        await client_1.client.login(process.env.DISCORD_TOKEN);
    }
    catch (err) {
        logger_1.logger.error('Error while startup: ', err);
        process.exit(1);
    }
}
initBot();
