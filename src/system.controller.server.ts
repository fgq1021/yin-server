import {ControllerServer} from "./controller.server";
import {yinStatus} from "yin-core";

export class SystemControllerServer extends ControllerServer {
    public name = 'System'

    create(object, user?) {
        if (user && user.$id === this.yin.me.$id)
            return super.create(object, user)
        return Promise.reject(yinStatus.FORBIDDEN('非管理员无法创建System'))
    }
}