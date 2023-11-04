import {
    basicEventSchema,
    basicFunctionSchema,
    ElementModule,
    FileModule,
    ModelModule,
    SystemModule,
    UserModule,
    Yin,
    yinConsole,
    yinObject,
    yinStatus
} from "./core/index.js";
import {UserControllerServer} from "./user.controller.server.js";
import {SystemControllerServer} from "./system.controller.server.js";
import {ModelControllerServer} from "./model.controller.server.js";
import {FileControllerServer} from "./file.controller.server.js";
import {existsSync, readFileSync} from "fs";
import fs from "fs/promises";
import {unwatchFile, watchFile} from 'node:fs'
import {basename, join} from "path/posix";
import {sep} from "path";
import {fileURLToPath, pathToFileURL} from 'url'
import {connect, disconnect} from "mongoose";
import {ControllerServer} from "./controller.server.js";
import {yinHttpServer} from "./lib/yin.httpServer.js";
import crypto from 'crypto'

export class YinServer extends Yin {
    nodeId = crypto.randomUUID()
    /**
     * 给me添加_name是为了在初始化时修改system后保存时_save(user)可以识别为user而不是option
     */
    me = {_isRoot: true}
    scriptsFile = {}
    yinModulePath = join(fileURLToPath(import.meta.url).replace(new RegExp('\\' + sep, 'g'), '/'), '../../')

    socket
    rootPath = '/'
    configPath = '/yin.config.json'
    system = {
        _id: '', _map: {}, db: 'mongodb://127.0.0.1:27017/引'
    }

    apps = {}

    httpServer
    serverController


    constructor(config) {
        super()
        console.log(...yinConsole.log('开始引导', this.nodeId))
        this.margeConfig(config)
        this.regModule(ModelModule, ModelControllerServer)
        this.regModule(UserModule, UserControllerServer)
        this.regModule(SystemModule, SystemControllerServer)
        this.regModule(ElementModule, ControllerServer)
        this.regModule(FileModule, FileControllerServer)
        console.log(...yinConsole.success('基础模块装载完成'))
    }

    margeConfig(config) {
        console.log(...yinConsole.log('读取配置'))
        if (config instanceof Object) {
            console.log(...yinConsole.log('读取传入的配置对象', config))
            Object.assign(this.system, config)
        }
        else {
            this.rootPath = (config || process.env['YIN_PATH']).replace(new RegExp('\\' + sep, 'g'), '/')
            console.log(...yinConsole.log('读取配置文件于目录', pathToFileURL(this.rootPath).toString()))
            this.configPath = join(this.rootPath, 'yin.config.json')
            if (existsSync(this.configPath)) Object.assign(this.system, JSON.parse(readFileSync(this.configPath, 'utf-8')))
            // else {
            //     console.log(...yinConsole.log('创建配置文件于', this.configPath))
            // }
        }
    }


    async start() {
        await super.start()
        try {
            await this.connectMongo()
            await this.importScriptsFromDir(join(this.yinModulePath, 'src', 'scripts'))
            await this.importScriptsFromDir()
            // 启动时直接清空数据库，便于调试
            // await this.systemRepair()

            await this.initSys()
            this.initialized = true

            // 在启动完成之前把模型文件写入硬盘
            await this.writeSystemModelToRoot()

            console.log(...yinConsole.success('引.Object 启动成功', '#' + this.system._id))
            await this.runEventFn('start', 'YinOS启动成功')
            // console.log(...yinConsole.success('启动成功于 System', '#' + this.system._id, 'User', '#' + this.me._id))
            console.log(...yinConsole.success('#' + this.system._id, this.system._titlePlace, `成功由 ${this.me._place} ${this.me._titlePlace} 启动`))
        }
        catch (e) {
            console.log(...yinConsole.error('启动失败'))
            throw e
        }
    }

    async connectMongo(url) {
        console.log(...yinConsole.log("数据库连接开始"));
        if (url) this.system.db = url
        const mongoUri = this.system.db
        try {
            console.log(...yinConsole.log(`数据库: ${mongoUri} 连接中`));
            await connect(mongoUri)
            console.log(...yinConsole.success(`数据库: ${mongoUri} 连接成功`));
            await this.runEventFn('mongoConnect', `数据库: ${mongoUri} 连接成功`)
        }
        catch (e) {
            console.log(...yinConsole.log(`数据库: ${mongoUri} 连接失败，尝试重新连接`, e));
            await disconnect()
            await this.runEventFn('mongoDisconnect', `数据库: ${mongoUri} 断开`)
            return new Promise((resolve) => {
                setTimeout(async () => {
                    await this.connectMongo(url)
                    resolve(true)
                }, 2000)
            })
        }
        return true
    }

    async initSys() {
        console.log(...yinConsole.log('开始载入系统', this.system))
        try {
            this.system = await this.System.get(this.system._id, this.me)
        }
        catch (e) {
            console.log(...yinConsole.warn("未找到配置 #", this.system._id || '空'));
            this.system = await this.initialization()
        }
        // for (let i in this.system._schema) {
        //     const k = this.system._schema[i]
        //     this[k.name] = this.system[k.name]
        // }
        // try {
        //     // @ts-ignore
        //     this.me = await this.system.root(this.me)
        //     this.me._isRoot = true
        // } catch (e) {
        //     console.log(...yinConsole.warn("初始化", "根用户尚未注册，请尽快完成初始化"));
        // }

        await this.initMe()
    }

    async initMe() {
        this.me = await this.system.root
        this.me._isRoot = true
        if (!this.me._tel) console.log(...yinConsole.warn("初始化", "根用户尚未注册，请尽快完成初始化"));
    }


    /**
     * TODO 目前仅支持引入单文件script，后续将支持包管理
     * @return {Promise<string>} script
     */
    async importScriptsFromDir(scriptsDir) {
        scriptsDir ??= join(this.rootPath, 'scripts')
        if (existsSync(scriptsDir)) {
            const scripts = await fs.readdir(scriptsDir)
            for (let s of scripts) {
                try {
                    await this.importScriptFromPath(join(scriptsDir, s))
                }
                catch (e) {
                }
            }
        }
    }

    async importScriptFromPath(scriptPath) {
        try {
            const scriptModule = await import(pathToFileURL(scriptPath) + '?t=' + Date.now()),
                script = scriptModule.default
            unwatchFile(scriptPath)
            watchFile(scriptPath, async curr => {
                if (curr.dev) try {
                    await this.importScriptFromPath(scriptPath)
                }
                catch (e) {
                }
            });
            if (script._id) for (let id of script._id) {
                this.scriptsFile[id] = scriptPath
            }
            this.regScripts(script)
            return true
        }
        catch (e) {
            console.log(...yinConsole.error(`${basename(scriptPath)} 引入时发生错误：\n`, e.stack, '\n 已跳过该文件的读取\n 文件位置：', pathToFileURL(scriptPath).toString()))
            return yinStatus.INTERNAL_SERVER_ERROR(e.stack)
        }
    }

    /**
     * todo 后续添加vscode.dev在线编辑器的支持
     * @param place {string}
     * @return {Promise<{code: number, query: *, message: string, status: string}|*|string>}
     */
    async readScript(place) {
        if (this.scriptsFile[place]) try {
            return await fs.readFile(this.scriptsFile[place], {encoding: 'utf8'})
        }
        catch (e) {
            return yinStatus.INTERNAL_SERVER_ERROR('无法读取该脚本', e)
        } else if (this.scripts[place]) return yinStatus.NO_CONTENT('只有在scripts中自动引入的脚本才能通过此方法读取')
        return yinStatus.NOT_FOUND('无此脚本')
    }

    createScript(place, script) {
        return this.updateScript(place, script || `export default {\n _id: ['${place}'],\n _setter: {},\n _getter: {}\n}`)
    }

    async updateScript(place, script) {
        if (!/export default.+\{[\s\S]+}/.test(script)) return yinStatus.NOT_ACCEPTABLE('脚本必须包含 export default')
        if (!/_id:.?\[..+.]/.test(script)) {
            script = script.replace(/export default.+\{/, `export default {\n _id: ['${place}'],`)
        }
        const object = await this.get(place), scriptsDir = join(this.rootPath, 'scripts'),
            scriptPath = this.scriptsFile[place] || join(scriptsDir, `${object._title || '脚本'}@${place}.js`)

        let note = `/**\n * ${object._title}:${object._name}\n *\n * @typedef {Object} ${object._title}\n`
        for (let key of object._schemaMix) {
            note += ` * @property {${key.type}} ${key.name}  ${key.title}`
            if (key.note) note += ` - ${key.note}`
            note += '\n'
        }

        for (let key of basicFunctionSchema) {
            note += ` * @property {${key.type}} ${key.name} ${key.title} - ${key.note}\n`
        }

        for (let key of basicEventSchema) {
            note += ` * @property {${key.type}} ${key.name} ${key.title} - ${key.note}\n`
        }

        note += ` *\n * @todo 脚本删除和重命名后需要重启服务,完成调试后最好也重启一下\n */\n`

        if (!/\/\*\*[\s\S]+\*\//.test(script)) script = note + script;
        else script = script.replace(/\/\*\*[\s\S]+\*\/\s*/, note)

        let oldScript
        try {
            oldScript = await this.readScript(place)
        }
        catch (e) {
        }
        await fs.mkdir(scriptsDir, {recursive: true});
        await fs.writeFile(scriptPath, script)
        try {
            await this.importScriptFromPath(scriptPath)
        }
        catch (e) {
            if (oldScript) await this.updateScript(place, oldScript)
            return Promise.reject(e)
        }
        // await this.runEventFn('updateScript', [place])
        return script
    }


    async initialization() {
        console.log(...yinConsole.log("初始化", '引.Object'));
        if (!this.configPath) {
            console.log(...yinConsole.warn("未监测到环境变量中的配置地址"));
            console.log(...yinConsole.warn("请将配置目录写入", "process.env['YIN_PATH']"));
            return Promise.reject()
        }

        await this.systemRepair();

        const systemModel = await this.importSystemModel()


        this.system = await this.System.create({
            _title: '新实例',
            _model: systemModel,
            _map: {
                systemModel: 'Model.' + systemModel
            },
            db: this.system.db
        }, this.me)

        await this.system.network

        await this.initMe()
        this.me.systemConfig = this.system
        await this.me._save(this.me)

        await this.writeSystemConfig()
        return this.system
    }

    async writeSystemConfig() {
        console.log(...yinConsole.warn("初始化", "写入配置于:", pathToFileURL(this.configPath).toString(), JSON.stringify(this.system)));
        await fs.writeFile(this.configPath, JSON.stringify(this.system));
    }

    async systemRepair() {
        console.log(...yinConsole.warn("开始系统修复"));
        // await this.User.api.deleteOne({tel: 12345678900});
        await this.resetDatabase()
        return true
    }

    async resetDatabase() {
        console.log(...yinConsole.warn("清空数据库"));
        for (let module of this.modules) {
            await module.api.api?.deleteMany({})
        }
    }

    async backupDatabase() {
        const backups = {}
        for (let module of this.modules) {
            backups[module.name] = await module.api.api.find({})
        }
        return backups
    }

    async restoreDatabase(info, collections, cover = true) {
        if (!this.rootPath) return Promise.reject()
        for (let cn in collections) {
            const collectionBackup = collections[cn], collection = this[cn].api.api
            if (cover) await collection.deleteMany({})
            await collection.insertMany(collectionBackup)
        }
        await fs.writeFile(this.configPath, JSON.stringify(info.config));
        return true
    }

    // async writeSystemModelToRoot() {
    //     const models = await this.Model.api.api.find({})
    //     const file = 'export const systemDefaultModel = ' + JSON.stringify(models.map(model => {
    //         const object = yinParse(model.toObject())
    //         /**
    //          * mongoose模型.toObject() 会把所有空的键值和对象删掉
    //          * 我们需要保留数组键值内 finder:{} 这种查全局的情况
    //          */
    //
    //         object._data = model._data
    //         delete object._owner
    //         return object
    //     }))
    //     await fs.writeFile(join(this.rootPath, 'system.default.model.js'), file);
    // }
    async importSystemModel() {
        const {systemDefaultModel} = await import('./lib/system.default.model.js')
        await this.Model.api.insertMany(systemDefaultModel)

        try {
            const {appDefaultModel} = await import(pathToFileURL(join(this.rootPath, 'app.default.model.js')))
            console.log(...yinConsole.log("加载私有模型库"));
            await this.Model.api.insertMany(appDefaultModel)
        }
        catch (e) {
        }

        console.log(...yinConsole.success("插入模型数据完成"));
        return systemDefaultModel[0]._id
    }

    async writeSystemModelToRoot() {
        console.log(...yinConsole.log("保存系统模型"));
        const systemModel = await this.system._model,
            idList = await systemModel._entire(),
            list = [], indexList = {}
        for (let p of idList) {
            const model = await this.get(p), sm = JSON.parse(JSON.stringify(model)), pureModel = {}
            delete sm._owner
            for (let key in sm) {
                if (/^_/.test(key))
                    pureModel[key] = sm[key]
                else {
                    if (model._schema[key])
                        pureModel[key] = sm[key]
                    // else
                    //     console.log('剔除未映射的键值', model._title, key, sm[key])
                }
                delete pureModel._createdAt
                delete pureModel._updatedAt
            }
            list.push(pureModel)
            indexList[pureModel._id] = pureModel
        }
        const {systemDefaultModel} = await import('./lib/system.default.model.js'),
            listString = JSON.stringify(list)
        if (JSON.stringify(systemDefaultModel) !== listString) {
            const defaultIndex = {}, listToSave = []
            for (let m of systemDefaultModel) defaultIndex[m._id] = m
            for (let m of list) {
                const dm = defaultIndex[m._id]
                if (dm && JSON.stringify(dm) === JSON.stringify(m)) {
                    // console.log('剔除已有模型', m._title)
                }
                else {
                    listToSave.push(m)
                }
            }
            const file = 'export const appDefaultModel = ' + JSON.stringify(listToSave),
                systemModelPath = join(this.rootPath, 'app.default.model.js')
            await fs.writeFile(systemModelPath, file);
            console.log(...yinConsole.success("系统模型保存完成", pathToFileURL(systemModelPath).toString()));
            // 同时创建完整的系统模型
            // await fs.writeFile(join(this.rootPath, 'system.default.model.js'), 'export const systemDefaultModel = ' + listString)
        }
        else {
            console.log(...yinConsole.log("没有全新的模型，系统模型无需保存"));
        }
    }

    // /**
    //  *
    //  * @param {Server} server Server - (http|https|http2).createServer() 创建的Server对象
    //  * @param {Object} options 服务器选项 - 默认读取system.network,也可自行配置
    //  * @param {String} options.prefix 前缀 - 引启动后网络接口的前缀
    //  * @param {Number} options.port 端口
    //  * @param {String} options.tokenSecret token密钥 - 网络身份认证的密钥
    //  * @param {Boolean} options.ssl  传输层安全协议SSL/TLS - 开启安全协议以启用超文本传输安全协议HTTPS
    //  * @param {String} options.cert  安全协议证书
    //  * @param {String} options.key  安全协议密钥
    //  */
    // async makeHttpServer(server, options) {
    //     const network = await this.system.network
    //     Object.assign(network, options)
    //     const {makeHttpServer} = await import('./lib/makeHttpServer.js')
    //     makeHttpServer(server, network, this)
    // }

    async listen() {
        const {yinHttpServer} = await import('./lib/yin.httpServer.js')
        this.httpServer = new yinHttpServer(this)
        await this.httpServer.listen()
    }

    /**
     *
     * @param socket
     * @return {YinServer}
     */
    regSocket(socket) {
        // 防止vue创建的proxy代理到socket内部，一旦reactive扩散到node内部的某些组件，会造成报错
        socket.__v_skip = true
        Object.defineProperty(this, 'socket', {value: socket})
        return this
    }

    async objectEvent(object, event, ...args) {
        await super.objectEvent(object, event, ...args);
        const res = {event, place: object._place, at: Date.now(), nodeId: this.nodeId, args: []}
        if (event === 'update') res.at = object._updatedAt
        for (let arg of args) {
            if (arg instanceof yinObject)
                res.args.push(arg._place)
            else
                res.args.push(arg)
        }

        // console.log(object._place.valueOf(), event, ...args)
        if (object instanceof yinObject) {
            if (['update', 'deleted'].includes(event))
                this.socket?.to(object._place.valueOf()).emit("event", res);
            else
                this.socket?.to('manage-' + object._place).emit("event", res);
        }
        else
            this.socket?.to(object._place.valueOf()).emit("event", res);
    }

    // 向管理员发送服务器事件
    async runEventFn(event, ...args) {
        await super.runEventFn(event, ...args)
        if (event !== 'ObjectEvents') {
            this.socket?.to('manage-' + this.system._place).emit('ServerEvent', {event, args})
        }
    }

    // childrenEvent(children, event, ...args) {
    //     super.childrenEvent(children, event, ...args);
    //     this.socket?.to(children.place.valueOf()).emit("event", res);
    // }


    // async test() {
    //     const test = await this.Model.create({_title: 123123}, this.me)
    //     test._title = 12312312312313
    //     test._save(this.me)
    // }
}

