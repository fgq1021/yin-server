import { ControllerServer } from "./controller.server";
export declare class UserControllerServer extends ControllerServer {
    name: string;
    get(id: any): Promise<any>;
    create(el: any, user?: any): Promise<any>;
    userParse(user: any): any;
    auth(id: any): Promise<any>;
    authPassword(tel: string, password: string): Promise<any>;
    findByTel(tel: any): Promise<object>;
    saveParse(object: any, user: any): Promise<any>;
}
