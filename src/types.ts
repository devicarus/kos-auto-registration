import { ElementHandle } from "puppeteer";

type Ticket = {
    element: ElementHandle<Element>,
    parallel: string,
    course: string,
    type: ParallelType,
    isSelected: boolean,
    freeSlots: number,
}

enum ParallelTypeEnum {
    LECTURE = 'P',
    SEMINAR = 'C',
    LABORATORY = 'L',
}

type ParallelType = keyof typeof ParallelTypeEnum;

type PackageJson = {
    repository: {
        url: string;
        type: string;
    };
    version: string;
}

export { 
    Ticket, 
    ParallelType, ParallelTypeEnum, 
    PackageJson
};