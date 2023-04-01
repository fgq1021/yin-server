import { ControllerServer } from "./controller.server";
export declare class SystemControllerServer extends ControllerServer {
    name: string;
    create(object: any, user?: any): Promise<any>;
}
