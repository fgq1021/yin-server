import {yinStatus} from "../lib/yin.status";
import {ModuleSchema} from "./module.schema";
import {YinArray, YinChildren} from "./array";
import {yinConsole} from "../lib/yin.console";
import {parseJson} from "../lib/parse.json";

export class Module {
    public name
    public yin
    public Object
    public api
    public schema = new ModuleSchema({})
    private list = {}
    private childrenList = {}

    constructor(yin, controller) {
        this.yin = yin
        this.api = new controller(yin, this)
    }

    init() {
        yinConsole.log('装载模块:', this.name)
        this.list = this.yin.vue.reactive({})
        this.api.init()
    }

    async regModel(modelId) {
        for (let i in this.list) {
            const el = this.list[i];
            if (el.$.model === modelId) {
                await el.$init();
            }
        }
    }

    async assign(el) {
        // console.log('assign', el.$id, el.$title, el)
        const id = el.$id;
        let element = this.list[id];
        if (element && element.$id) {
            // if (new Date(el.$updatedAt) > new Date(element.$updatedAt)) {
            if (new Date(el.$updatedAt) > new Date(element.$updatedAt)) {
                yinConsole.log("更新" + this.name + ":", el.$title, "#" + el.$id);
                const oldEl = parseJson(element)
                if (el.$model !== element.$.model) {
                    // Object.assign(this.list[id], el)
                    this.list[id].$assign(el)
                    await this.list[id].$init();
                } else
                    this.list[id].$assign(el)
                this.api.eventSync(this.list[id], oldEl);
            }
            // else {
            //   console.log("更新未成功" + this.name + ":", el.title || el.username, "#" + el.$id);
            //   console.log(el.updatedAt, element.updatedAt);
            // }
        } else {
            yinConsole.log("获取" + this.name + ":", el.$title, "#" + el.$id);
            this.list[id] = this.yin.vue.reactive(new this.Object(el));
            await this.list[id].$init()
            this.api.eventSync(this.list[id]);
        }
        return this.list[id];
    }

    // async assignList(list) {
    //     for (let i = 0; i < list.length; i++) {
    //         list[i] = await this.assign(list[i]);
    //     }
    //     return list;
    // }


    u(u) {
        return this.yin.client ? (u || this.yin.me) : u
    }

    refresh(id) {
        return this.list[id].$refresh()
    }

    async get(id: string, user?): Promise<any> {
        user = this.u(user)
        if (id) {
            const el = await this.getWaiter(id);
            if (await el.$readable(user)) return el;
            return Promise.reject(yinStatus.UNAUTHORIZED((user ? user.username + "#" + user.$id : "匿名用户") + "没有查看id为 #" + id + " " + this.name + "的权限"));
        }
        return Promise.reject(yinStatus.NOT_FOUND('#id 为空'))
    }

    async getWaiter(id) {
        if (id) {
            const cache = this.list[id];
            if (cache) {
                if (cache.$id && !cache.$isDeleted)
                    return cache;
                else if (cache.$isDeleted)
                    return Promise.reject({status: "NOT_FOUND", message: "未找到id为 #" + id + " 的" + this.name});
                else
                    return new Promise((resolve, reject) => {
                        const timer = setInterval(() => {
                            const _cache = this.list[id];
                            if (_cache && _cache.$id) {
                                resolve(_cache);
                                clearInterval(timer);
                            } else if (!_cache) {
                                reject();
                                clearInterval(timer);
                            }
                        }, 100);
                    });
            } else {
                this.list[id] = {};
                return this.getFromController(id);
            }
        } else return Promise.reject(yinStatus.NOT_ACCEPTABLE('没有ID'));
    }

    async getFromController(id: string) {
        try {
            let el = await this.api.get(id);
            return this.assign(el);
        } catch (err) {
            this.list[id].$isDeleted = true
            return Promise.reject(err);
        }
    }

    async children(place: string, user?) {
        user = this.u(user)
        const children = await this.childrenWaiter(place)
        const list = children.toArray(user)
        await list.get(10)
        return list
    }

    async childrenWaiter(place) {
        if (place) {
            const cache = this.childrenList[place];
            if (cache) {
                return cache
            } else {
                this.childrenList[place] = new YinChildren(place, this.yin, this)
                await this.childrenList[place].init()
                return this.childrenList[place]
            }
        } else return Promise.reject(yinStatus.NOT_ACCEPTABLE('没有正确的Place'));
    }

    async childrenUpdate(place, id, type) {
        const children = this.childrenList[place];
        if (children)
            switch (type) {
                case 'push':
                    return children.childrenPushed(id)
                default:
                    return children.childrenRefresh(id, type)
            }
    }

    // 创建时此选项会添加父元素的children
    // el.pushParents = ['id.key',['id,key']]
    async create(object, user?) {
        user = this.u(user)
        return this.assign(await this.api.create(object, user))
    }

    // 更新时此选项会添加父元素的children????
    // el.pushParents = ['id.key',['id,key']]
    async save(object, option?, user?) {
        let o = option, u = user
        if (!user && option && (option.$name === 'User' || option.$id || option.$isRoot)) {
            u = option
            o = {}
        }
        u = this.u(u)
        object = parseJson(object)
        const oriEl = await this.get(object.$id, u);
        await oriEl.$refresh()
        if (await oriEl.$manageable(u)) {
            oriEl.beforeSave(u);
            await this.assign(await this.api.save(object, o, u));
            oriEl.saved(u);
            return oriEl;
        }
        return Promise.reject(yinStatus.UNAUTHORIZED("您没有修改" + this.name + " #" + object.$id || object._id + " 的权限"));
    }

    async delete(o, user) {
        const id = o.$id || o;
        const object = await this.get(id, user)
        if (await object.$manageable(user)) {
            object.beforeDelete();
            await this.api.delete(id, user);
            object.deleted()
            this.afterDelete(id);
            return Promise.resolve(yinStatus.OK(this.name + " #" + id + " 已删除"));
        }
        return Promise.reject(yinStatus.UNAUTHORIZED('用户#' + user.$title + '没有' + this.name + ' #' + id + ' 的管理权限'))
    }

    objectUpdate(id, data?: { changeId: any; type: string }, timer?) {
        return this.api.objectUpdate(id, data, timer)
    }


    objectDelete(id) {
        return this.api.objectDelete(id)
    }

    // async deleteFrom(el, placeString, user?) {
    //     const {id, place, key} = this.parsePlaceString(placeString);
    //     const pIndex = el.parents.indexOf(id + "." + place + "." + key);
    //     if (pIndex !== -1) {
    //         el.parents.splice(pIndex, 1);
    //         await el.save(user);
    //     } else {
    //         await this.removeChildren(await this.yin.get(placeString), el.name + "." + el.$id + "." + place + "." + key, user);
    //     }
    // }

    afterDelete(id) {
        const el = this.list[id];
        if (el) {
            el.$isDeleted = true;
            this.api.afterDelete(el)
        }
    }

    async upload(file, id, place, key, progress?, user?) {
        if (file && id) {
            return this.assign(await this.api.upload(file, id, place, key, progress, user));
        }
        return Promise.reject({status: "FORBIDDEN", message: "文件或ID格式不对"});
    }

    async uploadDirectory(file, id, place = "data", key = "sub", progress?, user?) {
        if (file && id) {
            return this.assign(await this.api.uploadDirectory(file, id, place, key, progress, user));
        }
        return Promise.reject({status: "FORBIDDEN", message: "文件或ID格式不对"});
    }

    async pushChildren(el, placeString, user?) {
        if (!el.$id)
            el = await this.get(el);
        // el = await this.get(el, user);
        // const rights = this.rights(el, user);
        // if (rights.write()) {
        const {slot, units, id, place, key} = this.yin.parsePlaceString(placeString), keyString = place + "." + key;
        switch (slot) {
            case "Array":
                el.children[keyString] = el.children[keyString] || [];
                el.children[keyString].push(units + "-" + id);
                break;
            case "Object":
                el.children[keyString] = units + "-" + id;
        }
        return el.save(user);
        // } else return Promise.reject({
        //     status: "FORBIDDEN",
        //     message: "您没有修改" + this.name + " #" + el.$id + " 的权限"
        // });
    }

    async removeChildren(el, placeString, user?) {
        if (!el.$id)
            el = await this.get(el);
        // el = await this.get(el, user);
        // const rights = this.rights(el, user);
        // if (rights.write()) {
        const {Unit, id, place, key} = this.yin.parsePlaceString(placeString),
            keyString = place + "." + key, childrenString = Unit + "-" + id;
        if (el.children[keyString] === childrenString) {
            delete el.children[keyString];
            return el.save(user);
        } else {
            const cIndex = el.children[keyString].indexOf(childrenString);
            if (cIndex !== -1) {
                el.parents.splice(cIndex, 1);
                return el.save(user);
            }
        }
        return Promise.reject({status: "FORBIDDEN", message: el.name + " #" + el.$id + " 下没有固定此元素"});
        // }
        // return Promise.reject({status: "FORBIDDEN", message: "您没有修改" + el.name + " #" + el.$id + " 的权限"});
    }

    async find(filter: object = {}, sort: object = {}, limit: number = 50, skip: number = 0, user?): Promise<any> {
        const list = new YinArray({filter, sort}, this, user);
        await list.get(limit, skip)
        return list
    }

    async runFunction(placeString, req: object, user?) {
        // req = req || el.data
        // if (typeof el[functionName] === 'function') {
        //     return el[functionName](req, user)
        // }
        return this.api.runFunction(placeString, req, user)
    }
}

