import {
    ElementModule, ModelModule, SystemModule, UserModule, yinConsole, yinParse, Yin, yinStatus
} from "./core/index.js";
import {UserControllerServer} from "./user.controller.server.js";
import {SystemControllerServer} from "./system.controller.server.js";
import {ModelControllerServer} from "./model.controller.server.js";
import {ElementControllerServer} from "./element.controller.server.js";
import {readFileSync, existsSync} from "fs";
import fs from "fs/promises";
import {watchFile, unwatchFile} from 'node:fs'
import {join, basename} from "path";
import {pathToFileURL} from 'url'
import {connect, disconnect} from "mongoose";

export class YinServer extends Yin {
    /**
     * 给me添加_name是为了在初始化时修改system后保存时_save(user)可以识别为user而不是option
     */
    me = {_isRoot: true}
    scriptsFile = {}

    socket
    rootPath = '/'
    configPath = '/yin.config.json'
    system = {
        _id: '', _map: {}, secret: '', db: 'mongodb://127.0.0.1:27017/引'
    }
    instance
    instances = {
        /**
         * 赋予完整地址，不同app可能在不同服务器上
         * id:'http://yin.cab:2130'
         */

    }
    httpServer
    serverController


    constructor(config) {
        super()
        this.regModule(ModelModule, ModelControllerServer)
        this.regModule(UserModule, UserControllerServer)
        this.regModule(SystemModule, SystemControllerServer)
        this.regModule(ElementModule, ElementControllerServer)
        console.log(...yinConsole.success('基础模块装载完成'))
        this.margeConfig(config)
    }

    margeConfig(config) {
        console.log(...yinConsole.log('读取配置'))
        if (config instanceof Object) {
            console.log(...yinConsole.log('读取传入的配置对象', config))
            Object.assign(this.system, config)
        } else {
            this.rootPath = config || process.env['YIN_PATH']
            console.log(...yinConsole.log('读取配置文件于目录', pathToFileURL(this.rootPath).toString()))
            this.configPath = join(this.rootPath, 'yin.config.json')
            if (existsSync(this.configPath)) Object.assign(this.system, JSON.parse(readFileSync(this.configPath, 'utf-8')))
            // else {
            //     console.log(...yinConsole.log('创建配置文件于', this.configPath))
            // }
        }
    }


    async start() {
        super.start()
        try {
            await this.connectMongo()
            await this.importScriptsFromDir()
            // // 在初始化之前把模型文件写入硬盘
            // await this.writeSystemModelToRoot()
            // await this.systemRepair()

            await this.initSys()
            await this.runEventFn('start', 'YinOS启动成功')
            this.initialized = true
            console.log(...yinConsole.success('启动成功于 System', '#' + this.system._id, 'User', '#' + this.me._id))
        } catch (e) {
            console.log(...yinConsole.warn('启动失败'))
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
        } catch (e) {
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
        console.log(...yinConsole.log('初始化系统', this.system))
        try {
            this.system = await this.System.get(this.system._id, this.me)
        } catch (e) {
            console.log(...yinConsole.warn("未找到配置 #", this.system._id || '空', '系统初始化开始'));
            this.system = await this.initialization()
        }
        for (let i in this.system._schema) {
            const k = this.system._schema[i]
            this[k.name] = this.system[k.name]
        }
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
        try {
            this.me = await this.system.root
            this.me._isRoot = true
            if (!this.me._tel) console.log(...yinConsole.warn("初始化", "根用户尚未注册，请尽快完成初始化"));
        } catch (e) {
            // throw e
            // console.log(e)
        }
    }


    /**
     * TODO 目前仅支持引入单文件script，后续将支持包管理
     * @return {Promise<string>} script
     */
    async importScriptsFromDir() {
        const scriptsDir = join(this.rootPath, 'scripts')
        if (existsSync(scriptsDir)) {
            const scripts = await fs.readdir(scriptsDir)
            // fs.watch(scriptsDir, (event, filename) => {
            //
            // })
            for (let s of scripts) {
                try {
                    await this.importScriptFromPath(join(scriptsDir, s))
                } catch (e) {
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
                } catch (e) {
                }
            });
            if (script._id) for (let id of script._id) {
                this.scriptsFile[id] = scriptPath
            }
            this.regScripts(script)
            return true
        } catch (e) {
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
        } catch (e) {
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
        note += ` *\n * @todo 脚本删除和重命名后需要重启服务,完成调试后最好也重启一下\n */\n`

        if (!/\/\*\*[\s\S]+\*\//.test(script)) script = note + script; else script = script.replace(/\/\*\*[\s\S]+\*\/\s*/, note)

        let oldScript
        try {
            oldScript = await this.readScript(place)
        } catch (e) {
        }
        await fs.mkdir(scriptsDir, {recursive: true});
        await fs.writeFile(scriptPath, script)
        try {
            await this.importScriptFromPath(scriptPath)
        } catch (e) {
            if (oldScript) await this.updateScript(place, oldScript)
            return Promise.reject(e)
        }
        return script
    }


    async initialization() {
        console.log(...yinConsole.log("初始化"));
        if (!this.configPath) {
            console.log(...yinConsole.warn("初始化", "未监测到环境变量中的配置地址"));
            console.log(...yinConsole.warn("初始化", "请将配置目录写入", "process.env['YIN_PATH']"));
            return Promise.reject()
        }

        console.log(...yinConsole.log("初始化", "数据库检测..."));
        await this.systemRepair();

        const {systemDefaultModel} = await import('./lib/system.default.model.js')
        await this.Model.api.api.insertMany(systemDefaultModel)

        const systemModel = {}
        systemDefaultModel.forEach(m => {
            systemModel[m._title] = m._id
        })

        this.system = await this.System.create({
            _title: '系统配置', _model: systemModel["系统配置"], _map: {
                systemModels: 'Model.64255194330fca6bae002f7d'
            }, secret: this.genSecret(32), db: 'mongodb://127.0.0.1:27017/引'
        }, this.me)

        await this.initMe()
        // console.log(this.me._setter)
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
        await this.User.api.deleteOne({tel: 12345678900});
        await this.resetDatabase()
        return true
    }

    async resetDatabase() {
        console.log(...yinConsole.warn("清空数据库"));
        for (let module of this.modules) {
             await module.api.api.deleteMany({})
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

    async writeSystemModelToRoot() {
        const models = await this.Model.api.api.find({})
        const file = 'export const systemDefaultModel = ' + JSON.stringify(models.map(model => {
            const m = yinParse(model)
            delete m.owner
            return m
        }))
        await fs.writeFile(join(this.rootPath, 'system.default.model.js'), file);
    }

    async makeHttpServer(server, options = {}) {
        const {makeHttpServer} = await import('./lib/makeHttpServer.js')
        makeHttpServer(server, options, this)
    }

    /**
     * 启动yin服务器
     * @param options
     * @return {Promise<Server<typeof IncomingMessage, typeof ServerResponse>>}
     */
    async listen(options = {}) {
        const {listen} = await import('./lib/makeHttpServer.js')
        return listen(options, this)
    }

    regSocket(socket) {
        Object.defineProperty(this, 'socket', {value: socket})
        return this
    }

    // async test() {
    //     const test = await this.Model.create({_title: 123123}, this.me)
    //     test._title = 12312312312313
    //     test._save(this.me)
    // }
}

export const yin = new YinServer(process.cwd())
