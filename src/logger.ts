import {
    createLogger,
    Logger as Winston,
    transports,
    format,
    config,
} from "winston";
import Spinner from "./spinner";
import { DEBUG } from "./config";

export default class Logger {
    private winston: Winston = createLogger({
        levels: config.syslog.levels,
        format: format.combine(
            format.timestamp({
                format: "YYYY-MM-DD HH:mm:ss",
            }),
            format.prettyPrint(),
            format.json(),
        ),
        transports: [
            new transports.File({ filename: "logs/error.log", level: "error" }),
            new transports.File({ filename: "logs/info.log", level: "info" }),
            new transports.File({ filename: "logs/debug.log", level: "debug" }),
            new transports.Console({
                format: format.combine(
                    format.colorize({
                        level: true,
                    }),
                    format.printf(
                        (info) => `${info.timestamp} [${info.level}]: ${info.message}`,
                    ),
                ),
                level: DEBUG ? "debug" : "info",
            }),
        ],
    });
    
    private spinner: Spinner | undefined;
    
    public error(message: string): void {
        this.log("error", message);
    }
    
    public info(message: string): void {
        this.log("info", message);
    }
    
    public debug(message: string): void {
        this.log("debug", message);
    }
    
    public warning(message: string): void {
        this.log("warning", message);
    }
    
    public setSpinner(spinner: Spinner): void {
        this.spinner = spinner;
    }
    
    public clearSpinner(): void {
        this.spinner = undefined;
    }
    
    private log(level: string, message: string): void {
        if (this.spinner) this.spinner.stop();
        this.winston.log(level, message);
        if (this.spinner) this.spinner.resume();
    }
}
