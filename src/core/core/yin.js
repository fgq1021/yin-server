// import * as vue from 'vue'
import {yinError, yinStatus} from "../lib/yin.status.js";
import {yinConsole} from "../lib/yin.console.js";
import {Place} from "./place.js";
import {hideProperty} from "../lib/yin.defineProperty.js";
import {Types} from "./type.js";
//
// console.log(randomUUID)

export const yinRoot = 'User.2902ac2f0000000000000000'

/**
 * TODO
 * yinCore 和 module 都变成yinObject
 * model 变成 class
 * 用户自己直接创建 class extends YinObject
 *
 * 每个module都需要单独传入mongodbUri或者yin.Object地址
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
    instance
    instances = {
        /**
         * 赋予完整地址，不同app可能在不同服务器上
         * id:'http://yin.cab:2130'
         */

    }
    /**
     * 配合客户端框架热更新
     * 目前适配的是vue
     */
    reactive
    structureType = ['Object', 'Array']
    initialized

    constructor() {
        hideProperty(this, '__v_skip')
        hideProperty(this, 'reactive')
    }

    async start() {
        for (let module of this.modules)
            await module.init()
    }

    regModule(module, controller) {
        const Module = new module(this, controller)
        this[Module.name] = Module
        this.modules.push(Module)
        Module.regStructureType()
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
                this.runEventFn('regScript', id)
            }
        return this
    }

    regReactive(reactive) {
        this.reactive = reactive
        return this
    }


    // genSecret(passwordLength = 16) {
    //     const chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    //     let password = "";
    //     for (let i = 0; i <= passwordLength; i++) {
    //         const randomNumber = Math.floor(Math.random() * chars.length);
    //         password += chars.substring(randomNumber, randomNumber + 1);
    //     }
    //     return password;
    // }

    async get(place, user) {
        if (place) {
            place = Place.create(place)
            if (place.module && this[place.module])
                return this[place.module].get(place.id, user)
            else
                return yinStatus.NOT_FOUND('错误的place', place)
        }
        return yinStatus.NOT_FOUND('#id 为空')
    }

    getFromCache(place) {
        if (place) {
            place = Place.create(place)
            if (place.module)
                return this[place.module].list[place.id]
            else
                return yinStatus.NOT_FOUND('错误的place', place)
        }
        return yinStatus.NOT_FOUND('#id 为空')
    }


    async saveAll(progress) {
        const list = this.cacheList, all = list.length, err = [], saved = []
        for (let i in list) {
            const object = list[i]
            if (progress)
                progress(i, all, object._changed, object)
            if (object._changed) {
                try {
                    await object._save()
                    saved.push(object)
                }
                catch (e) {
                    err.push(e)
                }
            }
        }
        if (err.length)
            return yinStatus.NOT_MODIFIED({saved, err})
        return saved
    }

    get cacheList() {
        const all = []
        for (let module of this.modules) {
            for (let p in module.list) {
                all.push(module.list[p])
            }
        }
        return all
    }


    async objectEvent(object, event, ...args) {
        // console.assert(false, object._titlePlace, event, ...args)
        // console.log(object._titlePlace, event, ...args)
        if (args[0] instanceof yinError || args[0] instanceof Error) {
            console.log(...yinConsole.error(`#${object._place}`, `${object._title}._${event}() 运行出错\n`, ...args));
        }
        await this.runEventFn('ObjectEvents', event, object, ...args)
    }

    // childrenEvent(children, event, ...args) {}


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

    async runEventFn(event, ...args) {
        const list = this._eventFn[event];
        if (list)
            for (let i in list) {
                try {
                    await list[i](...args)
                }
                catch (e) {
                    console.log(...yinConsole.error(`yin.on('${event}') 运行出错`, e));
                }
            }
        return true;
    }
}
