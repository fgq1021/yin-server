import { Module } from "../core/module";
import { Key } from "../core/key";
import { Place } from "../core/place";
export declare class ModelModule extends Module {
    name: string;
    Place: typeof Place;
    Types: {
        String: import("../core/key").Type;
        Number: import("../core/key").Type;
        NumberRange: import("../core/key").Type;
        Boolean: import("../core/key").Type;
        Function: import("../core/key").Type;
        Date: import("../core/key").Type;
        Object: import("../core/key").Type;
        Array: import("../core/key").Type;
        Module: import("../core/key").Type;
        Model: import("../core/key").Type;
        User: import("../core/key").Type;
        Place: import("../core/key").Type;
        Image: import("../core/key").Type;
        Video: import("../core/key").Type;
        Audio: import("../core/key").Type;
        RichText: import("../core/key").Type;
        Color: import("../core/key").Type;
        File: import("../core/key").Type;
        Directory: import("../core/key").Type;
    };
    Key: typeof Key;
    constructor(yin: any, controller: any);
}
