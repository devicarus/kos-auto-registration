import { createLogger, Logger, transports, format, config } from 'winston';
import { DEBUG } from './config';

export default createLogger({
  levels: config.syslog.levels,
  format: format.combine(
		format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.prettyPrint(),
    format.json(),
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/debug.log', level: 'debug' }),
    new transports.File({ filename: 'logs/combined.log' }),
    new transports.Console({
      format: format.combine(
        format.colorize({
          level: true
        }),
        format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)
      ),
      level: DEBUG ? 'debug' : 'info'
    })
  ],
}) satisfies Logger;
