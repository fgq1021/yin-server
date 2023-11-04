import {hideProperty} from "../lib/yin.defineProperty.js";

/**
 * 无热更新Key
 */
// export class Key {
//     title = ""
//     name = ""
//     keyType = "String"
//     note = ""
//     private = false
//     settings = {}
//     id = Math.random()
//
//     constructor(key, type = 'String', title = '键', note) {
//         hideProperty(this, 'id')
//         if (typeof key === "object") {
//             Object.assign(this, key)
//         }
//         else {
//             this.title = title
//             this.name = key
//             this.type = type
//             this.note = note
//         }
//     }
//
//     static create(key) {
//         return key instanceof this ? key : new this(key)
//     }
//
//     get type() {
//         return this.keyType
//     }
//
//     set type(t) {
//         this.keyType = t
//     }
// }

/**
 * 热刷新Key
 */
// export class Key {
//     title = ""
//     name = ""
//     keyType = "String"
//     note = ""
//     private = false
//     settings = {}
//     id = Math.random()
//
//     constructor(key, type = 'String', title = '键', note) {
//         hideProperty(this, 'id')
//         hideProperty(this, 'eventFn')
//         if (typeof key === "object") {
//             Object.assign(this, key)
//         }
//         else {
//             this.title = title
//             this.name = key
//             this.type = type
//             this.note = note
//         }
//     }
//
//     static create(key) {
//         return key instanceof this ? key : new Proxy(new this(key), {
//             set(target, p, value) {
//                 target[p] = value
//                 if (p === 'name' || p === 'type' || p === 'keyType')
//                     target.changed(target)
//                 return true
//             }
//         })
//     }
//
//     get type() {
//         return this.keyType
//     }
//
//     set type(t) {
//         this.keyType = t
//     }
//
//     eventFn = [];
//
//     change(fn) {
//         this.eventFn.push(fn)
//         return this
//     }
//
//     removeEvent(fn) {
//         const i = this.eventFn.indexOf(fn)
//         if (i !== -1)
//             this.eventFn.splice(i, 1)
//         return this
//     }
//
//     async changed(msg) {
//         for (let fn of this.eventFn) {
//             fn && await fn(msg)
//         }
//         return true;
//     }
// }


export class Key {
    title = ""
    name = ""
    keyType = "String"
    note = ""
    private = false
    settings = {}
    id = Math.random()
    onChange = () => {
    }

    constructor(key, type = 'String', title = '键', note) {
        hideProperty(this, 'id')
        hideProperty(this, 'eventFn')
        if (typeof key === "object") {
            Object.assign(this, key)
        }
        else {
            this.title = title
            this.name = key
            this.type = type
            this.note = note
        }
    }

    static create(key) {
        return new Proxy(new this(key), {
            set(target, p, value) {
                target[p] = value
                if (['name', 'type', 'keyType'].includes(p) && target.onChange instanceof Function)
                    target.onChange(target)
                return true
            }
        })
    }

    get type() {
        return this.keyType
    }

    set type(t) {
        this.keyType = t
    }
}

// export const Key = new Proxy(Key, {})
