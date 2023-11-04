/**
 * koa文件上传中断时，koa/router会报错
 * 自己写个router又太费劲
 * 但是koa非常轻量化，可以像socket.io一样，
 * 接受别的应用的server直接跑起来
 *
 * 这个先别删了，说不定那天又要用。。。
 */

import Koa from 'Koa'
import send from 'koa-send'
import Router from '@koa/router'
import cors from '@koa/cors'
import jsonwebtoken from 'jsonwebtoken'
import {bodyParser} from "@koa/bodyparser";
import {Server} from 'socket.io'
import {Key, Place, yinConsole, yinError, yinStatus} from "../core/index.js";
import {join} from "path";
import net from "net";

function makeServerBasic(options, yin) {
    options.prefix = (options.prefix || "/yin").replace(/\/$/, "")
    yin.serverController = httpController(options, yin)
    yin.httpServer = yin.serverController.callback()
}

export function yinKoa(server, options, yin) {
    makeServerBasic(options, yin)
    const path = options.prefix + '.object'

    // cache and clean up listeners
    const listeners = server.listeners("request").slice(0);
    server.removeAllListeners("request");


    // add request handler
    server.on("request", (req, res) => {
        // TODO use `path === new URL(...).pathname` in the next major release (ref: https://nodejs.org/api/url.html)
        if (path === req.url.slice(0, path.length)) {
            yin.httpServer(req, res)
        }
        else {
            let i = 0;
            const l = listeners.length;
            for (; i < l; i++) {
                listeners[i].call(server, req, res);
            }
        }
    });


    socketController(server, options, yin)
    return server
}

export async function listen(options, yin) {
    // const network = await yin.system.network
    makeServerBasic(options, yin)
    const http = await import('http')
    const server = http.createServer(yin.httpServer);

    socketController(server, options, yin)

    server.listen(options.port || 80)

    console.log(...yinConsole.success("开始监听于端口：", options.port || 80));
    return server
}

// async function freePort(port) {
//     return new Promise((resolve, reject) => {
//         const socket = new net.Socket();
//
//         const timeout = () => {
//             resolve(port);
//             socket.destroy();
//         };
//
//         const next = () => {
//             socket.destroy();
//             resolve(freePort(++port));
//         };
//
//         setTimeout(timeout, 10);
//         socket.on("timeout", timeout);
//
//         socket.on("connect", () => next());
//
//         socket.on("error", error => {
//             if (error.code !== "ECONNREFUSED")
//                 reject(error);
//             else
//                 resolve(port);
//         });
//
//         socket.connect(port, "0.0.0.0");
//     });
// }

// async function freePort(start, done) {
//     // console.log(logTag, '为 spawn 查找空闲端口');
//
//
//
//         start ??= 1021;
//         const socket = new net.Socket()
//             .once('connect', () => {
//                 socket.destroy();
//                 freePort(++start, done);
//             })
//             .once('error', (/* err */) => {
//                 socket.destroy();
//                 done(start);
//             })
//             .connect(start, '127.0.0.1');
//
// }

export function socketController(server, options, yin) {
    const io = new Server(server, {
        path: options.prefix + '.io',
        // allowEIO3: true,
        cors: {
            origin: "*", // from the screenshot you provided
            methods: ['GET', 'PUT', 'POST']
        }
    })
    io.on('connection', socket => {
        socket.on('watch', ({place}) => {
            socket.join(place)
        })
    })
    io.of('/manage').on('connection', async socket => {
        socket.on('update', async ({place, value, nodeId}) => {
            // console.log(place, value)
            const p = new Place(place)
            try {
                const object = yin.getFromCache(p)
                if (object && object[p.key] !== value && nodeId !== yin.nodeId) {
                    await object._manageable(socket.user)
                    object._hold = p.key
                    object[p.key] = value
                    object._changed = true
                    object._hold = undefined
                    object._module.pull(object, p.key, value, nodeId)
                }
            }
            catch (e) {
            }
        })
        socket.on('watch', async ({place}) => {
            const p = new Place(place)
            try {
                const object = await yin.get(p)
                await object._manageable(socket.user)
                socket.join(place)
            }
            catch (e) {
            }
        })
    })

    io.of('/manage').use(async (socket, next) => {
        if (socket.handshake.auth?.token)
            try {
                const res = await jsonwebtoken.verify(socket.handshake.auth?.token, options.tokenSecret);
                socket.user = await yin.User.get(res._id)
                next()
            }
            catch (e) {
                next(new Error('授权失败，无法校验的token'))
            }
        else
            next(new Error('授权失败，未找到token'))
    });
    yin.regSocket(io)
}

export function httpController(options, yin) {
    const publicPath = join(yin.rootPath, 'public'),
        app = new Koa(),
        router = Router({prefix: options.prefix + '.object'}),
        prefix = options.prefix + '.object/',
        prefixLength = prefix.length,
        cabPath = join(yin.yinModulePath, 'public'),
        cabPrefix = options.prefix + '.cab/',
        cabPrefixLength = cabPrefix.length

    app.use(cors({maxAge: 604800}))
    app.use(bodyParser())

    app.use(async (ctx, next) => {
        // 引内部处理
        if (prefix === ctx.path.slice(0, prefixLength)) {
            // 授权处理
            const token = ctx.request.headers["authorization"]
            if (token) {
                try {
                    const res = await jsonwebtoken.verify(token.slice(7), options.tokenSecret)
                    if (res._id) ctx.user = await yin.User.get(res._id)
                }
                catch (e) {
                    ctx.user = {}
                }
            }
            else
                ctx.user = {}

            if (ctx.method !== 'GET' && !ctx.user._id) {
                ctx.status = 401
                ctx.body = new yinError(401, `匿名用户禁止访问该地址 [${ctx.method}]${ctx.path}`)
            }
            else
                try {
                    // 自动将结果放入body
                    ctx.body = await next()
                }
                catch (e) {
                    // 自动处理yin内部的错误信息
                    if (e instanceof yinError) {
                        ctx.status = e.code
                        ctx.body = e
                    }
                    else {
                        ctx.status = 500
                        ctx.body = new yinError(500, '服务器内部错误，请查看日志')
                        console.log(...yinConsole.error(`#${e.code}`, `${e.message}[未捕获错误]\n\n`, e.stack))
                    }
                }
        }
        // 控制台
        else if (cabPrefix === ctx.path.slice(0, cabPrefixLength)) {
            try {
                await send(ctx, ctx.path.slice(cabPrefixLength - 1), {
                    root: cabPath,
                    index: 'index.html',
                    maxage: 3600000
                });
            }
            catch (e) {
                await send(ctx, '/index.html', {root: cabPath, maxage: 3600000});
            }
        }
        else if (cabPrefix === ctx.path + '/') {
            ctx.status = 301;
            ctx.redirect(cabPrefix);
        }
        // 静态地址根目录
        else if (ctx.path === '/') {
            try {
                await send(ctx, ctx.path, {root: publicPath, index: 'index.html', maxage: 3600000});
            }
            catch (e) {
                ctx.status = 301;
                ctx.redirect(cabPrefix);
            }
        }
        // 公开文件托管
        else {
            try {
                await send(ctx, ctx.path, {root: publicPath, index: 'index.html', maxage: 3600000});
            }
            catch (e) {
                // history 路由支持
                await send(ctx, '/index.html', {root: publicPath, maxage: 3600000});
            }

        }
    })


    /**
     * 基本信息处理
     */
    router.get('/', async ctx => {
        const res = {
            modules: yin.structureType.slice(2)
        }
        if (!yin.me._tel)
            res.uninitialized = true
        if (ctx.user && ctx.user === yin.me) {
            res.me = yin.me
            res.rootPath = yin.rootPath
            res.scriptsFile = yin.scriptsFile
        }
        return res
    })

    router
        .get('/scripts/:place', async ctx => {
            if (ctx.user && ctx.user === yin.me) {
                return yin.readScript(ctx.params.place)
            }
            return yinStatus.UNAUTHORIZED('非管理员无权查看')
        })
        .post('/scripts/:place', async ctx => {
            if (ctx.user && ctx.user === yin.me) {
                return yin.createScript(ctx.params.place, ctx.request.body)
            }
            return yinStatus.UNAUTHORIZED('非管理员无权创建')
        })
        .patch('/scripts/:place', async ctx => {
            if (ctx.user && ctx.user === yin.me) {
                return yin.updateScript(ctx.params.place, ctx.request.body)
            }
            return yinStatus.UNAUTHORIZED('非管理员无权修改')
        })


    app.use(router.routes());

    yin.modules.forEach(module => {
        const router = Router({prefix: options.prefix + '.object/' + module.name})
        router.use((ctx, next) => {
            ctx.module = module.authProxy(ctx.user)
            return next()
        })

        module.api.makeRouter(router, app)


        /**
         * 获取module基本配置
         */
        router.get('/', ctx => {
            return {title: module.title, schema: module.Object.schema}
        })

        /**
         * 特殊查询
         */

        router.post('/findOne', ctx => ctx.module.findOne(ctx.request.body))
        router.post('/find', ctx => {
            const {filter, sort} = ctx.request.body, {limit, skip} = ctx.query
            return ctx.module.find(filter, sort, Number(limit), Number(skip))
        })
        router.get('/children/:id/:key/:index?', async ctx => {
            const children = await module.childrenWaiter(new Place(module.name, ctx.params.id, ctx.params.key, ctx.params.index)),
                {limit, skip} = ctx.query
            return children.getFromCache(Number(limit), Number(skip), ctx.user);
        })

        /**
         * 单个对象的增删改查
         */
        router.param('id', async (id, ctx, next) => {
            // ctx.Object = await module.get(ctx.params.id, ctx.user)

            ctx.Object = await ctx.module.get(ctx.params.id)
            return next()
        })
        router.post('/', ctx => ctx.module.create(ctx.request.body))
        router.get('/:id', ctx => ctx.Object)
        router.patch('/:id', async ctx => {
            await ctx.Object._manageable(ctx.user)
            // ctx.Object._hold=true
            Object.assign(ctx.Object, ctx.request.body)
            // ctx.Object._hold=undefined
            return ctx.Object._save()
        })
        router.delete('/:id', ctx => ctx.module.delete(ctx.params.id))

        /**
         * 对象Key的操作
         */

        async function makeObjectKeyRouter(ctx) {
            const k = ctx.params.key
            if (ctx.Key.type === 'Function') return ctx.Object[k](ctx.request.body, ctx.user);
            else if (ctx.Key.type === 'Array') {
                const children = await module.childrenWaiter(ctx.Object._place.toKey(k)), {limit, skip} = ctx.query
                return children.getFromCache(Number(limit), Number(skip), ctx.user);
            }
            else if (yin.structureType.indexOf(ctx.Key.type) !== -1) return ctx.Object[k](ctx.user);
            else if (ctx.Object[k] instanceof Function) return ctx.Object[k](ctx.request.body, ctx.user);
            else if (yin.File.Types.includes(ctx.Key.type)) return ctx.Object[k]
            else return ctx.Object[k]
        }

        router.param('key', (key, ctx, next) => {
            ctx.Key = ctx.Object._schemaMix[key] || new Key(key)
            return next()
        })
        router.get('/:id/:key', makeObjectKeyRouter)
        router.post('/:id/:key', makeObjectKeyRouter)
        router.patch('/:id/:key', async ctx => {
            const k = ctx.params.key
            await ctx.Object._manageable(ctx.user)
            ctx.Object[k] = ctx.request.body
            return ctx.Object._save()
        })

        app.use(router.routes())
    })


    return app
}


// function makeYinRes(yin, res = {}) {
//     for (let k in yin) {
//         const v = yin[k]
//         if (v instanceof Array)
//             res[k] = makeYinRes(v, [])
//         else if (v && v.name)
//             res[k] = v.name
//         else
//             res[k] = v
//     }
//     return res
// }

