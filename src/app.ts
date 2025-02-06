import Logger from "./logger";
import Sniper from './sniper';
import { SECONDS_BEFORE_RESTART_ON_ERROR, DEBUG, DEBUG_BROWSER } from "./config";
import Timer from "./timer";
import Updater from "./updater";
import { AuthError, ServerError } from "./errors";
import { formatDuration } from "./utils";
import packageJson from "../package.json";

const startSniper = (logger: Logger) => {
    const sniper = new Sniper(logger);
    sniper.start().then(() => { 
        logger.info('All done, enjoy your new schedule! 🎉');
    }).catch((e: Error) => {
        if (e instanceof AuthError) {
            logger.error(e.message);
            logger.error('Exiting... 🚪');
            process.exit(1);
        } else if (e instanceof ServerError) {
            logger.error(`${e.message} - seems like 🥥 is on fire`);
        } else {
            logger.debug(`${e.name}: ${e.message}`);
            logger.error('Something went wrong bud, sorry...');
        }
        
        logger.debug(`Restarting in ${formatDuration(SECONDS_BEFORE_RESTART_ON_ERROR)}`);

        const timer = new Timer(SECONDS_BEFORE_RESTART_ON_ERROR, 'Restarting in...');
        timer.start().onEnd(() => {
            logger.info('Restarting... 🔃');
            startSniper(logger);
        });
        
    });
}

const logger = new Logger();
const updater = new Updater(packageJson);

logger.info('🎯 Welcome to KOS Sniper! 🎯');
logger.info('In case of any problems, please open an issue on GitHub ASAP 🐛');
logger.info(packageJson.bugs.url);

const isLatest = await updater.isLatest();
logger.info('┌────────────────────┐');
logger.info(`│   Version: ${packageJson.version}   │`);
if (isLatest)
  logger.info(`│ \x1b[32mYou are up to date\x1b[0m │`)
else
  logger.info(`│  \x1b[31mUpdate available!\x1b[0m │`)
logger.info('└────────────────────┘');

logger.info('Spinnin up, gimme a sec... 🚀');
logger.debug(`Running in ${DEBUG ? 'DEBUG' : 'PRODUCTION'} mode with ${DEBUG_BROWSER ? 'visible' : 'headless'} browser`);
startSniper(logger);
