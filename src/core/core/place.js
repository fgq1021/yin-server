import {hideProperty} from "../lib/yin.defineProperty.js";
import {yinStatus} from "../lib/yin.status.js";
import {Module} from "./module.js";

/**
 * TODO Place的概念需要重新想一想
 * Module.id 应该被定义为ID
 * Module.id.key 应该为place？？
 * 不知道怎样表述才能更清楚一些
 */


// export class ModulePlace extends String {
//     static get [Symbol.species]() {
//         return String;
//     }
//
//     list
//     module
//
//     constructor(id, ...place) {
//         let p = id
//         for (let i = 0; i < place.length; i++) {
//             if (place[i])
//                 p += '.' + place[i]
//         }
//         super(p);
//         hideProperty(this, 'list')
//         this.list = p.split('.')
//     }
//
//     static create(place) {
//         return place instanceof this ? place : new this(place)
//     }
//
//     get id() {
//         return this.list[0]
//     }
//
//     get key() {
//         return this.list[1]
//     }
//
//     get meta() {
//         return this.list[2]
//     }
//
//     get index() {
//         return this.list[2] || 'default'
//     }
//
//     get Place() {
//         return new Place(this.module, this.id)
//     }
//
//     toKey(key) {
//         return new Place(this.module, this.id, key?.name || key)
//     }
//
//     auth(user) {
//         if (this.key)
//             return this.getKey(user)
//         return this.getObject(user)
//     }
//
//     getObject(user) {
//         if (this.module)
//             return this.module.get(this.id, user)
//         return yinStatus.FORBIDDEN(`${this} 没有包含有效的 模块{Module}`)
//     }
//
//     async getKey(user) {
//         if (this.key) {
//             const object = await this.getObject(user)
//             return object[this.key]
//         }
//         return yinStatus.NOT_ACCEPTABLE(`${this} 没有Key`)
//     }
//
//     async then(resolve, reject) {
//         try {
//             resolve(await this.auth())
//         } catch (e) {
//             reject(e)
//         }
//     }
// }

/**
 * just simplest Place
 */
export class Place extends String {
    static get [Symbol.species]() {
        return String;
    }

    list

    constructor(module, ...place) {
        let p = module instanceof Module ? module.name : module
        for (let i = 0; i < place.length; i++) {
            if (place[i])
                p += '.' + place[i]
        }
        super(p);
        hideProperty(this, 'list')
        this.list = p.split('.')
    }

    static create(place) {
        return place instanceof this ? place : new this(place)
    }

    get module() {
        return this.list[0]
    }

    get id() {
        return this.list[1]
    }

    get key() {
        return this.list[2]
    }

    get meta() {
        return this.list[3]
    }

    get index() {
        return this.list[3]
    }

    get 'id.key'() {
        return this.id + '.' + this.key
    }

    get 'id.key.index'() {
        return this.id + '.' + this.key + '.' + this.index
    }

    get 'module.id'() {
        return new Place(this.module, this.id)
    }

    get 'module.id.key'() {
        return new Place(this.module, this.id, this.key)
    }

    toKey(key) {
        return new Place(this.module, this.id, key?.name || key || this.key)
    }

    toIndex(index = 'default') {
        return new Place(this.module, this.id, this.key, index)
    }

    toIdKey(key) {
        return this.id + '.' + key?.name || key
    }
}

