import winston, { Logger, transports, format } from 'winston';
import { DEBUG } from './config';

export default winston.createLogger({
  level: DEBUG ? 'debug' : 'info',
  format: format.combine(
		winston.format.timestamp({
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
        winston.format.colorize({
          level: true
        }),
        format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)
      ),
    })
  ],
}) satisfies Logger;