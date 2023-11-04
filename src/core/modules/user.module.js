import {Module} from "../core/module.js";
import {Schema, yinObject} from "../core/object.js";

export class UserObject extends yinObject {
    static getter = {
        ...super.getter,
        _owner(object) {
            return object._owner || object._id
        }
    }

    static schema = Schema.create([
        {name: 'tel', title: '手机号', index: true, private: true, type: 'Number'},
        {name: 'token', title: '登录令牌', type: 'String', private: true},
        {name: 'passwordHash', title: '密码哈希值', type: 'String', private: true},
        {name: 'passwordUpdateTime', title: '密码更新时间', type: 'Date', private: true},
        {name: 'objectUpdateTime', title: '更新时间', type: 'Date'},
        ...super.schema])

    _manage(user) {
        return this._module.children(this._place.toKey('_manage'), user)
    }

    _read(user) {
        return this._module.children(this._place.toKey('_read'), user)
    }

    async _readable(user) {
        if (this === this._yin.me)
            return this._accessCheck(user, '_read', '读取')
        return true
    }

    async _manageable(user) {
        if (!user) user = this._module.yin.me
        if (user?._id === this._id) return true
        return super._manageable(user);
    }
}


export class UserModule extends Module {
    name = 'User'
    title = '用户'
    Object = class User extends UserObject {
    }

    // constructor(yin, controller) {
    //     super(yin, controller);
    // }

    initRoot(object) {
        return this.api.initRoot(object)
    }

    async register(tel, password) {
        const user = await this.api.register(tel, password)
        return this.assign(user)
    }

    async authPassword(tel, password) {
        const user = await this.api.authPassword(tel, password);
        return this.assign(user)
    }

    async auth(id) {
        const user = await this.api.auth(id)
        return this.assign(user)
    }

    async authBy(name, body) {

    }
}






