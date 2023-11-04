import {model, Schema} from "mongoose";
import {Key, Place, ResList, yinAssign, yinConsole, yinParse, yinStatus} from "./core/index.js";
import _ from 'lodash'

class ModuleAuth {

    constructor(module, user) {
        this.module = module
        this.user = user
    }

    run(p) {
        return (...arg) => {
            return this.module[p](...arg, this.user)
        }
    }
}


export class ControllerServer {
    get name() {
        return this.module?.name
    }

    get title() {
        return this.module?.title
    }

    api
    module
    yin

    constructor(yin, module) {
        this.yin = yin
        this.module = module
    }

    init() {
        this.makeModel()
    }

    makeModel() {
        const schema = new Schema(this.module.Object.schema.toDataBaseSchema(Schema.Types.ObjectId), {
            timestamps: {
                createdAt: '_createdAt', updatedAt: '_updatedAt'
            }
        });
        this.api = model(this.name, schema)
        this.api.watch().on('change', data => this.updateFromStream(data))
    }


    makeRouter(router, app) {
        const routes = app.routes[this.name],
            _router = new Proxy(router, {
                get: (target, p, receiver) => {
                    return (path, fn) => {
                        const r = p.toUpperCase() + path
                        if (routes[r]) console.log(...yinConsole.warn(`#${this.title}`, `默认路由 ${p.toUpperCase()}:/yin.object/${this.name}${path} 已被重写`))
                        else target[p](path, fn)
                    }
                }
            })

        /**
         * 获取module基本配置
         */
        _router.get('/', req => {
            return {title: this.module.title, schema: this.module.Object.schema}
        })

        /**
         * 特殊查询
         */

        _router.post('/findOne', req => this.module.findOne(req.body, req.user))
        _router.post('/find', req => {
            const {filter, sort} = req.body, {limit, skip} = req.query
            return this.module.find(filter, sort, Number(limit), Number(skip), req.user)
        })
        _router.get('/children/:id/:key/:index', async req => {
            const {id, key, index} = req.params
            const children = await this.module.childrenWaiter(new Place(this.name, id, key, index)),
                {limit, skip} = req.query
            return children.getFromCache(Number(limit), Number(skip), req.user);
        })


        /**
         * 单个对象的增删改查
         */
        _router.post('/', req => this.module.create(req.body, req.user))
        _router.get('/:id', req => req.Object)
        _router.patch('/:id', async req => {
            await req.Object._manageable(req.user)
            req.Object._overwrite(req.body)
            return req.Object._save(req.user)
        })
        _router.delete('/:id', req => req.Object._delete(req.user))

        /**
         * 对象Key的操作
         */
        _router.get('/:id/:key', this.makeObjectKeyRouter)
        _router.post('/:id/:key', this.makeObjectKeyRouter)
        _router.patch('/:id/:key', async req => {
            const k = req.params.key
            await req.Object._manageable(req.user)
            req.Object[k] = req.request.body
            return req.Object._save()
        })

    }


    async makeObjectKeyRouter(req) {
        const k = req.params.key
        if (req.Key.type === 'Function') return req.Object[k](req.request.body, req.user)
        else if (req.Key.type === 'Array') {
            const children = await this.module.childrenWaiter(req.Object._place.toKey(k)), {limit, skip} = req.query
            return children.getFromCache(Number(limit), Number(skip), req.user);
        }
        else if (this.yin.structureType.indexOf(req.Key.type) !== -1) return req.Object[k](req.user)
        else if (req.Object[k] instanceof Function) return req.Object[k](req.user)
        else return req.Object[k]
    }

    async updateFromStream(data) {
        const id = data.documentKey._id, object = this.module.list[id]
        switch (data.operationType) {
            case 'insert':
                if (!object) {
                    const Model = data.fullDocument
                    for (let idString of Model._parents) {
                        await this.module.childrenUpdate(this.name + '.' + idString, String(Model._id), 'push');
                    }
                }
                break
            case 'update':
                if (object) {
                    if (data.updateDescription.updatedFields._updatedAt > object._updatedAt) await this.module.getFromController(id)
                    /**
                     * 非本系统修改的也得算进去。。。
                     * 这中间总有个时间差
                     * 就按10秒算吧
                     */ else if ((data.wallTime - object._updatedAt) > 10000) {
                        const o = await this.module.getFromController(id)
                        Object.assign(o, data.updateDescription.updatedFields)
                        await o._save()
                    }
                }
                break
        }

    }


    mto(model) {
        if (model instanceof Array) {
            return model.map(m => this.mto(m))
        }
        const object = yinParse(model.toObject())
        // 从.data映射用户创建的键值
        for (let d in model._data || {}) {
            object[d] = model._data[d]
        }
        delete object._data
        delete object._maps
        // for (let key of this.module.Object.schema) {
        //     if (key.private) delete object['_' + key.name]
        // }
        // console.log(object)
        return object
    }

    otm(object) {
        if (object instanceof Array) {
            return object.map(m => this.otm(m))
        }
        else {
            object = yinParse(object)
            /**
             * ._data 不能默认加上
             * sort 和 filter也要用这个函数，空值无法继续进行
             */
            const m = {}
            for (let k in object) {
                if (/^_/.test(k)) {
                    m[k] = object[k]
                }
                else {
                    if (!m._data) m._data = {}
                    m._data[k] = object[k]
                }
            }

            return m
        }
    }

    // read(object) {
    //     this.yin.socket.to(object._place).emit('ObjectEvents')
    // }

    async get(id) {
        try {
            const model = await this.api.findById(id)
            // console.log(model)
            if (model) return this.mto(model)
        }
        catch (e) {
            return yinStatus.NOT_FOUND("未找到id为 #" + id + " 的" + this.name);
        }
        return yinStatus.NOT_FOUND("未找到id为 #" + id + " 的" + this.name);
    }


    async findOne(filter) {
        const model = await this.api.findOne(filter).exec();
        if (model) return this.mto(model); else return yinStatus.NOT_FOUND("未找到" + this.name, filter);
    }


    matchReg(array) {
        for (let i in array) {
            if (typeof array[i] === "string") {
                const reg = array[i].match(/^\/(.+)\/(.?)/);
                if (reg) {
                    array[i] = new RegExp(reg[1], reg[2]);
                }
            }
        }
        return array;
    }

    async find(filter = {}, sort = {}, limit = 50, skip = 0) {
        try {
            this.matchReg(filter);
            filter = this.otm(filter)
            sort = this.otm(sort)
            const total = await this.api.count(filter), listFinder = this.api.find(filter).sort(sort).skip(skip);
            if (limit > 0) {
                listFinder.limit(limit);
            }
            const list = await listFinder;
            if (list) return new ResList(this.mto(list), {
                skip: Number(skip) + list.length,
                total,
                filter: filter,
                sort
            }); else return yinStatus.NOT_FOUND("获取" + this.name + "列表失败", filter);
        }
        catch (e) {
            return yinStatus.NOT_ACCEPTABLE("获取" + this.name + "列表失败", e)
        }
    }

    async children(place, limit = 50, skip = 0) {
        const p = Place.create(place),
            parent = await this.module.get(p.id),
            arrayData = parent[p.key],
            finder = arrayData.finder ? arrayData.finder : {_parents: p["id.key"]},
            sort = arrayData.index[p.index],
            mapLength = parent._map[p.key]?.length || 0,
            res = await this.find(finder, sort, limit, Math.max(skip - mapLength, 0))
        res.total += mapLength
        res.skip += mapLength
        return res
    }

    /**
     * 在存储前后处理数据
     * @param model
     * @param user
     * @param fn
     */
    async saveParse(model, user, fn) {
        const pushParents = model._pushParents || []
        delete model._pushParents

        /**
         * 用户ID检查
         * 匿名无法创建，同时修改_owner
         *
         * TODO 此处并不完善，如果是管理员，不能该修改owner
         */
        // console.assert(user, model)
        user ??= this.yin.me
        if (user === this.yin.me) model._owner ??= user._id
        else model._owner = user._id

        /**
         * _parents检查
         * 过滤_parents中的内容，把没有权限的位置去掉
         */
        const parents = []
        if (model._parents) for (let place of model._parents) {
            try {
                const p = new Place(this.name, place), pel = await this.yin.get(p, user)
                if (pel[p.key]?.open)
                    parents.push(place)
                else {
                    await pel._manageable(user)
                    parents.push(place);
                }
            }
            catch (e) {
                console.log(e)
            }
        }
        model._parents = parents;

        model._map ??= {}
        const ids = []
        for (let i in model._map) {
            if (model._map[i] instanceof Array)
                ids.push(...model._map[i])
            else if (model._map[i])
                ids.push(model._map[i])
        }
        model._maps = [...new Set(ids.map(v => String(v)))]

        try {
            const m = await this.yin.Model.get(model._model)
            model._data ??= {}
            for (let i in m)
                if (!/^_/.test(i) && !(m[i] instanceof Function))
                    model._data[i] ??= m[i]
            model._title ??= m._title
        }
        catch (e) {

        }


        // console.log('before save', model._id, model._title, model._map)


        /**
         * 运行存储函数
         */
        if (fn) model = await fn(model, user)

        // console.log('after save', model._id, model.title, model.children)

        /**
         * 将对象固定在父系的_map中
         */
        try {
            const oPlace = new Place(this.name, model._id)
            for (let i in pushParents) {
                let place, type = 'Object';
                if (pushParents[i] instanceof Array) {
                    place = pushParents[i][0]
                    type = 'Array'
                }
                else {
                    place = pushParents[i]
                    type = 'Object'
                }
                place = Place.create(place)

                const pel = await this.yin.get(place, user)

                //TODO 暂时没有处理没有权限时怎么办。。。。
                await pel._manageable(user)
                await pel._nextTick()
                let key = pel._schemaMix[place.key]
                if (!key) {
                    pel._schema.push(new Key(place.key, type))
                    key = pel._schema[place.key]
                }
                if (key.type === 'Array') {
                    pel._map[key.name] = pel._map[key.name] || []
                    pel._map[key.name].push(oPlace)
                }
                else pel._map[key.name] = oPlace
                await pel._save(user)
            }
        }
        catch (e) {
            // console.log(e)
            // throw e
        }
        // console.log(model)
        return this.mto(model)
    }

    create(object, user) {
        return this.saveParse(this.otm(object), user, async m => {
            // 直接创建会把所有数值为{}的项删除，但是保存时不会删除
            const _m = await this.api.create({}), model = await this.api.findById(_m._id)
            Object.assign(model, m)
            await model.save()
            /**
             * 提醒_parents中的父系更新数组
             */
            if (model._parents) for (let idString of model._parents) {
                /**
                 * 这里加上await 会使该方法被调用两边。。。
                 * 我也不知道为什么，反正不影响，还是不加了
                 */
                this.module.childrenUpdate(this.name + '.' + idString, model._id.toString(), 'push');
            }

            return model
        })
    }

    async save(object, user) {
        object = this.otm(object)
        const m = await this.api.findById(object._id)
        const old = m.toObject()
        Object.assign(m, object)
        return this.saveParse(m, user, async m => {
            await m.save()
            this.childrenUpdateCheck(m, old)
            return m
        })
    }

    // deleteOne(filter) {
    //     return this.api.deleteOne(filter);
    // }

    delete(id) {
        return this.api.deleteOne({_id: id});
    }

    async deleted(object, user) {
        if (object._parents) {
            for (let idString of object._parents) {
                this.module.childrenUpdate(this.name + '.' + idString, object._id, 'delete')
            }
            const maps = await object._parents.fixed()
            for (let place of maps) {
                // console.log(place, object._id)
                this.module.childrenUpdate(place, [object._id], 'fixChange')
            }
        }
        //  console.log(object._deleteFrom)
        if (!object._deleteFrom) {
            const objects = await object._entireAlone()
            for (let i = 1; i < objects.length; i++) {
                try {
                    const o = await this.yin.get(objects[i], user)
                    o._deleteFrom = object._place
                    o._delete(user)
                }
                catch (e) {
                    //  console.log(e)
                }
            }
        }
    }

    async insertMany(list) {
        for (let object of list) {
            // 直接创建会把所有数值为{}的项删除，但是保存时不会删除
            const mts = this.otm(object)
            try {
                await this.api.create({_id: object._id})
            }
            catch (e) {
            }
            const m = await this.api.findOne({_id: object._id})
            Object.assign(m, mts)
            await m.save()
        }
    }

    childrenUpdateCheck(el, _el) {
        const parents = el._parents || [], _parents = _el._parents || [], map = el._map || {},
            _map = _el._map || {}, parentAdd = _.difference(parents, _parents),
            parentDelete = _.difference(_parents, parents), childrenDifference = {};
        for (let i in map) {
            if (map[i] instanceof Array) if (_map[i]) {
                // const cAdd = difference(children[i], _map[i]),cDel=difference(_map[i], children[i]);
                // 循环一下触发childrenDeleted和pushed事件
                if (JSON.stringify(map[i]) !== JSON.stringify(_map[i])) childrenDifference[i] = true;
            }
            else {
                childrenDifference[i] = true
            }
        }
        for (let i in _map) {
            if (_map[i] instanceof Array && !map[i]) {
                // 循环一下触发childrenDeleted事件
                childrenDifference[i] = true;
            }
        }
        // console.log(parents, _parents)
        // console.log(parentAdd, parentDelete)
        for (let idString of parentAdd) {
            this.module.childrenUpdate(this.name + '.' + idString, el._id.toString(), 'push');
        }
        for (let idString of parentDelete) {
            this.module.childrenUpdate(this.name + '.' + idString, el._id.toString(), 'delete')
        }
        for (let key in childrenDifference) {
            // this.module.childrenUpdate(new Place(this.name, el._id, key), el._id.toString(), 'refresh')
            this.module.childrenUpdate(new Place(this.name, el._id, key), [], 'fixChange')
        }
    }


    pull(object, key, value, nodeId) {
        const Key = object._schemaMix[key] || this.module.Object.schema[key.slice(1)]
        if (Key && Key.private) {
            this.yin.socket?.to('manage-' + object._place).emit("pull",
                {
                    place: object._place.toKey(key).valueOf(),
                    value,
                    nodeId: nodeId || this.yin.nodeId
                }
            );
        }
        else {
            this.yin.socket?.to(object._place.valueOf()).emit("pull",
                {
                    place: object._place.toKey(key).valueOf(),
                    value,
                    nodeId: nodeId || this.yin.nodeId
                }
            );
        }
    }

    async runFunction(place, req, user) {
        return yinStatus.METHOD_NOT_ALLOWED(`#${place} 并没有创建函数，请在创建后重试`, req)
    }
}
