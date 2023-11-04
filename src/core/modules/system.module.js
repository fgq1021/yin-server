import {Module} from "../core/module.js";
import {yinObject} from "../core/object.js";
import {yinStatus} from "../lib/yin.status.js";
import {yinConsole} from "../lib/yin.console.js";

export class SystemObject extends yinObject {

    /**
     * 系统对象仅由根用户读取
     * @param user
     * @return {Promise<*|boolean>}
     * @private
     */
    async _readable(user) {
        if (user === this._yin.me)
            return true
        return yinStatus.UNAUTHORIZED(`用户User #${user && user._id} 没有读取 ${this._name} #${this._id} 的权限`)
    }

    /**
     * 系统对象仅由根用户管理
     * @param user
     * @return {Promise<*|boolean>}
     * @private
     */
    async _manageable(user = this._yin.me) {
        if (user === this._yin.me)
            return true
        return yinStatus.UNAUTHORIZED(`用户User #${user._id} 没有管理 ${this._name} #${this._id} 的权限`)
    }
}


export class SystemModule extends Module {
    name = 'System'
    title = '系统'
    Object = class System extends SystemObject {
    }

    clearCache() {
        // console.log(...yinConsole.warn(`#${this.name}`, '不参与内存回收'))
    }
}
