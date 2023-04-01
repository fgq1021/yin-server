"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YinServer = void 0;
const yin_core_1 = require("yin-core");
const user_controller_server_1 = require("./user.controller.server");
const system_controller_server_1 = require("./system.controller.server");
const model_controller_server_1 = require("./model.controller.server");
const element_controller_server_1 = require("./element.controller.server");
const fs_1 = require("fs");
const promises_1 = require("node:fs/promises");
const path_1 = require("path");
const mongoose_1 = require("mongoose");
class YinServer extends yin_core_1.Yin {
    constructor(config) {
        super([yin_core_1.ModelModule, model_controller_server_1.ModelControllerServer], [yin_core_1.UserModule, user_controller_server_1.UserControllerServer], [yin_core_1.SystemModule, system_controller_server_1.SystemControllerServer], [yin_core_1.ElementModule, element_controller_server_1.ElementControllerServer]);
        // @ts-ignore
        this.me = { $isRoot: true };
        this.rootPath = '/';
        this.configPath = '/yin.config.json';
        this.system = {
            $id: '',
            $children: {},
            secret: '',
            mongo: 'mongodb://127.0.0.1:27017/引'
        };
        this.margeConfig(config);
    }
    margeConfig(config) {
        yin_core_1.yinConsole.log('读取配置');
        if (typeof config === 'object') {
            yin_core_1.yinConsole.log('读取传入的配置对象', config);
            Object.assign(this.system, config);
        }
        else {
            this.rootPath = config || process.env['YIN_PATH'];
            yin_core_1.yinConsole.log('读取配置文件于目录', this.rootPath);
            this.configPath = (0, path_1.join)(this.rootPath, 'yin.config.json');
            if ((0, fs_1.existsSync)(this.configPath))
                Object.assign(this.system, JSON.parse((0, fs_1.readFileSync)(this.configPath, 'utf-8')));
            // else {
            //     yinConsole.log('创建配置文件于', this.configPath)
            // }
        }
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.connectMongo();
                yield this.initSys();
                yield this.runEventFn('start', 'YinOS启动成功');
                yin_core_1.yinConsole.log('启动成功于', this.system.$id);
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    connectMongo(url) {
        return __awaiter(this, void 0, void 0, function* () {
            yin_core_1.yinConsole.log("数据库连接开始");
            if (url)
                this.system.mongo = url;
            const mongoUri = this.system.mongo;
            try {
                yin_core_1.yinConsole.log(`数据库: ${mongoUri} 连接中`);
                yield (0, mongoose_1.connect)(mongoUri);
                yin_core_1.yinConsole.log(`数据库: ${mongoUri} 连接成功`);
                yield this.runEventFn('mongoConnect', `数据库: ${mongoUri} 连接成功`);
            }
            catch (e) {
                yin_core_1.yinConsole.log(`数据库: ${mongoUri} 连接失败，尝试重新连接`);
                yield (0, mongoose_1.disconnect)();
                yield this.runEventFn('mongoDisconnect', `数据库: ${mongoUri} 断开`);
                return new Promise((resolve) => {
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        yield this.connectMongo(url);
                        resolve(true);
                    }), 2000);
                });
            }
            return true;
        });
    }
    initSys() {
        return __awaiter(this, void 0, void 0, function* () {
            yin_core_1.yinConsole.log('初始化系统', this.system);
            try {
                this.system = yield this.System.get(this.system.$id, this.me);
            }
            catch (e) {
                yin_core_1.yinConsole.warn("未找到配置 #", this.system.$id || '空', '系统初始化开始');
                this.system = yield this.initialization();
            }
            for (let i in this.system.$children) {
                this[i] = yield this.system[i];
            }
        });
    }
    initialization() {
        return __awaiter(this, void 0, void 0, function* () {
            yin_core_1.yinConsole.log("初始化");
            if (!this.configPath) {
                yin_core_1.yinConsole.warn("初始化", "未监测到环境变量中的配置地址");
                yin_core_1.yinConsole.warn("初始化", "请将配置目录写入", "process.env['YIN_PATH']");
                return Promise.reject();
            }
            yin_core_1.yinConsole.log("初始化", "数据库检测...");
            yield this.systemRepair();
            this.me = yield this.User.create({
                $title: 'root user',
                $tel: new Date().getTime(),
                $password: 123123123
            });
            const userM = yield this.Model.create({
                $title: '123123'
            }, this.me);
            console.log(this.me, 1);
            this.me.$model = userM.$id;
            console.log(this.me, 2);
            yield this.me.$save(this.me);
            console.log(this.me, 3);
            console.log(this.me.$model);
            this.system = yield this.System.create({
                $title: '系统配置',
                secret: this.genSecret(32),
                mongo: 'mongodb://127.0.0.1:27017/引'
            }, this.me);
            yield this.writeSystemConfig();
            return this.system;
        });
    }
    writeSystemConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            yin_core_1.yinConsole.warn("初始化", "写入配置于:", this.configPath, JSON.stringify(this.system));
            yield (0, promises_1.writeFile)(this.configPath, JSON.stringify(this.system));
        });
    }
    systemRepair() {
        return __awaiter(this, void 0, void 0, function* () {
            yin_core_1.yinConsole.warn("开始系统修复");
            yield this.User.api.deleteOne({ tel: 12345678900 });
            yield this.resetDatabase();
            return true;
        });
    }
    resetDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            yin_core_1.yinConsole.warn("清空数据库");
            for (let module of this.modules) {
                yield module.api.api.deleteMany({});
            }
        });
    }
    backupDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const backups = {};
            for (let module of this.modules) {
                backups[module.name] = yield module.api.api.find({});
            }
            return backups;
        });
    }
    restoreDatabase(info, collections, cover = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.rootPath)
                return Promise.reject();
            for (let cn in collections) {
                const collectionBackup = collections[cn], collection = this[cn].api.api;
                if (cover)
                    yield collection.deleteMany({});
                yield collection.insertMany(collectionBackup);
            }
            yield (0, promises_1.writeFile)(this.configPath, JSON.stringify(info.config));
            return true;
        });
    }
    // startHttpServer(httpServer?) {
    //
    // }
    regSocket(socket) {
        this.socket = socket;
        return this;
    }
}
exports.YinServer = YinServer;
