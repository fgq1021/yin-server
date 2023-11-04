/**
 * 仅仅只做2层深克隆
 * @param target
 * @param source
 */

export function yinAssign(target, source) {
    for (let i in source) {
        const s = Object.prototype.toString.call(source[i]),
            t = Object.prototype.toString.call(target[i])
        if (s === '[object Object]' && t === '[object Object]') {
            Object.assign(target[i], source[i])
        }
        else if (s === '[object Array]')
            target[i] = [...source[i]]
        else
            target[i] = source[i]
    }
    // structuredClone 不支持function。。。
    // return Object.assign(target, structuredClone(source))
}

export function yinParse(value) {
    const res = {}
    for (let k in value) {
        const vk = value[k]
        if (vk) {
            if (vk.toJSON) res[k] = vk.toJSON()
            else if (Object.prototype.toString.call(vk) === '[object Object]') res[k] = yinParse(vk)
            else if (!(vk instanceof Function)) res[k] = vk
        }
        else res[k] = vk
    }
    return res
    // return JSON.parse(JSON.stringify(value))
}

export const yinByteParse = {
    unit: ['Byte', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB', 'BB', 'NB', 'DB'],
    parse(value) {
        if (value) {
            let level = 0, v = value
            while (v >= 1024) {
                v = v / 1024
                level++
            }
            return {value: v, unit: this.unit[level]}
        }
        return {value: 0, unit: this.unit[0]}
    },
    speed(speed) {
        const {value, unit} = this.parse(speed)
        return `${value.toFixed(1)} ${unit}/s`
    },
    size(size) {
        const {value, unit} = this.parse(size)
        return `${value.toFixed(1)} ${unit}`
    }
}
// export const yinLengthParse={
//     number(value,length){}
//
// }
export const yinTimeParse = {
    unit: ['年', '月', '天', '小时', '分钟', 's'],

    parse(value) {
        const time = new Date(value || 0)
        return [
            time.getUTCFullYear() - 1970,
            time.getUTCMonth(),
            time.getUTCDate() - 1,
            time.getUTCHours(),
            time.getUTCMinutes(),
            time.getUTCSeconds()
        ]
    },
    left(ms) {
        const time = this.parse(ms)
        let res = ''
        if (time[0]) res += `${time[0]}年 `
        if (time[1]) res += `${time[1]}月 `
        if (time[2]) res += `${time[2]}天 `
        if (time[3]) res += `${time[3]}:${this.two(time[4])}:${this.two(time[5])}`
        else if (time[4]) res += `${time[4]}:${this.two(time[5])}`
        else res += `${time[5]}s`
        return res
    },
    two(value) {
        return value < 10 ? '0' + value : value
    }
}
