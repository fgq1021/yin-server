import {model, Schema} from "mongoose";
import {Key, Place, ResList, yinAssign, yinParse, yinStatus} from "./core/index.js";
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
    name
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


    makeRouter(app, router) {
        router.use((ctx, next) => {
            ctx.module = new Proxy(new ModuleAuth(this.module, ctx.user), {
                get(target, p) {
                    return target.run(p)
                }
            })
            return next()
        })

        /**
         * 获取module基本配置
         */
        router.get('/', ctx => {
            return {
                title: this.module.title, schema: this.module.Object.schema
            }
        })

        /**
         * 特殊查询
         */

        router.post('/findOne', ctx => this.module.findOne(ctx.request.body, ctx.user))
        router.post('/find', ctx => {
            const {filter, sort} = ctx.request.body, {limit, skip} = ctx.query
            return this.module.find(filter, sort, Number(limit), Number(skip), ctx.user)
        })
        router.get('/children/:place', async ctx => {
            const children = await this.module.childrenWaiter(ctx.params.place), {limit, skip} = ctx.query
            return children.getFromCache(Number(limit), Number(skip), ctx.user);
        })


        /**
         * 单个对象的增删改查
         */
        router.param('id', async (id, ctx, next) => {
            // ctx.Object = await this.module.get(ctx.params.id, ctx.user)

            ctx.Object = await ctx.module.get(ctx.params.id)
            return next()
        })
        router.post('/', ctx => this.module.create(ctx.request.body, ctx.user))
        router.get('/:id', ctx => ctx.Object)
        router.patch('/:id', async ctx => {
            await ctx.Object._manageable(ctx.user)
            ctx.Object._initialized = false
            Object.assign(ctx.Object, ctx.request.body)
            ctx.Object._initialized = true
            return ctx.Object._save()
        })
        router.delete('/:id', ctx => this.module.delete(ctx.params.id, ctx.user))

        /**
         * 对象Key的操作
         */

        router.param('key', (key, ctx, next) => {
            ctx.Key = ctx.Object._schemaMix[key] || new Key(key)
            return next()
        })
        router.get('/:id/:key', this.makeObjectKeyRouter)
        router.post('/:id/:key', this.makeObjectKeyRouter)
        router.patch('/:id/:key', async ctx => {
            const k = ctx.params.key
            await ctx.Object._manageable(ctx.user)
            ctx.Object[k] = ctx.request.body
            return ctx.Object._save()
        })


        return router
    }


    async makeObjectKeyRouter(ctx) {
        const k = ctx.params.key
        if (ctx.Key.type === 'Function') return ctx.Object[k](ctx.request.body, ctx.user); else if (ctx.Key.type === 'Array') {
            const children = await this.module.childrenWaiter(ctx.Object._place.toKey(k)), {limit, skip} = ctx.query
            return children.getFromCache(Number(limit), Number(skip), ctx.user);
        } else if (this.yin.structureType.indexOf(ctx.Key.type) !== -1) return ctx.Object[k](ctx.user); else if (ctx.Object[k] instanceof Function) return ctx.Object[k](ctx.user); else return ctx.Object[k]
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


    // 可以在这里把带_的存起来，下面直接匹配，不需要schemaDashKey
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
        return object
    }

    otm(object) {
        if (object instanceof Array) {
            return object.map(m => this.otm(m))
        } else {
            object = yinParse(object)
            /**
             * ._data 不能默认加上
             * sort 和 filter也要用这个函数，空值无法继续进行
             */
            const m = {}
            for (let k in object) {
                if (/^_/.test(k)) {
                    m[k] = object[k]
                } else {
                    if (!m._data) m._data = {}
                    m._data[k] = object[k]
                }
            }

            return m
        }
    }


    /**
     * 对象转化为排序
     * @param object
     * @return {{}}
     */
    ots(object) {
        const m = {}
        for (let k in object) {
            if (/^_/.test(k)) {
                m[k] = object[k]
            } else {
                m['_data.' + k] = object[k]
            }
        }
        return m
    }

    async get(id) {
        try {
            const model = await this.api.findById(id)
            // console.log(model)
            if (model) return this.mto(model)
        } catch (e) {
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
            sort = this.ots(sort)
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
        } catch (e) {
            return yinStatus.NOT_ACCEPTABLE("获取" + this.name + "列表失败", e)
        }
    }

    /**
     * 模仿客户端完成包含fixed的查询
     * 但是此处并不包含fixed的查询
     * 只是能接受包含fixLength的skip
     *
     * @param place
     * @param limit
     * @param skip
     * @return {Promise<ResList|*|undefined>}
     */
    async children(place, limit = 50, skip = 0) {
        // console.log(place)
        const p = Place.create(place),
            parent = await this.module.get(p.id),
            fixLength = parent._map[p.key] instanceof Array ? parent._map[p.key]?.length : 0,
            // if (skip < fixLength) {
            //     const list = (parent._map[p.key] || []).slice(skip, limit), findList = []
            //     for (let c of list) {
            //         const o = this.yin.getFromCache(c)
            //         if (!o)
            //             findList.push(c.id)
            //     }
            //     console.log(list, findList)
            //     if (findList.length) {
            //         const finder = {_id: findList}, list = await this.find(finder, {}, findList.length)
            //         console.log(list)
            //         if (findList.length !== list.length) {
            //             console.log(findList.length, list.length, '!!!')
            //         }
            //         return list
            //     }
            // }
            arrayData = parent[p.key],
            finder = arrayData.finder ? arrayData.finder : {_parents: p["id.key"]},
            sort = arrayData.index[p.index],
            res = await this.find(finder, sort, limit, skip - fixLength)
        res.total += fixLength
        res.skip += fixLength
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
         * TODO 此处并不完善，如果是管理员，不能修改owner
         */

        user ??= this.yin.me
        if (user !== this.yin.me && !user._id)
            return yinStatus.UNAUTHORIZED('匿名用户无权进行创建或修改操作')
        model._owner = user._id

        /**
         * _parents检查
         * 过滤_parents中的内容，把没有权限的位置去掉
         */
        const parents = []
        if (model._parents) for (let place of model._parents) {
            try {
                const p = new Place(this.name, place), pel = await this.yin.get(p, user)
                if (pel[p.key]?.open) parents.push(place); else {
                    await pel._manageable(user)
                    parents.push(place);
                }
            } catch (e) {
                console.log(e)
            }
        }
        model._parents = parents;


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
                } else {
                    place = pushParents[i]
                    type = 'Object'
                }
                place = Place.create(place)

                const pel = await this.yin.get(place, user)

                //TODO 暂时没有处理没有权限时怎么办。。。。
                await pel._manageable(user)
                let key = pel._schemaMix[place.key]
                if (!key) {
                    pel._schema.push(new Key(place.key, type))
                    key = pel._schema[place.key]
                }
                if (key.type === 'Array') {
                    pel._map[key.name] = pel._map[key.name] || []
                    pel._map[key.name].push(oPlace)
                } else pel._map[key.name] = oPlace
                await pel._save(user)
            }
        } catch (e) {
            // console.log(e)
            // throw e
        }
        return this.mto(model)
    }

    create(object, user) {
        return this.saveParse(this.otm(object), user, async m => {
            const model = await this.api.create(m)
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

    async save(object, option, user) {
        object = this.otm(object)
        const m = await this.api.findOne({_id: object._id})
        const old = m.toObject()
        yinAssign(m, object);
        return this.saveParse(m, user, async m => {
            await m.save(option)
            this.childrenUpdateCheck(m.toObject(), old)
            return m
        })
    }

    deleteOne(filter) {
        return this.api.deleteOne(filter);
    }

    delete(id) {
        return this.api.deleteOne({_id: id});
    }

    watch() {
    }

    /**
     * 子结构变化检查
     * @param el - 新的mongoose模型.toObject()
     * @param _el - 老的mongoose模型.toObject()
     */
    childrenUpdateCheck(el, _el) {
        const parents = el._parents || [], _parents = _el._parents || [], map = el._map || {},
            _map = _el._map || {}, parentAdd = _.difference(parents, _parents),
            parentDelete = _.difference(_parents, parents), childrenDifference = {};
        for (let i in map) {
            if (map[i] instanceof Array) if (_map[i]) {
                // const cAdd = difference(children[i], _map[i]),cDel=difference(_map[i], children[i]);
                // 循环一下触发childrenDeleted和pushed事件
                if (JSON.stringify(map[i]) !== JSON.stringify(_map[i])) childrenDifference[i] = true;
            } else {
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
        // console.log(childrenDifference)
        for (let key in childrenDifference) {
            this.module.childrenUpdate(new Place(this.name, el._id, key), _map[key], 'fixChange')
        }
    }

    // mapChange(object, old = {}) {
    //     const map = object._map || {}, _map = old, childrenDifference = {}
    //     for (let i in map) {
    //         if (map[i] instanceof Array) if (_map[i]) {
    //             // const cAdd = difference(children[i], _map[i]),cDel=difference(_map[i], children[i]);
    //             // 循环一下触发childrenDeleted和pushed事件
    //             if (JSON.stringify(map[i]) !== JSON.stringify(_map[i])) childrenDifference[i] = true;
    //         } else {
    //             childrenDifference[i] = true
    //         }
    //     }
    //     for (let i in _map) {
    //         if (_map[i] instanceof Array && !map[i]) {
    //             // 循环一下触发childrenDeleted事件
    //             childrenDifference[i] = true;
    //         }
    //     }
    //     console.log(map, _map, childrenDifference)
    //     for (let key in childrenDifference) {
    //         this.module.childrenUpdate(object._place.toKey(key), object._id, 'refresh')
    //     }
    // }
    //
    //
    // parentsChange(object, old = []) {
    //     const parents = object._parents || [], _parents = old,
    //         parentAdd = _.difference(parents, _parents),
    //         parentDelete = _.difference(_parents, parents)
    //     console.log(parents, _parents)
    //     console.log(parentAdd)
    //     for (let idString of parentAdd) {
    //         this.module.childrenUpdate(this.name + '.' + idString, object._id, 'push');
    //     }
    //     console.log(parentDelete)
    //     for (let idString of parentDelete) {
    //         this.module.childrenUpdate(this.name + '.' + idString, object._id, 'delete')
    //     }
    // }


    pull(object, key, value, nodeId) {
        const Key = object._schemaMix[key] || this.module.Object.schema[key.slice(1)]
        if (Key && Key.private) {
            // console.log(Key)
            // this.yin.socket?.of('/manage').to(object._place.valueOf()).emit("update", {
            //     place: object._place.toKey(key),
            //     value
            // });
        } else {
            this.yin.socket?.to(object._place.valueOf()).emit("update",
                {
                    place: object._place.toKey(key),
                    value,
                    nodeId: nodeId || this.yin.nodeId
                }
            );
        }
    }

    objectRead(place, user) {
        this.yin.socket?.of('/manage').to(place.valueOf()).emit("read", {place, user: user._place});
    }

    objectUpdate(place, res = {}) {
        res.place = place
        this.yin.socket?.to(place.valueOf()).emit("update", res);
    }

    objectDelete(place) {
        this.yin.socket?.to(place.valueOf()).emit("delete", {place});
    }

    afterDelete(el) {
        this.objectDelete(el._place)
        for (let i in el._parents) {
            this.module.childrenUpdate(this.name + '.' + el._parents[i], el._id, 'delete');
        }
    }

    async runFunction(place, req, user) {
        return yinStatus.METHOD_NOT_ALLOWED(`#${place} 并没有创建函数，请在创建后重试`, req)
    }

    // async childrenUpdate(place, id, type) {
    //     console.log('childrenUpdate', place, id, type)
    //     const children = this.module.childrenList[place];
    //     if (children)
    //         switch (type) {
    //             case 'push':
    //                 return children.childrenPushed(id)
    //             default:
    //                 return children.childrenRefresh(id, type)
    //         }
    // }
}
