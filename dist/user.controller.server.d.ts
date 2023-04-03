import { ControllerServer } from "./controller.server";
export declare class UserControllerServer extends ControllerServer {
    name: string;
    get(id: any): Promise<any>;
    saveParse(object: any, user?: any): Promise<any>;
    createRoot(object: any): Promise<any>;
    create(object: any, user?: any): Promise<any>;
    save(o: any, option: any, user?: any): Promise<any>;
    userParse(user: any): any;
    auth(id: any): Promise<any>;
    authPassword(tel: string, password: string): Promise<any>;
    findByTel(tel: any): Promise<object>;
}
