// export const moduleDefaultSchema = {
//     title: String,
//     owner: {type: "ObjectId", ref: "User"},
//     // accessControl:['userid.$read.0(继承层数)','userid.$manage','userid.$deny'...]
//     accessControl: [String],
//     //parents:['id.key']
//     // 特殊定义
//     // User权限给予'id.$manage'
//     parents: [String],
//     //children:{key:['module.id']||'module.id'||'module.id.key'}
//     children: {},
//     model: {type: "ObjectId", ref: "Model"},
//     data: {},
//     // 非Model时为私有结构
//     schema: [],
//     hide: {type: Boolean, default: false}
// }

import {schemaDashKey} from "../lib/schemaDashKey";

export class ModuleSchema {
    public schema = {
        $title: String,
        $owner: {type: "ObjectId", ref: "User"},
        // accessControl:['userid.$read.0(继承层数)','userid.$manage','userid.$deny'...]
        $accessControl: [String],
        //parents:['id.key']
        // 特殊定义
        // User权限给予'userid.$manage'
        $parents: [String],
        //children:{key:['module.id']||'module.id'||'module.id.key'}
        $children: {},
        $model: {type: "ObjectId", ref: "Model"},
        $data: {},
        // 非Model时为私有结构
        $schema: [],
        $hide: {type: Boolean, default: false}
    }

    constructor(schema = {}) {
        Object.assign(this.schema, schema)
    }

    toObjectSchema(s?) {
        const schema = {}
        s = s || this.schema
        for (let i in s) {
            if (s[i] && s[i].type === 'ObjectId')
                schema[i] = null
            else if (s[i].type === String || s[i].type === Number || s[i].type === Date)
                schema[i] = null
            else if (s[i] === String || s[i] === Number || s[i] === Date)
                schema[i] = null
            else if (s[i] instanceof Array)
                schema[i] = []
            else if (s[i].default !== undefined)
                schema[i] = s[i].default
            else if (s[i] instanceof Object)
                schema[i] = this.toObjectSchema(s[i])
            else
                schema[i] = s[i]
        }
        // console.log(schema)
        return schema
    }

    toModelSchema(ObjectId) {
        const schema = {}
        for (let i in this.schema) {
            let key = i.replace(/^\$/, '')
            if (schemaDashKey.indexOf('_' + key) !== -1)
                key = '_' + key
            if (this.schema[i] && this.schema[i].type === 'ObjectId') {
                schema[key] = {}
                Object.assign(schema[key], this.schema[i])
                schema[key].type = ObjectId
            } else
                schema[key] = this.schema[i]
        }
        // console.log(schema)
        return schema
    }
}
