import * as vue from 'vue';
export declare const yinRoot = "User.2902ac2f0000000000000000";
export declare class Yin {
    me: any;
    modules: any[];
    System: any;
    User: any;
    Model: any;
    Element: any;
    models: {};
    vue: typeof vue;
    structureType: string[];
    constructor(...modules: any[]);
    regModule(module: any, controller: any): this;
    regModel(model: any): Promise<this>;
    regVue(v: any): this;
    genSecret(passwordLength?: number): string;
    get(place: any, user?: any): Promise<any>;
    private eventFn;
    on(event: any, fn: any): this;
    removeEvent(event: any): this;
    runEventFn(event: any, msg: any): Promise<boolean>;
}
