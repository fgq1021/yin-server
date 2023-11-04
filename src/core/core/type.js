import {hideProperty} from "../lib/yin.defineProperty.js";
import {Key} from "./key.js";

//
// export class Type {
//     public title
//     public note
//     public schema
//     public db = String
//
//     public toJSON() {
//         return {
//             title: this.title,
//             name: this.name,
//             note: this.note,
//             schema: this.schema
//         }
//     }
// }
//
// export const TypeList = [
//     class String extends Type {
//         public title = '字符串'
//         public note = '可填写任意字符'
//     },
//     class Number extends Type {
//         public title = '数字'
//         public schema = [
//             new Key('int', 'Boolean', '整数', '整数型数字'),
//             new Key('range', 'NumberRange', '字数范围')
//         ]
//         public db = Number
//     },
//     class NumberRange extends Type {
//         public title = '数字范围'
//         public note = '最小和最大值'
//         public db = [Number, Number]
//     },
//     class Boolean extends Type {
//         public title = '布尔值'
//         public note = '布尔值只有是否两个状态'
//         public db = Boolean
//     },
//     class Function extends Type {
//         public title = '功能'
//         public note = '直接执行Model文件中的功能'
//         public db = undefined
//
//         public create(object, key) {
//             return new this(object, key)
//         }
//
//         constructor() {
//             super();
//         }
//
//
//
//     }
//
// ]
//
// export const Types = {}
//
// for (let type of TypeList) {
//     Types[type.name] = type
// }
//
//
// console.log(Types)
// console.log(JSON.stringify(Types))


export class Type {
    title = ""
    note = ""
    settings = []
    defaultValue = null
    defaultConstructor = String

    constructor(title, note, defaultConstructor, settings) {
        this.title = title
        this.note = note
        this.settings = settings || []
        this.defaultConstructor = defaultConstructor
        hideProperty(this, 'defaultConstructor')
    }
}

export const Types = {
    // 基础类型
    String: new Type('字符串', '可填写任意字符', String,
        [new Key('range', 'NumberRange', '字数范围')]),
    Number: new Type('数字', '可填写任意数字', Number, [
        new Key('range', 'NumberRange', '字数范围')
    ]),
    NumberRange: new Type('数字范围', '最小和最大值', [Number, Number]),
    Boolean: new Type('布尔值', '布尔值只有是否两个状态', Boolean),
    Function: new Type('功能', '直接执行Model文件中的功能', String, [new Key('argument', 'Boolean', '包含参数')]),
    Date: new Type('日期', '', Date),


    // 对象选择
    Object: new Type('对象', '可以放置任意类型的对象', String,
        [new Key('manualCreation', 'Boolean', '手动创建', '此项默认关闭，关闭时系统将自动根据模型创建该对象，\n对于可能造成回环的模型键值，强烈建议打开此项')]),
    Array: new Type('数组', '本系统中的对象组，只能创建本对象的类型', {}),
    Module: new Type('模块', '选择模块'),
    Place: new Type('系统内地址', 'Module._id.key.meta'),

    // 文件
    Image: new Type('图片'),
    Video: new Type('视频'),
    Audio: new Type('音频'),
    File: new Type('文件'),
    Directory: new Type('文件夹'),
    // FileExplorer: new Type('文件预览', '读取并预览文件对象的数据'),

    // 数据类媒体
    RichText: new Type('富文本', '用户通过富文本编辑器创建内容'),
    Color: new Type('颜色', '选择一种颜色'),
    JSON: new Type('JSON', '元数据', {}, {}),
    Information: new Type('信息', '仅为信息展示，不可编辑，在cab中可展示富文本', String, [
        new Key('label', 'Boolean', '键值信息展示'),
    ]),


    // 系统内置
    AccessControl: new Type('权限', '权限管理', [String]),
    Parents: new Type('父系', '此对象都被映射在哪些对象的哪些键值', [String]),
    Children: new Type('映射', '此对象都在哪些键值映射了哪些对象或对象的键值', {}),
    Schema: new Type('结构', '描述对象的结构', [])
}

// let typeList = ''
// for (let type in Types) {
//     typeList += type + ','
// }
// console.log(typeList)

// export const TypeProxy = {
//
// }
