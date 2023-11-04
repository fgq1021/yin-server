import {ControllerServer} from "./controller.server.js";
import {Place} from "./core/index.js";

export class ModelControllerServer extends ControllerServer {
    async children(place, limit = 50, skip = 0) {
        const p = Place.create(place),
            parent = await this.module.get(p.id),
            arrayData = parent[p.key],
            sort = arrayData.index[p.index],
            mapLength = parent._map[p.key]?.length || 0,
            res = await this.find({_parents: p["id.key"]}, sort, limit, Math.max(skip - mapLength, 0))
        res.total += mapLength
        res.skip += mapLength
        return res
    }
}
