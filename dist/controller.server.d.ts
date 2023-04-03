export declare class ControllerServer {
    name: any;
    api: any;
    module: any;
    yin: any;
    private updateTimer;
    constructor(yin: any, module: any);
    init(): void;
    makeModel(): void;
    mto(model: any | [any]): any;
    otm(object: any): any;
    get(id: string): Promise<object>;
    findOne(filter: object): Promise<object>;
    matchReg(array: any): any;
    find(filter?: object, sort?: object, limit?: number, skip?: number): Promise<any>;
    create(object: any, user: any): Promise<any>;
    saveParse(object: any, user: any): Promise<any>;
    pushParents(oPlace: any, list: any, user: any): Promise<void>;
    save(o: any, option: any, user?: any): Promise<any>;
    deleteOne(filter: any): any;
    delete(id: any): any;
    objectUpdate(id: any, data?: {
        changeId: any;
        type: string;
    }, timer?: any): void;
}
