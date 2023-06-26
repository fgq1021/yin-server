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
        } else {
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
    loading = false

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

    async get(num, skip = this.option.$skip) {
        if (this.api.place) {
            await this.children(num, skip)
        } else {
            await this.getWaiter(num, skip)
        }
    }

    async children(num, skip = this.option.$skip) {
        this.loading = true
        const res = await this.api.get(num, skip, this.user)
        let l = skip
        this.option.$skip = res.skip
        this.option.total = res.total
        if (skip === this.option.$skip)
            l = this.length
        for (let i in res.list) {
            this[l + Number(i)] = res.list[i]
        }
        this.loading = false
    }

    async getWaiter(limit = 50, skip = 0) {
        if (!this.loading)
            return this.getFromController(limit, skip);
        else
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(this.getWaiter(limit, skip))
                }, 100)
            });
    }

    async getFromController(limit = 50, skip = 0) {
        this.loading = true
        const res = await this.api.api.find(this.option.filter, this.option.sort, limit, skip)
        let cantRead = 0
        this.option.total = res.total
        this.option.$skip = res.skip
        for (let i in res.list) {
            await this.api.assign(res.list[i])
            try {
                this[skip + Number(i) - cantRead] = await this.api.get(res.list[i]._id, this.user)
            } catch (e) {
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
        this.loading = false
    }


    async refresh(length) {
        this.length = 0
        await this.get(this.option.$skip + length, 0)
    }

    create(object) {
        return this.api.create(object)
    }

    toJSON() {
        return new ResList(this.map(v => v), this.option)
    }
}


export class YinChildren {
    parent
    children = []
    childrenTotal = 0
    place
    loading = true
    yin
    module
    userList = {}
    readTimes = 0
    lastRead = new Date()

    constructor(place, yin, module) {
        this.place = Place.create(place)
        this.yin = yin
        this.module = module
        if (this.yin.reactive)
            this.userList = this.yin.reactive({})
    }

    get fixedList() {
        if (this.parent)
            return this.parent._map[this.place.key] || []
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
                keyName = this.parent._schemaMix[this.place.key]?.title
        }
        return ['#' + this.place['id.key'], "[" + this.module.name + "]", this.parent._title + '.' + keyName, this.list.length + '/' + this.total]
    }

    async init() {
        this.parent = await this.module.get(this.place.id, this.yin.me)
        this.module.api.watch(this.place)
        this.loading = false
        await this.getFromController(10, 0)
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
        const res = await this.getWaiter(limit, skip, user)
        return new ResList(res.list, res)
    }

    async getWaiter(limit = 50, skip = 0, user) {
        if (!this.loading)
            return this.getFromCache(limit, skip, user);
        else
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(this.getWaiter(limit, skip, user))
                }, 100)
            });
    }

    async getFromController(limit = 50, skip = 0) {
        this.loading = true
        let res = await this.module.api.children(this.place, limit, skip)
        this.childrenTotal = res.total
        for (let i in res.list) {
            await this.module.assign(res.list[i])
            this.children[Number(i) + skip] = res.list[i]._id;
        }
        if (skip) { // @ts-ignore
            console.log(...yinConsole.update(...this.logMark, limit, skip));
        } else { // @ts-ignore
            console.log(...yinConsole.load(...this.logMark));
        }

        this.loading = false
        return res
    }

    async getFromCache(limit = 50, skip = 0, user) {
        await this.parent._readable(user)
        limit = Number(limit)
        skip = Number(skip)
        // console.log('getFromCache', limit, skip)
        const res = [], notFoundFixedList = [], notFoundList = []
        let i = skip, manageable
        try {
            manageable = await this.parent._manageable(user)
        } catch (e) {

        }

        while ((res.length < limit) && (i < this.total)) {
            // console.log(res.length, limit, i, this.total)
            if (i < this.fixed) {
                for (let i in this.fixedList) {
                    try {
                        res.push(await this.yin.get(this.fixedList[i], user));
                    } catch (e) {
                        if (e.status === "NOT_FOUND")
                            notFoundFixedList.push(i);
                        else if (manageable)
                            res.push({_id: this.fixedList[i], hide: true})
                    }
                }
            } else {
                // const c = i - this.fixed
                let subId = this.children[i];
                if (!subId) {
                    await this.getFromController(limit + 50, i);
                    subId = this.children[i];
                }
                try {
                    const el = await this.module.get(subId, user);
                    res.push(el);
                } catch (e) {
                    if (e.status === "NOT_FOUND")
                        notFoundList.push(i);
                }
            }
            i++;
        }

        if (!this.yin.client) {
            notFoundFixedList.reverse();
            for (let index of notFoundFixedList) {
                this.parent._map[this.place.key].splice(index, 1);
            }

            if (notFoundFixedList.length)
                await this.parent._save(this.yin.me);
        }


        notFoundList.reverse()
        for (let index of notFoundList) {
            this.children.splice(index, 1);
        }

        // 此处返回的skip为：总列表鉴权后的skip数
        return new ResList(res, {skip: i, total: this.total})
    }


    async childrenPushed(id) {
        const firstList = await this.module.api.children(this.place, 1),
            firstObject = firstList.list[0]
        if (firstObject && firstObject._id === id) {
            return this.childrenRefresh(id, 'pushFirst')
        }

        if (this.children.length === this.childrenTotal) {
            await this.getFromController(1, this.childrenTotal)
            if (this.children[this.childrenTotal - 1] === id) {
                return this.refreshDone(id, 'pushLast', 1)
            }
            return this.childrenRefresh(id, 'clear')
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
        let length = 0
        switch (type) {
            case 'pushFirst':
                this.children.splice(1, 0, id)
                this.childrenTotal++
                length++
                break
            case 'pushLast':
                if (this.children.length === this.childrenTotal) {
                    await this.getFromController(1, this.childrenTotal)
                    length++
                }
                break
            case 'clear':
                console.log('childrenClear !!!!')
                this.children = []
                length++
                await this.getFromController(10, 0)
                break
            case 'refresh':
                length++
                await this.getFromController(10, 0)
                break
            case 'delete':
                const index = this.children.indexOf(id)
                // console.log(this.children)
                // console.log(id)
                // console.log(index)
                if (index !== -1) {
                    this.children.splice(index, 1)
                    if (this.children.length === this.childrenTotal) {
                        length--
                    }
                }
                break
            default:
                console.log('childrenRefresh not match', id, type)
                break
        }
        return this.refreshDone(id, type, length)
    }

    async refreshDone(id, type, length) {
        for (let u in this.userList) {
            await this.userList[u].refresh(length)
        }
        if (type === 'delete')
            this.parent.childrenDeleted(id)
        else
            this.parent.childrenPushed(id)
        this.module.objectUpdate(this.place, {type, changeId: id});
    }

    create(object) {
        return this.parent[this.place.key].create(object)
    }
}
