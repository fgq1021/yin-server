"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementModule = void 0;
const module_1 = require("../core/module");
const object_1 = require("../core/object");
class ElementModule extends module_1.Module {
    constructor(yin, controller) {
        super(yin, controller);
        this.name = 'Element';
        const _this = this;
        this.Object = class Element extends object_1.YinObject {
            constructor() {
                super(...arguments);
                this.$name = 'Element';
            }
            get $api() {
                return _this;
            }
        };
        this.init();
    }
}
exports.ElementModule = ElementModule;
