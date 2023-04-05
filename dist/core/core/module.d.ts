import { ModuleSchema } from "./module.schema";
export declare class Module {
    name: any;
    yin: any;
    Object: any;
    api: any;
    schema: ModuleSchema;
    private list;
    private childrenList;
    constructor(yin: any, controller: any);
    init(): void;
    regModel(modelId: any): Promise<void>;
    assign(el: any): Promise<any>;
    u(u: any): any;
    refresh(id: any): any;
    get(id: string, user?: any): Promise<any>;
    getWaiter(id: any): Promise<any>;
    getFromController(id: string): Promise<any>;
    children(place: string, user?: any): Promise<any>;
    childrenWaiter(place: any): Promise<any>;
    childrenUpdate(place: any, id: any, type: any): Promise<any>;
    create(object: any, user?: any): Promise<any>;
    save(object: any, option?: any, user?: any): Promise<any>;
    delete(o: any, user: any): Promise<{
        status: string;
        message: string;
        query: any;
    }>;
    objectUpdate(id: any, data?: {
        changeId: any;
        type: string;
    }, timer?: any): any;
    objectDelete(id: any): any;
    afterDelete(id: any): void;
    upload(file: any, id: any, place: any, key: any, progress?: any, user?: any): Promise<any>;
    uploadDirectory(file: any, id: any, place?: string, key?: string, progress?: any, user?: any): Promise<any>;
    pushChildren(el: any, placeString: any, user?: any): Promise<any>;
    removeChildren(el: any, placeString: any, user?: any): Promise<any>;
    find(filter?: object, sort?: object, limit?: number, skip?: number, user?: any): Promise<any>;
    runFunction(placeString: any, req: object, user?: any): Promise<any>;
}
