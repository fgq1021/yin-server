import {ControllerServer} from "./controller.server.js";
import {yinStatus} from "./core/index.js";
import bcrypt from './lib/bcrypt.cjs'
import jsonwebtoken from 'jsonwebtoken'

export class UserControllerServer extends ControllerServer {
    makeRouter(router, app) {
        router
            .get('/auth', async req => req.user._id ? req.user : yinStatus.UNAUTHORIZED('未匹配到有效的身份令牌'))
            .get('/login', async req => this.module.authPassword(req.query.tel, req.query.password))
            .get('/register', async req => this.module.register(req.query.tel, req.query.password))

        if (!this.yin.me._tel)
            router.get('/root', async req => {
                if (!this.yin.me._tel) {
                    const {tel, password} = req.query
                    // console.log(tel, password)
                    this.yin.me._tel = tel
                    this.yin.me._password = password
                    await this.yin.User.save(this.yin.me)
                    return this.yin.me
                }
                return yinStatus.FORBIDDEN('根用户已经初始化，再访问此接口将封IP')
            })
        return super.makeRouter(router, app);
    }

    // mto(model) {
    //     const m = super.mto(model);
    //     delete m._passwordHash
    //     return m
    // }


    async mounted(user) {
        const network = await this.yin.system.network
        if (network && network.tokenSecret)
            user._token = await jsonwebtoken.sign({_id: user._id}, network.tokenSecret)
        // if (this.yin.system._map.network) await this.sign(user)
    }

    // async sign(user) {
    //     const network = await this.yin.system.network
    //     if (network && network.tokenSecret)
    //         user._token = await jsonwebtoken.sign({_id: user._id}, network.tokenSecret)
    // }

    async saveParse(model, user, fn) {
        // console.log('saveParse in user')
        if (model._password) {
            model._passwordHash = await bcrypt.hash(String(model._password), 10);
            model._passwordUpdateTime = new Date()
            delete model._password
        }
        else {
            delete model._passwordHash
            delete model._passwordUpdateTime
        }
        if (user) {
            model._owner = user._id
        }
        return super.saveParse(model, user, fn)
    }

    async create(object, user) {
        if (object._tel)
            try {
                await this.findByTel(object._tel)
                return yinStatus.FORBIDDEN("手机号为 " + object._tel + " 的用户已存在");
            }
            catch (e) {
                return super.create(object, user)
            }
        return super.create(object, user)
    }


    async authPassword(tel, password) {
        const user = await this.findByTel(tel);
        if (user && await bcrypt.compare(String(password), user._passwordHash)) return user;
        return yinStatus.UNAUTHORIZED('账户或密码错误');
    }

    async register(tel, password) {
        const userSettings = await this.yin.system.userSettings
        if (userSettings.list?.open) {
            return userSettings.list.create({_tel: tel, _password: password})
        }
        return yinStatus.FORBIDDEN('该系统没有开放用户注册')
    }

    findByTel(tel) {
        if (tel)
            return this.findOne({_tel: tel});
        else
            return yinStatus.NOT_ACCEPTABLE('没有有效的电话号码', tel)
    }

    pull(object, key, value, nodeId) {
        if (key !== '_token')
            super.pull(object, key, value, nodeId);
    }
}
