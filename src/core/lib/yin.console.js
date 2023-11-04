import {yinColor} from "./yin.color.js";

function makeStyle(color) {
    return 'color: white;background-color:' + color + ';padding:1px 2.5px;border-radius:2px;'
}

export const yinConsole = {
    makeLog(data, color, prefix) {
        let log = ['%c引'], id = data[0].charAt(0) === '#'
        if (prefix || id) {
            log[0] += '%c' + (prefix || '')
            if (id) {
                log[0] += data[0]
                data.splice(0, 1)
            }
            log[1] = makeStyle(color[0]) + 'border-radius:2px 0 0 2px'
            log[2] = makeStyle(color[3]) + 'border-radius:0 2px 2px 0'
        }
        else {
            log[1] = makeStyle(color[0])
        }
        return [...log, ...data]
    },
    log(...data) {
        return this.makeLog(data, yinColor.gray)
    },
    warn(...data) {
        return this.makeLog(data, yinColor.yellow)
    },
    success(...data) {
        return this.makeLog(data, yinColor.green, '✓')
    },
    error(...data) {
        return this.makeLog(data, yinColor.red)
    },
    load(...data) {
        return this.makeLog(data, yinColor.gray, '↓')
    },
    update(...data) {
        return this.makeLog(data, yinColor.blue, '↑')
    },
    delete(...data) {
        return this.makeLog(data, yinColor.orange, 'X')
    }
}

