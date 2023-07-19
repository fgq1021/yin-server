import {yinStatus} from "../lib/yin.status.js";
import {Key} from "./key.js";
import {Place} from "./place.js";
import {hideProperty} from "../lib/yin.defineProperty.js";
import {yinAssign, yinParse} from "../lib/yin.assign.js";
import {Types} from "./type.js";

export class Schema extends Array {
    static get [Symbol.species]() {
        return Array;
    }

    static create(schema) {
        const _schema = new Proxy(new this(), {
            set(target, p, key) {
                if (Number.isInteger(Number(p))) {
                    target[p] = Key.create(key)
                    target.__changed(target[p])
                    target[p].change(key => {
                        target.__changed(key)
                    })
                } else {
                    target[p] = key
                }
                return true
            },
            get(target, p) {
                if (target.hasOwnProperty(p) || target[p]) return target[p]
                for (let i in target) {
                    if (target[i].name === p) return target[i]
                }
                for (let i in target) {
                    if (target[i].title === p) return target[i]
                }
                return target[p]
            }
        })
        hideProperty(_schema, '__eventFn')
        Object.assign(_schema, schema)
        return _schema
    }

    toDataBaseSchema(ObjectId) {
        const schema = {}
        for (let key of this) {
            const t = Types[key.type], name = '_' + key.name
            if (t?.defaultConstructor === 'ObjectId')
                schema[name] = {type: ObjectId, ref: key.type, index: true}
            else
                schema[name] = t ? t.defaultConstructor : null
            // if (key.index)
            //     schema[name].index = key.index
        }
        return schema
    }

    toModuleObjectSchema() {
        const schema = Schema.create([])
        for (let i in this) {
            if (!this[i].private) {
                const key = new Key(this[i])
                key.name = '_' + key.name
                schema.push(key)
            }
        }
        return schema
    }

    __eventFn = [];

    __change(fn) {
        this.__eventFn.push(fn)
        return this
    }

    __removeEvent(fn) {
        const i = this.__eventFn.indexOf(fn)
        if (i !== -1) this.__eventFn.splice(i, 1)
        return this
    }

    async __changed(msg) {
        for (let fn of this.__eventFn) {
            fn && await fn(msg)
        }
        return true;
    }
}


export const basicSchema = Schema.create([
    {
        name: 'title',
        title: '标题',
        type: 'String'
    },
    {
        name: 'hold',
        title: '自锁',
        note: '打开此项将关闭数据的实时同步',
        type: 'Boolean'
    },
    {
        name: 'owner',
        title: '所有者',
        type: 'User'
    },
// 所属的实例ID
    {
        name: 'instance',
        title: '所属实例',
        type: 'System'
    },
// accessControl:['userid._read.0(继承层数)','userid._manage','userid._deny'...]
    {
        name: 'accessControl',
        title: '权限',
        type: 'AccessControl'
    },
    /**
     * @example parents:['id.key']
     * @example User.parents 权限给予 'userid._manage'
     */
    {
        name: 'parents',
        title: '父映射',
        type: 'Parents'
    },
    /**
     * @example _map:{key:['modules.id']||'modules.id'||'modules.id.key'}
     */
    {
        name: 'map',
        title: '子映射',
        type: 'Children'
    },
    {
        name: 'model',
        title: '模型',
        type: 'Model'
    },
    {
        name: 'data',
        title: '数据',
        type: 'JSON',
        private: true
    },
    {
        name: 'schema',
        title: '结构',
        type: 'Schema'
    },
    {
        name: 'private',
        title: '隐藏',
        type: 'Boolean'
    }
])

/**
 * 引[对象OS] 中最基础的对象Class，一切结构都是由此推展开来
 */
export class yinObject {
    /**
     * 特殊类型
     * @private
     */
    static module
    _module
    //TODO 保留这个临时集合，还是把所有临时数据都放在第一层来Proxy？，然后用hideKeys来隐藏
    _ = {
        model: undefined,
        eventFn: {},
        keyWaiter: {}
    }
    /**
     * 当此值为false时，对该对象赋值不会触发更新
     * @private
     */
    _initialized
    /**
     * 当此值为true时，对该对象赋值不会触发更新
     * @private
     */
    _hold
    _changed
    _saving = false
    _saveWaiter

    get _place() {
        return new Place(this._module, this._id)
    }

    get _name() {
        return this._module?.name
    }

    /**
     * 基础类型
     */
    _title
    _id
    _instance
    _owner
    _model
    _map = {}
    _parents = []
    _updatedAt
    _createdAt

    constructor(module, id) {
        this._module ??= module
    }

    static hideKeys = ['_', '__v', '_changed', '_saving', '_isDelete',
        '_module', '_setter', '_getter', '_eventFn', '_keyWaiter', '_initialized', '_saveWaiter']


    /**
     * 创建yinObject的代理，代理会处理对象的setter和getter
     * 直接new yinObject(...arg) 创建的对象不会被处理setter和getter
     * @param object 数据 - 对象的数据
     * @return {yinObject}
     */
    static create(object = {}) {
        const o = new Proxy(new this(this.module), {
            deleteProperty: (target, p) => {
                if (target._map[p])
                    delete target._map[p]
                else
                    delete target[p]
                return true
            },
            get: (target, key, proxy) => {
                // console.log('get', target._title, key, target[key], target._getter, this.getter[key])
                if (target._getter[key]) return target._getter[key].call(proxy, target);
                else if (this.getter[key]) return this.getter[key].call(proxy, target);
                else return target[key]
            },
            set: (target, key, value, proxy) => {
                // console.log('set', target._title, key, value, target._setter[key], this.setter[key])
                // if (!target._initialized && this.hideKeys.indexOf(key) === -1) {
                //     console.log(Date.now())
                // }
                let setStatus = true
                if (target._setter[key]) setStatus = target._setter[key].call(proxy, value, target, proxy);
                else if (this.setter[key]) setStatus = this.setter[key].call(proxy, value, target, proxy);
                else target[key] = value
                if (setStatus && !target._hold && target._initialized && this.hideKeys.indexOf(key) === -1) {
                    proxy._changed = true
                    this.module.pull(proxy, key, target[key])
                }
                return setStatus
            }
        })
        for (let k of this.hideKeys)
            hideProperty(o, k)
        Object.assign(o, object)
        o._initialized = true
        return o
    }

    static schema = basicSchema


    /**
     * 用proxy代理不同用户的数据处理，以鉴权
     * @param user
     * @return {yinObject}
     */
    auth(user) {
        return new Proxy(this, {
            get(target, p) {

            }
        })
    }

    /**
     * 为键值创建Proxy setter,
     * 在key赋值的时候运行的函数,
     * @type {{键: function(value, object): boolean}}
     * @param {value} 值 - 赋予新的值
     * @param {object} 对象 - 当前对象
     * @return {boolean} 此次赋值是否成功
     */
    static setter = {
        _updatedAt(value, object) {
            object._updatedAt = new Date(value)
            return true
        },
        _createdAt(value, object) {
            object._createdAt = new Date(value)
            return true
        },
        _model(value, object) {
            object._model = value
            if (value) {
                object._.model = object._module?.yin.Model.getFromCache(value)
                if (object._.model) {
                    object._.model._schema.__change(key => {
                        object._mapKey(key)
                    })
                    object._mapSchema()
                }
            }
            return true
        },
        _schema(value = [], object) {
            object._schema = Schema.create(value)
            object._schema.__change(key => {
                object._mapKey(key)
            })
            object._mapSchema()
            return true
        },
        // /**
        //  * 需要在map变更中处理更新函数
        //  * @param value
        //  * @param object
        //  * @return {boolean}
        //  * @private
        //  */
        _map(value, object) {
            // const old = object._map
            object._map = _mapProxy(value)
            // if (JSON.stringify(old) !== '{}')
            //     object._module.mapChange(this, old)
            return true
        },
        /**
         * 需要在parents变更中处理更新函数
         * @param value
         * @param object
         * @return {boolean}
         * @private
         */
        _parents: (value, object) => {
            object._parents = new Parents(...value)
            return true
        }
    }

    _setter = {}

    /**
     * 为键值创建Proxy getter,
     * 在key取值的时候运行的函数,
     * @type {{键: function(object): *}}
     * @param {object} 对象 - 当前对象
     * @return {*} 此次取值经过函数处理后的值
     */
    static getter = {}
    _getter = {}

    /**
     * _schema 相关操作
     */
    _schema = []

    get _schemaMix() {
        const schemaMix = this._.model?._schema || []
        for (let key of this._schema) {
            const i = schemaMix.findIndex(mKey => mKey.name === key.name)
            if (i === -1) schemaMix.push(key)
            else schemaMix[i] = key
        }
        return Schema.create(schemaMix)
    }

    _mapSchema() {
        this._setter = {}
        this._getter = {}
        const scripts = this._module.yin.scripts,
            script = scripts[this._place] || scripts[this._.model?._place]
        Object.assign(this, script)
        for (let key of this._schemaMix) {
            this._mapKey(key)
        }
    }

    /**
     * 暂时只有Object和Array需要匹配映射
     * @param key
     * @private
     */
    _mapKey(key) {
        // if (key.private)
        //     this._privateKeys.push(key.name)
        if (key.type === 'Array') {
            this[key.name] ??= ArrayKey.create(this, key.name)
            this._setter[key.name] = function (value, object) {
                if (object._initialized === false) {
                    ArrayKey.findChange(this, key.name, value)
                }
                object[key.name] = ArrayKey.create(this, key.name, value)
                return true
            }
        } else if ((this._module?.yin?.structureType || ['System', 'Object']).indexOf(key.type) !== -1) {
            if (/^_/.test(key.name))
                this._getter[key.name] = function (object) {
                    return new ObjectKey(object, key.name, key.type)
                }
            else {
                this._setter[key.name] = function (value, object) {
                    // console.log('=================')
                    // console.log(object._title, key.name, value, JSON.stringify(object._map))
                    /**
                     * objectKey toJSON的时候默认为null
                     * 所以此位置不能通过赋值为null进行删除
                     * 请使用objectKey.remove()删除
                     */
                    if (value)
                        object._map[key.name] = value instanceof yinObject ? value._place : value
                    if (value && object._name === 'Model' && object._schema[key.name]) {
                        object._schema[key.name].settings.manualCreation = true
                    }
                    return true
                }
                this._getter[key.name] = function (object) {
                    return new ObjectKey(this, key.name)
                }
            }
        } else if (key.type === 'Function') {
            if (!(this[key.name] instanceof Function)) {
                this[key.name] = (req, user) => {
                    return this._module.runFunction(this._place.toKey(key.name), req, user)
                }
            }
        }
    }

    // _privateKeys = []
    // static privateKeys = []

    static mapSchema() {
        for (let key of this.schema) {
            const name = '_' + key.name
            // if (key.private)
            //     this.privateKeys.push(name)
            if (key.type === 'Array')
                this.setter[name] = (value, object, proxy) => {
                    object[name] = ArrayKey.create(proxy, name, value)
                    return true
                }
            else if ((this.module?.yin?.structureType || ['System', 'Object']).indexOf(key.type) !== -1) {
                this.getter[name] = (object, proxy) => {
                    return new ObjectKey(object, name, key.type)
                }
            }
        }
    }


    /**
     * 匿名用户请传入{}
     * 如果留空则使用 yin.me
     * @param user
     */
    async _readable(user = this._module?.yin.me || {}) {
        if (!this._private)
            return true
        if (!user._id)
            return yinStatus.UNAUTHORIZED(`用户User #匿名 没有查看 ${this._name} #${this._id} 的权限`)
        if (this._owner?.valueOf() === user._id)
            return true

        try {
            const owner = await this._owner
            if (owner._parents.indexOf(this._place.toIdKey('_read')) !== -1)
                return true
        } catch (e) {

        }
        try {
            return await this._manageable(user)
        } catch (e) {
            return yinStatus.UNAUTHORIZED(`用户User #${user._id} 没有查看 ${this._name} #${this._id} 的权限`)
        }
    }

    /**
     * 匿名用户请传入{}
     * 如果留空则使用 yin.me
     * @param user
     */
    async _manageable(user = this._module?.yin.me || {}) {
        /**
         * 匿名检查
         */
        if (!user._id)
            return yinStatus.UNAUTHORIZED(`用户User #匿名 没有管理 ${this._name} #${this._id} 的权限`)
        /**
         * 所有者检查
         */
        if (this._owner.valueOf() === user._id)
            return true
        /**
         * 管理员检查
         */
        if (this._module?.yin.me._isRoot && (user === this._module.yin.me))
            return true
        /**
         * 可管理者检查
         * @type {*}
         */
        try {
            const owner = await this._owner
            if (owner._parents.indexOf(this._place.toIdKey('_manage')) !== -1)
                return true
        } catch (e) {

        }
        return yinStatus.UNAUTHORIZED(`用户User #${user._id} 没有管理 ${this._name} #${this._id} 的权限`)
    }


    _refresh() {
        if (this._module.listWaiter[this._id]) return this._module.listWaiter[this._id]
        this._module.listWaiter[this._id] = this._module.getFromController(this._id)
        return this._module.getFromController(this._id)
    }

    async _createChild(object = {}, key, user) {
        let req = yinParse(object)
        // 创建副本
        if (req._id) {
            delete req._parents
            delete req._owner
            delete req._id
            delete req._map
            req._title ??= ''
            req._title += '的副本'
        }
        const k = typeof key === "string" ? this._schemaMix[key] : key
        let module = req._name
        if (k?.type === 'Object' || k?.type === 'Array')
            module ??= this._name
        else
            module ??= k?.type
        if (k.type !== 'Array') req._pushParents = [this._place.toKey(k.name)]
        else if (module !== this._name) req._pushParents = [[this._place.toKey(k.name)]]
        else if (!req._pushParents?.length) {
            if (!(req._parents instanceof Array)) req._parents = []
            req._parents.push(this._id + '.' + k.name)
        }
        req._title ??= k.title
        if (!req._model && this._name !== 'Model')
            try {
                const parentModel = await this._model
                if (parentModel._id !== this._id) {
                    const models = await parentModel[k.name], model = models._id ? models : models[0]
                    if (model._id) {
                        req._model = model._id
                    }
                }
            } catch (e) {
                // console.log(e)
            }
        if (req._model) {
            const model = await this._module.yin.Model.get(req._model)
            for (let {name} of model._schema) {
                req[name] ??= model[name]
            }
        }

        // console.log('_createChild', module, req)
        return this._module.yin[module].create(req, user)
    }

    async _pushChild(object, key, user) {
        const k = typeof key === "string" ? this._schemaMix[key] : key,
            o = (object instanceof Place || typeof object === 'string') ? await this._module.yin.get(object) : object
        if (k.type === 'Array' && o._name === this._name) {
            o._parents.push(this._place.toIdKey(k))
            return o._save(user)
        } else if (k.type === 'Array') {
            if (!this._map[k.name] instanceof Array)
                this._map[k.name] = []
            this._map[k.name].push(o._place)
        } else if (this._module.yin.structureType.indexOf(k.type) !== -1)
            this._map[k.name] = o._place
        return this._save(user)
    }

    async _removeChild(object, key, user) {
        const k = typeof key === "string" ? this._schemaMix[key] : key,
            o = (object instanceof Place || typeof object === 'string') ? await this._module.yin.get(object) : object
        if (k.type === 'Array') {
            const i = o._parents.indexOf(this._place.toIdKey(k))
            if (i !== -1) {
                o._parents.splice(i, 1)
                return o._save(user)
            }

            /**
             * 列表固定的项目处理
             */
            if (this._map[k.name]) {
                const i = this._map[k.name].findIndex(p => p.valueOf() === o._place.valueOf())
                if (i !== -1) {
                    this._map[k.name].splice(i, 1)
                    return this._save(user)
                }
            }
        } else if (this._module.yin.structureType.indexOf(k.type) !== -1) {
            if (this._map[k.name]?.valueOf() === o._place.valueOf()) delete this._map[k.name]
            return this._save(user)
        }
        return yinStatus.NOT_FOUND(`${this._title}.${k.title}没有${o.title}`)
    }

    async _fixChild(object, key, user) {
        await this._manageable(user)
        this._map[key] ??= []
        this._map[key].push(object)
        await this._save(user)
        const parentsIndex = object._parents.indexOf(this._place.toKey(key)['id.key'])
        if (parentsIndex !== -1) {
            await object._manageable(user)
            object._parents.splice(parentsIndex, 1)
            await object._save(user)
        }
        return this
    }

    async _unfixChild(index, key, user) {
        await this._manageable(user)
        this._map[key] ??= []
        const unFix = this._map[key][index]
        this._map[key].splice(index, 1)
        await this._save(user)

        const object = await this._module.yin.get(unFix)
        await object._manageable(user)
        object._parents.push(this._place.toKey(key)['id.key'])
        await object._save(user)

        return this
    }

    async _save(option, user) {
        if (this._saving)
            await this._saveWaiter
        this._saveWaiter = this._module.save(this, option, user);
        this._saving = true
        const o = await this._saveWaiter
        this._saving = false
        return o
    }

    async _delete(user) {
        return this._module.delete(this, user)
    }

    _keyWaiter = {}
    _eventFn = {};

    _on(event, fn) {
        this._eventFn[event] ??= [];
        this._eventFn[event].push(fn)
        return this
    }

    _removeEvent(event, fn) {
        if (this._eventFn[event]) {
            const i = this._eventFn[event].indexOf(fn)
            if (i !== -1) this._eventFn[event].splice(i, 1)
        }
        return this
    }

    _runEventFn(event, msg) {
        for (let fn of this._eventFn[event] || []) {
            //
            // console.log('_runEventFn=================>')
            // console.log(fn)
            fn && fn(msg)
        }
        return true;
    }

    // _toJson() {
    //     const o = yinParse(this)
    //     for (let i in o._) {
    //         o['$' + i] = o._[i]
    //     }
    //     for (let i in o._data) {
    //         o[i] = o._data
    //     }
    //     delete o._
    //     delete o._data
    //     return o
    // }

    /**
     * TODO 等有劲儿了根据Schema手写一个 字符串转化，提升下速度
     */
    // toJSON() {
    //     return ''
    // }

    /**
     * 生命周期函数
     */

    // mounted(user) {
    // }

    beforeDestroy(user) {
    }

    created(user) {
    }

    beforeSave(user) {
    }

    saved(user) {
    }

    beforeDelete(user) {
    }

    deleted(user) {
    }

    childrenSaved(user) {
    }

    childrenPushed(key, id) {
    }

    childrenDeleted(user) {
    }

    //
    // async then(resolve, reject) {
    //     try {
    //         resolve(await this._refresh())
    //     } catch (e) {
    //         reject(e)
    //     }
    // }
}


/**
 * yinObject自带的一些键值
 */


export function _mapProxy(map = {}) {
    const _map = new Proxy({}, {
        set(target, p, newValue) {
            if (newValue instanceof Array) target[p] = _mapArrayProxy(newValue)
            else {
                if (newValue instanceof yinObject)
                    target[p] = newValue._place
                else
                    target[p] = Place.create(newValue)
            }
            return true
        }
    })
    Object.assign(_map, map)
    return _map
}

export function _mapArrayProxy(list) {
    const _mapArray = new Proxy([], {
        set(target, p, newValue) {
            if (Number.isInteger(Number(p))) {
                let value
                if (newValue instanceof yinObject)
                    value = newValue._place
                else
                    value = Place.create(newValue)
                if (target.findIndex(v => v.valueOf() === v) === -1)
                    target[p] = value
                else
                    return false
            } else {
                target[p] = newValue
            }
            return true
        }
    })
    Object.assign(_mapArray, list)
    return _mapArray
}

export class Parents extends Array {
    get [Symbol.species]() {
        return Array;
    }

    push(...ids) {
        const list = []
        for (let id of ids) {
            if (this.indexOf(id) === -1)
                list.push(id)
        }
        return super.push(...list)
    }
}


export class ObjectKey {
    object
    key
    module

    /**
     * @param object 对象
     * @param key 键值
     * @param module 模块 - 当key以_开头时需要传入，此时该位置不是一个Place，只有id
     */
    constructor(object, key, module) {
        this.object = object
        this.key = key
        this.module = module
    }

    async models() {
        try {
            const parentModel = await this.object._model
            if (parentModel._id !== this.object._id) {
                const models = await parentModel[this.key]
                return models._id ? [models] : models
            }
        } catch (e) {
            return []
        }
    }

    createWaiter(user) {
        if (this.object._keyWaiter[this.key])
            return this.object._keyWaiter[this.key]
        this.object._keyWaiter[this.key] = this.create({}, user)
        return this.object._keyWaiter[this.key]
    }

    async create(object, user) {
        const o = await this.object._createChild(object, this.key, user)
        delete this.object._keyWaiter[this.key]
        // console.log(o)
        return o
    }

    async remove() {
        if (/^_/.test(this.key))
            this.object[this.key] = undefined
        else
            delete this.object._map[this.key]
        return this.object._save()
    }

    async auth(user) {
        const object = this.object, yin = object._module.yin, k = this.key
        if (/^_/.test(k))
            return yin[this.module].get(object[k], user)

        if (object._map[k] instanceof Array)
            object._map[k] = object._map[k][0]

        try {
            return await yin.get(object._map[k], user)
        } catch (e) {
            if (e.status === 'NOT_FOUND' && object._name !== 'Model') {
                const model = object._.model
                if (model && model._schema[k] && !model._schema[k].settings?.manualCreation) {
                    try {
                        const models = await model[k]
                        if (models._id || models.length) {
                            return await this.createWaiter(user)
                        }
                    } catch (e) {
                        if (e.status !== 'NOT_FOUND')
                            return Promise.reject(e)
                    }
                }
            }
            return Promise.reject(e)
        }
    }

    get place() {
        const k = this.key
        if (/^_/.test(k))
            return new Place(this.module, this.object[k])
        return this.object._map[k]
    }

    toJSON() {
        if (/^_/.test(this.key) && this.object[this.key])
            return this.object[this.key]
        // else
        //     return undefined
    }

    valueOf() {
        return this.toJSON()
    }

    async then(resolve, reject) {
        // console.log(this.object._title, this.key, 'then======================>')
        try {
            resolve(await this.auth())
        } catch (e) {
            reject(e)
        }
    }
}

export class ArrayKey {
    finder = null
    index
    /**
     * 开放创建
     */
    open = false
    object
    key

    constructor(object, key, value) {
        hideProperty(this, 'object')
        hideProperty(this, 'key')
        if (value)
            Object.assign(this, value)
        this.object = object
        this.key = key
    }

    static create(object, key, value = {}) {
        value.index ??= {default: {}}
        value.index.default ??= {}
        value.index = this.indexesProxy(object, key, value.index)
        return new Proxy(new ArrayKey(object, key, value), {
            deleteProperty: (target, p) => {
                delete target[p]
                this.pull(object, key)
                return true
            },
            get(target, p, receiver) {
                if (target[p])
                    return target[p]
                else if (target.index[p])
                    return {
                        auth(user) {
                            return object._module.children(new Place(object._place, key, p), user)
                        },
                        async then(resolve, reject) {
                            try {
                                resolve(await this.auth())
                            } catch (e) {
                                reject(e)
                            }
                        }
                    }
                return target[p]
            },
            set: (target, p, value, proxy) => {
                if (p === 'index')
                    target.index = this.indexesProxy(object, key, value)
                else
                    target[p] = value
                this.pull(object, key)
                return true
            }
        })
    }

    static indexesProxy(object, key, value = {default: {_id: 1}}) {
        for (let i in value) {
            value[i] = this.indexProxy(object, key, i, value[i])
        }
        return new Proxy(value, {
            deleteProperty: (target, p) => {
                delete target[p]
                this.pull(object, key, p)
                return true
            },
            set: (target, p, value, proxy) => {
                target[p] = this.indexProxy(object, p, key, value)
                this.pull(object, key, p)
                return true
            }
        })
    }

    static indexProxy(object, key, i, value) {
        return new Proxy(value, {
            deleteProperty: (target, p) => {
                delete target[p]
                this.pull(object, key, i)
                return true
            },
            set: (target, p, value, proxy) => {
                target[p] = value
                this.pull(object, key, i)
                return true
            }
        })
    }


    static findChange(object, key, value = {}) {
        const _value = object[key]
        // console.log(!_value.finder !== !value.finder, JSON.stringify(_value.finder) !== JSON.stringify(value.finder))
        if (!_value.finder !== !value.finder || JSON.stringify(_value.finder) !== JSON.stringify(value.finder)) {
            const list = {}
            for (let i in value.index) {
                list[i] = true
                this.refreshChildren(object, key, i)
            }
            for (let i in _value.index) {
                if (!list[i])
                    this.refreshChildren(object, key, i)
            }
            return
        }
        this.findIndexChange(object, key, value.index)
    }

    static findIndexChange(object, key, index = {}) {
        const refreshList = {}, _index = object[key].index
        for (let i in _index) {
            refreshList[i] = !(index[i] && JSON.stringify(_index[i]) === JSON.stringify(index[i]));
        }
        for (let i in index) {
            refreshList[i] ??= true
        }
        // console.log(refreshList)
        for (let i in refreshList) {
            if (refreshList[i])
                this.refreshChildren(object, key, i)
        }
    }

    static pull(object, key, index) {
        // console.log('array key pull')
        object._module.pull(object, key, object[key])
        if (index)
            this.refreshChildren(object, key, index)
    }

    static refreshChildren(object, key, i) {
        if (!object._module.yin.client)
            object._module.childrenUpdate(new Place(object._place, key, i), null, 'refresh')
    }


    async models() {
        try {
            const parentModel = await this.object._model
            if (parentModel._id !== this.object._id) {
                const models = await parentModel[this.key]
                return models._id ? [models] : models
            }
        } catch (e) {
            return []
        }
    }


    auth(user) {
        return this.object._module.children(this.object._place.toKey(this.key), user)
    }

    create(object, user) {
        return this.object._createChild(object, this.key, user)
    }

    push(object, user) {
        return this.object._pushChild(object, this.key, user)
    }

    fix(id, user) {
        return this.object._fixChild(id, this.key, user)
    }

    remove(object, user) {
        return this.object._removeChild(object, this.key, user)
    }

    async then(resolve, reject) {
        try {
            resolve(await this.auth())
        } catch (e) {
            reject(e)
        }
    }
}


// export function _parentsProxy(list) {
//     const l = new Proxy([], {
//         set(target, p, newValue) {
//             target[p] = newValue instanceof Place ? newValue : new Place(target._module, newValue)
//             return true
//         }
//     })
//     Object.assign(l, list)
//     return l
// }
