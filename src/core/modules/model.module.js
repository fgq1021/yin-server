import {Module} from "../core/module.js";
import {yinObject} from "../core/object.js";
import {Key} from "../core/key.js";
import {Types} from "../core/type.js";

export class ModelObject extends yinObject {
    async _readable(user) {
        return true
    }

    async _createChild(req = {}, key, user) {
        req._name ??= this._name
        return super._createChild(req, key, user)
    }
}


export class ModelModule extends Module {
    name = 'Model'
    title = '模型'
    Object = class Model extends ModelObject {
    }
    //TODO 把Type写成单独的模块，并且用SSR生成表单，以此动态添加类型输入
    Types = Types
    Key = Key
}




