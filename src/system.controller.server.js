import {ControllerServer} from "./controller.server.js";
import {yinStatus} from "./core/index.js";

export class SystemControllerServer extends ControllerServer {
    create(object, user) {
        if (user && user === this.yin.me)
            return super.create(object, user)
        return yinStatus.FORBIDDEN('非管理员无法创建System')
    }
}
