import {hideProperty} from "../lib/yin.defineProperty.js";
import {yinStatus} from "../lib/yin.status.js";
import {Module} from "./module.js";
import {yinObject} from "./object.js";
import {Key} from "./key.js";

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

    // 原生文件系统支持
    // constructor(module, ...place) {
    //     let p = module instanceof Module ? module.name : module, file = p === 'File'
    //     for (let i = 0; i < place.length; i++) {
    //         if (place[i]) p += '.' + (file ? place[i].replace('.', '|') : place[i])
    //     }
    //     super(p);
    //     hideProperty(this, 'list')
    //     this.list = p.split('.')
    // }
    constructor(module, ...place) {
        let p = module instanceof Module ? module.name : module
        for (let i = 0; i < place.length; i++) {
            if (place[i]) p += '.' + place[i]
        }
        super(p);
        hideProperty(this, 'list')
        console.assert(typeof p === 'string')
        this.list = p.split('.')
    }

    static create(place) {
        return place instanceof this ? place : new this(place)
    }

    get module() {
        return this.list[0]
    }

    set module(module) {
        this.list[0] = module instanceof Module ? module.name : module
    }

    get id() {
        return this.list[1]
    }

    set id(id) {
        id = id instanceof yinObject ? id._id : id
        this.list[1] = id
    }


    // 原生文件系统支持
    // get id() {
    //     return this.module === 'File' ? this.list[1].replace('|', '.') : this.list[1]
    // }
    //
    // set id(id) {
    //     id = id instanceof yinObject ? id._id : id
    //     this.list[1] = this.module === 'File' ? id.replace('.', '|') : id
    // }

    set Object(object) {
        this.id = object
    }

    get key() {
        return this.list[2]
    }

    set key(key) {
        this.list[2] = key instanceof Key ? key.name : key
    }

    get meta() {
        return this.list[3]
    }

    set meta(meta) {
        this.list[3] = meta
    }

    get index() {
        return this.list[3]
    }

    set index(index) {
        this.list[3] = index
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

    toUrl() {
        return this.list.join('/')
    }

    toUrlWithoutModule() {
        return this.list.slice(1).join('/')
    }

    toKey(key) {
        return new Place(this.module, this.id, key?.name || key || this.key)
    }

    toIndex(index = 'default') {
        return new Place(this.module, this.id, this.key, index)
    }

    toIdKey(key) {
        return this.id + '.' + (key?.name || key)
    }


    static idSetter(value) {
        if (typeof value === 'string') {
            if (/\./.test(value)) return new Place(value).id
            else return value
        }
        else if (value instanceof Place) return value.id
        else if (value instanceof yinObject) return value._id
        else if (!value) return value
        else if (value.valueOf) return value.valueOf()
        return false
    }

    static setter(value, module) {
        if (value instanceof yinObject) return value._place
        else if (value instanceof Place) return value
        else if (typeof value === 'string') {
            if (/\./.test(value)) return new Place(value)
            else if (module) return new Place(module, value)
        }
        else if (!value) return value
        return false
    }
}


export class PlaceArray extends Array {
    get [Symbol.species]() {
        return Array;
    }

    // 对构建器进行改写会造成一些数据出错
    // constructor(...places) {
    //     super(...places.map(p => Place.create(p)))
    // }

    static create(list) {
        // console.log(list)
        const _mapArray = new Proxy(new PlaceArray(), {
            set(target, p, newValue) {
                if (Number.isInteger(Number(p))) {
                    let value
                    if (newValue instanceof yinObject)
                        value = newValue._place
                    else
                        value = Place.create(newValue)
                    if (target.findIndex(v => v.valueOf() === v) === -1)
                        target[p] = value
                    else
                        return false
                }
                else {
                    target[p] = newValue
                }
                return true
            }
        })
        Object.assign(_mapArray, list)
        return _mapArray
    }

    // push(...places) {
    //     return super.push(...places.map(p => Place.create(p)))
    // }

    // concat(...items) {
    //     try {
    //         if (items[0][0] instanceof Place)
    //             return super.concat(...items)
    //         else
    //             return [].concat(this, ...items)
    //     } catch (e) {
    //         return [].concat(this, ...items)
    //     }
    // }

    /**
     *
     * @param {yinObject|Place|string} searchPlace
     * @param fromIndex
     * @private
     */
    includes(searchPlace, fromIndex = 0) {
        const placeString = String(searchPlace instanceof yinObject ? searchPlace._place : searchPlace)
        for (let i = fromIndex; i < this.length; i++) {
            if (this[i].valueOf() === placeString)
                return true
        }
    }
}
