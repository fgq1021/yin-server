import {Schema, model} from "mongoose";
import {yinStatus, Place, ResList, Key, schemaDashKey} from "yin-core";

export class ControllerServer {
    public name
    public api
    public module
    public yin
    private updateTimer = {};

    constructor(yin, module) {
        this.yin = yin
        this.module = module
    }

    init() {
        this.makeModel()
    }

    makeModel() {
        const schema = new Schema(this.module.schema.toModelSchema(Schema.Types.ObjectId), {timestamps: true});
        this.api = model(this.name, schema)
    }


    // 可以在这里把带_的存起来，下面直接匹配，不需要schemaDashKey
    mto(model: any | [any]) {
        if (model instanceof Array) {
            return model.map(m => this.mto(m))
        } else {
            model = JSON.parse(JSON.stringify(model))
            const o = {}
            for (let k in model) {
                let name = k
                if (schemaDashKey.indexOf(k) !== -1) {
                    name = k.replace(/^_/, '$')
                } else
                    name = '$' + k
                o[name] = model[k]
            }
            // 从.data映射用户创建的键值
            for (let d in model.data) {
                o[d] = model.data[d]
            }
            return o
        }
    }

    otm(object) {
        const m = {} as any
        let $
        for (let k in object) {
            if (/^\$/.test(k)) {
                if (k === '$')
                    $ = object.$
                else if (k !== '$$') {
                    const _k = k.replace(/^\$/, '')
                    if (schemaDashKey.indexOf('_' + _k) !== -1)
                        m['_' + _k] = object[k]
                    else
                        m[_k] = object[k]
                }
            } else {
                if (!m.data)
                    m.data = {}
                m.data[k] = object[k]
            }
        }
        for (let k in $) {
            if (schemaDashKey.indexOf('_' + k) !== -1)
                m['_' + k] = $[k]
            else
                m[k] = $[k]
        }
        return m
    }

    async get(id: string): Promise<object> {
        try {
            const model = await this.api.findById(id)
            if (model) return this.mto(model)
        } catch (e) {
            return Promise.reject(yinStatus.NOT_FOUND("未找到id为 #" + id + " 的" + this.name));
        }
        return Promise.reject(yinStatus.NOT_FOUND("未找到id为 #" + id + " 的" + this.name));
    }


    async findOne(filter: object): Promise<object> {
        const model = await this.api.findOne(filter).exec();
        if (model) return this.mto(model)
        else return Promise.reject(yinStatus.NOT_FOUND("未找到" + this.name, filter));
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

    async find(filter: object = {}, sort: object = {}, limit: number = 50, skip: number = 0) {
        this.matchReg(filter);
        filter = this.otm(filter)
        console.log(filter)
        const total = await this.api.count(filter), listFinder = this.api.find(filter).sort(sort).skip(skip);
        if (limit > 0) {
            listFinder.limit(limit);
        }
        const list = await listFinder;
        if (list)
            return new ResList(this.mto(list), {skip: Number(skip) + list.length, total, filter: filter, sort});
        else return Promise.reject(yinStatus.NOT_FOUND("获取" + this.name + "列表失败", filter));
    }

    async create(object, user) {
        object = this.otm(object)
        const parents = object.pushParents
        delete object.pushParents
        await this.saveParse(object, user)
        // await this.parentsCheck(object, user)
        const Model = new this.api(object);
        await Model.save()
        await this.pushParents(new Place(this.name, Model._id), parents, user)
        return this.mto(Model)
    }

    async saveParse(object, user) {
        if (user) {
            object.owner = user.$id
            return object
        }
        return Promise.reject(yinStatus.UNAUTHORIZED('匿名用户无法创建' + this.name, object))
    }

    // async parentsCheck(object, user) {
    //     // 因为有userID的权限也在parents里面，这里的检查会比较麻烦
    //     // 就先不检查了
    //     const parents = []
    //     for (let i in object.$parents) {
    //         const pel = await this.yin.get(object.$parents[i], user);
    //         if (pel)
    //             parents.push(object.$parents[i]);
    //     }
    //     object.$parents = parents;
    // }

    async pushParents(oPlace, list, user) {
        for (let i in list) {
            // console.log(list.length, list[i] instanceof Array)
            let place, type = 'Object';

            if (list[i] instanceof Array) {
                place = new Place(list[i][0])
                type = 'Array'
            } else {
                place = new Place(list[i])
                type = 'Object'
            }

            const pel = await this.yin.get(place, user)
            if (pel.$manageable(user)) {
                let key = pel.$schema[place.key]
                if (!key) {
                    pel.$objectSchema.push(new Key(place.key, type))
                    key = pel.$schema[place.key]
                    // console.log(key)
                }
                if (key.type === 'Array') {
                    pel.$children[key.name] = pel.$children[key.name] || []
                    pel.$children[key.name].push(oPlace)
                } else
                    pel.$children[key.name] = oPlace
                await pel.$save(user)
            }
        }
    }

    async save(o, option?, user?) {
        o = this.otm(o)
        console.log(o)
        const m = await this.api.findOne({_id: o._id});
        Object.assign(m, o);
        await this.saveParse(o, user)
        await m.save(option);
        return this.mto(m)
    }

    deleteOne(filter) {
        return this.api.deleteOne(filter);
    }

    delete(id) {
        return this.api.deleteOne({_id: id});
    }

    // async children(place) {
    //     const p = new Place(place),
    //         parent = await this.module.get(p.id),
    //         {filter, sort} = parent.$.data[p.key] || {filter: {}, sort: {}},
    //         idList = parent.$children[p.key] || [],
    //         listOption = {skip: 0, total: 0, fixed: 0}, notFoundList = [], fixedList = []
    //     filter.parent = p.idKey
    //     for (let i in idList) {
    //         try {
    //             const el = await this.yin.get(idList[i], this.yin.me)
    //             fixedList.push(el.$);
    //         } catch (e) {
    //             if (e.status === "NOT_FOUND")
    //                 notFoundList.push(i);
    //         }
    //     }
    //     notFoundList.reverse();
    //     for (let index of notFoundList) {
    //         parent.$children[p.key].splice(index, 1);
    //     }
    //     if (notFoundList.length)
    //         parent.save(this.yin.me);
    //
    //     listOption.fixed = fixedList.length;
    //
    //     const subList = await this.find(filter, sort)
    //     listOption.total = subList.total + fixedList.length
    //     listOption.skip = subList.skip + fixedList.length
    //     return new ResList(fixedList.concat(subList.list), listOption)
    // }

    // eventSync(el, _el?) {
    //     if (_el) {
    //         this.objectUpdate(this.name + "." + el.$id);
    //         console.time("findDifferent");
    //         const parents = el.parents || [], _parents = _el.parents || [], children = el.children || {},
    //             _children = _el.children || {};
    //
    //         const parentAdd = difference(parents, _parents), parentDelete = difference(_parents, parents),
    //             parentsDifference = parentAdd.concat(parentDelete), childrenDifference = {};
    //         for (let i in children) {
    //             if (_children[i]) {
    //                 // const d = _.difference(children[i], _children[i]).concat(_.difference(_children[i], children[i]));
    //                 // if (d.length)
    //                 //   childrenDifference[i] = d;
    //                 if (JSON.stringify(children[i]) !== JSON.stringify(_children[i]))
    //                     childrenDifference[i] = true;
    //             } else {
    //                 childrenDifference[i] = true;
    //             }
    //         }
    //         // console.log(childrenDifference);
    //         for (let i in _children) {
    //             if (!children[i])
    //                 childrenDifference[i] = true;
    //         }
    //         console.timeEnd("findDifferent");
    //         // console.log(childrenDifference, parentsDifference, el, _el);
    //         // for (let idString of parentsDifference) {
    //         //   // 元素触发结构更新时不判断头尾，可能为降低效率
    //         //   // this.childrenRefresh(idString, el.$id);
    //         //   this.childrenRefresh(idString);
    //         // }
    //         for (let idString of parentAdd) {
    //             this.childrenRefresh(idString, el.$id);
    //         }
    //         for (let idString of parentDelete) {
    //             this.childrenRefresh(idString, null, el.$id);
    //         }
    //         for (let parentString in childrenDifference) {
    //             this.objectUpdate(this.name + "." + el.$id + "." + parentString, {
    //                 type: "fixedChange",
    //                 changeId: el.$id
    //             });
    //         }
    //     }
    // }

    objectUpdate(id, data?: { changeId: any; type: string }, timer?) {
        const res = {id};
        if (data)
            Object.assign(res, data);
        if (timer) {
            if (this.updateTimer[id]) {
                clearTimeout(this.updateTimer[id]);
            }
            this.updateTimer[id] = setTimeout(() => {
                console.log("推送更新：", timer + "ms(延迟)", id);
                this.yin.socket.to(id).emit("update", res);
                delete this.updateTimer[id];
            }, timer);
        } else if (this.yin.socket) {
            console.log("推送更新：", id);
            this.yin.socket.to(id).emit("update", res);
        }
    }

    // async childrenRefresh(parentString, addId?, delId?) {
    //     console.log("childrenRefresh:", parentString);
    //     const {id, place, key} = this.yin.parsePlaceString(parentString);
    //     const children = this.childrenList[parentString];
    //     // console.log(children.total);
    //     if (children) {
    //         await this.childrenFromController(id, place, key);
    //         if (addId) {
    //             let emitted = false;
    //             const firstEl = children.list[0];
    //             if (firstEl && firstEl.$id === addId) {
    //                 //触发列表头部添加
    //                 this.objectUpdate(this.name + "." + parentString, {type: "addFirst", changeId: addId});
    //                 emitted = true;
    //             }
    //
    //             const lastEl = await this.lastChildren(id, place, key);
    //             if (lastEl && lastEl.$id === addId && !emitted) {
    //                 //触发列表尾部添加
    //                 this.objectUpdate(this.name + "." + parentString, {type: "addLast", changeId: addId});
    //                 emitted = true;
    //             }
    //
    //             if (!emitted) {
    //                 this.objectUpdate(this.name + "." + parentString);
    //             }
    //             const parent = await this.module.get(id, this.yin.me);
    //             // if (parent.childrenPushed)
    //             parent.childrenPushed(parentString, addId);
    //         } else {
    //             this.objectUpdate(this.name + "." + parentString);
    //             if (delId) {
    //                 const parent = await this.module.get(id, this.yin.me);
    //                 // if (parent.childrenDeleted)
    //                 parent.childrenDeleted(parentString, delId);
    //             }
    //         }
    //     }
    // }
}
