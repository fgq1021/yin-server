import {get} from 'lodash'
import {Key} from "./key";
import {Place} from "./place";
import {yinStatus} from "../lib/yin.status";
import {yinConsole} from "../lib/yin.console";

export const lifecycle = [
    'mounted', 'beforeDestroy',
    'created',
    'beforeSave', 'saved',
    'beforeDelete', 'deleted',
    'childrenSaved', 'childrenPushed', 'childrenDeleted'
]

export class Schema extends Array {
    constructor(schema) {
        super(...schema.map(key => key.isKey ? key : new Key(key)))
    }

    push(...schema): number {
        return super.push(...schema.map(key => key.isKey ? key : new Key(key)))
    }
}

export class YinObject {
    public $id: string;
    public $name
    // 临时映射数据
    public $ = {
        owner: null,
        model: null,
        schema: []
    }
    // 临时一次性数据
    public $$ = {
        model: {$: {schema: []}},
        schema: []
    }
    public $hide
    public $children;
    public $changed = false

    get $api() {
        return null
    }

    get $place() {
        return new Place(this.$name, this.$id)
    }

    constructor(object, module) {
        if (module)
            Object.defineProperty(this, '$api', {
                value: module,
                enumerable: false
            })
        Object.defineProperty(this, '$$', {
            value: this.$$,
            enumerable: false
        })
        Object.assign(this, this.$api.schema.toObjectSchema())
        // if (object.$) {
        //     // console.log('assign match $ !!!!', object, object.$)
        //     const $ = object.$
        //     delete object.$
        //     for (let i in $) {
        //         object['$' + i] = $[i]
        //     }
        // }
        this.$assign(object)
    }

    $assign(object) {
        delete object.$eventFn
        Object.assign(this, object)
    }

    async $init() {
        try {
            await this.$initModel()
        } catch (e) {
            if (e.status !== 'NOT_FOUND')
                yinConsole.warn('$init error', this["$title"], this.$place, e)
        }
        // 在此处读一下，好刷新不同key的功能
        this.$schema
        this.mounted()
    }

    async $initModel() {
        const model = await this.$model()
        this.$$.schema = model.$.schema
        const models = this.$api.yin.models;
        const typeModule = models[this.$id] || models[model.$id];
        lifecycle.forEach(method => {
            if (typeModule && typeModule[method])
                this[method] = typeModule[method]
            else
                this[method] = async () => true
        })
        if (typeModule) {
            if (typeModule.methods)
                for (let method in typeModule.methods) {
                    this[method] = typeModule.methods[method];
                }
            if (typeModule.watch)
                for (let w in typeModule.watch) {
                    this.$api.yin.vue.watch(get(this, w), typeModule.watch[w])
                }
            if (typeModule.computed) {
                for (let c in typeModule.computed) {
                    this[c] = this.$api.yin.vue.computed(typeModule.computed[c])
                }
            }
        }
        return true
    }

    async $readable(user) {
        if (!user && this.$api.yin.client)
            user = this.$api.yin.me
        if (!this.$hide)
            return true
        if (this.$.owner === user.$id)
            return true

        const rds = await user.$read
        for (let u of rds) {
            if (this.$.owner === u.$id)
                return true
        }

        return await this.$manageable(user)
    }

    async $manageable(user) {
        // 客户端自动添加用户
        if (!user && this.$api.yin.client)
            user = this.$api.yin.me
        if (!user)
            return Promise.reject(yinStatus.UNAUTHORIZED("匿名用户没有修改" + this.$name + " #" + this.$id + " 的权限"))
        if (this.$.owner === user.$id)
            return true

        const mgs = await user.$manage(user)
        for (let u of mgs) {
            if (this.$.owner === u.$id)
                return true
        }
        if (this.$api.yin.me?.$isRoot && (user.$id === this.$api.yin.me.$id))
            return true
        return Promise.reject(yinStatus.UNAUTHORIZED('用户User #' + user.$id + " 没有修改" + this.$name + " #" + this.$id + " 的权限"))
    }

    get $owner() {
        return (user?) => this.$api.yin.User.get(this.$.owner, user)
    }

    set $owner(o: any) {
        if (o)
            this.$.owner = o.$id ? o.$id : o
    }

    get $model() {
        return (user?) => this.$api.yin.Model.get(this.$.model, user)
    }

    set $model(o: any) {
        if (o)
            this.$.model = o.$id ? o.$id : o
    }

    set $schema(s) {
        this.$.schema = new Schema(s)
    }

    get $schema() {
        // console.time('$schema')
        const st = [],
            putSchema = (schema) => {
                if (schema)
                    schema.forEach(key => {
                        let match = -1
                        key = key.isKey ? key : new Key(key)
                        for (let i = 0; i < st.length && match === -1; i++) {
                            if (key.name === st[i].name) {
                                match = i
                            }
                        }
                        if (match === -1)
                            st.push(key)
                        else
                            st[match] = key
                    })
            },
            makeObject = (k) => {
                if (this.$children[k] instanceof Array) {
                    this.$children[k] = this.$children[k][0]
                }
                Object.defineProperty(this, k, {
                    get() {
                        const res = async (user?) => {
                            try {
                                return await this.$api.yin.get(this.$children[k], user)
                            } catch (e) {
                                if (e.status === 'NOT_FOUND' && this.$name !== 'Model') {
                                    const model = await this.$model()
                                    if (model.$schema[k]) {
                                        const models = await model[k](user)
                                        if (models.$id || models.length)
                                            return res.create({}, user)
                                    }
                                }
                                return Promise.reject(e)
                            }
                        }
                        res.create = async (o, user?) => {
                            console.log('res create', this.$id, k)
                            return await this.$createChild(o, k, user)
                        }
                        return res
                    },
                    set(el: any) {
                        console.log('object set', el.$id)
                        if (el)
                            this.$children[k] = el.$place || el
                    },
                    enumerable: true,
                    configurable: true
                })
            },
            makeArray = (k) => {
                if (this.$children[k] instanceof String) {
                    this.$children[k] = [this.$children[k]]
                }
                Object.defineProperty(this, k, {
                    get() {
                        const res = async (user?) => this.$api.children(new Place(this.$name, this.$id, k), user);
                        res.create = (o, user?) => {
                            console.log('makeArray create', this.$id, k)
                            return this.$createChild(o, k, user)
                        }
                        res.push = res.create
                        return res
                    },
                    set(option: object) {
                        this.$data[k] = option
                        return this
                    },
                    enumerable: true,
                    configurable: true
                })
            }

        // for (let c in this.$children) {
        //     if (typeof this.$children[c] === 'string') {
        //         st.push(new Key(c, 'Object'))
        //     } else
        //         st.push(new Key(c, 'Array'))
        // }
        putSchema(this.$$.schema)
        putSchema(this.$.schema)


        st.forEach(key => {
            const k = key.name
            if (st[k])
                st[k] = key
            else if (k)
                Object.defineProperty(st, k, {
                    value: key,
                    enumerable: false,
                    configurable: true,
                    writable: true
                })

            if (k) {
                const type = key.type
                if (type === 'Function')
                    this[k] = (req) => this.$api.runFunction(this, k, req);
                else if (type === 'Array') {
                    makeArray(k)
                } else if (this.$api.yin.structureType.indexOf(type) !== -1)
                    makeObject(k)
            }
        })
        // console.timeEnd('$schema')
        return st
    }

    $refresh() {
        return this.$api.getFromController(this.$id);
    }

    async $createChild(req = {} as any, key: string | object, user?) {
        const k = typeof key === "string" ? this.$schema[key] : key
        let module = req.$name || k.settings.module || this.$name
        if (this.$name === 'Model' && !this.$.model) {
            module = "Model"
        }
        if (k.type !== 'Array')
            req.$pushParents = [new Place(this.$name, this.$id, k.name)]
        else if (module !== this.$name)
            req.$pushParents = [[new Place(this.$name, this.$id, k.name)]]
        else {
            if (!(req.$parents instanceof Array))
                req.$parents = []
            req.$parents.push(new Place(this.$id, k.name))
        }
        if (!req.$title)
            req.$title = k.title
        if (!req.$model && this.$name !== 'Model')
            try {
                const parentModel = await this.$model()
                if (parentModel.$id !== this.$id) {
                    const models = await parentModel[k.name](), model = models.$id ? models : models[0]
                    if (model.$id) {
                        req.$model = model.$id
                        for (let i in model.$data) {
                            req[i] = req[i] || model.$data[i]
                        }
                    }
                }
            } catch (e) {
                // console.log(e)
            }
        return this.$api.yin[module].create(req, user)
    }

    async $save(option?, user?) {
        return this.$api.save(this, option, user);
    }

    async $delete(user?) {
        return this.$api.delete(this, user)
    }

    public $eventFn = {};

    $on(event, fn) {
        if (!this.$eventFn[event])
            this.$eventFn[event] = [];
        this.$eventFn[event].push(fn)
        return this
    }

    $removeEvent(event, fn) {
        if (this.$eventFn[event]) {
            const i = this.$eventFn[event].indexOf(fn)
            this.$eventFn[event].splice(i, 1)
        }
        return this
    }

    async $runEventFn(event, msg) {
        const list = this.$eventFn[event];
        if (list)
            for (let i in list) {
                await list[i](msg)
            }
        return true;
    }


    // 生命周期默认函数
    'mounted'(user?) {
    }

    'beforeDestroy'(user?) {
    }

    'created'(user?) {
    }

    'beforeSave'(user?) {
    }

    'saved'(user?) {
    }

    'beforeDelete'(user?) {
    }

    'deleted'(user?) {
    }

    'childrenSaved'(user?) {
    }

    'childrenPushed'(key, id) {
    }

    'childrenDeleted'(user?) {
    }
}