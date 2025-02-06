import puppeteer, { Browser, ElementHandle, Page, TimeoutError } from "puppeteer";
import { setTimeout } from "timers/promises";

import { DEBUG_BROWSER, SECONDS_BETWEEN_CHECKS, SECONDS_TIMEOUT, KOS_USERNAME, KOS_PASSWORD } from './config';
import { AuthError, ServerError } from "./errors";
import Logger from './logger';
import Timer from "./timer";
import Spinner from "./spinner";
import { Ticket, ParallelType, ParallelTypeEnum } from "./types";

const LOGIN_PAGE="https://kos.cvut.cz/login"
const SCHEDULE_PAGE="https://kos.cvut.cz/schedule/create"

import WISHLIST from '../wishlist.json';

export default class Sniper {

    private browser: Browser;
    private page: Page;
    private logger: Logger;

    private tickets: Ticket[];

    constructor(logger: Logger) {
        this.logger = logger;
    }

    public async start(): Promise<void> {
        await this.launch(!DEBUG_BROWSER, SECONDS_TIMEOUT);
        await this.login(KOS_USERNAME.get(), KOS_PASSWORD.get());
        await this.run();
        await this.stop();
    }

    /**
     * @param headless - whether the browser should be launched in headless mode
     * @param timeout - in seconds
     */
    private async launch(headless: boolean, timeout: number): Promise<void> {
        this.browser = await puppeteer.launch({ headless });
        this.page = await this.browser.newPage();
        this.page.setDefaultTimeout(timeout * 1000);
    }

    private async login(username: string, password: string): Promise<void> {
        await this.page.goto(LOGIN_PAGE, { waitUntil: 'networkidle2' });
        await setTimeout(1000); // why is this here?
        await this.page.waitForSelector('.form-body > .base-button-wrapper > button');
        await this.page.type('#username', username);
        await this.page.type('#password', password);
        await this.page.click('.form-body > .base-button-wrapper > button');

        try {
            
            const result: ElementHandle<Element> | null = await Promise.race([
                this.page.waitForSelector('.header-wrapper > .header-text'), // logged in successfully
                this.page.waitForSelector('.form-body > .error-message') // wrong username or password (probably)
            ]);

            if (result?.remoteObject().description?.includes("error-message"))
                throw new AuthError('Wrong username or password')

            if (result?.remoteObject().description?.includes("header-text"))
                this.logger.info('Logged in successfully ✅');

        } catch (e) {
            if (e instanceof TimeoutError)
                throw new ServerError('Login timed out');
            else
                throw e;
        }
    }

    public async stop(): Promise<void> {
        await this.browser.close();
    }

    private async run(): Promise<void> {
        const spinner: Spinner = new Spinner('Checking for available parallels...');
        const timer: Timer = new Timer(SECONDS_BETWEEN_CHECKS, 'Next check in...');
        
        let done: boolean = false;
        while (!done) {
            this.logger.debug('Checking for available parallels');
            
            try {
                this.logger.setSpinner(spinner);
                spinner.start();
            
                done = !await this.check();
            } catch (error) {
                if (error instanceof TimeoutError)
                    throw new ServerError('Schedule check timed out');
                else
                    throw error;
            } finally {
                spinner.stop();
                this.logger.clearSpinner();
            }

            if (!done) await timer.start().waitForEnd();
        }
    }

    private async check(): Promise<boolean> {
        await this.page.goto(SCHEDULE_PAGE, { waitUntil: 'networkidle2' });

        await Promise.all([
            await this.page.waitForSelector('#loading-indicator', { hidden: true }),
            await this.page.waitForSelector('label[for="select-all-filter-courses"]', { visible: true })
        ]);

        // while the above is partially an indicator of the page being loaded, it's not 100%, because 🥥...
        // do yourself a favor and don't try to find a better solution, it's not worth your time
        // HOURS_OF_MY_LIFE_WASTED = 7 // kindly increment appropriately to warn others
        while ((await this.page.$('label[for="select-all-filter-courses"].active')) === null)
            await this.page.click('label[for="select-all-filter-courses"]');
        
        const ticketElements: ElementHandle<Element>[] = await this.page.$$('.ticket-wrapper');

        const ticketPromises: Promise<Ticket>[] = ticketElements.map(async element => {
            const parallel: string = await element.$eval('.box-parallel', e => e.textContent!.toUpperCase());
            const course: string = await element.$eval('.ticket-body', e => e.textContent!.toUpperCase());
            const type: ParallelType = element.remoteObject().description!.split('.').find(item => Object.keys(ParallelTypeEnum).includes(item.toUpperCase())) as ParallelType;
            const isSelected: boolean = !element.remoteObject().description!.includes('ticket-unselected');
    
            let freeSlots: number = 0;
            if (await element.$('.box-count')) // have to check if the element exists, because $eval throws an error if it doesn't
                freeSlots = parseInt(await element.$eval('.box-count', e => e.textContent!.toUpperCase()));

            return {
                element,
                parallel,
                course,
                type,
                isSelected,
                freeSlots,
            };
        });

        this.tickets = await Promise.all(ticketPromises);

        let betterAvailable: boolean = false;
        for (const course in WISHLIST) {
            const parallels_by_type = Object.groupBy(WISHLIST[course], (parallel: string, _) => parallel.slice(-1) as ParallelType)
            for (const [_, parallels] of Object.entries(parallels_by_type)) {
                for (const parallel of parallels) {

                    const ticket: Ticket | undefined = this.getTicket(course, parallel);
                    if (!ticket) {
                        this.logger.warning(`${course.toUpperCase()}: Ticket "${parallel}" was not found, maybe there was misspell`);
                        continue;
                    }

                    await setTimeout(1000); // why is this here?

                    if (ticket.isSelected) break;

                    if (ticket.freeSlots > 0 && await this.selectTicket(ticket)) {
                        this.logger.info(`${course.toUpperCase()} parallel "${parallel}" was successfully signed 🎉`);
                        break;
                    } else
                        betterAvailable = true;
                }
            }
        }

        return betterAvailable;
    }

    private getTicket(courseId: string, parallelId: string): Ticket | undefined {
        return this.tickets.find(item => item.course === courseId.toUpperCase() && item.parallel === parallelId.toUpperCase());
    }

    private async selectTicket(ticket: Ticket): Promise<boolean> {
        let result: boolean = false;
        
        await ticket.element.click();
        const modalElement: ElementHandle<Element> | null = await this.page.waitForSelector('.modal-content', { visible: true });
        const [_, signButtonElement]: ElementHandle<Element>[] = await modalElement!.$$('.button-component');
        
        if (signButtonElement) {
            signButtonElement.click()
            await setTimeout(3000); // TODO: replace with a waitForSelector (the buttin spinner)
            result = true;
        }

        await this.page.waitForSelector('.modal-content', { hidden: true });
        return result;
    }

}