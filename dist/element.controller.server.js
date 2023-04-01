"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementControllerServer = void 0;
const controller_server_1 = require("./controller.server");
class ElementControllerServer extends controller_server_1.ControllerServer {
    constructor() {
        super(...arguments);
        this.name = 'Element';
    }
}
exports.ElementControllerServer = ElementControllerServer;
