import {yinStatus} from "../lib/yin.status.js";
import {yinConsole} from "../lib/yin.console.js";
import {yinObject} from "./object.js";
import {YinArray, YinChildren} from "./array.js";

//TODO 下个版本要让Module也由yinObject拓展而来

export class Module {
    name
    title
    yin
    Object = class extends yinObject {
    }
    // Place
    api
    list = {}
    listWaiter = {}
    childrenList = {}
    /**
     * 防止vue创建的proxy代理到module内的项目，
     * 因为module有时候会挂载node中的基础功能，
     * 一旦发生reactive扩散，会造成莫名其妙的报错
     * @type {boolean}
     * @private
     */
    __v_skip = true

    constructor(yin, controller) {
        this.yin = yin
        this.api = new controller(yin, this)
    }

    init() {
        console.log(...yinConsole.load('模块', this.name))
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
        this.api.init()
    }

    regScripts(place) {
        for (let i in this.list) {
            const el = this.list[i];
            if (el._model) if (el._model.valueOf() === place.id || el._id === place.id)
                el._mapSchema();
        }
    }


    async assign(el) {
        // console.log(...yinConsole.update("#>>" + el._id, this.name, el._title))
        const id = el._id;
        let element = this.list[id];
        if (element && element._id) {
            if (new Date(el._updatedAt) > element._updatedAt) {
                if (el._model !== element._model.valueOf()) await this.yin.Model.get(el._model)
                this.list[id]._initialized = false
                Object.assign(this.list[id], el)
                this.list[id]._initialized = true
                console.log(...yinConsole.update("#" + el._id, this.name, el._title))
                this.api.objectUpdate(this.list[id]._place, {at: this.list[id]._updatedAt})
                this.list[id]._runEventFn('update', '更新')
                // this.api.eventSync(this.list[id], oldEl);
            }
        } else {
            if (el._model) await this.yin.Model.get(el._model)
            this.list[id] = this.Object.create(el)
            console.log(...yinConsole.load("#" + el._id, this.name, el._title))
            // this.api.eventSync(this.list[id]);
            this.api.watch(this.list[id]._place);
        }
        return this.list[id];
    }

    async refresh(id, at) {
        const o = this.list[id]
        if (o) {
            if (o._saving) {
                await o._saveWaiter
                return this.refresh(id, at)
            } else if (at) {
                if (new Date(at) > o._updatedAt) return o._refresh()
                return
            }
            return o._refresh()
        }
    }

    pull(object, key, value, nodeId) {
        return this.api.pull(object, key, value, nodeId)
    }

    async get(id, user = this.yin.me) {
        if (id) {
            try {
                const el = await this.getWaiter(id);
                await el._readable(user)
                this.api.objectRead(el._place, user)
                return el;
            } catch (e) {
                if (e.message === `未找到id为 #${id} 的${this.name}`) {
                    this.list[id] ??= {_isDeleted: true}
                }
                return Promise.reject(e)
            }
        }
        return yinStatus.NOT_FOUND('#id 为空')
    }

    async getWaiter(id) {
        if (id) {
            const cache = this.list[id];
            if (cache) {
                if (cache._isDeleted) return yinStatus.NOT_FOUND("未找到id为 #" + id + " 的" + this.name);
                return cache;
            } else {
                if (this.listWaiter[id]) return this.listWaiter[id]
                this.listWaiter[id] = this.getFromController(id)
                return this.listWaiter[id]
            }
        } else return yinStatus.NOT_ACCEPTABLE('没有ID');
    }

    // getFromCache(id) {
    //     return this.list[id]
    // }

    async getFromController(id) {
        try {
            const el = await this.assign(await this.api.get(id));
            delete this.listWaiter[id]
            return el
        } catch (err) {
            if (this.list[id]) this.list[id]._isDeleted = true; else this.list[id] = {_id: id, _isDeleted: true}
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
            const cache = this.childrenList[place];
            if (cache) {
                return cache
            } else {
                this.childrenList[place] = new YinChildren(place, this.yin, this)
                try {
                    await this.childrenList[place].init()
                } catch (e) {
                    delete this.childrenList[place]
                    return yinStatus.NOT_ACCEPTABLE('没有正确的Place');
                }
                return this.childrenList[place]
            }
        } else return yinStatus.NOT_ACCEPTABLE('没有正确的Place');
    }

    async childrenUpdate(place, id, type) {
        try {
            const children = this.childrenList[place];
            if (children) switch (type) {
                case 'push':
                    return children.childrenPushed(id)
                default:
                    return children.childrenRefresh(id, type)
            }
        } catch (e) {
            console.log(e)
        }
    }

// 创建时此选项会添加父元素的children
// el.pushParents = ['id.key',['id,key']]
    async create(object, user = this.yin.me) {
        return this.assign(await this.api.create(object, user))
    }

// 更新时此选项会添加父元素的children????
// el.pushParents = ['id.key',['id,key']]
    async save(object, option, user = this.yin.me) {
        let o = option, u = user
        if (!user && option && (option._name === 'User' || option._id || option._isRoot)) {
            u = option
            o = {}
        }
        await object._manageable(u)
        object.beforeSave(u);
        await this.assign(await this.api.save(object, o, u));
        object.saved(u);
        object._runEventFn('saved', u)
        return object;
    }

    async delete(o, user = this.yin.me) {
        const id = o._id || o;
        const object = await this.get(id, user)
        if (!this.yin.client) await object._refresh()
        if (await object._manageable(user)) {
            object.beforeDelete();
            await this.api.delete(id, user);
            object.deleted()
            this.afterDelete(id);
            return yinStatus.OK(this.name + " #" + id + " 已删除")
        }
        return yinStatus.UNAUTHORIZED('用户#' + user._title + '没有' + this.name + ' #' + id + ' 的管理权限')
    }

    objectUpdate(id, data) {
        return this.api.objectUpdate(id, data)
    }


    objectDelete(id) {
        return this.api.objectDelete(id)
    }

// async deleteFrom(el, placeString, user) {
//     const {id, place, key} = this.parsePlaceString(placeString);
//     const pIndex = el.parents.indexOf(id + "." + place + "." + key);
//     if (pIndex !== -1) {
//         el.parents.splice(pIndex, 1);
//         await el.save(user);
//     } else {
//         await this.removeChildren(await this.yin.get(placeString), el.name + "." + el._id + "." + place + "." + key, user);
//     }
// }

    afterDelete(id) {
        const el = this.list[id];
        if (el) {
            el._isDeleted = true;
            el._runEventFn('delete', '已删除')
            this.api.afterDelete(el)
        }
    }

    mapChange(object, old) {
        return this.api.mapChange && this.api.mapChange(object, old)
    }


    parentsChange(object, old) {
        return this.api.parentsChange && this.api.parentsChange(object, old)
    }

    async upload(file, id, place, key, progress, user = this.yin.me) {
        if (file && id) {
            return this.assign(await this.api.upload(file, id, place, key, progress, user));
        }
        return Promise.reject({status: "FORBIDDEN", message: "文件或ID格式不对"});
    }

    async uploadDirectory(file, id, place = "data", key = "sub", progress, user) {
        if (file && id) {
            return this.assign(await this.api.uploadDirectory(file, id, place, key, progress, user));
        }
        return Promise.reject({status: "FORBIDDEN", message: "文件或ID格式不对"});
    }

    async pushChildren(el, placeString, user = this.yin.me) {
        if (!el._id) el = await this.get(el);
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
        //     message: "您没有修改" + this.name + " #" + el._id + " 的权限"
        // });
    }

    async removeChildren(el, placeString, user = this.yin.me) {
        if (!el._id) el = await this.get(el);
        // el = await this.get(el, user);
        // const rights = this.rights(el, user);
        // if (rights.write()) {
        const {Unit, id, place, key} = this.yin.parsePlaceString(placeString), keyString = place + "." + key,
            childrenString = Unit + "-" + id;
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
        return Promise.reject({status: "FORBIDDEN", message: el.name + " #" + el._id + " 下没有固定此元素"});
        // }
        // return Promise.reject({status: "FORBIDDEN", message: "您没有修改" + el.name + " #" + el._id + " 的权限"});
    }

    async find(filter = {}, sort = {}, limit = 50, skip = 0, user = this.yin.me) {
        const list = new YinArray({filter, sort}, this, user);
        await list.get(limit, skip)
        return list
    }

    async findOne(filter, user = this.yin.me) {
        const m = await this.api.findOne(filter), o = await this.assign(m)
        if (await o._readable(user)) return o;
        return yinStatus.UNAUTHORIZED((user ? user.username + "#" + user._id : "匿名用户") + "没有查看该" + this.title + "的权限");
    }

    async runFunction(place, req, user = this.yin.me) {
        // const p = Place.create(place), object = await this.get(p.id, user), key = object._schema[p.key]
        // if (key.type !== 'Function') return yinStatus.NOT_ACCEPTABLE(`#${place} 不是功能类型`)
        // if (!this.yin.client) await object._refresh()
        // await object._manageable(user)
        return this.api.runFunction(place, req, user)
    }
}
