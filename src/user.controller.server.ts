import {ControllerServer} from "./controller.server";
import {yinStatus} from "yin-core";
import * as bcrypt from 'bcrypt'

export class UserControllerServer extends ControllerServer {
    public name = 'User'
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

    async get(id) {
        const user = await super.get(id)
        return this.userParse(user)
    }

    async create(el, user?): Promise<any> {
        if (el.$tel)
            try {
                if (await this.findByTel(el.$tel))
                    return Promise.reject(yinStatus.FORBIDDEN("手机号为 " + el.$tel + " 的用户已存在"));
            } catch (e) {
                if (el.$password) el.$passwordHash = await bcrypt.hash(String(el.$password), 10);
                delete el.$password
                // el.type = el.type || this.users.type;
                return super.create(el, user)
            }
        return Promise.reject(yinStatus.FORBIDDEN('创建用户时必须包含手机号 $tel'))
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
        return this.get(id)
    }

    async authPassword(tel: string, password: string): Promise<any> {
        const user = await this.findByTel(tel);
        // @ts-ignore
        if (user && await bcrypt.compare(String(password), user.$passwordHash)) {
            return this.userParse(user);
        }
        return Promise.reject(yinStatus.UNAUTHORIZED('账户或密码错误'));
    }

    findByTel(tel) {
        return this.findOne({tel});
    }

    async saveParse(object, user) {
        delete object.$M
        if (user) {
            object.$owner = user.$id
        }
        return object
    }
}