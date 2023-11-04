import {Module} from "../core/module.js";
import {ArrayKey, Schema, yinObject} from "../core/object.js";
import {yinStatus} from "../lib/yin.status.js";
import {Key} from "../core/key.js";
import {yinFilePath} from "../lib/yin.file.path.js";
import {yinByteParse} from "../lib/yin.assign.js";

class FileSize extends Number {
    get parse() {
        return yinByteParse.size(this)
    }
}

export class FileObject extends yinObject {
    static schema = Schema.create([
        {name: 'path', title: '路径', index: true, type: 'String'},
        {name: 'type', title: '类型', index: true, type: 'String'},
        {name: 'size', title: '大小', index: true, type: 'Number'},
        {name: 'mime', title: 'mime', index: true, type: 'String'},
        ...super.schema])

    static setter = {
        ...super.setter,
        _path(value, object) {
            object._path = new yinFilePath(value)
            return true
        },
        _size(value, object) {
            object._size = new FileSize(value)
            return true
        },
    }

    static getter = {
        children() {
            return this._type === 'Directory' ? ArrayKey.create(this, 'children') : undefined
        }
    }

    get _dir() {
        return this._path.dir
    }

    get _ext() {
        if (this._type !== 'Directory')
            return this._title.substring(this._title.lastIndexOf('.'))
    }

    get _owner() {
        if (this._path.user)
            return this._path.user.id
        else
            return this.yin.me._id
    }

    _path

    _content(user) {
        return this._module.content(this._path, user)
    }

    _save(data, user) {
        if (data instanceof File)
            return this._module.save(this._path, data, {}, user)
        return super._save(data, user)
    }

    async _readable(user = this._yin.me || {}) {
        if (this._path.user)
            return super._readable(user);
        else {
            return this._privateReadableController(user)
        }
    }

    get _schemaMix() {
        const schemaMix = super._schemaMix
        if (this._type === 'Directory')
            schemaMix.push(new Key('children', 'Array', '子文件'))
        else
            schemaMix.push(new Key('preview', 'Information', '预览'))
        return schemaMix
    }
}


export class FileModule extends Module {
    name = 'File'
    title = '文件'
    Object = class File extends FileObject {
    }

    Types = ['Directory', 'File', 'Image', 'Video', 'Audio']

    regStructureType() {
        this.yin.structureType.push(this.name)
        for (let t of this.Types) {
            this.yin.structureType.push(t)
        }
    }


    async create(path, data, progress, user = this.yin.me || {}) {
        if (typeof path === 'string' || path instanceof yinFilePath) {
            if (!(path instanceof yinFilePath)) path = new yinFilePath(path)
            if (path.user && path.user.id === user._id || this.yin.me === user) {
                const o = await this.assign(await this.api.create(path.valueOf(), data, progress, user), user)
                await o.created(user)
                return o
            }
            return yinStatus.NOT_MODIFIED(`${user._titlePlace} #${user._place} 没有${path} 的写入权限`)
        }
        return super.create(path, data)
    }

    async save(path, data, progress, user = this.yin.me || {}) {
        if (typeof path === 'string' || path instanceof yinFilePath) {
            const object = this.getPath(path, user)
            await object._manageable(user)
            await this.assign(await this.api.save(String(path), data, progress, user), user)
            await object.saved(user)
            return object
        }
        else return super.save(path, data, progress)
    }


    async content(path, user) {
        const object = await this.getPath(path, user)
        // 小于1mb
        if (object._size < 1048576)
            return this.api.content(path)
        return Promise.reject('文件过大，请使用资源管理器进行访问')
    }


    async children(place, user = this.yin.me) {
        const list = await super.children(place, user)
        await list.get(list.total)
        return list
    }


    pathListWaiter = {}

    async getPath(path, user = this.yin.me || {}) {
        if (path instanceof yinFilePath) path = path.valueOf()
        const object = await this.getPathWaiter(path, user)
        await object._readable(user)
        return object
    }

    async getPathWaiter(path, user) {
        if (!path)
            return yinStatus.NOT_ACCEPTABLE('请输入地址')
        if (this.pathListWaiter[path]) return this.pathListWaiter[path]
        for (let id in this.list) {
            if (this.list[id]._path?.valueOf() === path) return this.list[id]
        }
        this.pathListWaiter[path] = this.getPathFromController(path, user)
        try {
            const object = await this.pathListWaiter[path]
            delete this.pathListWaiter[path]
            return object
        }
        catch (e) {
            delete this.pathListWaiter[path]
            return Promise.reject(e)
        }
    }

    async getPathFromController(path, user) {
        const m = await this.api.getPath(path)
        return this.assign(m, user)
    }

    async getRoot(user = this.yin.me || {}) {
        try {
            return await this.getPath(`/yin.file/${user._place}`, user)
        }
        catch (e) {
            if (e.status === 'NOT_FOUND')
                try {
                    return await this.create(`/yin.file/${user._place}`, null, null, user)
                }
                catch (e) {
                    if (e.status === 'NOT_ACCEPTABLE')
                        return this.getPath(`/yin.file/${user._place}`, user)
                }
        }
    }
}




