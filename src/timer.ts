import logUpdate from 'log-update';
import { formatDuration } from './utils';

/**
 * A simple timer that logs the remaining time and a progress bar to the console.
 * 
 * @example
 * ```typescript
 * const timer = new Timer(60, "Time remaining:");
 * timer.start().onEnd(() => console.log("Time's up!"));
 * ```
 * 
 * @example
 * ```typescript
 * const timer = new Timer(60, "Time remaining:");
 * await timer.start().waitForEnd();
 * console.log("Time's up!");
 * ```
 */
export default class Timer {
    private totalSeconds: number;
    private currentSeconds: number = 0;
    private label: string;

    private intervalObject: ReturnType<typeof setInterval>;
    private onEndCallback: ((timer: Timer) => void) | undefined;
    
    /**
     * @param totalSeconds - The total duration of the timer in seconds.
     * @param label - The label to be displayed before the remaining time.
     */
    public constructor(totalSeconds: number, label: string) {
        this.totalSeconds = totalSeconds;
        this.label = label;
    }
    
    /**
     * Starts the timer.
     * @returns The Timer instance.
     */
    public start(): Timer {
        this.intervalObject = setInterval(() => {
            if (this.currentSeconds <= this.totalSeconds) {
                logUpdate(`${this.label} ${formatDuration(this.getRemaining())} ${this.renderBar()}`);
                this.currentSeconds++;
            } else {
                this.stop()

                if (this.onEndCallback)
                    this.onEndCallback(this);
            };
        }, 1000);

        process.once("SIGINT", () => this.stop()); // stop the timer when the process is interrupted

        return this;
    }

    private renderBar(): string {
        const percentage: number = this.currentSeconds / this.totalSeconds;
        const barLength: number = 20;
        const progress: number = Math.floor(percentage * barLength);
        const bar: string = '█'.repeat(progress) + '░'.repeat(barLength - progress);
        return bar;
    }

    /**
     * Stops the timer.
     */
    public stop(): void {
        clearInterval(this.intervalObject[Symbol.toPrimitive]()); // apparently this is necessary to avoid a TS error
        logUpdate.done()
    }

    /**
     * Registers a callback to be called when the timer ends.
     * @param callback - The callback to be called when the timer ends.
     */
    public onEnd(callback: (timer: Timer) => void): void {
        this.onEndCallback = callback;
    }

    /**
     * Waits for the timer to end.
     * @returns A promise that resolves when the timer ends.
     */
    public async waitForEnd(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.onEnd((timer) => {
                resolve();
            });
        });
    }

    /**
     * @returns The number of seconds remaining.
     */
    public getRemaining(): number {
        return this.totalSeconds - this.currentSeconds;
    }
}

export { Timer };

