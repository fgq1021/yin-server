"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerServer = void 0;
const mongoose_1 = require("mongoose");
const core_1 = require("./core");
const lodash_1 = require("lodash");
class ControllerServer {
    // private updateTimer = {};
    constructor(yin, module) {
        this.yin = yin;
        this.module = module;
    }
    init() {
        this.makeModel();
    }
    makeModel() {
        const schema = new mongoose_1.Schema(this.module.schema.toModelSchema(mongoose_1.Schema.Types.ObjectId), { timestamps: true });
        this.api = (0, mongoose_1.model)(this.name, schema);
    }
    // 可以在这里把带_的存起来，下面直接匹配，不需要schemaDashKey
    mto(model) {
        if (model instanceof Array) {
            return model.map(m => this.mto(m));
        }
        else {
            model = JSON.parse(JSON.stringify(model));
            const o = {};
            for (let k in model) {
                let name = k;
                if (core_1.schemaDashKey.indexOf(k) !== -1) {
                    name = k.replace(/^_/, '$');
                }
                else
                    name = '$' + k;
                o[name] = model[k];
            }
            // 从.data映射用户创建的键值
            for (let d in model.data) {
                o[d] = model.data[d];
            }
            return o;
        }
    }
    otm(object) {
        const m = {};
        let $;
        for (let k in object) {
            if (/^\$/.test(k)) {
                if (k === '$')
                    $ = object.$;
                else if (k !== '$$') {
                    const _k = k.replace(/^\$/, '');
                    if (core_1.schemaDashKey.indexOf('_' + _k) !== -1)
                        m['_' + _k] = object[k];
                    else
                        m[_k] = object[k];
                }
            }
            else {
                if (!m.data)
                    m.data = {};
                m.data[k] = object[k];
            }
        }
        for (let k in $) {
            if (core_1.schemaDashKey.indexOf('_' + k) !== -1)
                m['_' + k] = $[k];
            else
                m[k] = $[k];
        }
        return m;
    }
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const model = yield this.api.findById(id);
                if (model)
                    return this.mto(model);
            }
            catch (e) {
                return Promise.reject(core_1.yinStatus.NOT_FOUND("未找到id为 #" + id + " 的" + this.name));
            }
            return Promise.reject(core_1.yinStatus.NOT_FOUND("未找到id为 #" + id + " 的" + this.name));
        });
    }
    findOne(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = yield this.api.findOne(filter).exec();
            if (model)
                return this.mto(model);
            else
                return Promise.reject(core_1.yinStatus.NOT_FOUND("未找到" + this.name, filter));
        });
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
    find(filter = {}, sort = {}, limit = 50, skip = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            this.matchReg(filter);
            filter = this.otm(filter);
            sort = this.otm(sort);
            const total = yield this.api.count(filter), listFinder = this.api.find(filter).sort(sort).skip(skip);
            if (limit > 0) {
                listFinder.limit(limit);
            }
            const list = yield listFinder;
            if (list)
                return new core_1.ResList(this.mto(list), { skip: Number(skip) + list.length, total, filter: filter, sort });
            else
                return Promise.reject(core_1.yinStatus.NOT_FOUND("获取" + this.name + "列表失败", filter));
        });
    }
    children(place, limit = 50, skip = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            const p = new core_1.Place(place), parent = yield this.module.get(p.id), arrayData = {};
            Object.assign(arrayData, core_1.ArrayDataDefault, parent.$data[p.key] || {});
            const finder = arrayData.finder ? arrayData.finder : { $parents: p.idKey }, sort = arrayData.index[p.index];
            return this.find(finder, sort, limit, skip);
        });
    }
    create(object, user) {
        return __awaiter(this, void 0, void 0, function* () {
            object = this.otm(object);
            const parents = object.pushParents;
            delete object.pushParents;
            yield this.saveParse(object, user);
            // await this.parentsCheck(object, user)
            const Model = new this.api(object);
            yield Model.save();
            for (let idString of Model.parents) {
                this.module.childrenUpdate(this.name + '.' + idString, String(Model._id), 'push');
            }
            try {
                yield this.pushParents(new core_1.Place(this.name, Model._id), parents, user);
            }
            catch (e) {
                console.log(e);
            }
            return this.mto(Model);
        });
    }
    saveParse(object, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (user) {
                object.owner = user.$id;
                return object;
            }
            return Promise.reject(core_1.yinStatus.UNAUTHORIZED('匿名用户无法创建' + this.name, object));
        });
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
    pushParents(oPlace, list, user) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i in list) {
                // console.log(list.length, list[i] instanceof Array)
                let place, type = 'Object';
                if (list[i] instanceof Array) {
                    place = new core_1.Place(list[i][0]);
                    type = 'Array';
                }
                else {
                    place = new core_1.Place(list[i]);
                    type = 'Object';
                }
                const pel = yield this.yin.get(place, user);
                if (yield pel.$manageable(user)) {
                    let key = pel.$schema[place.key];
                    if (!key) {
                        pel.$.schema.push(new core_1.Key(place.key, type));
                        key = pel.$schema[place.key];
                    }
                    if (key.type === 'Array') {
                        pel.$children[key.name] = pel.$children[key.name] || [];
                        pel.$children[key.name].push(oPlace);
                    }
                    else
                        pel.$children[key.name] = oPlace;
                    return pel.$save(user);
                }
                // 没有权限怎么处理？撤回？？？？
            }
        });
    }
    save(o, option, user) {
        return __awaiter(this, void 0, void 0, function* () {
            o = this.otm(o);
            const m = yield this.api.findOne({ _id: o._id });
            Object.assign(m, o);
            yield this.saveParse(o, user);
            yield m.save(option);
            return this.mto(m);
        });
    }
    deleteOne(filter) {
        return this.api.deleteOne(filter);
    }
    delete(id) {
        return this.api.deleteOne({ _id: id });
    }
    watch() {
    }
    eventSync(el, _el) {
        if (_el) {
            this.objectUpdate(el.$place);
            const parents = el.$parents || [], _parents = _el.$parents || [], children = el.$children || {}, _children = _el.$children || {}, parentAdd = (0, lodash_1.difference)(parents, _parents), parentDelete = (0, lodash_1.difference)(_parents, parents), childrenDifference = {};
            for (let i in children) {
                if (_children[i]) {
                    // const cAdd = difference(children[i], _children[i]),cDel=difference(_children[i], children[i]);
                    // 循环一下触发childrenDeleted和pushed事件
                    if (JSON.stringify(children[i]) !== JSON.stringify(_children[i]))
                        childrenDifference[i] = true;
                }
                else {
                    childrenDifference[i] = true;
                }
            }
            for (let i in _children) {
                if (!children[i]) {
                    // 循环一下触发childrenDeleted事件
                    childrenDifference[i] = true;
                }
            }
            for (let idString of parentAdd) {
                this.module.childrenUpdate(this.name + '.' + idString, el.$id, 'push');
            }
            for (let idString of parentDelete) {
                this.module.childrenUpdate(this.name + '.' + idString, el.$id, 'delete');
            }
            for (let key in childrenDifference) {
                this.module.childrenUpdate(el.$place + "." + key, el.$id, 'refresh');
            }
        }
    }
    objectUpdate(id, data) {
        if (this.yin.socket) {
            id = String(id);
            let res = { id };
            if (data)
                Object.assign(res, data);
            console.log("推送更新：", res);
            this.yin.socket.to(id).emit("update", res);
            return;
        }
    }
    objectDelete(id) {
        if (this.yin.socket) {
            id = String(id);
            let res = { id };
            console.log("推送删除：", res);
            return this.yin.socket.to(id).emit("delete", res);
        }
    }
    afterDelete(el) {
        this.objectDelete(el.$place);
        for (let i in el.$parents) {
            this.module.childrenUpdate(this.name + '.' + el.$parents[i], el.$id, 'delete');
        }
    }
}
exports.ControllerServer = ControllerServer;
