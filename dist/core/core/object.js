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
exports.YinObject = exports.Schema = exports.lifecycle = void 0;
const lodash_1 = require("lodash");
const key_1 = require("./key");
const place_1 = require("./place");
const yin_status_1 = require("../lib/yin.status");
const yin_console_1 = require("../lib/yin.console");
exports.lifecycle = [
    'mounted', 'beforeDestroy',
    'created',
    'beforeSave', 'saved',
    'beforeDelete', 'deleted',
    'childrenSaved', 'childrenPushed', 'childrenDeleted'
];
class Schema extends Array {
    constructor(schema) {
        super(...schema.map(key => key.isKey ? key : new key_1.Key(key)));
    }
    push(...schema) {
        return super.push(...schema.map(key => key.isKey ? key : new key_1.Key(key)));
    }
}
exports.Schema = Schema;
class YinObject {
    get $api() {
        return null;
    }
    get $place() {
        return new place_1.Place(this.$name, this.$id);
    }
    constructor(object, module) {
        // 临时映射数据
        this.$ = {
            owner: null,
            model: null,
            schema: []
        };
        // 临时一次性数据
        this.$$ = {
            model: { $: { schema: [] } },
            schema: []
        };
        this.$changed = false;
        if (module)
            Object.defineProperty(this, '$api', {
                value: module,
                enumerable: false
            });
        Object.defineProperty(this, '$$', {
            value: this.$$,
            enumerable: false
        });
        Object.assign(this, this.$api.schema.toObjectSchema());
        // if (object.$) {
        //     // console.log('assign match $ !!!!', object, object.$)
        //     const $ = object.$
        //     delete object.$
        //     for (let i in $) {
        //         object['$' + i] = $[i]
        //     }
        // }
        this.$assign(object);
    }
    $assign(object) {
        Object.assign(this, object);
    }
    $init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.$initModel();
            }
            catch (e) {
                if (e.status !== 'NOT_FOUND')
                    yin_console_1.yinConsole.warn('$init error', this["$title"], this.$place, e);
            }
            // 在此处读一下，好刷新不同key的功能
            this.$schema;
            this.mounted();
        });
    }
    $initModel() {
        return __awaiter(this, void 0, void 0, function* () {
            const model = yield this.$model();
            this.$$.schema = model.$.schema;
            const models = this.$api.yin.models;
            const typeModule = models[this.$id] || models[model.$id];
            exports.lifecycle.forEach(method => {
                if (typeModule && typeModule[method])
                    this[method] = typeModule[method];
                else
                    this[method] = () => __awaiter(this, void 0, void 0, function* () { return true; });
            });
            if (typeModule) {
                if (typeModule.methods)
                    for (let method in typeModule.methods) {
                        this[method] = typeModule.methods[method];
                    }
                if (typeModule.watch)
                    for (let w in typeModule.watch) {
                        this.$api.yin.vue.watch((0, lodash_1.get)(this, w), typeModule.watch[w]);
                    }
                if (typeModule.computed) {
                    for (let c in typeModule.computed) {
                        this[c] = this.$api.yin.vue.computed(typeModule.computed[c]);
                    }
                }
            }
            return true;
        });
    }
    $readable(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!user && this.$api.yin.client)
                user = this.$api.yin.me;
            if (!this.$hide)
                return true;
            if (this.$.owner === user.$id)
                return true;
            const rds = yield user.$read;
            for (let u of rds) {
                if (this.$.owner === u.$id)
                    return true;
            }
            return yield this.$manageable(user);
        });
    }
    $manageable(user) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // 客户端自动添加用户
            if (!user && this.$api.yin.client)
                user = this.$api.yin.me;
            if (!user)
                return Promise.reject(yin_status_1.yinStatus.UNAUTHORIZED("匿名用户没有修改" + this.$name + " #" + this.$id + " 的权限"));
            if (this.$.owner === user.$id)
                return true;
            const mgs = yield user.$manage(user);
            for (let u of mgs) {
                if (this.$.owner === u.$id)
                    return true;
            }
            if (((_a = this.$api.yin.me) === null || _a === void 0 ? void 0 : _a.$isRoot) && (user.$id === this.$api.yin.me.$id))
                return true;
            return Promise.reject(yin_status_1.yinStatus.UNAUTHORIZED('用户User #' + user.$id + " 没有修改" + this.$name + " #" + this.$id + " 的权限"));
        });
    }
    get $owner() {
        return (user) => this.$api.yin.User.get(this.$.owner, user);
    }
    set $owner(o) {
        if (o)
            this.$.owner = o.$id ? o.$id : o;
    }
    get $model() {
        return (user) => this.$api.yin.Model.get(this.$.model, user);
    }
    set $model(o) {
        if (o)
            this.$.model = o.$id ? o.$id : o;
    }
    set $schema(s) {
        this.$.schema = new Schema(s);
    }
    get $schema() {
        // console.time('$schema')
        const st = [], putSchema = (schema) => {
            if (schema)
                schema.forEach(key => {
                    let match = -1;
                    key = key.isKey ? key : new key_1.Key(key);
                    for (let i = 0; i < st.length && match === -1; i++) {
                        if (key.name === st[i].name) {
                            match = i;
                        }
                    }
                    if (match === -1)
                        st.push(key);
                    else
                        st[match] = key;
                });
        }, makeObject = (k) => {
            if (this.$children[k] instanceof Array) {
                this.$children[k] = this.$children[k][0];
            }
            Object.defineProperty(this, k, {
                get() {
                    const res = (user) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            return yield this.$api.yin.get(this.$children[k], user);
                        }
                        catch (e) {
                            if (e.status === 'NOT_FOUND' && this.$name !== 'Model') {
                                const model = yield this.$model();
                                if (model.$schema[k]) {
                                    const models = yield model[k](user);
                                    if (models.$id || models.length)
                                        return res.create({}, user);
                                }
                            }
                            return Promise.reject(e);
                        }
                    });
                    res.create = (o, user) => __awaiter(this, void 0, void 0, function* () {
                        console.log('res create', this.$id, k);
                        return yield this.$createChild(o, k, user);
                    });
                    return res;
                },
                set(el) {
                    console.log('object set', el.$id);
                    if (el)
                        this.$children[k] = el.$place || el;
                },
                enumerable: true,
                configurable: true
            });
        }, makeArray = (k) => {
            if (this.$children[k] instanceof String) {
                this.$children[k] = [this.$children[k]];
            }
            Object.defineProperty(this, k, {
                get() {
                    const res = (user) => __awaiter(this, void 0, void 0, function* () { return this.$api.children(new place_1.Place(this.$name, this.$id, k), user); });
                    res.create = (o, user) => {
                        console.log('makeArray create', this.$id, k);
                        return this.$createChild(o, k, user);
                    };
                    res.push = res.create;
                    return res;
                },
                set(option) {
                    this.$data[k] = option;
                    return this;
                },
                enumerable: true,
                configurable: true
            });
        };
        for (let c in this.$children) {
            if (typeof this.$children[c] === 'string') {
                st.push(new key_1.Key(c, 'Object'));
            }
            else
                st.push(new key_1.Key(c, 'Array'));
        }
        putSchema(this.$$.schema);
        putSchema(this.$.schema);
        st.forEach(key => {
            const k = key.name;
            if (st[k])
                st[k] = key;
            else if (k)
                Object.defineProperty(st, k, {
                    value: key,
                    enumerable: false,
                    configurable: true,
                    writable: true
                });
            if (k) {
                const type = key.type;
                if (type === 'Function')
                    this[k] = (req) => this.$api.runFunction(this, k, req);
                else if (type === 'Array') {
                    makeArray(k);
                }
                else if (this.$api.yin.structureType.indexOf(type) !== -1)
                    makeObject(k);
            }
        });
        // console.timeEnd('$schema')
        return st;
    }
    $refresh() {
        return this.$api.getFromController(this.$id);
    }
    $createChild(req = {}, key, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const k = typeof key === "string" ? this.$schema[key] : key;
            let module = req.$name || k.settings.module || this.$name;
            if (this.$name === 'Model' && !this.$.model) {
                module = "Model";
            }
            if (k.type !== 'Array')
                req.$pushParents = [new place_1.Place(this.$name, this.$id, k.name)];
            else if (module !== this.$name)
                req.$pushParents = [[new place_1.Place(this.$name, this.$id, k.name)]];
            else {
                if (!(req.$parents instanceof Array))
                    req.$parents = [];
                req.$parents.push(new place_1.Place(this.$id, k.name));
            }
            if (!req.$title)
                req.$title = k.title;
            if (!req.$model && this.$name !== 'Model')
                try {
                    const parentModel = yield this.$model();
                    if (parentModel.$id !== this.$id) {
                        const models = yield parentModel[k.name](), model = models.$id ? models : models[0].$id;
                        if (model.$id) {
                            req.$model = model.$id;
                            for (let i in model.$data) {
                                req[i] = req[i] || model.$data[i];
                            }
                        }
                    }
                }
                catch (e) {
                    // console.log(e)
                }
            return this.$api.yin[module].create(req, user);
        });
    }
    $save(option, user) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.$api.save(this, option, user);
        });
    }
    $delete(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.$api.delete(this, user);
        });
    }
    // 生命周期默认函数
    'mounted'(user) {
    }
    'beforeDestroy'(user) {
    }
    'created'(user) {
    }
    'beforeSave'(user) {
    }
    'saved'(user) {
    }
    'beforeDelete'(user) {
    }
    'deleted'(user) {
    }
    'childrenSaved'(user) {
    }
    'childrenPushed'(key, id) {
    }
    'childrenDeleted'(user) {
    }
}
exports.YinObject = YinObject;
