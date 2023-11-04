import {Place} from "./place.js";
import {yinConsole} from "../lib/yin.console.js";
import {hideProperty} from "../lib/yin.defineProperty.js";


/**
 * 为列表的返回创建一个标准接口
 */
export class ResList {
    list = []
    filter = {}
    sort = {}
    total = 0
    skip = 0

    constructor(list, option) {
        if (list.list && !option) {
            this.list = list.list
            option = list
        }
        else {
            this.list = list
        }
        delete option.list

        for (let key in option) {
            option[key] = option[key] || 0;
            option[key] = Number(option[key]) ? Number(option[key]) : option[key]
        }
        Object.assign(this, option)
    }
}

export class YinArray extends Array {
    static get [Symbol.species]() {
        return Array;
    }

    option = {
        filter: {},
        sort: {},
        total: 0,
        fixed: 0,
        $skip: 0
    }
    user
    api
    loading

    constructor(option, api, user) {
        super()
        Object.assign(this.option, option)
        this.api = api
        this.user = user

        hideProperty(this, 'api')
        hideProperty(this, 'user')
        hideProperty(this, 'loading')
        hideProperty(this, 'option')
    }

    async all() {
        await this.get(this.option.total)
    }

    async get(num, skip = this.option.$skip) {
        if (this.loading) await this.loading
        if (this.api.place) {
            this.loading = this.children(num, skip)
        }
        else {
            this.loading = this.getFromController(num, skip)
        }
        await this.loading
        this.loading = undefined
    }

    async children(num, skip = this.option.$skip) {
        const res = await this.api.get(num, skip, this.user)
        let l = skip
        this.option.$skip = res.skip
        this.option.total = res.total
        if (skip === this.option.$skip)
            l = this.length
        for (let i in res.list) {
            this[l + Number(i)] = res.list[i]
        }
    }

    // async getWaiter(limit = 50, skip = 0) {
    //     if (!this.loading)
    //         return this.getFromController(limit, skip);
    //     else
    //         return new Promise((resolve) => {
    //             setTimeout(() => {
    //                 resolve(this.getWaiter(limit, skip))
    //             }, 100)
    //         });
    // }

    async getFromController(limit = 50, skip = 0) {
        const res = await this.api.api.find(this.option.filter, this.option.sort, limit, skip)
        let cantRead = 0
        this.option.total = res.total
        this.option.$skip = res.skip
        for (let i in res.list) {
            await this.api.assign(res.list[i])
            try {
                this[skip + Number(i) - cantRead] = await this.api.get(res.list[i]._id, this.user)
            }
            catch (e) {
                cantRead++
            }
            // const object = await this.api.get(res.list[i]._id,this.user)
            // if (await object._readable(this.user))
            //     this[skip + Number(i) - cantRead] = object
            // else
            //     cantRead++
        }
        if (cantRead && res.skip < res.total) {
            await this.getFromController(Math.min(cantRead, res.total - res.skip), res.skip)
        }
    }

    fix(object) {
        if (this.api.place)
            return this.api.fix(object, this.user)
    }

    unFix(index) {
        if (this.api.place)
            return this.api.unFix(index, this.user)
    }

    async refresh(length) {
        if (this.loading) await this.loading
        this.length = 0
        await this.get(this.option.$skip + length, 0)
    }

    create(object) {
        return this.api.create(object)
    }

    toJSON() {
        return new ResList(this.map(v => v), this.option)
    }

    concat(...items) {
        const list = []
        for (let v of this) list.push(v)
        return list.concat(...items)
    }

    /**
     * 事件
     * @param {'mounted'|'push'|'remove'} event
     * @param {function} fn
     * @return {this}
     */
    on(event, fn) {
        this.api.eventFn[event] ??= [];
        this.api.eventFn[event].push(fn)
        return this
    }
}


/**
 * 自定义查询的数组无法稳定获得热更新
 * 手动刷新？自动刷新？还是不再缓存？
 */

export class YinChildren {
    parent
    children = []
    childrenTotal = 0
    place
    loading
    yin
    module
    userList = {}
    readTimes = 0
    lastRead = new Date()
    __v_skip = true


    constructor(place, yin, module) {
        this.place = Place.create(place)
        this.yin = yin
        this.module = module
        if (this.yin.reactive)
            this.userList = this.yin.reactive({})
    }

    get _place() {
        return this.place
    }

    get fixedList() {
        if (this.parent && this.parent._map[this.place.key] instanceof Array)
            return this.parent._map[this.place.key]
        return []
    }

    get list() {
        return this.fixedList.concat(this.children)
    }

    get fixed() {
        return this.fixedList.length
    }

    get total() {
        return this.fixed + this.childrenTotal
    }

    get logMark() {
        let keyName
        switch (this.place.key) {
            case '_manage':
                keyName = '可管理'
                break
            case '_read':
                keyName = '可读取'
                break
            default:
                keyName = this.parent._schemaMix[this.place.key]?.title || this.place.key
        }
        return ['#' + this.place['id.key.index'], "[" + this.module.name + "]", this.parent._title + '.' + keyName + '.' + this.place.index, this.list.length + '/' + this.total]
        //  return ['#' + this.place, "[" + this.module.name + "]", this.parent._title + '.' + keyName + '.' + this.place.index, this.list.length + '/' + this.total]
    }

    async init() {
        // console.log('init - ' + this.place)
        this.parent = await this.module.get(this.place.id, this.yin.me)
        // this.module.api.watch(this.place)
        await this.getFixedList()
        await this.getFromController(10, this.fixed)
        await this.getFromCache(this.fixed, 0)
        await this.runEventFn('mounted')
        return this
    }


    toArray(user, once) {
        if (once)
            return new YinArray({}, this, user)
        else if (user) {
            if (this.userList[user._id])
                return this.userList[user._id]
            else
                this.userList[user._id] = new YinArray({}, this, user)
            return this.userList[user._id]
        }
    }

    find(filter, sort, limit = 50, skip = 0, user) {
        return this.get(limit, skip, user)
    }

    async get(limit = 50, skip = 0, user) {
        limit = Number(limit)
        skip = Number(skip)
        this.readTimes++
        this.lastRead = new Date()
        if (this.loading) await this.loading
        const res = await this.getFromCache(limit, skip, user)
        return new ResList(res.list, res)
    }

    fixDeleteFunctionList = {}

    async getFixedList() {
        // console.log('getFixedList', this.place, this.parent._title)
        // console.log(this.parent._map)
        const unCacheList = {}, deleteList = []
        for (let f of this.fixedList) {
            if (!this.yin[f.module].list[f.id]) {
                unCacheList[f.module] ??= []
                unCacheList[f.module].push(f.id)
            }
        }
        // console.log(unCacheList)
        for (let module in unCacheList) {
            const ids = unCacheList[module], res = await this.yin[module].find({_id: ids}, {}, ids.length, 0)
            // console.log(ids, res)
            if (!this.yin.client)
                if (ids.length !== res.length) {
                    for (let id of ids) {
                        if (res.findIndex(o => o._id === id) === -1) {
                            this.yin[module].list[id] = {_id: id, _isDeleted: true}
                        }
                    }
                }
        }
        if (!this.yin.client) {
            for (let p in this.fixDeleteFunctionList) {
                try {
                    const object = await this.yin.get(p)
                    object._removeEvent('delete', this.fixDeleteFunctionList[p])
                }
                catch (e) {
                }
            }
            for (let i in this.fixedList) {
                try {
                    const object = await this.yin.get(this.fixedList[i])
                    this.fixDeleteFunctionList[object._place] = async () => {
                        if (object._place.valueOf() === this.parent._map[this.place.key][i].valueOf()) {
                            // console.log('object delete in fixedList', i, object._place.valueOf())
                            this.parent._map[this.place.key].splice(i, 1);
                            await this.parent._save(this.yin.me);
                        }
                        else {
                            console.log('!!!!!!!!!!!!!!!')
                            console.log('object delete in fixedList', i, object._place.valueOf(), this.parent._map[this.place.key])
                        }
                    }
                    object._on('delete', this.fixDeleteFunctionList[object._place])
                }
                catch (e) {
                    if (e.status === "NOT_FOUND") {
                        deleteList.push(i)
                    }
                }
            }
            deleteList.reverse();
            for (let index of deleteList) {
                this.parent._map[this.place.key].splice(index, 1);
            }

            if (deleteList.length)
                await this.parent._save(this.yin.me);
        }
    }

    async getFromController(limit = 50, skip = 0) {
        if (this.loading) await this.loading
        this.loading = this._getFromController(limit, skip)
        return this.loading

        // return this._getFromController(limit, skip)
    }

    async _getFromController(limit = 50, skip = 0) {
        // console.assert(false, this.place.valueOf(), limit, skip)
        let res = await this.module.api.children(this.place, limit, skip)
        this.childrenTotal = res.total - this.fixed
        for (let i in res.list) {
            const object = await this.module.assign(res.list[i])
            this.children[Number(i) + skip - this.fixed] = object._id;
        }
        if (skip) {
            console.log(...yinConsole.load(...this.logMark, limit, skip));
        }
        else {
            console.log(...yinConsole.load(...this.logMark));
        }
        this.loading = false
        return res
    }

    async getFromCache(limit = 50, skip = 0, user = this.yin.me) {
        if (this.loading) await this.loading
        await this.parent._readable(user)
        limit = Number(limit)
        skip = Number(skip)
        const res = [], notFoundFixedList = [], notFoundList = []
        let i = skip, manageable
        try {
            manageable = await this.parent._manageable(user)
        }
        catch (e) {

        }

        while ((res.length < limit) && (i < this.total)) {
            if (i < this.fixed) {
                try {
                    res.push(await this.yin.get(this.fixedList[i], user));
                }
                catch (e) {
                    if (e.status !== "NOT_FOUND" && manageable)
                        res.push({_id: this.fixedList[i], _hide: true})
                }
            }
            else {
                const c = i - this.fixed
                let subId = this.children[c];
                if (!subId) {
                    await this.getFromController(limit + 50, i);
                    subId = this.children[c];
                }
                try {
                    const el = await this.module.get(subId, user);
                    res.push(el);
                }
                catch (e) {
                    if (e.status === "NOT_FOUND")
                        notFoundList.push(i);
                }
            }
            i++;
        }

        // if (!this.yin.client) {
        //     notFoundFixedList.reverse();
        //     for (let index of notFoundFixedList) {
        //         this.parent._map[this.place.key].splice(index, 1);
        //     }
        //
        //     if (notFoundFixedList.length)
        //         await this.parent._save(this.yin.me);
        // }

        notFoundList.reverse()
        for (let index of notFoundList) {
            this.children.splice(index, 1);
        }

        // 此处返回的skip为：总列表鉴权后的skip数
        return new ResList(res, {skip: i, total: this.total})
    }


    async childrenPushed(id) {
        const firstList = await this.module.api.children(this.place, 1, this.fixed),
            firstObject = firstList.list[0]
        if (firstObject && firstObject._id === id) {
            return this.childrenRefresh(id, 'pushFirst')
        }

        //  console.log(this.children.length, this.childrenTotal)

        if (this.children.length === this.childrenTotal) {
            await this.getFromController(1, this.total)
            if (this.children[this.childrenTotal - 1] === id) {
                return this.refreshDone(id, 'pushLast', 1)
            }
            // return this.childrenRefresh(id, 'clear')
        }
        return this.childrenRefresh(id, 'refresh')
    }

    // async childrenDeleted(id) {
    //     const index = this.children.indexOf(id)
    //     if (index !== -1) {
    //         this.children.splice(index, 1)
    //         this.module.objectUpdate(this.place, {type: 'delete', changeId: id});
    //         this.parent.childrenDeleted(this.place.key, id);
    //     }
    // }

    async childrenRefresh(id, type) {
        // console.assert(false, this.place.valueOf(), id, type)
        let length = 0
        switch (type) {
            case 'pushFirst':
                this.children.splice(0, 0, id)
                this.childrenTotal++
                length++
                break
            case 'pushLast':
                if (this.children.length === this.childrenTotal) {
                    this.children.push(id)
                    length++
                }
                this.childrenTotal++
                break
            // case 'clear':
            //     console.log('childrenClear !!!!')
            //     this.children = []
            //     length++
            //     await this.getFromController(10, 0)
            //     break
            case 'refresh':
                length++
                await this.getFromController(this.children.length + 1, this.fixed)
                break
            case 'delete':
                const index = this.children.indexOf(id)
                if (index !== -1) {
                    this.children.splice(index, 1)
                    this.childrenTotal--
                    // if (this.children.length === this.childrenTotal) {
                    //     length--
                    // }
                }
                break
            case 'fixChange':
                await this.module.get(this.place.id)
                await this.getFixedList()
                length = this.fixed - id.length
                if (length < 0)
                    length = 0
                break
            default:
                console.log('childrenRefresh not match', id, type)
                break
        }
        // console.log(this.list)
        // console.log(length)
        return this.refreshDone(id, type, length)
    }

    async refreshDone(id, type, length) {
        for (let u in this.userList) {
            await this.userList[u].refresh(length)
        }
        if (type === 'delete')
            this.runEventFn('remove', id)
        else
            this.runEventFn('push', id)

        // this.module.objectUpdate(this.place, {type, changeId: id});
        // this.runEventFn(type, length, id)
        this.module.yin.objectEvent(this, type, id, length)
    }

    create(object) {
        return this.parent[this.place.key].create(object)
    }

    fix(object, user) {
        return this.parent._fixChild(object, this.place.key, user)
    }

    unFix(index, user) {
        return this.parent._unfixChild(index, this.place.key, user)
    }

    eventFn = {};


    /**
     * 事件
     * @param {'mounted'|'push'|'remove'} event
     * @param {function} fn
     * @return {this}
     */
    on(event, fn) {
        this.eventFn[event] ??= [];
        this.eventFn[event].push(fn)
        return this
    }

    removeEvent(event, fn) {
        if (this.eventFn[event]) {
            const i = this.eventFn[event].indexOf(fn)
            if (i !== -1) this.eventFn[event].splice(i, 1)
        }
        return this
    }


    async runEventFn(event, ...args) {
        const ce = 'children' + event.charAt(0).toUpperCase() + event.slice(1)
        if (this.module[ce]) await this.module[ce](this, ...args)
        if (this.module.api[ce]) await this.module.api[ce](this, ...args)

        let res
        // if (this[event]) {
        //     try {
        //         res = await this[event](...args)
        //     }
        //     catch (e) {
        //         console.log(...yinConsole.error(`#${this.place}`, `${event}() 运行出错\n`, e));
        //     }
        // }
        const list = this.eventFn[event];
        if (list)
            for (let i in list) {
                try {
                    await list[i](...args)
                }
                catch (e) {
                    console.log(...yinConsole.error(`#${this.place}`, `on('${event}') 运行出错\n`, e));
                }
            }
        await this.module.yin.objectEvent(this, ce, ...args)
        return res;
    }
}
