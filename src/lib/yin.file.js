import fs from "fs/promises";
import {createReadStream} from 'fs'
import {watch} from "fs";
import {basename, join, extname, dirname} from "path/posix";
import {Readable} from 'stream'
import {yinStatus} from "../core/index.js";
import {fileTypeFromFile} from "file-type";
import mimeTypes from 'mime-types'

export class YinFile {
    path
    prefix
    onChange

    constructor(path, prefix) {
        this.path = path
        this.prefix = prefix
        this.init()
    }

    async init() {
        try {
            await fs.access(this.path);
        }
        catch (e) {
            await fs.mkdir(this.path, {recursive: true});
        }
        watch(this.path, (e, name) => {
            if (this.onChange instanceof Function)
                this.onChange(e, name)
        })
    }

    fsPath(path) {
        return /^\//.test(path) ? join(this.path, path) : path
    }

    async read(path) {
        try {
            return await fs.readFile(this.fsPath(path), {encoding: 'utf8'})
        }
        catch (e) {
            return yinStatus.FORBIDDEN('读取失败', e)
        }
    }

    async get(path) {
        if (/.+\/$/.test(path)) path = path.substring(0, path.length - 1)
        try {
            const _path = this.fsPath(path),
                stats = await fs.stat(_path),


                res = {
                    // _id: path,
                    _path: path,
                    _title: basename(path),
                    _size: stats.size,
                    _updatedAt: stats.ctime, // mtime 仅写入时更新
                    _createdAt: stats.birthtime
                }

            if (stats.isDirectory())
                res._type = 'Directory'
            else {
                try {
                    let mime = await fileTypeFromFile(_path)
                    if (mime) {
                        res._mime = mime.mime
                        const t = mime.mime.split('/')[0]
                        res._type = t.charAt(0).toUpperCase() + t.slice(1)
                    }
                    else if (['.ts', '.tsx', '.mts', '.cts'].includes(extname(_path))) {
                        res._mime = 'application/typescript'
                        res._type = 'Application'
                    }
                    else {
                        mime = mimeTypes.lookup(_path)
                        if (mime) {
                            res._mime = mime
                            const t = mime.split('/')[0]
                            res._type = t.charAt(0).toUpperCase() + t.slice(1)
                        }
                        else {
                            res._mime = 'text/plain'
                            res._type = 'Text'
                        }
                    }
                }
                catch (e) {
                    // console.log('error', e)
                }
            }
            return res
        }
        catch (e) {
            // console.log(e)
            return yinStatus.NOT_FOUND(`未在该地址找到文件或目录`, path)
        }

    }

    // 支持原生文件隐藏
    // async get(path) {
    //     const name = basename(path),
    //         dir = dirname(path),
    //         hide = /^\./.test(name),
    //         _title = hide ? name.slice(1) : name
    //
    //     let stats, _hide = hide, _path = join('/', path)
    //
    //     try {
    //         stats = await fs.stat(join(this.path, path))
    //     }
    //     catch (e) {
    //         try {
    //             const path1 = join(dir, hide ? _title : `.${_title}`)
    //             stats = await fs.stat(join(this.path, path1))
    //             _hide = !hide
    //             _path = path1
    //         }
    //         catch (e) {
    //             return yinStatus.NOT_FOUND(`未在该地址找到文件或目录`, path)
    //         }
    //     }
    //     return {
    //         _path, _title, _hide,
    //         _isDirectory: stats.isDirectory(),
    //         _size: stats.size,
    //         _updatedAt: stats.mtime,
    //         _createdAt: stats.birthtime,
    //     }
    // }

    // async dir(path) {
    //     const files = await fs.readdir(join(this.path, path)), res = []
    //     for (const file of files)
    //         res.push(await this.get(join(path, file)))
    //     return res
    // }
    async dir(path) {
        const file = await this.get(path)
        if (file._type === 'Directory')
            return fs.readdir(this.fsPath(path))
        return yinStatus.NOT_FOUND(`该地址不是目录`, path)
    }

    /**
     *
     * @param path
     * @param { string | Buffer | TypedArray | DataView | AsyncIterable | Iterable | Stream} data 数据
     * @return {Promise<{_size: number, _createdAt: Date, _title: string, _path, _updatedAt: Date}|*|undefined>}
     */
    async put(path, data) {
        let storePath = this.fsPath(path), parentPath = dirname(storePath);
        try {
            await fs.stat(parentPath);
        }
        catch (e) {
            await fs.mkdir(parentPath, {recursive: true});
        }

        if (data instanceof Readable) {
            data.on('error', err => console.log(err))
        }

        if (data)
            await fs.writeFile(storePath, data);
        else
            return this.mkdir(path)

        return this.get(path);
    }

    async rename(oldPath, newPath) {
        await fs.rename(this.fsPath(oldPath), this.fsPath(newPath))
        return this.get(newPath)
    }

    async mkdir(path) {
        try {
            await fs.stat(this.fsPath(path));
            return yinStatus.NOT_ACCEPTABLE('目录已创建', path)
        }
        catch (e) {
            await fs.mkdir(this.fsPath(path), {recursive: true});
            return this.get(path)
        }
    }

    createHashFromFile = filePath => new Promise(resolve => {
        const hash = crypto.createHash('sha256');
        createReadStream(filePath)
            .on('data', data => hash.update(data))
            .on('end', () => resolve(hash.digest('hex')));
    });

    async delete(path) {

    }

    sign(path) {
        return join('assets', path)
    }
}
