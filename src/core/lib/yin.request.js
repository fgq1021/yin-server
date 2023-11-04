import axios from "axios";
import {ResList} from "../core/array.js";
import {yinError} from "./yin.status.js";
import {yinByteParse, yinTimeParse} from "./yin.assign.js";

export class yinRequest {
    yin
    path
    controller
    req = axios
    __v_skip = true

    constructor(yin, path) {
        this.yin = yin
        if (typeof path === 'string')
            this.path = path.replace(/^\//, '').replace(/\/$/, '')
        else
            this.controller = path
    }

    get api() {
        if (this.path || this.controller)
            return `${this.yin.url}/yin.object/${this.path || this.controller?.name}/`
        return `${this.yin.url}/yin.object/`
    }

    async res(promise) {
        try {
            const res = (await promise).data
            if (res._name)
                return res
            else if (res.list)
                return new ResList(res.list, res)
            else
                return res
        }
        catch (err) {
            // console.log(err)
            if (err.response) {
                const ye = new yinError()
                Object.assign(ye, err.response.data)
                return Promise.reject(ye)
            }
            else
                return Promise.reject(err)
        }
    }

    makeProgress(progress) {
        progress._progress = `${(progress.progress * 100).toFixed(1)}%`
        progress._rate = yinByteParse.speed(progress.rate)
        progress._loaded = yinByteParse.size(progress.loaded)
        progress._total = yinByteParse.size(progress.total)
        progress._estimated = yinTimeParse.left(Math.round(progress.estimated * 1000) + 1000)
        return progress
    }

    config(config) {
        if (this.yin.me._token) {
            config.headers ??= {}
            config.headers["Authorization"] = "Bearer " + this.yin.me._token
        }
        if (config.onUploadProgress instanceof Function) {
            const fn = config.onUploadProgress
            config.onUploadProgress = p => {
                this.makeProgress(p)
                fn(p)
            }
        }
        if (config.onDownloadProgress instanceof Function) {
            const fn = config.onDownloadProgress
            config.onDownloadProgress = p => {
                this.makeProgress(p)
                fn(p)
            }
        }
        return config;
    }

    configWithParams(data, config) {
        config ??= {}
        this.config(config)
        if (data) config.params = data
        return config
    }

    configWithData(data, config) {
        config ??= {}
        this.config(config)
        // 当通过自定义功能发送字符串时，需要改一下Content-Type，不然会发送Json
        if (typeof data === 'string') config.headers["Content-Type"] = 'text/plain'
        return config
    }

    get(url = '', data, config) {
        return this.res(this.req.get(this.api + url, this.configWithParams(data, config)))
    }

    delete(url = '', data, config) {
        return this.res(this.req.delete(this.api + url, this.configWithParams(data, config)))
    }

    head(url = '', data, config) {
        return this.res(this.req.head(this.api + url, this.configWithParams(data, config)))
    }

    options(url = '', data, config) {
        return this.res(this.req.options(this.api + url, this.configWithParams(data, config)))
    }

    post(url = '', data, config) {
        return this.res(this.req.post(this.api + url, data, this.configWithData(data, config)))
    }

    put(url = '', data, config) {
        return this.res(this.req.put(this.api + url, data, this.configWithData(data, config)))
    }

    patch(url = '', data, config) {
        return this.res(this.req.patch(this.api + url, data, this.configWithData(data, config)))
    }
}
