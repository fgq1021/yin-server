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
exports.SystemModule = void 0;
const module_1 = require("../core/module");
const object_1 = require("../core/object");
class SystemModule extends module_1.Module {
    constructor(yin, controller) {
        super(yin, controller);
        this.name = 'System';
        const _this = this;
        this.Object = class System extends object_1.YinObject {
            constructor() {
                super(...arguments);
                this.$name = 'System';
            }
            get $api() {
                return _this;
            }
            $readable(user) {
                return __awaiter(this, void 0, void 0, function* () {
                    return this.$manageable(user);
                });
            }
            $manageable(user) {
                var _a;
                return __awaiter(this, void 0, void 0, function* () {
                    return ((_a = this.$api.yin.me) === null || _a === void 0 ? void 0 : _a.$isRoot) && (user.$id === this.$api.yin.me.$id);
                });
            }
        };
        this.init();
    }
}
exports.SystemModule = SystemModule;
