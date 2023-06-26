import {ControllerServer} from "./controller.server.js";
import {yinStatus} from "./core/index.js";
import bcrypt from 'bcrypt'
import jsonwebtoken from 'jsonwebtoken'

export class UserControllerServer extends ControllerServer {
    name = 'User'

    makeRouter(app, router) {
        router.get('/auth', async ctx => {
            if (ctx.user._id)
                return this.sign(ctx.user)
            return yinStatus.UNAUTHORIZED('未匹配到有效的身份令牌')
        })
        router.post('/login', async ctx => {
            const {tel, password} = ctx.request.body, user = await this.module.authPassword(tel, password)
            return await this.sign(user)
        })

        if (!this.yin.me._tel)
            router.post('/root', async ctx => {
                if (!this.yin.me._tel) {
                    const user = await this.initRoot(ctx.request.body)
                    return await this.sign(user)
                }
                return yinStatus.FORBIDDEN('根用户已经初始化，再访问此接口将封IP')
            })
        return super.makeRouter(app, router);
    }


    async get(id) {
        const user = await super.get(id)
        return this.userParse(user)
    }

    // async saveParse(object, user, fn) {
    //     console.log('saveParse in user')
    //     if (object._password) {
    //         object._passwordHash = await bcrypt.hash(String(object._password), 10);
    //         object._passwordUpdateTime = new Date()
    //         delete object._password
    //     } else {
    //         delete object._passwordHash
    //         delete object._passwordUpdateTime
    //     }
    //     if (user) {
    //         object._owner = user._id
    //     }
    //     return object
    // }

    async saveParse(model, user, fn) {
        // console.log('saveParse in user')
        if (model._password) {
            model._passwordHash = await bcrypt.hash(String(model._password), 10);
            model._passwordUpdateTime = new Date()
            delete model._password
        } else {
            delete model._passwordHash
            delete model._passwordUpdateTime
        }
        if (user) {
            model._owner = user._id
        }

        const object = await super.saveParse(model, user, fn)

        return this.userParse(object)
    }


    async initRoot(object) {
        if (!this.yin.me._tel) {
            try {
                const telUser = await this.module.findOne({_tel: object._tel}, this.yin.me),
                    rootModel = await this.yin.me._model()
                console.log(telUser, rootModel)
                this.yin.system.root = telUser
                await this.yin.system._save(this.yin.me)
                telUser._model = rootModel
                await telUser._save(this.yin.me)
                telUser.systemConfig = this.yin.system
                await telUser._save(this.yin.me)
                await this.yin.initMe()
            } catch (e) {
                Object.assign(this.yin.me, object)
                await this.yin.me._save(this.yin.me)
            }
            return this.yin.me
        } else
            return yinStatus.FORBIDDEN('根用户已经存在，再访问此接口将封IP')
    }

    async create(object, user) {
        if (object._tel)
            try {
                await this.findByTel(object._tel)
                return yinStatus.FORBIDDEN("手机号为 " + object._tel + " 的用户已存在");
            } catch (e) {
                return super.create(object, user)
            }
        return super.create(object, user)
    }

    userParse(user) {
        delete user._passwordHash;
        delete user._passwordUpdateTime;
        delete user._password;
        if (user._id === this.yin.me._id)
            user._isRoot = true;
        return user;
    }

    async sign(user) {
        user._token = await jsonwebtoken.sign({_id: user._id}, this.yin.system.secret)
        return user
    }

    auth(id) {
        return this.get(id)
    }

    async authPassword(tel, password) {
        const user = await this.findByTel(tel);
        if (user && await bcrypt.compare(String(password), user._passwordHash)) {
            return this.userParse(user);
        }
        return yinStatus.UNAUTHORIZED('账户或密码错误');
    }

    findByTel(tel) {
        if (tel)
            return this.findOne({_tel: tel});
        else
            return yinStatus.NOT_ACCEPTABLE('没有有效的电话号码', tel)
    }
}
