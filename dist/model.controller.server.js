"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelControllerServer = void 0;
const controller_server_1 = require("./controller.server");
class ModelControllerServer extends controller_server_1.ControllerServer {
    constructor() {
        super(...arguments);
        this.name = 'Model';
    }
}
exports.ModelControllerServer = ModelControllerServer;
