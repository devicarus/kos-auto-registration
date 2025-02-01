import logUpdate from 'log-update';

/**
 * A simple console spinner.
 * 
 * @example
 * ```typescript
 * const spinner = new Spinner("Doing stuff...");
 * spinner.start();
 * // stuff
 * spinner.stop();
 * ```
 */
export default class Spinner {
    private label: string;
    private frame: number = 0;

    private intervalObject: ReturnType<typeof setInterval>;
    
    private static frames: string[] = ["⣷","⣯","⣟","⡿","⢿", "⣻","⣽","⣾"]; //["⣾","⣽","⣻","⢿","⡿","⣟","⣯","⣷"];
    
    /**
     * @param label - The label to be displayed before the spinner frame.
     */
    public constructor(label: string) {
        this.label = label;
    }
    
    /**
     * Starts the spinner.
     * @returns The Spinner instance.
     */
    public start(): Spinner {
        this.frame = 0;
        this.render();
        this.intervalObject = setInterval(() => {
            this.frame = (this.frame + 1) % Spinner.frames.length;
            this.render();
        }, 100);

        process.once("SIGINT", this.stop); // stop the spinner when the process is interrupted

        return this;
    }
    
    private render(): void {
        logUpdate(`${this.label} ${Spinner.frames[this.frame]}`);
    }

    /**
     * Stops the spinner.
     */
    public stop(): void {
        clearInterval(this.intervalObject);
        process.removeListener("SIGINT", this.stop)
        logUpdate.clear()
    }
}

