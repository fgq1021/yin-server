// import * as vue from 'vue'
import {yinStatus} from "../lib/yin.status.js";
import {yinConsole} from "../lib/yin.console.js";
import {Place} from "./place.js";
import {hideProperty} from "../lib/yin.defineProperty.js";
import {Type, Types} from "./type.js";

export const yinRoot = 'User.2902ac2f0000000000000000'

/**
 * TODO
 * yinCore 和 module 都变成yinObject
 * model 变成 class
 * 用户自己直接创建 class extends YinObject
 */

/**
 * TODO 让 yinCore 继承 Module
 * export class YinCore extends Module {}
 */
export class Yin {
    me
    nodeId = Math.random()
    Types = Types
    modules = []
    System
    User
    Model
    Element
    // 文件形式的模型
    scripts = {}
    reactive
    // vue
    structureType = ['Object', 'Array']
    initialized
    __v_skip = true

    constructor() {
        console.log(...yinConsole.log('开始引导'))
        hideProperty(this, '__v_skip')
        hideProperty(this, 'reactive')
    }

    start() {
        for (let module of this.modules)
            module.init()
    }

    regModule(module, controller) {
        const Module = new module(this, controller)
        this[Module.name] = Module
        this.Types[Module.name] = new Type(Module.title, '', 'ObjectId')
        this.modules.push(this[Module.name])
        this.structureType.push(Module.name)
        return this
    }

    regScripts(script) {
        const ids = script._id
        delete script._id
        if (ids)
            for (let id of ids) {
                this.scripts[id] = script;
                const p = Place.create(id)
                if (p.module === 'Model')
                    this.modules.map(module => module.regScripts(p))
                else
                    this[p.module].regScripts(p)
            }
        return this
    }

    regReactive(reactive) {
        this.reactive = reactive
        return this
    }

    genSecret(passwordLength = 16) {
        const chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let password = "";
        for (let i = 0; i <= passwordLength; i++) {
            const randomNumber = Math.floor(Math.random() * chars.length);
            password += chars.substring(randomNumber, randomNumber + 1);
        }
        return password;
    }

    async get(place, user) {
        if (place) {
            place = Place.create(place)
            if (place.module)
                return this[place.module].get(place.id, user)
            else
                return yinStatus.NOT_FOUND('错误的place', place)
        }
        return yinStatus.NOT_FOUND('#id 为空')
    }

    getFromCache(place) {
        if (place) {
            if (place.module)
                return this[place.module].list[place.id]
            else
                return yinStatus.NOT_FOUND('错误的place', place)
        }
        return yinStatus.NOT_FOUND('#id 为空')
    }

    // 系统事件
    _eventFn = {};

    on(event, fn) {
        if (!this._eventFn[event])
            this._eventFn[event] = [];
        this._eventFn[event].push(fn)
        return this
    }

    removeEvent(event) {
        const i = this._eventFn[event].indexOf(event)
        this._eventFn[event].splice(i, 1)
        return this
    }

    async runEventFn(event, msg) {
        const list = this._eventFn[event];
        if (list)
            for (let i in list) {
                await list[i](msg)
            }
        return true;
    }
}
