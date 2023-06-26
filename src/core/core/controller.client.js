import {yinRequest} from "../lib/yin.request.js";

export class ControllerClient {
    name
    module
    yin
    req

    constructor(yin, module) {
        this.yin = yin
        this.module = module
        this.req = new yinRequest(yin, this)
    }

    init() {
        return this.req.get();
    }

    // api功能,请输入原始数据
    get(id) {
        return this.req.get(id);
    }

    findOne(filter) {
        return this.req.post("findOne", filter)
    }

    matchReg(array) {
        for (let i in array) {
            if (array[i] instanceof RegExp) {
                array[i] = array[i].toString()
            }
        }
        return array;
    }

    find(filter = {}, sort = {}, limit = 50, skip = 0) {
        return this.req.post("find?limit=" + limit + "&skip=" + skip, {filter: this.matchReg(filter), sort})
    }

    create(el) {
        return this.req.post('', el);
    }

    save(el) {
        return this.req.patch(el._id, el);
    }

    delete(id) {
        return this.req.delete(id);
    }

    children(place, limit = 50, skip = 0) {
        return this.req.get('children/' + place + "?limit=" + limit + "&skip=" + skip)
    }

    async runFunction(place, req) {
        return this.req.post(place.id + '/' + place.key, req);
    }

    eventSync(el, _el) {
        if (_el) {
        } else {
            this.watch(el._place);
        }
    }

    watch(place) {
        this.yin.socket?.emit("watch", {place});
        this.yin.socketManage?.emit("watch", {place});
    }

    pull(object, key, value, nodeId) {
        this.yin.socketManage?.emit("update",
            {
                place: object._place.toKey(key),
                value,
                nodeId: nodeId || this.yin.nodeId
            });
    }

    objectRead(place) {
    }

    objectUpdate(id, data) {
    }

    objectDelete(id) {
    }

    afterDelete(el) {
    }

    hotReloadRestart() {
        for (let i in this.module.list) {
            this.watch(this.name + "." + i);
        }
        for (let i in this.module.childrenList) {
            this.watch(this.name + "." + i);
        }
    }
}
