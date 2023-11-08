import fs from "fs/promises";
import {join} from "path";
import child_process from "child_process";
import {yinFreePort} from "./yin.freePort.js";
import {yinConsole} from "../core/index.js";
import {basename, dirname} from "path/posix";

export const startMongoShell = async (path, messageFn) => {
    const dirPath = path ? dirname(path) : join(process.cwd(), 'bin'),
        mongoName = path ? basename(path) : 'mongod',
        controller = new AbortController(),
        {signal} = controller,
        dbPath = `${process.cwd()}\\db`,
        port = await yinFreePort(1000)
    await fs.mkdir(dbPath, {recursive: true})
    try {
        await fs.unlink(join(dbPath, 'mongod.lock'))
    }
    catch (e) {
    }
    let run
    if (messageFn instanceof Function) run = messageFn
    else run = () => {
    }

    console.log(dirPath, mongoName, dbPath, port)

    return new Promise(async (resolve, reject) => {
        const ls = child_process.spawn(
            mongoName,
            [
                '--dbpath', dbPath,
                '--port', port,
                '--bind_ip', '127.0.0.1',
            ],
            {cwd: dirPath, signal})

        ls.stdout.on('data', (data) => {
            const res = data?.toString().split(/\r\n|\r|\n/g)
            for (let msg of res) {
                const m = msg ? JSON.parse(msg) : null
                if (m) {
                    // console.log('[yin.db]', m.s, m.c, m.ctx, '\n', m.msg, m.attr || '', '\n');
                    run(m)

                    if (/failure/.test(msg)) {
                        run(`[失败]${msg}`)
                        reject({error: m, controller})
                    }
                    if (/Waiting for connections/.test(msg)) {
                        console.log(...yinConsole.success('#数据库', `启动成功\n端口：${port} 位置：${dbPath}`))
                        run(`[成功]数据库启动成功\n端口：${port} 位置：${dbPath}`)
                        resolve({port, path: dbPath, controller})
                    }
                }
            }
        });

        ls.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            run(String(data))
        });

        ls.on('error', err => {
            run('[错误]', err)
        })
        ls.on('close', (code) => {
            run('[退出]')
            run(code)
        });
    })
}
