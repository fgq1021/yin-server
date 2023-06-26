import {Module} from "../core/module.js";
import {yinObject} from "../core/object.js";

export class ElementModule extends Module {
    name = 'Element'
    title = '元素'
    Object = class Element extends yinObject {
    }
}




