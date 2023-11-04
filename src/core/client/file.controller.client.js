//import {ControllerClient, yinFilePath, yinStatus} from "./core/index.js";

import {ControllerClient} from "./controller.client.js";
import {yinFilePath} from "../lib/yin.file.path.js";

export class FileControllerClient extends ControllerClient {
    async scanFiles(item, container, path, progress) {
        return new Promise((resolve, reject) => {
            if (!progress?.signal?.aborted)
                if (item.isDirectory) {
                    let directoryReader = item.createReader();
                    directoryReader.readEntries(async entries => {
                        for (let entry of entries)
                            await this.scanFiles(entry, container, path + item.name + '/', progress);
                        resolve(container)
                    });
                }
                else {
                    item.file(file => {
                        file.entryPath = path + file.name
                        if (progress?.onUploadProgress)
                            progress.onUploadProgress({
                                _part: progress._part,
                                _title: progress._title,
                                _progress: file.entryPath,
                                _loaded: container.length
                            })
                        container.push(file)
                        resolve(container)
                    })
                }
            else
                reject('已终止')
        })
    }

    async create(path, data, progress) {
        if (typeof path === 'string' || path instanceof yinFilePath) {
            const req = new FormData()
            if (data instanceof File) {
                req.append(path, data)
            }
            else if (data instanceof FileList) {
                const dirname = data[0].webkitRelativePath.split('/')[0]
                req.append('Directory', path + dirname)
                for (let f of data) {
                    req.append(f.webkitRelativePath.replace(dirname, ''), f);
                }
            }
            else if (data instanceof Array) {
                const dirname = data[0].entryPath.split('/')[0]
                req.append('Directory', path + dirname)
                for (let f of data) {
                    req.append(f.entryPath.replace(dirname, ''), f);
                }
            }
            else if (data instanceof DataTransfer) {
                let items = [], files = [], res
                for (let file of data.items) {
                    items.push(file.webkitGetAsEntry())
                }
                for (let file of data.files) {
                    files.push(file)
                }
                for (let i in items) {
                    const file = items[i]
                    if (file && !progress?.signal?.aborted) {
                        if (file.isDirectory) {
                            const list = []
                            // this.msg = ['扫描:', '/' + file.name]
                            progress._part = Number(i)
                            progress._title = file.name + '/'
                            await this.scanFiles(file, list, '', progress);
                            const config = {}
                            Object.assign(config, progress)
                            if (progress?.onUploadProgress)
                                config.onUploadProgress = p => {
                                    p._part = Number(i)
                                    p._title = file.name + '/'
                                    progress.onUploadProgress(p)
                                }
                            // console.log(list)
                            const object = await this.create(path, list, config)
                            res ??= object
                        }
                        else {
                            const config = {}
                            Object.assign(config, progress)
                            if (progress.onUploadProgress)
                                config.onUploadProgress = p => {
                                    p._part = Number(i)
                                    p._title = file.name
                                    progress.onUploadProgress(p)
                                }
                            const object = await this.create(path + file.name, files[i], config)
                            res ??= object
                        }
                    }
                }
                return res
            }
            else if (!data) {
                req.append('Directory', path)
            }
            return this.req.post('', req, progress);
        }
        else return super.create(path)
    }

    content(path) {
        return this.req.post('content', {path});
    }

    getPath(path) {
        return this.req.post('path', {path});
    }
}
