export declare class ModuleSchema {
    schema: {
        $title: StringConstructor;
        $owner: {
            type: string;
            ref: string;
        };
        $accessControl: StringConstructor[];
        $parents: StringConstructor[];
        $children: {};
        $model: {
            type: string;
            ref: string;
        };
        $data: {};
        $schema: any[];
        $hide: {
            type: BooleanConstructor;
            default: boolean;
        };
    };
    constructor(schema?: {});
    toObjectSchema(s?: any): {};
    toModelSchema(ObjectId: any): {};
}
