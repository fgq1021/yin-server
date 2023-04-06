export class Key {
    public title = ""
    public name = ""
    public keyType = "String"
    public note = ""
    public settings = {}

    constructor(key: string | object, type = 'String', title = '键', note?, settings?) {
        Object.defineProperty(this, 'isKey', {value: true, enumerable: false, configurable: false})

        if (typeof key === "object") {
            Object.assign(this, key)
            if (!this.settings)
                this.settings = {}
            // @ts-ignore
            if (key.id)
                { // @ts-ignore
                    Object.defineProperty(this, 'id', {value: key.id, enumerable: false})
                }
        } else {
            this.title = title
            this.name = key
            this.type = type
            this.note = note
            this.settings = settings || {}
        }
    }

    get type() {
        return this.keyType
    }

    set type(t) {
        this.keyType = t
    }
}

export class Type {
    public title = ""
    public name = ""
    public note = ""
    public settings = []

    constructor(name, title, note?, settings?) {
        this.name = name
        this.title = title
        this.note = note
        this.settings = settings || []
    }
}

export const Types = {
    // 基础类型
    String: new Type('String', '字符串', '可填写任意字符', [new Key('range', 'NumberRange', '字数范围')]),
    Number: new Type('Number', '数字', '可填写任意数字', [new Key('int', 'Boolean', '整数', '整数型数字'), new Key('range', 'NumberRange', '字数范围')]),
    NumberRange: new Type('NumberRange', '数字范围', '最小和最大值'),
    Boolean: new Type('Boolean', '布尔值', '布尔值只有是否两个状态'),
    Function: new Type('Function', '功能', '直接执行Model文件中的功能'),
    Date: new Type('Date', '日期', ''),

    // 对象选择
    Object: new Type('Object', '对象', '本系统中的对象', [new Key('module', 'Module', '模块', '创建时所采用的模块')]),
    Array: new Type('Array', '数组', '本系统中的对象组', [new Key('module', 'Module', '模块', '创建时所采用的模块')]),
    Module: new Type('Module', '模块', '选择模块'),
    Model: new Type('Model', '模型', '选择模型'),
    User: new Type('User', '用户', '选择用户'),
    Place: new Type('Place', '系统内地址', 'Module.$id.key.meta'),

    // 媒体元素
    Image: new Type('Image', '图片', ''),
    Video: new Type('Video', '视频', ''),
    Audio: new Type('Audio', '音频', ''),
    RichText: new Type('RichText', '富文本', '用户通过富文本编辑器创建内容'),
    Color: new Type('Color', '颜色', '选择一种颜色'),
    File: new Type('File', '文件', ''),
    Directory: new Type('Directory', '文件夹', ''),
}