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
exports.Yin = exports.yinRoot = void 0;
const vue = require("vue");
const place_1 = require("./place");
const yin_status_1 = require("../lib/yin.status");
const yin_console_1 = require("../lib/yin.console");
exports.yinRoot = 'User.2902ac2f0000000000000000';
class Yin {
    constructor(...modules) {
        this.modules = [];
        // 文件形式的模型
        this.models = {};
        this.vue = vue;
        this.structureType = ['Object', 'Array'];
        // 系统事件
        this.eventFn = {};
        yin_console_1.yinConsole.log('开始引导');
        modules.map(([module, controller]) => {
            this.regModule(module, controller);
        });
        yin_console_1.yinConsole.log('模块装载完成');
    }
    regModule(module, controller) {
        const Module = new module(this, controller);
        this[Module.name] = Module;
        this.modules.push(this[Module.name]);
        this.structureType.push(Module.name);
        return this;
    }
    regModel(model) {
        return __awaiter(this, void 0, void 0, function* () {
            model.models.forEach(modelId => {
                this.models[modelId] = model;
                this.modules.map((module) => __awaiter(this, void 0, void 0, function* () { return yield module.regModel(modelId); }));
            });
            return this;
        });
    }
    regVue(v) {
        this.vue = v;
        return this;
    }
    genSecret(passwordLength = 16) {
        const chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let password = "";
        for (let i = 0; i <= passwordLength; i++) {
            const randomNumber = Math.floor(Math.random() * chars.length);
            password += chars.substring(randomNumber, randomNumber + 1);
        }
        return password;
    }
    get(place, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (place) {
                const p = new place_1.Place(place);
                if (p.module)
                    return this[p.module].get(p.id, user);
                else
                    return Promise.reject(yin_status_1.yinStatus.NOT_FOUND('错误的place', p));
            }
            return Promise.reject(yin_status_1.yinStatus.NOT_FOUND('#id 为空'));
        });
    }
    on(event, fn) {
        if (!this.eventFn[event])
            this.eventFn[event] = {};
        const t = new Date().getTime();
        this.eventFn[event][t] = fn;
        return { event, t };
    }
    removeEvent({ event, t }) {
        delete this.eventFn[event][t];
    }
    runEventFn(event, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const list = this.eventFn[event];
            if (list)
                for (let id in list) {
                    yield list[id](msg);
                }
            return true;
        });
    }
}
exports.Yin = Yin;
