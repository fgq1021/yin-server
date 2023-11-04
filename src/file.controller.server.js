import {ControllerServer} from "./controller.server.js";
import {YinFile} from "./lib/yin.file.js";
import {basename, dirname, extname, join} from "path/posix";
import {Place, ResList, yinAssign, yinFilePath, yinStatus} from "./core/index.js";
import {model, Schema} from "mongoose";


export class FileControllerServer extends ControllerServer {
    publicFileSystem
    privateFileSystem


    makeApi() {
        const schema =
            new Schema(this.module.Object.schema.toDataBaseSchema(Schema.Types.ObjectId));
        this.api = model(this.name, schema)
    }

    async init() {
        this.makeApi()

        try {
            const fileSystem = await this.yin.system.fileSystem
            this.publicFileSystem = await fileSystem.publicFilesServer
            this.publicFileSystem.onChange = (e, name) => {
                console.log(e, name)
            }
        }
        catch (e) {
            this.publicFileSystem = new YinFile(join(this.yin.rootPath, 'public'))
        }

        this.privateFileSystem = new YinFile(this.yin.rootPath)
        const that = this
        this.fs = new Proxy(this.privateFileSystem, {
            get(target, p) {
                if (target[p] instanceof Function)
                    return (path, ...args) => {
                        const _path = path instanceof yinFilePath ? path : new yinFilePath(path)
                        // console.log(_path.type, _path.valueOf())
                        return _path.type === 'public' ?
                            that.publicFileSystem[p](String(path), ...args) :
                            that.privateFileSystem[p](String(path), ...args)
                    }
                return target[p]
            }
        })
        // this.privateFileSystem.onChange = (e, name) => {
        //     console.log(e, name)
        // }
    }

    makeRouter(router, app) {
        router.post('/path', async req => req.module.getPath(req.body.path))
        router.post('/content', async req => req.module.content(req.body.path))

        router.post('/', async req => {
            const parts = req.parts()
            let path, directory
            for await (const part of parts) {
                if (part.type === 'file') {
                    if (path)
                        // await this.module.create(path + part.fieldname, part.file, null, req.user)
                        await this.fs.put(path + part.fieldname, part.file)
                    else
                        return this.module.create(part.fieldname, part.file, null, req.user)
                }
                else {
                    path = await this.checkPath(part.value)
                    try {
                        directory = await this.module.getPath(path, req.user)
                    }
                    catch (e) {
                        directory = await this.module.create(path, null, null, req.user)
                    }
                }
            }
            return directory
        })


        super.makeRouter(router, app)
    }


    async get(id) {
        const object = await super.get(id), file = await this.fs.get(object._path)
        Object.assign(object, file)
        return object
    }


    async getPath(path) {
        const file = await this.fs.get(path)
        let object
        try {
            object = await this.findOne({_path: file._path})
            Object.assign(object, file)
            return object
        }
        catch (e) {
            // if (path !== '/' && path !== '.')
            if (path.length > 1) {
                const parent = await this.module.getPath(dirname(path))
                file._parents = [parent._place.toIdKey('children')]
            }
            const model = await this.api.create(file)
            return this.mto(model)
        }
    }


    async children(place, limit, skip = 0) {
        const p = Place.create(place)
        if (place.key === 'children') {
            const parent = await this.module.get(p.id),
                children = await this.fs.dir(parent._path),
                files = []
            for (let name of children) {
                files.push(await this.getPath(join(parent._path.valueOf(), name)))
            }
            return new ResList(files.slice(skip), {total: files.length, skip})
        }
        else
            return super.children(place, limit, skip)
    }

    async checkPath(path) {
        try {
            await this.fs.get(path)
            const ext = extname(path)
            return path.replace(new RegExp(`${ext}$`), `@${String(Math.random()).slice(2)}${ext}`)
        }
        catch (e) {
            return path
        }
    }

    // parentPath = path.match(/.*\//)[0]

    async create(path, data, progress, user) {
        if (typeof path === 'string' || path instanceof yinFilePath) {
            path = await this.checkPath(path)
            const file = await this.fs.put(path, data),
                parent = await this.module.getPath(dirname(path))
            // file._title = basename(file._path)
            file._parents = [parent._place.toIdKey('children')]
            try {
                const object = await this.module.findOne({_path: file._path})
                yinAssign(object, file)
                await object._save()
                return object
            }
            catch (e) {
                file._owner = user._id
                return super.create(file)
            }
        }
        else return super.create(path, data)
    }

    async save(path, data, progress, user) {
        if (typeof path === 'string' || path instanceof yinFilePath) {
            const object = await this.module.getPath(path),
                file = await this.fs.put(path, data)
            Object.assign(object, file)
            return super.save(object, user)
        }
        else {
            const m = await this.api.findOne({_id: path._id})
            if (m._path === path._path?.valueOf()) {
                // 重命名
                if (m._title !== path._title) {
                    const file = await this.fs.rename(m._path, join(dirname(m._path), path._title))
                    Object.assign(path, file)
                }
                // 存储数据
                if (path._fileData) {
                    const file = await this.fs.put(path._path, path._fileData)
                    Object.assign(path, file)
                }
            }
            // 更换地址映射
            else {
                const file = await this.getPath(path._path)
                Object.assign(path, file)
            }
            return super.save(path, data)
        }
    }


    content(path) {
        return this.fs.read(path)
    }
}
