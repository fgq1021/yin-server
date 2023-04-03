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
exports.UserControllerServer = void 0;
const controller_server_1 = require("./controller.server");
const yin_core_1 = require("yin-core");
const bcrypt = require("bcrypt");
class UserControllerServer extends controller_server_1.ControllerServer {
    constructor() {
        super(...arguments);
        this.name = 'User';
    }
    // public schema = {
    //     title: String,
    //     owner: {type: ObjectId, ref: "User"},
    //     // accessControl:['userid.$read.0(继承层数)','userid.$manage','userid.$deny'...]
    //     accessControl: [String],
    //     //parents:['id.key']
    //     // 特殊定义
    //     // User权限给予'id.$manage'
    //     parents: [String],
    //     //children:{key:['module.id']||'module.id'||'module.id.key'}
    //     children: {},
    //     model: {type: ObjectId, ref: "Model"},
    //     data: {},
    //     // 非Model时为私有结构
    //     schema: [],
    //     hide: {type: Boolean, default: false},
    //     wx: {
    //         openid: String,
    //         unionid: String,
    //         userInfo: {}
    //     },
    //     tel: {
    //         unique: true,
    //         type: Number
    //     },
    //     passwordHash: String,
    //     passwordUpdateTime: {
    //         type: Date,
    //         default: Date.now
    //     },
    //     catalogUpdateTime: {
    //         type: Date,
    //         default: Date.now
    //     }
    // }
    get(id) {
        const _super = Object.create(null, {
            get: { get: () => super.get }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield _super.get.call(this, id);
            return this.userParse(user);
        });
    }
    saveParse(object, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (object.$password) {
                object.$passwordHash = yield bcrypt.hash(String(object.$password), 10);
                object.$passwordUpdateTime = new Date();
                delete object.$password;
            }
            else {
                delete object.$passwordHash;
                delete object.$passwordUpdateTime;
            }
            if (user) {
                object.$owner = user.$id;
            }
            return object;
        });
    }
    createRoot(object) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.yin.me.$id) {
                this.yin.me = yield this.yin.system.root.create(object, this.yin.me);
                this.yin.me.$isRoot = true;
                this.yin.me.systemConfig = this.yin.system;
                yield this.yin.me.$save(this.yin.me);
                return this.yin.me;
            }
            else
                return Promise.reject(yin_core_1.yinStatus.FORBIDDEN('根用户已经存在，再访问此接口将封IP'));
        });
    }
    create(object, user) {
        const _super = Object.create(null, {
            create: { get: () => super.create }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (object.$tel)
                try {
                    if (yield this.findByTel(object.$tel))
                        return Promise.reject(yin_core_1.yinStatus.FORBIDDEN("手机号为 " + object.$tel + " 的用户已存在"));
                }
                catch (e) {
                    return this.userParse(yield _super.create.call(this, yield this.saveParse(object, user), user));
                }
            return Promise.reject(yin_core_1.yinStatus.FORBIDDEN('创建用户时必须包含手机号 $tel'));
        });
    }
    save(o, option, user) {
        const _super = Object.create(null, {
            save: { get: () => super.save }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.save.call(this, yield this.saveParse(o, user), option, user);
        });
    }
    userParse(user) {
        delete user.$passwordHash;
        delete user.$passwordUpdateTime;
        delete user.$password;
        if (user.$id === this.yin.me.$id)
            user.$isRoot = true;
        return user;
    }
    auth(id) {
        return this.get(id);
    }
    authPassword(tel, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.findByTel(tel);
            // @ts-ignore
            if (user && (yield bcrypt.compare(String(password), user.$passwordHash))) {
                return this.userParse(user);
            }
            return Promise.reject(yin_core_1.yinStatus.UNAUTHORIZED('账户或密码错误'));
        });
    }
    findByTel(tel) {
        return this.findOne({ tel });
    }
}
exports.UserControllerServer = UserControllerServer;
