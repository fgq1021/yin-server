import {Module} from "../core/module.js";
import {yinObject} from "../core/object.js";
import {yinStatus} from "../lib/yin.status.js";

export class SystemObject extends yinObject {

    async _readable(user) {
        return this._manageable(user)
    }

    async _manageable(user) {
        if (!user)
            user = this._module.yin.me
        if (user._isRoot && user === this._module.yin.me)
            return true
        if (!user._id)
            return yinStatus.UNAUTHORIZED(`用户User #匿名 没有管理 ${this._name} #${this._id} 的权限`)
        if (this._module.yin.me?._isRoot && (user._id === this._module.yin.me._id))
            return true
        return yinStatus.UNAUTHORIZED(`用户User #${user._id} 没有管理 ${this._name} #${this._id} 的权限`)
    }
}


export class SystemModule extends Module {
    name = 'System'
    title = '系统'
    Object = class System extends SystemObject {
    }
}
