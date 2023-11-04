import {io} from "socket.io-client";
import {Yin} from "../core/yin.js";
import {yinRequest} from "../lib/yin.request.js";
import {lockProperty} from "../lib/yin.defineProperty.js";
import {yinConsole} from "../lib/yin.console.js";
import {Schema, yinObject} from "../core/object.js";
import {ControllerClient} from "./controller.client.js";
import {Module} from "../core/module.js";
import {Place} from "../core/place.js";
import {yinStatus} from "../lib/yin.status.js";
import {cabUrl} from "../core/cab.js";
import {ModelModule} from "../modules/model.module.js";
import {UserModule} from "../modules/user.module.js";
import {SystemModule} from "../modules/system.module.js";
import {ElementModule} from "../modules/element.module.js";
import {FileModule} from "../modules/file.module.js";
import {FileControllerClient} from "./file.controller.client.js";
import {UserControllerClient} from "./user.controller.client.js";

// TODO 下一版不再集成module，全部由服务器下载


export class YinClient extends Yin {
    me = {_token: ''}
    system = {}
    req = new yinRequest(this)
    socket
    url
    localStorage = {}
    client = true

    get isYin() {
        return this.url === cabUrl
    }

    get objectUrl() {
        return this.url + '/yin.object/'
    }

    get ioUrl() {
        return this.url + '/yin.io/'
    }

    constructor(url) {
        super()
        lockProperty(this, 'client', true)
        try {
            window
            this.url = url || location.origin
        }
        catch (e) {
            this.url = url
        }
        this.regModule(ModelModule, ControllerClient)
        this.regModule(UserModule, UserControllerClient)
        this.regModule(SystemModule, ControllerClient)
        this.regModule(ElementModule, ControllerClient)
        this.regModule(FileModule, FileControllerClient)
    }


    async start() {
        if (this.initialized) return
        await this.initNodeId()
        console.log(...yinConsole.log('开始启动', this.nodeId))
        await this.initLocalStorage()
        this.regUrl()
        await this.config()
        await this.regShadowModules()
        await super.start()
        await this.auth()
        this.initialized = true
        console.log(...yinConsole.success('引.Object 启动成功', this.url))
        await this.runEventFn('start', '引.Object 启动成功')
    }


    async initNodeId() {
        try {
            window
            this.nodeId = crypto.randomUUID ? crypto.randomUUID() : crypto.getRandomValues(new Uint32Array(4)).toString().replaceAll(',', '-')
        }
        catch (e) {
            const crypto = await import('crypto')
            this.nodeId = crypto.randomUUID()
        }
    }

    async initLocalStorage() {
        try {
            window
            this.localStorage = localStorage
        }
        catch (e) {
            this.yinModulePath = process.cwd()
            this._localStorage = {}
            const {join} = await import('path/posix'),
                {existsSync, readFileSync, writeFileSync} = await import( "fs");
            this.localStoragePath = join(this.yinModulePath, 'yinLocalStorage.json')
            if (existsSync(this.localStoragePath)) {
                try {
                    this._localStorage = JSON.parse(readFileSync(this.localStoragePath, 'utf-8'))
                }
                catch (e) {
                    this._localStorage = {}
                }
            }
            else {
                writeFileSync(this.localStoragePath, '{}')
                this._localStorage = {}
            }

            this.localStorage.setItem = (key, value) => {
                this._localStorage[key] = value
                writeFileSync(this.localStoragePath, JSON.stringify(this._localStorage))
            }
            this.localStorage.getItem = key => {
                return this._localStorage[key]
            }
            this.localStorage.removeItem = key => {
                delete this._localStorage[key]
                writeFileSync(this.localStoragePath, JSON.stringify(this._localStorage))
            }
            this.localStorage.clear = () => {
                this._localStorage = {}
                writeFileSync(this.localStoragePath, '{}')
            }
        }
    }


    async regShadowModules() {
        for (let module of this.system.modules) {
            if (!this[module]) await this.regShadowModule(module)
        }
    }

    async regShadowModule(name) {
        const moduleConfig = await this.req.get(name),
            shadowObject = new Function('yinObject', 'Schema',
                `return class ${name} extends yinObject {static schema = Schema.create(${JSON.stringify(moduleConfig.schema)})}`)(yinObject, Schema),
            shadowModule = new Function('Module', 'shadowObject',
                `return class ${name}Module extends Module {name = '${name}';title = '${moduleConfig.title}';Object = shadowObject}`)(Module, shadowObject)
        this.regModule(shadowModule, ControllerClient)
    }

    regUrl(url) {
        if (url) this.url = url
        this.me._token = this.localStorage.getItem(this.url);
        this.makeSocket()
    }

    async config() {
        this.system = {}
        Object.assign(this.system, await this.req.get())
    }

    async auth() {
        try {
            if (this.me._token) {
                this.me = await this.User.auth()
                console.log(...yinConsole.success('#' + this.me._id, '授权成功', this.me._title))
            }
        }
        catch (e) {
            console.log(...yinConsole.warn('授权失败', e))
            delete this.me._token
            this.localStorage.removeItem(this.url)
        }
    }

    async unAuth() {
        delete this.me._token
        this.localStorage.removeItem(this.url)
    }

    makeSocket() {
        const u = new URL(this.url), urlMark = `${u.protocol === 'https:' ? 'wss' : 'ws'}://${u.host}/yin.io`
        this.socket = io(this.url, {path: '/yin.io', auth: {token: this.me._token}})
        this.socket.on('connect', r => console.log(...yinConsole.success('热更新连接成功', urlMark)))
        this.socket.on('connect_error', err => console.log(...yinConsole.error('热更新连接出错', err)))
        this.socket.on("disconnect", (reason) => {
            console.log(...yinConsole.error("连接已断开:", urlMark, reason))
            this.runEventFn("disconnect", "连接已断开");
            console.log(...yinConsole.log("连接重启中:正在尝试重新连接服务器", urlMark))
        });

        this.socket.on("event", data => {
            const place = new Place(data.place), {at, args, event} = data
            if (place.key) {
                // console.log(place.valueOf(), event)
                const children = this[place.module].childrenList[place]
                if (children)
                    if (/^children/.test(event))
                        children.runEventFn(event.replace('children', '').toLowerCase(), ...args, at)
                    else
                        children.childrenRefresh(args[0], event)
            }
            else {
                const object = this[place.module].list[place.id]
                if (object && object[event])
                    object[event](...args, at)
            }
        })

        this.socket.on('pull', data => {
            // console.log(data)
            const place = new Place(data.place),
                {value, nodeId} = data,
                el = this[place.module]?.list[place.id]
            if (el && el[place.key] !== value && nodeId !== this.nodeId) {
                // console.log('pull!!!', nodeId, this.nodeId, nodeId !== this.nodeId)
                el._hold = place.key
                el[place.key] = value
                el._changed = true
                el._hold = undefined
            }
        })


        this.socket.on('ServerEvent', data => {
            this.runEventFn(data.event, ...data.args)
        })

        this.socket.io.on("reconnect", async () => {
            console.log(...yinConsole.warn("连接重启中:服务器已连接"))
            try {
                await this.User.auth();
                console.log(...yinConsole.warn("连接重启中:数据更新正在恢复"))
                for (let module of this.modules) {
                    module.api.hotReloadRestart();
                }
                console.log(...yinConsole.success("连接已重启", urlMark))
                await this.runEventFn("reconnect", "连接已重启");
            }
            catch (e) {
                console.log(e)
                // location.reload();
            }
        });
    }

    readScript(place) {
        if (this.system.scriptsFile[place])
            return this.req.get(`scripts/${place}`)
        return yinStatus.NOT_FOUND('未加载该脚本')
    }

    createScript(place, script) {
        return this.req.post(`scripts/${place}`, script)
    }

    updateScript(place, script) {
        return this.req.patch(`scripts/${place}`, script)
    }
}

export const yinCab = new YinClient(cabUrl)
