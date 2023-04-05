import { Yin, YinObject } from "./core";
interface systemConfig extends YinObject {
    secret: string;
    db: string;
    root: () => Promise<YinObject>;
}
interface rootUser extends YinObject {
    $isRoot: true;
    systemConfig: YinObject;
}
export declare class YinServer extends Yin {
    me: rootUser;
    socket: any;
    rootPath: string;
    configPath: string;
    system: systemConfig;
    constructor(config?: string | object);
    margeConfig(config?: string | object): void;
    start(): Promise<void>;
    connectMongo(url?: string): Promise<unknown>;
    initSys(): Promise<void>;
    initialization(): Promise<systemConfig>;
    writeSystemConfig(): Promise<void>;
    systemRepair(): Promise<boolean>;
    resetDatabase(): Promise<void>;
    backupDatabase(): Promise<{}>;
    restoreDatabase(info: any, collections: any, cover?: boolean): Promise<boolean>;
    writeSystemModelToRoot(): Promise<void>;
    regSocket(socket: any): this;
}
export {};
