import {Yin, UserModule, SystemModule, ModelModule, ElementModule, yinConsole, YinObject} from "yin-core";
import {UserControllerServer} from "./user.controller.server";
import {SystemControllerServer} from "./system.controller.server";
import {ModelControllerServer} from "./model.controller.server";
import {ElementControllerServer} from "./element.controller.server";
import {readFileSync, existsSync} from "fs";
import {writeFile} from 'node:fs/promises'
import {join} from "path";
import {connect, disconnect} from "mongoose";


export class YinServer extends Yin {
    // @ts-ignore
    public me: YinObject = {$isRoot: true}
    public socket
    public rootPath = '/'
    public configPath = '/yin.config.json'
    public system = {
        $id: '',
        $children: {},
        secret: '',
        mongo: 'mongodb://127.0.0.1:27017/引'
    }


    constructor(config?: string | object) {
        super(
            [ModelModule, ModelControllerServer],
            [UserModule, UserControllerServer],
            [SystemModule, SystemControllerServer],
            [ElementModule, ElementControllerServer]
        )
        this.margeConfig(config)
    }

    margeConfig(config?: string | object) {
        yinConsole.log('读取配置')
        if (typeof config === 'object') {
            yinConsole.log('读取传入的配置对象', config)
            Object.assign(this.system, config)
        } else {
            this.rootPath = config || process.env['YIN_PATH']
            yinConsole.log('读取配置文件于目录', this.rootPath)
            this.configPath = join(this.rootPath, 'yin.config.json')
            if (existsSync(this.configPath))
                Object.assign(this.system, JSON.parse(readFileSync(this.configPath, 'utf-8')))
            // else {
            //     yinConsole.log('创建配置文件于', this.configPath)
            // }
        }
    }


    async start() {
        try {
            await this.connectMongo()
            await this.initSys()
            await this.runEventFn('start', 'YinOS启动成功')
            yinConsole.log('启动成功于', this.system.$id)
        } catch (e) {
            console.log(e)
        }
    }

    async connectMongo(url?: string) {
        yinConsole.log("数据库连接开始");
        if (url)
            this.system.mongo = url
        const mongoUri = this.system.mongo
        try {
            yinConsole.log(`数据库: ${mongoUri} 连接中`);
            await connect(mongoUri)
            yinConsole.log(`数据库: ${mongoUri} 连接成功`);
            await this.runEventFn('mongoConnect', `数据库: ${mongoUri} 连接成功`)
        } catch (e) {
            yinConsole.log(`数据库: ${mongoUri} 连接失败，尝试重新连接`);
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
        yinConsole.log('初始化系统', this.system)
        try {
            this.system = await this.System.get(this.system.$id, this.me)
        } catch (e) {
            yinConsole.warn("未找到配置 #", this.system.$id || '空', '系统初始化开始');
            this.system = await this.initialization()
        }
        for (let i in this.system.$children) {
            this[i] = await this.system[i]
        }
    }

    async initialization() {
        yinConsole.log("初始化");
        if (!this.configPath) {
            yinConsole.warn("初始化", "未监测到环境变量中的配置地址");
            yinConsole.warn("初始化", "请将配置目录写入", "process.env['YIN_PATH']");
            return Promise.reject()
        }


        yinConsole.log("初始化", "数据库检测...");
        await this.systemRepair();

        this.me = await this.User.create({
            $title: 'root user',
            $tel: new Date().getTime(),
            $password: 123123123
        })

        const userM = await this.Model.create({
            $title: '123123'
        }, this.me)

        console.log(this.me, 1)
        this.me.$model = userM.$id
        console.log(this.me, 2)
        await this.me.$save(this.me)
        console.log(this.me, 3)
        console.log(this.me.$model)
        this.system = await this.System.create({
            $title: '系统配置',
            secret: this.genSecret(32),
            mongo: 'mongodb://127.0.0.1:27017/引'
        }, this.me)
        await this.writeSystemConfig()
        return this.system
    }

    async writeSystemConfig() {
        yinConsole.warn("初始化", "写入配置于:", this.configPath, JSON.stringify(this.system));
        await writeFile(this.configPath, JSON.stringify(this.system));
    }

    async systemRepair() {
        yinConsole.warn("开始系统修复");
        await this.User.api.deleteOne({tel: 12345678900});
        await this.resetDatabase()
        return true
    }

    async resetDatabase() {
        yinConsole.warn("清空数据库");
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
        if (!this.rootPath)
            return Promise.reject()
        for (let cn in collections) {
            const collectionBackup = collections[cn], collection = this[cn].api.api
            if (cover)
                await collection.deleteMany({})
            await collection.insertMany(collectionBackup)
        }
        await writeFile(this.configPath, JSON.stringify(info.config));
        return true
    }


    // startHttpServer(httpServer?) {
    //
    // }

    regSocket(socket) {
        this.socket = socket
        return this
    }
}