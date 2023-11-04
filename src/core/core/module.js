import {yinStatus} from "../lib/yin.status.js";
import {yinConsole} from "../lib/yin.console.js";
import {yinObject} from "./object.js";
import {YinArray, YinChildren} from "./array.js";
import {Place} from "./place.js";
import {Type} from "./type.js";
import {Key} from "./key.js";

//TODO 下个版本要让Module也由yinObject拓展而来

/**
 * TODO 分离客户端和服务端的Module[重大改变]
 * 合并Module和ControllerClient？
 * 改ControllerServer为本地操作？
 *
 * 由于之前版本的操作完全依赖Module
 * 为了各端操作体验一致，所有功能由同一Module进行分发
 * 但是现在更进了一步，功能被尽可能添加到Object上
 * 用户几乎不需要操作Module
 * 统一Module的意义也就弱化了
 */


export class Module {
    name
    title
    yin
    Object = class extends yinObject {
    }
    // Place
    api
    file
    list = {}
    listWaiter = {}
    childrenList = {}

    constructor(yin, controller) {
        this.yin = yin
        this.api = new controller(yin, this)
    }

    async init() {
        // console.log(...yinConsole.load('#模块', this.name))
        // const _this = this
        this.Object.module = this
        this.Object.mapSchema()


        // this.Place = class extends ModulePlace {
        //     module = _this
        // }
        /**
         * 当yin.reactive存在时
         * 把所有缓存存在vue.reactive创建的proxy之内，以适配vue的热更新
         * 您可以通过yin.regReactive(reactive)来把您项目中的vue.reactive挂在yin.reactive上
         * yinClientVue会自动添加此项
         * TODO yinClientReact - 暂时还没精力适配react
         */
        if (this.yin?.reactive) {
            this.list = this.yin.reactive({})
            this.childrenList = this.yin.reactive({})
        }
        await this.api.init()

        // 自动释放
        // setInterval(() => {
        //     this.clearCache()
        // }, this.clearCacheGap)
    }

    clearCacheGap = 1000

    clearCache() {
        // console.log(...yinConsole.log(`#${this.name}`, '开始内存回收'))
        const now = Date.now()
        for (let p in this.list) {
            if (now - this.list[p]._readAt > this.clearCacheGap) {
                console.log(...yinConsole.warn(`#${this.list[p]._id}`, `${this.list[p]._titlePlace} 已被释放`))
                delete this.list[p]
            }
        }
        for (let p in this.childrenList) {
            if (!this.list[this.childrenList[p].parent._place]) {
                console.log(...yinConsole.warn(...this.childrenList[p].logMark, `已被释放`))
                delete this.childrenList[p]
            }
        }
    }

    regStructureType() {
        this.yin.Types[this.name] = new Type(this.title, '', 'ObjectId',
            [new Key('manualCreation', 'Boolean', '手动创建', '此项默认关闭，关闭时系统将自动根据模型创建该对象，\n对于可能造成回环的模型键值，强烈建议打开此项')])
        this.yin.structureType.push(this.name)
    }

    authProxyList = {}

    authProxy(user) {
        if (this.authProxyList[user._id]) return this.authProxyList[user._id]
        this.authProxyList[user._id] = new Proxy(this, {
            get(target, p) {
                if (target[p] instanceof Function)
                    return (...args) => target[p](...args, user)
                return target[p]
            }
        })
        return this.authProxyList[user._id]
    }


    regScripts(place) {
        for (let i in this.list) {
            const el = this.list[i];
            if (el._model) if (el._model.valueOf() === place.id || el._id === place.id)
                el._mapSchema();
        }
    }


    async assign(el, user = this.yin.me) {
        // console.log(...yinConsole.update("#>>" + el._title, this.name, el))
        const id = el._id;
        let element = this.list[id];
        if (element && element._id) {
            if (new Date(el._updatedAt) > element._updatedAt) {
                try {
                    if (el._model) await this.yin.Model.get(el._model)
                }
                catch (e) {
                }
                element._hold = true
                Object.assign(this.list[id], el)
                element._changed = false
                element._hold = undefined
                console.log(...yinConsole.update("#" + el._id, this.name, el._title))
                // this.objectUpdate(this.list[id]._place, {at: this.list[id]._updatedAt})
                // this.list[id]._runEventFn('update')
                await element.update(user)
                // this.api.eventSync(this.list[id], oldEl);
            }
            // return yinStatus.NOT_ACCEPTABLE('没有更新日期的数据')
        }
        else {
            try {
                if (el._model) await this.yin.Model.get(el._model)
            }
            catch (e) {
            }
            this.list[id] = this.Object.create(el)
            await this.list[id].mounted(user)
            console.log(...yinConsole.load("#" + el._id, this.name, el._title))
            // this.api.eventSync(this.list[id]);
            // this.api.watch && this.api.watch(this.list[id]._place);
        }
        return this.list[id];
    }

    // async refresh(id, at) {
    //     const o = this.list[id]
    //     if (o) {
    //         if (at) {
    //             await o._nextTick()
    //             if (new Date(at) > o._updatedAt) return o._refresh()
    //             return
    //         }
    //         return o._refresh()
    //     }
    // }

    pull(object, key, value, nodeId) {
        // console.assert(false, object._titlePlace, key, value)
       // console.log(nodeId, this.yin.nodeId)
        return this.api.pull(object, key, value, nodeId)
    }

    async get(id, user = this.yin.me) {
        id = Place.idSetter(id)
        if (id) {
            const el = await this.getWaiter(id);
            await el._readable(user)
            await el.read(user)
            return el;
        }
        return yinStatus.NOT_FOUND('#id 为空')
    }

    async getWaiter(id, user) {
        if (id) {
            const cache = this.list[id];
            if (cache) {
                cache._readAt = Date.now()
                if (cache._isDeleted) return yinStatus.NOT_FOUND("未找到id为 #" + id + " 的" + this.name);
                return cache;
            }
            else return this.getFromController(id, user)
        }
        else return yinStatus.NOT_ACCEPTABLE('没有ID');
    }

    getFromCache(id) {
        const object = this.list[id]
        if (object && !object._isDeleted)
            return object
    }

    async getFromController(id, user) {
        try {
            if (this.listWaiter[id]) return this.listWaiter[id]
            this.listWaiter[id] = this.assign(await this.api.get(id), user);
            const object = await this.listWaiter[id]
            delete this.listWaiter[id]
            return object
        }
        catch (err) {
            if (this.list[id]) this.list[id]._isDeleted = true;
            else this.list[id] = {_id: id, _isDeleted: true}
            return Promise.reject(err);
        }
    }

    async children(place, user = this.yin.me) {
        const children = await this.childrenWaiter(place)
        const list = children.toArray(user)
        await list.get(10, 0)
        return list
    }

    async childrenWaiter(place) {
        if (place) {
            place = Place.create(place)
            if (!place.index) place = place.toIndex()
            const cache = this.childrenList[place];
            if (cache) return cache
            else if (this.listWaiter[place]) return this.listWaiter[place]
            else {
                this.listWaiter[place] = this.getChildrenFromController(place)
                return this.listWaiter[place]
            }
            //  return this.childrenList[place]||this.getChildrenFromController(place)
        }
        else return yinStatus.NOT_ACCEPTABLE('没有正确的Place');
    }

    async getChildrenFromController(place) {
        try {
            // console.log('' + place, this.listWaiter[place] instanceof Promise)
            this.childrenList[place] = await new YinChildren(place, this.yin, this).init()
            delete this.listWaiter[place]
            return this.childrenList[place]
        }
        catch (err) {
            delete this.listWaiter[place]
            return Promise.reject(err);
        }
    }


    async childrenUpdate(place, id, type) {
        try {
            place = Place.create(place)
            if (place.index) {
                const children = this.childrenList[place];
                if (children)
                    switch (type) {
                        case 'push':
                            await children.childrenPushed(id)
                            break
                        default:
                            await children.childrenRefresh(id, type)
                            break
                    }
                else {
                    // console.log(place)
                }
            }
            else {
                const parent = await this.yin.get(place)
                if (parent[place.key]?.index)
                    for (let i in parent[place.key].index) {
                        const children = this.childrenList[place.toIndex(i)];
                        if (children)
                            switch (type) {
                                case 'push':
                                    await children.childrenPushed(id)
                                    break
                                default:
                                    await children.childrenRefresh(id, type)
                                    break
                            }
                    }
            }
        }
        catch (e) {
            // console.log(e)
        }
    }

// 创建时此选项会添加父元素的children
// el.pushParents = ['id.key',['id,key']]
    async create(object, user = this.yin.me) {
        const o = await this.assign(await this.api.create(object, user), user)
        await o.created(user)
        return o
    }

// 更新时此选项会添加父元素的children????
// el.pushParents = ['id.key',['id,key']]
    async save(object, user = this.yin.me) {
        await object._manageable(user)
        await object.beforeSave(user)
        await this.assign(await this.api.save(object, user), user);
        await object.saved(user)
        return object;
    }

    async delete(object, user = this.yin.me) {
        // if (!this.yin.client) await object._refresh()
        await object._manageable(user)
        await object.beforeDelete(user);
        await this.api.delete(object, user);
        await object.deleted(user)
        return yinStatus.OK(this.name + " #" + object._id + " 已删除")
    }

    deleted(object) {
        object._isDeleted = true
        for (let key in object) {
            if (!/^_/.test(key))
                delete object.key
        }
        console.log(...yinConsole.delete("#" + object._id, this.name, object._title))
    }

    async deleteOne(filter, user) {
        let object
        try {
            object = await this.findOne(filter, user)
            return object._delete(user)
        }
        catch (e) {

        }
    }

    findChildren(object) {

    }


    // objectUpdate(place, data) {
    //     return this.api.objectUpdate(place, data)
    // }
    //
    //
    // objectDelete(id) {
    //     return this.api.objectDelete(id)
    // }
    //
    // afterDelete(id) {
    //     const el = this.list[id];
    //     if (el) {
    //         el._isDeleted = true;
    //         this.api.afterDelete(el)
    //     }
    // }

    async upload(name, data, place, progress, user = this.yin.me) {
        place = Place.create(place)
        const parent = await this.get(place.id, user)
        await parent._manageable(user)
        if (this.yin.File.Types.includes(parent._schemaMix[place.key]?.type)) {
            const object = await this.yin.File.create(`/yin.file/${user._place}/${name || ''}`, data, progress, user)
            parent[place.key] = object._path
            await parent._save(user)
            return object._path
        }
        return yinStatus.NOT_ACCEPTABLE(`${place}不能上传文件`)
    }


    async find(filter = {}, sort = {}, limit = 50, skip = 0, user = this.yin.me) {
        const list = new YinArray({filter, sort}, this, user);
        await list.get(limit, skip)
        return list
    }

    async findOne(filter, user = this.yin.me) {
        const m = await this.api.findOne(filter), o = await this.assign(m, user)
        await o._readable(user)
        return o;
    }

    async runFunction(place, req, user = this.yin.me) {
        return this.api.runFunction(place, req, user)
    }
}
