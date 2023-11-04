import {Module} from "../core/module.js";
import { Schema, yinObject} from "../core/object.js";
import {Key} from "../core/key.js";
import {Types} from "../core/type.js";

export class ModelObject extends yinObject {
    static schema = Schema.create([
        ...super.schema,
        {name: 'schema', note: '使用此模型的对象将在保存后变更'}
    ])

    async _readable(user) {
        return true
    }

    get _arrayTypes() {
        if (this._model?.valueOf())
            return []
        return this._module.yin.structureType.concat(['Selector'])
    }

    /**
     * 对此项的更改不会直接作用到_schema上
     * @return {Proxy[Array]}
     * @private
     */
    get _schemaMix() {
        // const s = {}, a = []
        // for (let key of this._.model?._schema || [])
        //     s[key.name] = key
        // for (let key of this._schema || [])
        //     s[key.name] = key
        // for (let k in s) {
        //     const _key = new Key(s[k])
        //     if (this._arrayTypes.includes(_key.type)) _key.type = 'Array'
        //     a.push(_key)
        // }
        //
        // return new Proxy(a, {
        //     set() {
        //         return false
        //     },
        //     get(target, p) {
        //         if (target.hasOwnProperty(p) || target[p]) return target[p]
        //         for (let i in target) {
        //             if (target[i].name === p) return target[i]
        //         }
        //         for (let i in target) {
        //             if (target[i].title === p) return target[i]
        //         }
        //         return target[p]
        //     }
        // })
        const schemaMix = Schema.create(this._.model?._schema || [])
        for (let key of this._schema) {
            const i = schemaMix.findIndex(mKey => mKey.name === key.name), k = new Key(key)
            if (this._arrayTypes.includes(k.type)) k.type = 'Array'
            if (i === -1) schemaMix.push(k)
            else schemaMix[i] = k
        }
        return schemaMix
    }

    _mapSchema() {
        this._setter = {}
        this._getter = {}
        for (let key of this._schemaMix) {
            this._mapKey(key)
        }
    }

    _mapKey(key) {
        if (this._arrayTypes.includes(key.type)) {
            const k = new Key(key)
            k.type = 'Array'
            super._mapKey(k)
        }
        else super._mapKey(key);
    }

    //
    // async _createChild(req = {}, key, user) {
    //     const k = new Key(typeof key === "string" ? this._schemaMix[key] : key)
    //     k.type = 'Array'
    //     req._name ??= this._name
    //     return super._createChild(req, k, user)
    // }
    //
    // async _pushChild(object, key, user) {
    //     const k = new Key(typeof key === "string" ? this._schemaMix[key] : key)
    //     k.type = 'Array'
    //     return super._pushChild(object, key, user);
    // }
    //
    // async _removeChild(object, key, user) {
    //     const k = new Key(typeof key === "string" ? this._schemaMix[key] : key)
    //     k.type = 'Array'
    //     return super._removeChild(object, key, user);
    // }
}


export class ModelModule extends Module {
    name = 'Model'
    title = '模型'
    Object = class Model extends ModelObject {
    }
    //TODO 把Type写成单独的模块，并且用SSR生成表单，以此动态添加类型输入
    Types = Types
    Key = Key

    clearCache() {
      //  console.log(...yinConsole.warn(`#${this.name}`, '不参与内存回收'))
    }

    update(model) {
        for (let o of this.yin.cacheList) {
            if (o._model?.valueOf() === model._id) {
                o._mapSchema(model._schema)
            }
        }
    }
}




