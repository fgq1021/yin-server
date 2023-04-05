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
exports.UserModule = void 0;
const module_1 = require("../core/module");
const object_1 = require("../core/object");
const module_schema_1 = require("../core/module.schema");
class UserModule extends module_1.Module {
    constructor(yin, controller) {
        super(yin, controller);
        this.name = 'User';
        this.schema = new module_schema_1.ModuleSchema({
            $wx: {
                openid: String,
                unionid: String,
                userInfo: {}
            },
            $tel: {
                index: true,
                unique: true,
                type: Number
            },
            $passwordHash: String,
            $passwordUpdateTime: {
                type: Date,
                default: Date.now
            },
            $objectUpdateTime: {
                type: Date,
                default: Date.now
            }
        });
        const _this = this;
        this.Object = class User extends object_1.YinObject {
            constructor() {
                super(...arguments);
                this.$name = 'User';
            }
            get $api() {
                return _this;
            }
            get $owner() {
                return (user) => this.$api.yin.User.get(this.$.owner || this.$id, user);
            }
            set $owner(o) {
                super.$owner = o;
            }
            $manage(user) {
                return this.$api.children(this.$name + '.' + this.$id + '.$manage', user);
            }
            $read(user) {
                return this.$api.children(this.$name + '.' + this.$id + '.$read', user);
            }
            $readable(user) {
                return __awaiter(this, void 0, void 0, function* () {
                    return true;
                });
            }
            $manageable(user) {
                const _super = Object.create(null, {
                    $manageable: { get: () => super.$manageable }
                });
                return __awaiter(this, void 0, void 0, function* () {
                    if (!user && this.$api.yin.client)
                        user = this.$api.yin.me;
                    if ((user === null || user === void 0 ? void 0 : user.$id) === this.$id)
                        return true;
                    return _super.$manageable.call(this, user);
                });
            }
        };
        this.init();
    }
    createRoot(object) {
        return this.api.createRoot(object);
    }
    authPassword(tel, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.api.authPassword(tel, password);
            return this.assign(user);
        });
    }
    auth(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.api.auth(id);
            return this.assign(user);
        });
    }
}
exports.UserModule = UserModule;
