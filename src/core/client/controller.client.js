import {yinRequest} from "../lib/yin.request.js";
import {yinMD5} from "../lib/yin.md5.js";

export class ControllerClient {
    get name() {
        return this.module?.name
    }

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

    mounted(object) {
        this.yin.socket?.emit("watch", object._place);
    }

    childrenMounted(children) {
        this.mounted(children)
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

    async update(object, user, at) {
        if (at) {
            await object._nextTick()
            if (new Date(at) > object._updatedAt) return object._refresh()
        }
    }

    delete(object) {
        return this.req.delete(object._id);
    }

    async children(place, limit = 50, skip = 0) {
        return this.req.get('children/' + place.toUrlWithoutModule() + "?limit=" + limit + "&skip=" + skip)
    }

    async upload(file, place, progress) {
        if (file instanceof Array) {
            const data = new FormData();
            for (let f of file) {
                data.append(f.webkitRelativePath, f);
            }
            return this.req.patch(place.toUrlWithoutModule(), data, progress);
        }
        const md5 = new yinMD5.ArrayBuffer(),
            suffix = file.name.match(/\..+$/),
            data = new FormData();
        md5.append(await file.arrayBuffer());
        let name = md5.end()
        if (suffix) name += suffix[0]
        data.append(name, file, name);
        return this.req.patch(place.toUrlWithoutModule(), data, progress);
    }

    async runFunction(place, req) {
        return this.req.post(place.id + '/' + place.key, req);
    }

    pull(object, key, value, nodeId) {
        this.yin.socket?.emit("pull",
            {
                place: object._place.toKey(key).valueOf(),
                value,
                nodeId: nodeId || this.yin.nodeId
            });
    }

    hotReloadRestart() {
        for (let i in this.module.list) {
            if (!this.module.list[i]._isDeleted)
                this.yin.socket?.emit("watch", this.name + "." + i);
        }
        for (let i in this.module.childrenList) {
            if (!this.module.childrenList[i].parent._isDeleted)
                this.yin.socket?.emit("watch", i);
        }
    }
}
