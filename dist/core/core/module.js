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
exports.Module = void 0;
const yin_status_1 = require("../lib/yin.status");
const module_schema_1 = require("./module.schema");
const array_1 = require("./array");
const yin_console_1 = require("../lib/yin.console");
const parse_json_1 = require("../lib/parse.json");
class Module {
    constructor(yin, controller) {
        this.schema = new module_schema_1.ModuleSchema({});
        this.list = {};
        this.childrenList = {};
        this.yin = yin;
        this.api = new controller(yin, this);
    }
    init() {
        yin_console_1.yinConsole.log('装载模块:', this.name);
        this.list = this.yin.vue.reactive({});
        this.api.init();
    }
    regModel(modelId) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i in this.list) {
                const el = this.list[i];
                if (el.$.model === modelId) {
                    yield el.$init();
                }
            }
        });
    }
    assign(el) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log('assign', el.$id, el.$title, el)
            const id = el.$id;
            let element = this.list[id];
            if (element && element.$id) {
                // if (new Date(el.$updatedAt) > new Date(element.$updatedAt)) {
                if (new Date(el.$updatedAt) > new Date(element.$updatedAt)) {
                    yin_console_1.yinConsole.log("更新" + this.name + ":", el.$title, "#" + el.$id);
                    const oldEl = (0, parse_json_1.parseJson)(element);
                    if (el.$model !== element.$.model) {
                        // Object.assign(this.list[id], el)
                        this.list[id].$assign(el);
                        yield this.list[id].$init();
                    }
                    else
                        this.list[id].$assign(el);
                    try {
                        yield this.list[id].$runEventFn('update', '更新');
                    }
                    catch (e) {
                        console.log(e);
                    }
                    this.api.eventSync(this.list[id], oldEl);
                }
                // else {
                //   console.log("更新未成功" + this.name + ":", el.title || el.username, "#" + el.$id);
                //   console.log(el.updatedAt, element.updatedAt);
                // }
            }
            else {
                yin_console_1.yinConsole.log("获取" + this.name + ":", el.$title, "#" + el.$id);
                this.list[id] = new this.Object(el);
                yield this.list[id].$init();
                this.api.eventSync(this.list[id]);
            }
            return this.list[id];
        });
    }
    // async assignList(list) {
    //     for (let i = 0; i < list.length; i++) {
    //         list[i] = await this.assign(list[i]);
    //     }
    //     return list;
    // }
    u(u) {
        return this.yin.client ? (u || this.yin.me) : u;
    }
    refresh(id) {
        return this.list[id].$refresh();
    }
    get(id, user) {
        return __awaiter(this, void 0, void 0, function* () {
            user = this.u(user);
            if (id) {
                const el = yield this.getWaiter(id);
                if (yield el.$readable(user))
                    return el;
                return Promise.reject(yin_status_1.yinStatus.UNAUTHORIZED((user ? user.username + "#" + user.$id : "匿名用户") + "没有查看id为 #" + id + " " + this.name + "的权限"));
            }
            return Promise.reject(yin_status_1.yinStatus.NOT_FOUND('#id 为空'));
        });
    }
    getWaiter(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (id) {
                const cache = this.list[id];
                if (cache) {
                    if (cache.$id && !cache.$isDeleted)
                        return cache;
                    else if (cache.$isDeleted)
                        return Promise.reject({ status: "NOT_FOUND", message: "未找到id为 #" + id + " 的" + this.name });
                    else
                        return new Promise((resolve, reject) => {
                            const timer = setInterval(() => {
                                const _cache = this.list[id];
                                if (_cache && _cache.$id) {
                                    resolve(_cache);
                                    clearInterval(timer);
                                }
                                else if (!_cache) {
                                    reject();
                                    clearInterval(timer);
                                }
                            }, 100);
                        });
                }
                else {
                    this.list[id] = {};
                    return this.getFromController(id);
                }
            }
            else
                return Promise.reject(yin_status_1.yinStatus.NOT_ACCEPTABLE('没有ID'));
        });
    }
    getFromController(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let el = yield this.api.get(id);
                return this.assign(el);
            }
            catch (err) {
                this.list[id].$isDeleted = true;
                return Promise.reject(err);
            }
        });
    }
    children(place, user) {
        return __awaiter(this, void 0, void 0, function* () {
            user = this.u(user);
            const children = yield this.childrenWaiter(place);
            const list = children.toArray(user);
            yield list.get(10);
            return list;
        });
    }
    childrenWaiter(place) {
        return __awaiter(this, void 0, void 0, function* () {
            if (place) {
                const cache = this.childrenList[place];
                if (cache) {
                    return cache;
                }
                else {
                    this.childrenList[place] = new array_1.YinChildren(place, this.yin, this);
                    yield this.childrenList[place].init();
                    return this.childrenList[place];
                }
            }
            else
                return Promise.reject(yin_status_1.yinStatus.NOT_ACCEPTABLE('没有正确的Place'));
        });
    }
    childrenUpdate(place, id, type) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const children = this.childrenList[place];
                if (children)
                    switch (type) {
                        case 'push':
                            return children.childrenPushed(id);
                        default:
                            return children.childrenRefresh(id, type);
                    }
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    // 创建时此选项会添加父元素的children
    // el.pushParents = ['id.key',['id,key']]
    create(object, user) {
        return __awaiter(this, void 0, void 0, function* () {
            user = this.u(user);
            return this.assign(yield this.api.create(object, user));
        });
    }
    // 更新时此选项会添加父元素的children????
    // el.pushParents = ['id.key',['id,key']]
    save(object, option, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let o = option, u = user;
            if (!user && option && (option.$name === 'User' || option.$id || option.$isRoot)) {
                u = option;
                o = {};
            }
            u = this.u(u);
            object = (0, parse_json_1.parseJson)(object);
            const oriEl = yield this.get(object.$id, u);
            yield oriEl.$refresh();
            if (yield oriEl.$manageable(u)) {
                oriEl.beforeSave(u);
                yield this.assign(yield this.api.save(object, o, u));
                oriEl.saved(u);
                return oriEl;
            }
            return Promise.reject(yin_status_1.yinStatus.UNAUTHORIZED("您没有修改" + this.name + " #" + object.$id || object._id + " 的权限"));
        });
    }
    delete(o, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = o.$id || o;
            const object = yield this.get(id, user);
            if (yield object.$manageable(user)) {
                object.beforeDelete();
                yield this.api.delete(id, user);
                object.deleted();
                this.afterDelete(id);
                return Promise.resolve(yin_status_1.yinStatus.OK(this.name + " #" + id + " 已删除"));
            }
            return Promise.reject(yin_status_1.yinStatus.UNAUTHORIZED('用户#' + user.$title + '没有' + this.name + ' #' + id + ' 的管理权限'));
        });
    }
    objectUpdate(id, data, timer) {
        return this.api.objectUpdate(id, data, timer);
    }
    objectDelete(id) {
        return this.api.objectDelete(id);
    }
    // async deleteFrom(el, placeString, user?) {
    //     const {id, place, key} = this.parsePlaceString(placeString);
    //     const pIndex = el.parents.indexOf(id + "." + place + "." + key);
    //     if (pIndex !== -1) {
    //         el.parents.splice(pIndex, 1);
    //         await el.save(user);
    //     } else {
    //         await this.removeChildren(await this.yin.get(placeString), el.name + "." + el.$id + "." + place + "." + key, user);
    //     }
    // }
    afterDelete(id) {
        const el = this.list[id];
        if (el) {
            el.$isDeleted = true;
            el.$runEventFn('delete', '已删除');
            this.api.afterDelete(el);
        }
    }
    upload(file, id, place, key, progress, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (file && id) {
                return this.assign(yield this.api.upload(file, id, place, key, progress, user));
            }
            return Promise.reject({ status: "FORBIDDEN", message: "文件或ID格式不对" });
        });
    }
    uploadDirectory(file, id, place = "data", key = "sub", progress, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (file && id) {
                return this.assign(yield this.api.uploadDirectory(file, id, place, key, progress, user));
            }
            return Promise.reject({ status: "FORBIDDEN", message: "文件或ID格式不对" });
        });
    }
    pushChildren(el, placeString, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!el.$id)
                el = yield this.get(el);
            // el = await this.get(el, user);
            // const rights = this.rights(el, user);
            // if (rights.write()) {
            const { slot, units, id, place, key } = this.yin.parsePlaceString(placeString), keyString = place + "." + key;
            switch (slot) {
                case "Array":
                    el.children[keyString] = el.children[keyString] || [];
                    el.children[keyString].push(units + "-" + id);
                    break;
                case "Object":
                    el.children[keyString] = units + "-" + id;
            }
            return el.save(user);
            // } else return Promise.reject({
            //     status: "FORBIDDEN",
            //     message: "您没有修改" + this.name + " #" + el.$id + " 的权限"
            // });
        });
    }
    removeChildren(el, placeString, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!el.$id)
                el = yield this.get(el);
            // el = await this.get(el, user);
            // const rights = this.rights(el, user);
            // if (rights.write()) {
            const { Unit, id, place, key } = this.yin.parsePlaceString(placeString), keyString = place + "." + key, childrenString = Unit + "-" + id;
            if (el.children[keyString] === childrenString) {
                delete el.children[keyString];
                return el.save(user);
            }
            else {
                const cIndex = el.children[keyString].indexOf(childrenString);
                if (cIndex !== -1) {
                    el.parents.splice(cIndex, 1);
                    return el.save(user);
                }
            }
            return Promise.reject({ status: "FORBIDDEN", message: el.name + " #" + el.$id + " 下没有固定此元素" });
            // }
            // return Promise.reject({status: "FORBIDDEN", message: "您没有修改" + el.name + " #" + el.$id + " 的权限"});
        });
    }
    find(filter = {}, sort = {}, limit = 50, skip = 0, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const list = new array_1.YinArray({ filter, sort }, this, user);
            yield list.get(limit, skip);
            return list;
        });
    }
    runFunction(placeString, req, user) {
        return __awaiter(this, void 0, void 0, function* () {
            // req = req || el.data
            // if (typeof el[functionName] === 'function') {
            //     return el[functionName](req, user)
            // }
            return this.api.runFunction(placeString, req, user);
        });
    }
}
exports.Module = Module;
