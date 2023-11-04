import {ControllerServer} from "./controller.server.js";
import {YinFile} from "./lib/yin.file.js";
import {dirname, extname, join} from "path/posix";
import {Place, ResList, yinAssign, yinFilePath, yinStatus} from "./core/index.js";


export class ControllerFile extends ControllerServer {
    publicFileSystem
    privateFileSystem

    async init() {
        await super.init()

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
        this.privateFileSystem.onChange = (e, name) => {
            console.log(e, name)
        }
    }

    makeRouter(router, app) {
        router.post('/path', async req => req.module.getPath(req.body.path))

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


    async get(path) {
        return this.fs.get(path)
    }


    // async getPath(path, user) {
    //     const file = await this.fs.get(path)
    //     let object
    //     try {
    //         object = await this.findOne({_path: file._path})
    //         Object.assign(object, file)
    //     }
    //     catch (e) {
    //         /**
    //          * 在这里需要创建父目录，但是什么时候才是个头啊
    //          * @type {Promise<*>|Promise<*>|*}
    //          */
    //
    //         if (path !== '/') {
    //             const parent = await this.module.getPath(dirname(path), user)
    //             file._parents = [parent._place.toIdKey('children')]
    //         }
    //         object = await super.create(file, user)
    //     }
    //     return object
    // }


    async children(place, limit = 50, skip = 0) {
        const p = Place.create(place),
            parent = await this.module.get(p.id),
            children = await this.fs.dir(parent._path),
            files = []
        console.log(children)
        for (let name of children) {
            files.push(await this.getPath(join(parent._path.valueOf(), name)))
        }
        return new ResList(files.slice(skip), {total: files.length, skip})
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
        // console.log('create', path, data)
        path = await this.checkPath(path)
        const file = await this.fs.put(path, data),
            parent = await this.module.getPath(dirname(path), user)
        file._parents = [parent._place.toIdKey('children')]
        try {
            const object = await this.module.findOne({_path: file._path}, user)
            yinAssign(object, file)
            await object._save(user)
            return object
        }
        catch (e) {
            return super.create(file, user)
        }
    }
}
