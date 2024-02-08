import puppeteer, { Browser, ElementHandle, Page, TimeoutError } from "puppeteer";
import { Logger } from 'winston';

import { DEBUG_HEADLESS, SECONDS_BETWEEN_CHECKS, KOS_USERNAME, KOS_PASSWORD } from './config';
import { AuthError, ServerError } from "./errors";
import { Timer } from "./timer";
import { Ticket } from "./types";

const LOGIN_PAGE="https://new.kos.cvut.cz/login"
const SCHEDULE_PAGE="https://new.kos.cvut.cz/schedule/create"

import LESSONS from '../wishlist.json' assert { type: 'json' };

const PARALLEL_TYPES = {
    LECTURE: 'lecture',
    SEMINAR: 'seminar',
    LABORATORY: 'laboratory',
}
const PARALLEL_TYPES_CHAR = {
    [PARALLEL_TYPES.LECTURE]: 'P',
    [PARALLEL_TYPES.SEMINAR]: 'C',
    [PARALLEL_TYPES.LABORATORY]: 'L',
}

const LESSONS_PARSED = {};
for (const lessonKey in LESSONS) {
    LESSONS_PARSED[lessonKey] = {};
    for (const type of Object.values(PARALLEL_TYPES)) {
        LESSONS_PARSED[lessonKey][type] = LESSONS[lessonKey].filter(item => item.toLowerCase().includes(PARALLEL_TYPES_CHAR[type].toLowerCase()));
    }
}

export default class Sniper {

    private browser: Browser;
    private page: Page;
    private logger: Logger;

    constructor(logger) {
        this.logger = logger;
    }

    public async start(): Promise<void> {
        await this.launch(DEBUG_HEADLESS);
        //await this.login(KOS_USERNAME.get(), KOS_PASSWORD.get());
        await this.run();
        //await this.stop();
    }

    private async launch(headless: boolean): Promise<void> {
        this.browser = await puppeteer.launch({ headless });
        this.page = await this.browser.newPage();
    }

    private async login(username: string, password: string): Promise<void> {
        await this.page.goto(LOGIN_PAGE, { waitUntil: 'networkidle2' });
        await this.page.waitForTimeout(1000); // why is this here?
        await this.page.waitForSelector('.form-body > .base-button-wrapper > button');
        await this.page.type('#username', username);
        await this.page.type('#password', password);
        await this.page.click('.form-body > .base-button-wrapper > button');

        try {
            
            const result: ElementHandle<Element> | null = await Promise.race([
                this.page.waitForSelector('.header-wrapper > .header-text'), // logged in successfully
                this.page.waitForSelector('.form-body > .error-message') // wrong username or password (probably)
            ]);

            if (result?._remoteObject.description?.includes("error-message"))
                throw new AuthError('Wrong username or password')

            if (result?._remoteObject.description?.includes("header-text"))
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
        while (true) {
            this.logger.info('Checking for available parallels...');
            await this.check();

            const timer: Timer = new Timer(SECONDS_BETWEEN_CHECKS, 'Next check in...');
            await timer.start().waitForEnd();
        }
    }

    private async check(): Promise<void> {
        await this.page.goto(SCHEDULE_PAGE, { waitUntil: 'networkidle2' });
        await this.page.waitForTimeout(10000); // why is this here?
        try {
            await this.page.evaluate(() => { // why evaluate and not just waitForSelector?
                const checkboxLabelElement: Element = document.querySelector('label[for="select-all-filter-courses"]');
                if (!checkboxLabelElement.className.split(' ').includes('active')) {
                    document.getElementById('select-all-filter-courses').click();
                }
            });
        } catch {
            this.logger.info('Scheduler not ready yet (or down 🥥)');
            return;
        }
        const [logStash, betterAvailable] = await this.page.evaluate(async (LESSONS_CONVERTED, TYPES) => {
            const logStash: string[] = [];
            let betterAvailable: boolean = false;

            const ticketsElement: Element[] = Array.from(document.querySelectorAll('.ticket-wrapper'));

            const convertTicketType = (classArray: string[]): string => {
                for (const type of Object.values(PARALLEL_TYPES)) {
                    if (classArray.includes(type))
                        return type;
                }
            };

            const tickets: Ticket[] = ticketsElement.map(element => {
                const parallel: string = element.querySelector('.box-parallel')!.textContent!.toLowerCase();
                const course: string = element.querySelector('.ticket-body')!.textContent!.toLowerCase();
                const type: string = convertTicketType(element.className.split(' '));
                const isSelected: boolean = !element.className.split(' ').includes('ticket-unselected')
                const freeSlots: number = parseInt(element!.querySelector('.box-count')!.textContent ?? '0');

                return {
                    element,
                    parallel,
                    course,
                    type,
                    isSelected,
                    freeSlots,
                }
            });

            const getTicket = (courseId: string, parallelId: string): Ticket | undefined => {
                return tickets.find(item => item.course === courseId.toLowerCase() && item.parallel === parallelId.toLowerCase());
            }

            const delay = timeout =>
                new Promise(resolve => setTimeout(resolve, timeout))

            const selectTicket = async element => {
                let result = false;

                element.click();
                await delay(300);
                const modalElement = document.querySelector('.modal-content');
                const [closeButtonElement, signButtonElement] = Array.from(modalElement.querySelectorAll('.button-container'))
                if (signButtonElement) {
                    signButtonElement.click();
                    await delay(3000);
                    result = true;
                }

                closeButtonElement.click();
                await delay(500);
                return result;
            };

            for (const course in LESSONS_CONVERTED) {
                for (const ticketType of Object.values(TYPES)) {
                    for (const parallel of LESSONS_CONVERTED[course][ticketType] ?? []) {
                        const ticket = getTicket(course, parallel);
                        await delay(1000);
                        if (!ticket) {
                            logStash.push(`${course.toUpperCase()}: Ticket "${parallel}" was not found, maybe there was misspell`);
                            continue;
                        }
                        if (ticket.isSelected)
                            break;
                        if (ticket.freeSlots > 0 && await selectTicket(ticket.element)) {
                            logStash.push(`${course}: Parallel "${parallel}" was successfully signed`);
                            break;
                        } else {
                            betterAvailable = true;
                        }
                    }
                }
            }

            return [logStash, betterAvailable];
        }, LESSONS_PARSED, PARALLEL_TYPES)

        for (const message of logStash)
            console.log(message);

        if (!betterAvailable) return;
    };

}