import logger from "./logger";
import Sniper from './sniper';
import { SECONDS_BEFORE_RESTART_ON_ERROR } from "./config";
import { Timer } from "./timer";
import { AuthError, ServerError } from "./errors";
import { formatDuration } from "./utils";

const startSniper = () => {
    const sniper = new Sniper(logger);
    sniper.start().then(() => { 
        logger.info('All done, enjoy your new schedule! 🎉');
    }).catch(e => {
        if (e instanceof AuthError) {
            logger.error(e.message);
            logger.error('Exiting... 🚪');
            process.exit(1);
        } else if (e instanceof ServerError) {
            logger.error(`${e.message} - seems like 🥥 is on fire`);
        } else {
            logger.debug(e.message);
            logger.error('Something went wrong bud, sorry...');
        }
        
        logger.debug(`Restarting in ${formatDuration(SECONDS_BEFORE_RESTART_ON_ERROR)}`);

        const timer = new Timer(SECONDS_BEFORE_RESTART_ON_ERROR, 'Restarting in...');
        timer.start().onEnd(() => {
            logger.info('Restarting... 🔃');
            startSniper();
        });
        
    });
}

logger.info('Spinnin up, gimme a sec... 🚀');
startSniper();