"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemControllerServer = void 0;
const controller_server_1 = require("./controller.server");
const yin_core_1 = require("yin-core");
class SystemControllerServer extends controller_server_1.ControllerServer {
    constructor() {
        super(...arguments);
        this.name = 'System';
    }
    create(object, user) {
        if (user && user.$id === this.yin.me.$id)
            return super.create(object, user);
        return Promise.reject(yin_core_1.yinStatus.FORBIDDEN('非管理员无法创建System'));
    }
}
exports.SystemControllerServer = SystemControllerServer;
