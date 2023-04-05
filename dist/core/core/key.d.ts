export declare class Key {
    title: string;
    name: string;
    keyType: string;
    note: string;
    settings: {};
    constructor(key: string | object, type?: string, title?: string, note?: any, settings?: any);
    get type(): string;
    set type(t: string);
}
export declare class Type {
    title: string;
    name: string;
    note: string;
    settings: any[];
    constructor(name: any, title: any, note?: any, settings?: any);
}
export declare const Types: {
    String: Type;
    Number: Type;
    NumberRange: Type;
    Boolean: Type;
    Function: Type;
    Date: Type;
    Object: Type;
    Array: Type;
    Module: Type;
    Model: Type;
    User: Type;
    Place: Type;
    Image: Type;
    Video: Type;
    Audio: Type;
    RichText: Type;
    Color: Type;
    File: Type;
    Directory: Type;
};
