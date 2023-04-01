import { Yin, YinObject } from "yin-core";
export declare class YinServer extends Yin {
    me: YinObject;
    socket: any;
    rootPath: string;
    configPath: string;
    system: {
        $id: string;
        $children: {};
        secret: string;
        mongo: string;
    };
    constructor(config?: string | object);
    margeConfig(config?: string | object): void;
    start(): Promise<void>;
    connectMongo(url?: string): Promise<unknown>;
    initSys(): Promise<void>;
    initialization(): Promise<{
        $id: string;
        $children: {};
        secret: string;
        mongo: string;
    }>;
    writeSystemConfig(): Promise<void>;
    systemRepair(): Promise<boolean>;
    resetDatabase(): Promise<void>;
    backupDatabase(): Promise<{}>;
    restoreDatabase(info: any, collections: any, cover?: boolean): Promise<boolean>;
    regSocket(socket: any): this;
}
