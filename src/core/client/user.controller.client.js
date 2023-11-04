import {ControllerClient} from "./controller.client.js";

export class UserControllerClient extends ControllerClient {
    async assignMe(me) {
        this.yin.me = await this.module.assign(me);
        this.yin.localStorage.setItem(this.yin.url, me._token)
        return me
    }

    // async create(object) {
    //     let user
    //     if (this.yin.system.uninitialized)
    //         user = await this.req.get("root", object)
    //     else
    //         user = await super.create(object)
    //     if (this.yin.me._id)
    //         return user
    //     else {
    //         await this.assignMe(user)
    //         await this.yin.config()
    //         return this.yin.me
    //     }
    // }

    /**
     * 没注册公司，发不了验证码，先这么用着吧
     * @param tel
     * @param password
     */
    async register(tel, password) {
        let user
        if (this.yin.system.uninitialized)
            user = await this.req.get("root", {tel, password})
        else
            user = await this.req.get("register", {tel, password})
        await this.assignMe(user)
        await this.yin.config()
        return this.yin.me
    }


    async auth() {
        const me = await this.req.get('auth');
        return this.assignMe(me)
    }

    async authPassword(tel, password) {
        const me = await this.req.get("login", {tel, password})
        return this.assignMe(me)
    }

    pull(object, key, value, nodeId) {
        if (key !== '_token')
            super.pull(object, key, value, nodeId);
    }
}
