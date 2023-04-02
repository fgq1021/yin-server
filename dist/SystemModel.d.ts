export declare const SystemModel: ({
    _id: string;
    title: string;
    accessControl: any[];
    parents: any[];
    _schema: {
        title: string;
        name: string;
        keyType: string;
        note: string;
    }[];
    hide: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    model: any;
    children?: undefined;
    data?: undefined;
} | {
    _id: string;
    title: string;
    accessControl: any[];
    parents: string[];
    _schema: ({
        title: string;
        name: string;
        keyType: string;
        note: string;
        settings: {
            module: string;
        };
    } | {
        title: string;
        name: string;
        keyType: string;
        note: string;
        settings?: undefined;
    })[];
    hide: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    children: {
        elements: string;
        users: string;
        models: string;
        system: string;
        systemConfig: string;
        aliyun?: undefined;
        OSS?: undefined;
        SMS?: undefined;
        root?: undefined;
        network?: undefined;
        safety?: undefined;
        fileSystem?: undefined;
        cloud?: undefined;
    };
    data: {
        systemConfig: string;
        models: string;
        port?: undefined;
        cert?: undefined;
        root?: undefined;
        network?: undefined;
        safety?: undefined;
        fileSystem?: undefined;
        cloud?: undefined;
        db?: undefined;
    };
    model: any;
} | {
    _id: string;
    title: string;
    accessControl: any[];
    parents: any[];
    _schema: {
        title: string;
        name: string;
        keyType: string;
        note: string;
    }[];
    hide: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    data: {
        port: number;
        cert: string;
        systemConfig?: undefined;
        models?: undefined;
        root?: undefined;
        network?: undefined;
        safety?: undefined;
        fileSystem?: undefined;
        cloud?: undefined;
        db?: undefined;
    };
    model: any;
    children?: undefined;
} | {
    _id: string;
    title: string;
    accessControl: any[];
    parents: any[];
    _schema: {
        title: string;
        name: string;
        keyType: string;
        note: string;
    }[];
    hide: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    children: {
        aliyun: string;
        elements?: undefined;
        users?: undefined;
        models?: undefined;
        system?: undefined;
        systemConfig?: undefined;
        OSS?: undefined;
        SMS?: undefined;
        root?: undefined;
        network?: undefined;
        safety?: undefined;
        fileSystem?: undefined;
        cloud?: undefined;
    };
    model: any;
    data?: undefined;
} | {
    _id: string;
    title: string;
    accessControl: any[];
    parents: any[];
    _schema: {
        title: string;
        name: string;
        keyType: string;
        note: string;
    }[];
    hide: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    children: {
        OSS: string;
        SMS: string;
        elements?: undefined;
        users?: undefined;
        models?: undefined;
        system?: undefined;
        systemConfig?: undefined;
        aliyun?: undefined;
        root?: undefined;
        network?: undefined;
        safety?: undefined;
        fileSystem?: undefined;
        cloud?: undefined;
    };
    model: any;
    data?: undefined;
} | {
    _id: string;
    title: string;
    accessControl: any[];
    parents: any[];
    _schema: ({
        title: string;
        name: string;
        keyType: string;
        note: string;
        settings?: undefined;
    } | {
        title: string;
        name: string;
        keyType: string;
        note: string;
        settings: {
            module: string;
        };
    })[];
    hide: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    children: {
        root: string;
        network: string;
        safety: string;
        fileSystem: string;
        cloud: string;
        elements?: undefined;
        users?: undefined;
        models?: undefined;
        system?: undefined;
        systemConfig?: undefined;
        aliyun?: undefined;
        OSS?: undefined;
        SMS?: undefined;
    };
    data: {
        root: string;
        network: string;
        safety: string;
        fileSystem: string;
        cloud: string;
        db: string;
        systemConfig?: undefined;
        models?: undefined;
        port?: undefined;
        cert?: undefined;
    };
    model: any;
} | {
    _id: string;
    title: string;
    accessControl: any[];
    parents: any[];
    _schema: any[];
    hide: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    model?: undefined;
    children?: undefined;
    data?: undefined;
})[];
