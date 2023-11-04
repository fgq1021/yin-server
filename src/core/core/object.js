import {yinStatus} from "../lib/yin.status.js";
import {Key} from "./key.js";
import {Place, PlaceArray} from "./place.js";
import {hideProperty} from "../lib/yin.defineProperty.js";
import {yinAssign, yinParse} from "../lib/yin.assign.js";
import {Types} from "./type.js";
import {yinConsole} from "../lib/yin.console.js";
import {yinFilePath} from "../lib/yin.file.path.js";

export const IdHex = /^[0-9A-Fa-f]{24}$/

export class Schema extends Array {
    static get [Symbol.species]() {
        return Array;
    }

    static create(schema = [], object) {
        let set, mounted
        if (object)
            set = (target, p, key) => {
                if (Number.isInteger(Number(p))) {
                    const _key = target[p]
                    target[p] = Key.create(key)
                    if (_key) {
                        if (_key.name !== key.name || _key.keyType !== key.keyType)
                            this.mapKey(object, target[p])
                    }
                    else if (mounted) this.mapKey(object, target[p])

                    target[p].onChange = key => {
                        this.mapKey(object, key)
                    }
                }
                else target[p] = key
                return true
            }
        else
            set = (target, p, key) => {
                if (Number.isInteger(Number(p))) target[p] = new Key(key)
                else target[p] = key
                return true
            }

        const _schema = new Proxy(new Schema(), {
            set,
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

        const schemaMix = []
        for (let key of schema) {
            const i = schemaMix.findIndex(mKey => mKey.name === key.name)
            if (i === -1) schemaMix.push(key)
            else yinAssign(schemaMix[i], key)
        }

        Object.assign(_schema, schemaMix)
        mounted = true
        return _schema
    }

    static mapKey(object, key) {
        if (key.name && key.type) {
            delete object._setter[key.name]
            delete object._getter[key.name]
            object._mapKey(key)
            if (object._.script?._setter && object._.script?._setter[key.name]) object._setter[key.name] = object._.script._setter[key.name]
            if (object._.script?._getter && object._.script?._getter[key.name]) object._getter[key.name] = object._.script._getter[key.name]
            if (object._.script[key.name]) object[key.name] = object._.script[key.name]

            // if (object._name === 'Model') {
            //     for (let o of object._module?.yin.cacheList || []) {
            //         if (o._model?.valueOf() === object._id) {
            //             this.mapKey(o, key)
            //         }
            //     }
            // }
        }
    }

    toDataBaseSchema(ObjectId) {
        const schema = {_maps: []}
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

    // async __mapKey(key) {
    //     console.log(this.object._titlePlace, key.name, '//////////////')
    //     if (key.name && key.type) {
    //         this.object._mapKey(key)
    //         // if (this.object._name === 'Model') {
    //         //     for (let o of this.object._module?.yin.cacheList || []) {
    //         //         if (o._model?.valueOf() === this.object._id) {
    //         //             // o._clearKey = key.name
    //         //             o._mapKey(o._schemaMix[key.name])
    //         //         }
    //         //     }
    //         // }
    //     }
    // }
}

export const basicFunctionSchema = [
    {name: '_save', title: '保存', type: 'Function', note: '保存该对象'},
    {name: '_delete', title: '删除', type: 'Function', note: '删除该对象'},
]

export const basicEventSchema = [
    {name: 'read', title: '读取事件', type: 'Function', note: '该对象被读取时运行的函数'},
    {name: 'mounted', title: '加载事件', type: 'Function', note: '该对象被加载时运行的函数'},
    {name: 'created', title: '创建事件', type: 'Function', note: '该对象创建时运行的函数'},
    {name: 'beforeSave', title: '保存前事件', type: 'Function', note: '该对象保存前运行的函数'},
    {name: 'saved', title: '保存事件', type: 'Function', note: '该对象保存后运行的函数'},
    {name: 'update', title: '更新事件', type: 'Function', note: '该对象更新时运行的函数（保存不一定触发更新）'},
    {name: 'beforeDelete', title: '删除前事件', type: 'Function', note: '该对象删除前运行的函数'},
    {name: 'deleted', title: '删除事件', type: 'Function', note: '该对象删除后运行的函数'},
]


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
    // {
    //     name: 'maps',
    //     title: '所有映射',
    //     default: [],
    //     private: true
    // },
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
 * todo 从键值直接拿到yinObject的空客篓子，而不是objectKey，要拿到数据直接await一下
 * example yinObject next
 * {
 *     _id:...,
 *     _module:{},
 *     _loading:true,
 *     toJSON(){return undefined}
 *     async then(res,rej){...}
 * }
 */

/**
 * 引[对象OS] 中最基础的对象Class，一切结构都是由此拓展开来
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
        script: {},
        eventFn: {},
    }
    // /**
    //  * 当此值为false时，对该对象赋值不会触发更新
    //  * @private
    //  */
    // _initialized
    /**
     * 当此值为true时，对该对象赋值不会触发更新
     * @private
     */
    _hold = true
    _changed
    // _saving = false
    // _saveWaiter

    _waiter
    _readAt

    async _wait() {
        try {
            const res = await this._waiter
            delete this._waiter
            return res
        }
        catch (e) {
            delete this._waiter
            return Promise.reject(e)
        }
    }

    async _nextTick() {
        try {
            await this._wait()
        }
        catch (e) {

        }
    }

    get _place() {
        return new Place(this._module, this._id)
    }

    get _titlePlace() {
        return this._module.title + '.' + this._title
    }

    get _name() {
        return this._module?.name
    }

    get _yin() {
        return this._module?.yin
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

    constructor(module) {
        this._module ??= module
    }

    static hideKeys = ['_', '__v', '_changed', '_saving', '_isDeleted', '_readAt',
        '_module', '_setter', '_getter', '_eventFn', '_hold', '_waiter']


    /**
     * 创建yinObject的代理，代理会处理对象的setter和getter
     * 直接new yinObject(...arg) 创建的对象不会被处理setter和getter
     * @param object 数据 - 对象的数据
     * @return {yinObject}
     */
    static create(object = {}) {
        const o = new Proxy(new this(this.module), {
            deleteProperty: (target, key) => {
                if (target._map[key])
                    delete target._map[key]
                delete target[key]
                if (!this.hideKeys.includes(key) && target._hold !== true && key !== target._hold) {
                    const proxy = target._module.list[target._id]
                    proxy._changed = true
                    this.module.pull(proxy, key, target[key])
                }
                return true
            },
            get: (target, key, proxy) => {
                target._readAt = Date.now()
                // console.log('get', target._title, key, target[key], target._getter[key], this.getter[key])
                if (target._getter[key] instanceof Function) return target._getter[key].call(proxy, target);
                else if (this.getter[key] instanceof Function) return this.getter[key].call(proxy, target);
                else if (this.events.includes(key)) return (...args) => target._runEventFn(proxy, key, ...args)
                else if (key === '_isYinProxy') return true
                else return target[key]

                //TODO 在toJSON时直接返回target
                // if (key === 'toJSON') {
                //     return () => target
                // }
            },
            set: (target, key, value, proxy) => {
                // console.log('set', target._titlePlace, key, value, target._setter[key], this.setter[key])
                // if (key === '_clearKey') {
                //     delete target._setter[value]
                //     delete target._getter[value]
                //     delete target[value]
                //     return true
                // }
                // console.log(proxy)
                let setStatus = true
                if (target._setter[key] instanceof Function) setStatus = target._setter[key].call(proxy, value, target);
                else if (this.setter[key] instanceof Function) setStatus = this.setter[key].call(proxy, value, target);
                else target[key] = value
                if (setStatus && !this.hideKeys.includes(key) && target._hold !== true && key !== target._hold) {
                    proxy._changed = true
                    this.module.pull(proxy, key, target[key])
                }
                return setStatus
            }
        })
        for (let k of this.hideKeys)
            hideProperty(o, k)
        Object.assign(o, object)
        o._hold = undefined
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
            const id = Place.idSetter(value)
            if (id === false)
                return false
            object._model = id
            if (object._model) {
                object._.model = object._module?.yin.Model.getFromCache(object._model)
                if (object._.model && object._.model._schema.length) this._mapSchema()
            }
            return true
        },
        _schema(value = [], object) {
            // console.log(this._title, '_schema set', !(object._schema instanceof Schema) || object._schema.length > value.length)
            if (!(object._schema instanceof Schema) || object._schema.length > value.length) {
                object._schema = Schema.create(value, this)
                if (value.length) this._mapSchema()
            }
            else
                Object.assign(object._schema, value)
            return true
        },
        _map(value, object) {
            object._map = yinMap.create(value)
            return true
        },
        _parents(value = [], object) {
            object._parents = new Parents(value, this)
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
        const schemaMix = Schema.create(this._.model?._schema || [])
        for (let key of this._schema) {
            const i = schemaMix.findIndex(mKey => mKey.name === key.name)
            if (i === -1) schemaMix.push(key)
            else schemaMix[i] = key
        }
        return schemaMix
    }

    _mapSchema() {
        this._setter = {}
        this._getter = {}
        const scripts = this._module.yin.scripts
        this._.script = scripts[this._place] || scripts[this._.model?._place] || {}
        for (let key of this._schemaMix) {
            this._mapKey(key)
        }
        yinAssign(this, this._.script)
    }

    /**
     * 暂时只有Object和Array需要匹配映射
     * @param key
     * @private
     */
    _mapKey(key) {
        // console.log(this._titlePlace, key.name, key.type)
        // if (key.private)
        //     this._privateKeys.push(key.name)
        if (key.type === 'Array') {
            this._setter[key.name] = function (value, object) {
                // console.log(object._hold, value)
                if (object._hold === key.name) {
                    ArrayKey.findChange(this, key.name, value)
                }
                object[key.name] = ArrayKey.create(this, key.name, value)
                return true
            }
            if (!(this[key.name] instanceof ArrayKey))
                this[key.name] = ArrayKey.create(this, key.name, this[key.name])
        }
        else if (key.type === 'File' || this._yin.File?.Types.includes(key.type)) {
            this._setter[key.name] = function (value, object) {
                // console.log(value, object, key)
                if (value instanceof yinObject)
                    object[key.name] = value._path
                else if (typeof value === 'string' || value instanceof String)
                    object[key.name] = value
                return true
            }
            this._getter[key.name] = function (object) {
                return new FileKey(object[key.name], this, key.name)
            }
        }
        else if ((this._module?.yin?.structureType || ['System', 'Object']).indexOf(key.type) !== -1) {
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
                    value = Place.setter(value)
                    if (value !== false)
                        object._map[key.name] = value
                    if (value && object._name === 'Model' && object._schema[key.name]) {
                        object._schema[key.name].settings.manualCreation = true
                    }
                    return true
                }
                this._getter[key.name] = function (object) {
                    return new ObjectKey(this, key.name)
                }
            }
        }
        else if (key.type === 'Function') {
            this[key.name] = (req, user) => {
                return this._module.runFunction(this._place.toKey(key.name), req, user)
            }
        }
    }

    // _atKey(object) {
    //     for (let key in this._map) {
    //
    //     }
    // }

    // _privateKeys = []
    // static privateKeys = []

    static mapSchema() {
        for (let key of this.schema) {
            const name = '_' + key.name
            // if (key.private)
            //     this.privateKeys.push(name)
            if (key.type === 'Array')
                this.setter[name] ??= function (value, object) {
                    object[name] = ArrayKey.create(this, name, value)
                    return true
                }
            else if ((this.module?.yin?.structureType || ['System', 'Object']).indexOf(key.type) !== -1) {
                this.getter[name] ??= function (object) {
                    return new ObjectKey(object, name, key.type)
                }
                this.setter[name] ??= function (value, object) {
                    const id = Place.idSetter(value)
                    if (id === false)
                        return false
                    object[name] = id
                    return true
                    // if (value instanceof yinObject) object[name] = value._id
                    // else if (value instanceof Place) object[name] = value.id
                    // else if (typeof value === 'string') {
                    //     if (/\./.test(value)) object[name] = new Place(value).id
                    //     else object[name] = value
                    // }
                    // else return false
                    // return true
                }
            }
        }
    }

    /**
     * 获取所有在该对象范围内的对象 [this,...子对象,...子对象的子对象,...]
     * @param {[]}list
     * @return {Promise<*[]>}
     * @private
     */
    async _entire(list = []) {
        if (list.includes(this._place.valueOf()))
            return []
        list.push(this._place.valueOf())
        const _list = []
        for (let key of this._schemaMix) {
            if (key.type === 'Array') {
                const c = await this[key.name]
                await c.all()
                _list.push(...c)
            }
        }
        for (let key in this._map) {
            try {
                if (this._map[key] instanceof Place)
                    _list.push(await this._yin.get(this._map[key]))
            }
            catch (e) {

            }
        }
        for (let object of _list) {
            await object._entire(list)
        }
        return list
    }

    /**
     * 获取所有只属于该对象范围内的对象
     * @return {Promise<*[]>}
     * @private
     */
    async _entireAlone() {
        const list = await this._entire(), aloneList = [this._place.valueOf()]
        for (let i = 1; i < list.length; i++) {
            const p = list[i],
                child = await this._yin.get(p),
                parents = await child._parents
            if (parents.length <= 1)
                aloneList.push(p)
            else {
                let match
                for (let place of parents) {
                    if (!list.includes(place['module.id'].valueOf())) {
                        try {
                            await this._yin.get(place)
                            match = true
                            break
                        }
                        catch (e) {

                        }
                    }
                }
                if (!match) aloneList.push(p)
            }
        }
        return aloneList
    }

    _private

    /**
     * 用户读取权限检查
     * 匿名用户请传入{}
     * 如果留空则使用 yin.me
     * @param user 用户 - 传空则为yin.me
     * @param title 权限名 - 用来覆盖默认值
     */
    async _readable(user, title) {
        if (!this._private) return
        return this._privateReadableController(user, title)
    }

    /**
     * 用户读取权限检查（）
     * 匿名用户请传入{}
     * 如果留空则使用 yin.me
     * @param user 用户 - 传空则为yin.me
     * @param title 权限名 - 用来覆盖默认值
     */
    async _privateReadableController(user, title) {
        title ??= '读取'
        try {
            await this._accessCheck(user, '_read', title)
        }
        catch (e) {
            return this._manageable(user, title)
        }
    }

    /**
     * 用户管理权限检查
     * 匿名用户请传入{}
     * 如果留空则使用 yin.me
     * @param user 用户 - 传空则为yin.me
     * @param title 权限名 - 用来覆盖默认值
     */
    async _manageable(user, title) {
        return this._accessCheck(user, '_manage', title || '管理')
    }

    _accessControl = []

    /**
     * 用户权限检查
     * 匿名用户请传入{}
     * 如果留空则使用 yin.me
     * @param user 用户 - 传空则为yin.me
     * @param right 权限 - 要检查的权限，默认'_manage'
     * @param title 权限的友好名
     * @return {Promise<undefined|yinError>} 错误时返回Promise.reject(原因)
     * @private
     */
    async _accessCheck(user = this._module?.yin.me || {}, right = '_manage', title = '管理') {
        /**
         * 管理员检查
         */
        if (user._isRoot && user === this._module.yin.me) return
        /**
         * 匿名检查
         */
        if (!user._id)
            return yinStatus.FORBIDDEN(`用户User #匿名 没有${title} ${this._name} #${this._id} 的权限`)
        /**
         * 所有者检查
         */
        if (this._owner.valueOf() === user._id) return

        /**
         * 所有者赋予了那些用户全部对象的该权限
         */
        const accessPlace = user._place.toIdKey(right)
        try {
            const owner = await this._owner
            if (owner._parents.includes(accessPlace)) return
        }
        catch (e) {

        }
        /**
         *  该对象赋予了那些用户该权限
         */
        const userReadLength = accessPlace.length + 1
        for (let ac of this._accessControl) {
            if (`${accessPlace}.` === ac.slice(0, userReadLength)) return
        }
        return yinStatus.UNAUTHORIZED(`用户User #${user._id} 没有${title} ${this._name} #${this._id} 的权限`)
    }


    async _refresh() {
        await this._nextTick()
        if (this._module.listWaiter[this._id]) this._waiter = this._module.listWaiter[this._id]
        else this._waiter = this._module.getFromController(this._id)
        return this._wait()
    }


    async _upload(name, data, key, progress, user) {
        return this._module.upload(name, data, this._place.toKey(key), progress, user)
    }


    // async _parent(){
    //
    // }

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


        if (!req._model) {
            const models = await this[k.name].models()
            if (models.length) {
                req._model = models[0]._id
                req._title ??= models[0]._title
            }
        }
        req._title ??= k.title
        // try {
        //     const parentModel = await this._model
        //     const models = await parentModel[k.name], model = models._id ? models : models[0]
        //     if (model._id) {
        //         req._model = model._id
        //     }
        // }
        // catch (e) {
        //     // console.log(e)
        // }
        // if (req._model) {
        //     const model = await this._module.yin.Model.get(req._model)
        //     for (let {name} of model._schema) {
        //         req[name] ??= model[name]
        //     }
        // }

        // console.log('_createChild', module, req)
        return this._module.yin[module].create(req, user)
    }

    async _pushChild(object, key, user) {
        const k = typeof key === "string" ? this._schemaMix[key] : key,
            o = (object instanceof Place || typeof object === 'string') ? await this._module.yin.get(object) : object
        if (k.type === 'Array' && o._name === this._name) {
            o._parents.push(this._place.toIdKey(k))
            return o._save(user)
        }
        else if (k.type === 'Array') {
            if (!this._map[k.name] instanceof Array)
                this._map[k.name] = []
            this._map[k.name].push(o._place)
        }
        else if (this._module.yin.structureType.indexOf(k.type) !== -1)
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
        }
        else if (this._module.yin.structureType.indexOf(k.type) !== -1) {
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


    // /**
    //  * 保存
    //  * 此操作会延迟200ms进行，防止数据库访问过于频繁，也防止用户刷新过于频繁。
    //  * 由于键值的变更会直接推送，所以除了对象结构变化之外并没有什么感觉。
    //  * @param {UserObject} user
    //  * @return {Promise<yinObject>}
    //  * @private
    //  */
    // async _save(user) {
    //     clearTimeout(this._saveTimer)
    //     this._saveTimer = setTimeout(async () => {
    //         await this._nextTick()
    //         this._waiter = this._module.save(this, user)
    //         await this._wait()
    //     }, 200)
    //     return this
    // }


    async _save(user) {
        await this._nextTick()
        this._waiter = this._module.save(this, user)
        return this._wait()
    }


    async _delete(user) {
        return this._module.delete(this, user)
    }

    /**
     * 复写
     * 此操作不会删除以_开头的键值
     * @param object
     * @private
     */
    _overwrite(object) {
        const h = this._hold
        this._hold = true
        for (let i in this) {
            if (!/^_/.test(i)) {
                delete this[i]
            }
        }
        Object.assign(this, object)
        this._mapSchema()
        this._hold = h
    }


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

    async _runEventFn(proxy, event, ...args) {
        // console.log(this._title, event, this._module[event], this._module.api[event])
        if (this._module[event]) await this._module[event](proxy, ...args)
        if (this._module.api[event]) await this._module.api[event](proxy, ...args)

        let res
        if (this[event]) {
            try {
                res = await this[event].call(proxy, ...args)
            }
            catch (e) {
                console.log(...yinConsole.error(`#${this._place}`, `${this._title}.${event}() 运行出错\n`, e));
                // return Promise.reject(e)
            }
        }
        const list = this._eventFn[event] || [];
        for (let i in list) {
            if (list[i] instanceof Function)
                try {
                    await list[i](...args)
                }
                catch (e) {
                    console.log(...yinConsole.error(`#${this._place}`, `${this._title}._on('${event}') 运行出错\n`, e));
                    // return Promise.reject(e)
                }
        }
        await this._module.yin.objectEvent(proxy, event, ...args)
        return res;
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



        //  beforeDestroy(user) {
        //  }

    static events = [
        'mounted', 'read',
        'created',
        'beforeSave', 'saved',
        'update',
        'beforeDelete', 'deleted']

    // 应该绑定在children
    // 'childrenSaved', 'childrenIncreased', 'childrenDecreased']


    /**
     * 读取事件，会被云端触发
     * @param user
     */
    read(user) {
    }

    /**
     * 对象被加载事件，仅本地事件，不会被云端触发
     * @param user
     */
    mounted(user) {
    }

    /**
     * 创建完成事件，仅本地事件，不会被云端触发
     * @param user
     */
    created(user) {
    }

    /**
     * 即将保存事件，仅本地事件，不会被云端触发
     * @param user
     */
    beforeSave(user) {
    }


    /**
     * 保存完成事件，仅本地事件，不会被云端触发
     * @param user
     */
    saved(user) {
    }

    /**
     * 更新事件，会被云端触发
     * 保存的数据如果没有更新，并不会触发更新
     * @param user
     */
    update(user) {

    }

    /**
     * 即将删除事件，仅本地事件，不会被云端触发
     * @param user
     */
    beforeDelete(user) {
    }

    /**
     * 删除事件，会被云端触发
     * @param user
     */
    deleted(user) {
    }

    // 云触发事件,似乎也没啥意义
    // visit(){}
    // update(){}
    // delete(){}

    // /**
    //  * 尚未实装
    //  * @param user
    //  */
    // childrenSaved(user) {
    // }
    //
    // childrenIncreased(key, id) {
    // }
    //
    // childrenDecreased(key, id) {
    // }

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

export class yinMap {

    constructor(map) {
        if (map instanceof Object) Object.assign(this, map)
    }

    static create(map) {
        const _map = new Proxy(new yinMap(), {
            set(target, p, newValue) {
                if (newValue instanceof Array) target[p] = PlaceArray.create(newValue)
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

    /**
     *
     * @param {yinObject|Place|string} object
     * @private
     */
    _at(object) {
        const res = [], place = object instanceof yinObject ? object._place : object
        for (let key in this) {
            if (this[key] instanceof Array && this[key].includes(place)) res.push(key)
            else if (this[key].valueOf() === place) res.push(key)
        }
        return res
    }
}


// export function _mapProxy(map = {}) {
//     const _map = new Proxy({}, {
//         set(target, p, newValue) {
//             if (newValue instanceof Array) target[p] = _mapArrayProxy(newValue)
//             else {
//                 if (newValue instanceof yinObject)
//                     target[p] = newValue._place
//                 else
//                     target[p] = Place.create(newValue)
//             }
//             return true
//         }
//     })
//     Object.assign(_map, map)
//     return _map
// }

// export function _mapArrayProxy(list) {
//     const _mapArray = new Proxy([], {
//         set(target, p, newValue) {
//             if (Number.isInteger(Number(p))) {
//                 let value
//                 if (newValue instanceof yinObject)
//                     value = newValue._place
//                 else
//                     value = Place.create(newValue)
//                 if (target.findIndex(v => v.valueOf() === v) === -1)
//                     target[p] = value
//                 else
//                     return false
//             } else {
//                 target[p] = newValue
//             }
//             return true
//         }
//     })
//     Object.assign(_mapArray, list)
//     return _mapArray
// }


export class Parents extends Array {
    get [Symbol.species]() {
        return Array;
    }

    constructor(ids, object) {
        // console.log(ids, object)
        if (ids instanceof Array)
            super(...new Set(ids));
        else
            super(ids)
        this.object = object
        hideProperty(this, 'object')
    }

    push(...ids) {
        const list = []
        for (let id of ids) {
            if (this.indexOf(id) === -1)
                list.push(id)
        }
        return super.push(...list)
    }

    async fixed() {
        const parents = [], yin = this.object._yin
        for (let module of yin.modules) {
            const fixes = await module.find({_maps: this.object._place.valueOf()})
            await fixes.all()
            for (let object of fixes) {
                const keys = object._map._at(this.object)
                parents.push(...keys.map(key => object._place.toKey(key)))
            }
        }
        return parents
    }

    async all() {
        const list = []
        for (let p of this) {
            list.push(new Place(this.object._name, p))
        }
        return list.concat(await this.fixed())
    }

    async main() {
        return this.object._module.get(new Place(this.object._name, this[0]).id)
    }


    concat(...items) {
        return [].concat(this, ...items)
    }

    async then(resolve, reject) {
        try {
            resolve(await this.all())
        }
        catch (e) {
            reject(e)
        }
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
        if (this.object._name === 'Model')
            return []
        try {
            const parentModel = await this.object._model
            if (parentModel[this.key])
                return parentModel[this.key]
            return []
        }
        catch (e) {
            return []
        }
    }

    // async createAutomate(user) {
    //     if (this.object._waiter) {
    //         await this.object._nextTick()
    //         return this.auth(user)
    //     }
    //     // return this.create({}, user)
    //     console.log(this.object._titlePlace, this.key, this.object._.keyWaiter[this.key])
    //     if (this.object._.keyWaiter[this.key]) return this.object._.keyWaiter[this.key]
    //     this.object._.keyWaiter[this.key] = this.create({}, user)
    //     const object = await this.object._.keyWaiter[this.key]
    //     delete this.object._.keyWaiter[this.key]
    //     console.log(this.object._titlePlace, this.key, 'done!!!!')
    //     return object
    // }

    async create(object, user) {
        const child = await this.object._createChild(object, this.key, user)
        this.object._map[this.key] = child._place
        return child
    }

    async remove() {
        if (/^_/.test(this.key))
            this.object[this.key] = undefined
        else
            delete this.object._map[this.key]
        return this.object._save()
    }


    async auth(user) {
        const object = this.object, yin = object._module.yin, k = this.key, keyTitle = object._schemaMix[k]?.title || k
        if (/^_/.test(k))
            return yin[this.module].get(object[k], user)

        if (object._map[k] instanceof Array)
            object._map[k] = object._map[k][0]

        if (object._map[k]) return yin.get(object._map[k], user)
        else {
            const model = object._.model
            if (model && model._schema[k] && !model._schema[k].settings?.manualCreation) {
                try {
                    const models = await model[k]
                    if (models.length) {
                        return await this.create({}, user)
                    }
                }
                catch (e) {
                    return yinStatus.NOT_FOUND(`在${object._title}.${keyTitle}自动创建子对象时发生错误`, e)
                }
            }
        }
        return yinStatus.NOT_FOUND(`没有在${object._title}.${keyTitle}找到对象映射信息`)

        // try {
        //     return await yin.get(object._map[k], user)
        // }
        // catch (e) {
        //     if (e.status === 'NOT_FOUND' && object._name !== 'Model') {
        //         const model = object._.model
        //         if (model && model._schema[k] && !model._schema[k].settings?.manualCreation) {
        //             try {
        //                 const models = await model[k]
        //                 if (models.length) {
        //                     return await this.createWaiter(user)
        //                 }
        //             }
        //             catch (e) {
        //                 if (e.status !== 'NOT_FOUND')
        //                     return Promise.reject(e)
        //             }
        //         }
        //     }
        //     return Promise.reject(e)
        // }
    }

    // get value() {
    //     if (/^_/.test(this.key))
    //         return this.object[this.key]
    //     else
    //         return this.object._map[this.key]
    // }

    get place() {
        if (/^_/.test(this.key)) if (this.object[this.key])
            return new Place(this.module, this.object[this.key])
        return this.object._map[this.key]
    }

    get cache() {
        if (this.place)
            return this.object._module.yin.getFromCache(this.place)
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
        try {
            resolve(await this.auth())
        }
        catch (e) {
            reject(e)
        }
    }
}

export class ArrayKey {
    finder = undefined
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
        if (value) Object.assign(this, value)
        this.object = object
        this.key = key
    }

    static _create(object, key, value = {index: {default: {}}}) {
        if (!value) value = {}
        value.index ??= {default: {}}
        value.index.default ??= {}
        return new ArrayKey(object, key, value)
    }

    static create(object, key, value = {}) {
        value.index ??= {default: {}}
        value.index.default ??= {}
        value.index = this.indexesProxy(object, key, value.index)
        // console.assert(false, object._titlePlace, key, value)
        // if (object._isYinProxy)
        //     console.assert(false, object._titlePlace, key)
        // else
        //     console.assert(false, object._titlePlace, key, object)

        return new Proxy(new ArrayKey(object, key, value), {
            // construct(target, argArray, newTarget) {
            // },
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
                            }
                            catch (e) {
                                reject(e)
                            }
                        }
                    }
                else if (p === '_isYinProxy') return true
                return target[p]
            },
            set: (target, p, value, proxy) => {
                // console.log('ArrayKey', p, value)
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
                // console.log('indexes', p, value)

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
                // console.log('index', p, value)

                target[p] = value
                this.pull(object, key, i)
                return true
            }
        })
    }


    static findChange(object, key, value = {finder: null, index: {default: {}}}) {
        const _value = object[key]
        if ((!_value.finder) !== (!value.finder) || (_value.finder && value.finder && JSON.stringify(_value.finder) !== JSON.stringify(value.finder))) {
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

    static findIndexChange(object, key, index = {default: {}}) {
        const refreshList = {}, _index = object[key].index
        for (let i in _index) {
            refreshList[i] = !(index[i] && JSON.stringify(_index[i]) === JSON.stringify(index[i]));
        }
        for (let i in index) {
            refreshList[i] ??= true
        }
        for (let i in refreshList) {
            if (refreshList[i])
                this.refreshChildren(object, key, i)
        }
    }

    static pull(object, key, index) {
        // console.log('array key pull', object._titlePlace, key, index, object[key])
        // ArrayKey初始化时，值还没有被付到对象的key上，此时不应推送和刷新
        if (object[key]?._isYinProxy) {
            object._module.pull(object, key, object[key])
            if (index)
                this.refreshChildren(object, key, index)
        }
    }

    static refreshChildren(object, key, i) {
        if (!object._module.yin.client)
            object._module.childrenUpdate(new Place(object._place, key, i), null, 'refresh')
    }


    async models() {
        if (this.object._name === 'Model')
            return []
        try {
            const parentModel = await this.object._model
            return await parentModel[this.key]
        }
        catch (e) {
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
        }
        catch (e) {
            reject(e)
        }
    }
}

export class FileKey extends yinFilePath {
    object
    key

    constructor(path, object, key) {
        // console.log(object, path, key)
        super(path || '')
        this.object = object
        this.key = key
    }

    uploadProgress


    eventProgress
    // create(file, user) {
    //     return this.object._upload(file, this.key, p => {
    //         if (this.uploadProgress instanceof Function)
    //             this.uploadProgress(p)
    //     }, user)
    // }

    /**
     * 创建文件
     * @param {String} name 文件名或文件描述符
     * @param data
     * @param user
     */
    create(name, data, user) {
        this.abortController = new AbortController();
        return this.object._upload(name, data, this.key, {
            onUploadProgress: p => {
                this.eventProgress = p.event
                if (this.uploadProgress instanceof Function)
                    this.uploadProgress(p)
            },
            signal: this.abortController.signal
        }, user)
    }

    abort() {
        this.abortController.abort()
    }


    // async auth(user) {
    //     const object = this.object, yin = object._module.yin, k = this.key
    //     if (/^_/.test(k))
    //         return yin.File.getPath(this, user)
    //
    //     if (object._map[k] instanceof Array)
    //         object._map[k] = object._map[k][0]
    //
    //     try {
    //         return yin.get(object._map[k], user)
    //     }
    //     catch (e) {
    //         return yin.File.getPath(this, user)
    //     }
    // }

    async auth(user) {
        if (String(this))
            return this.object._yin.File.getPath(this, user)
        return yinStatus.NOT_FOUND('地址为空')
    }

    async then(resolve, reject) {
        try {
            resolve(await this.auth())
        }
        catch (e) {
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
