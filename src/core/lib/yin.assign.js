/**
 * 仅仅只做2层深克隆
 * 适配mongoose的model，直接等于会使model的保存失效
 * @param target
 * @param source
 */

export function yinAssign(target, source) {
    // console.log(target)
    // 创建临时t已适配mongoose
    const t = {}
    Object.assign(t, target)
    for (let i in source) {
        if (source[i] instanceof Object && t[i] instanceof Object)
            Object.assign(t[i], source[i])
        else
            t[i] = source[i]
    }
    Object.assign(target, t)
    return target
}

export function yinParse(value) {
    const res = {}
    for (let k in value) {
        // console.log(value[k], typeof value[k], value[k] instanceof Object)
        if (value[k] instanceof Object && value[k].toJSON) {
            res[k] = value[k].toJSON()
        } else
            res[k] = value[k]
    }
    // console.log(res)
    return res
}
