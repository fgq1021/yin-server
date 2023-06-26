import axios from "axios";
import {ResList} from "../core/array.js";

export class yinRequest {
    yin
    path
    controller
    req = axios

    constructor(yin, path) {
        this.yin = yin
        if (path instanceof String) {
            this.path = path.replace(/^\//, '').replace(/\/$/, '')
        } else
            this.controller = path
    }

    get api() {
        if (this.path || this.controller)
            return `${this.yin.url}.object/${this.path || this.controller?.name}/`
        return `${this.yin.url}.object/`
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
        } catch (err) {
            if (err.response)
                return Promise.reject(err.response.data)
            else
                return Promise.reject(err)
        }
    }

    config(uploadProgress, downloadProgress) {
        const config = {
            headers: {}
        }
        if (this.yin.me._token) {
            config.headers["Authorization"] = "Bearer " + this.yin.me._token;
        }
        if (uploadProgress)
            config.onUploadProgress = ({loaded, total, progress, bytes, estimated, rate, upload}) => {
                console.log(loaded, total, progress, bytes, estimated, rate, upload)
                uploadProgress(Math.round((loaded * 10000) / total) / 10000)
            }
        if (downloadProgress)
            config.onDownloadProgress = ({loaded, total, progress, bytes, estimated, rate, download}) => {
                console.log(loaded, total, progress, bytes, estimated, rate, download)
                uploadProgress(Math.round((loaded * 10000) / total) / 10000)
            }
        return config;
    }

    configWithData(data, uploadProgress, downloadProgress) {
        const config = this.config(uploadProgress, downloadProgress)
        if (typeof data === 'object')
            config.headers["Content-Type"] = 'application/json'
        else
            config.headers["Content-Type"] = 'text/plain'
        return config
    }

    get(url = '', uploadProgress, downloadProgress) {
        return this.res(this.req.get(this.api + url, this.config(uploadProgress, downloadProgress)))
    }

    delete(url = '', uploadProgress, downloadProgress) {
        return this.res(this.req.delete(this.api + url, this.config(uploadProgress, downloadProgress)))
    }

    head(url = '', uploadProgress, downloadProgress) {
        return this.res(this.req.head(this.api + url, this.config(uploadProgress, downloadProgress)))
    }

    options(url = '', uploadProgress, downloadProgress) {
        return this.res(this.req.options(this.api + url, this.config(uploadProgress, downloadProgress)))
    }

    post(url = '', data, uploadProgress, downloadProgress) {
        return this.res(this.req.post(this.api + url, data, this.configWithData(data, uploadProgress, downloadProgress)))
    }

    put(url = '', data, uploadProgress, downloadProgress) {
        return this.res(this.req.put(this.api + url, data, this.configWithData(data, uploadProgress, downloadProgress)))
    }

    patch(url = '', data, uploadProgress, downloadProgress) {
        return this.res(this.req.patch(this.api + url, data, this.configWithData(data, uploadProgress, downloadProgress)))
    }
}
