import {hideProperty, Place} from "../index.js";

export class yinFilePath extends String {
    static get [Symbol.species]() {
        return String;
    }

    type
    user
    dir
    title

    constructor(path) {
        path ??= '/'
        if (/\\/.test(path))
            path = path.replace(/\\/g, '/')
        super(path)

        // const origin = typeof location === 'object' ? location.origin : undefined
        if (/^\/yin\.file\/User\.[0-9A-Fa-f]{24}\//.test(path) || /^\/yin\.file\/User\.[0-9A-Fa-f]{24}$/.test(path)) {
            this.type = 'public'
            this.user = new Place(path.slice(9, 39))
        }
        else if (/^\/yin\.file\//.test(path) || /^\/yin\.file$/.test(path))
            this.type = 'public'
        else if (/^\//.test(path))
            this.type = 'private'
        else if (/^http:\/\//.test(path) || /^https:\/\//.test(path))
            this.type = 'url'
        else
            this.type = 'local'

        // console.log(path)

        const m = path.match(/(.*)\/(.+)/)
        if (m) {
            this.dir = m[1] || '/'
            this.title = m[2]
        }
        else
            this.dir = '/'


        hideProperty(this, 'type')
        hideProperty(this, 'user')
    }
}
