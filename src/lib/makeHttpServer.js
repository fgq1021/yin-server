import Koa from 'Koa'
import koaStatic from "koa-static"
import Router from '@koa/router'
import cors from '@koa/cors'
import jsonwebtoken from 'jsonwebtoken'
import {koaBody} from "koa-body";
import {Server} from 'socket.io'
import {Place, yinConsole, yinStatus} from "../core/index.js";


function makeServerBasic(options, yin) {
    options.path = (options.path || "/yin").replace(/\/$/, "")
    yin.serverController = httpController(options, yin)
    yin.httpServer = yin.serverController.callback()
}

export function makeHttpServer(server, options, yin) {
    makeServerBasic(options, yin)
    const path = options.path + '.object'

    // cache and clean up listeners
    const listeners = server.listeners("request").slice(0);
    server.removeAllListeners("request");

    // add request handler
    server.on("request", (req, res) => {
        // TODO use `path === new URL(...).pathname` in the next major release (ref: https://nodejs.org/api/url.html)
        if (path === req.url.slice(0, path.length)) {
            yin.httpServer(req, res)
        } else {
            let i = 0;
            const l = listeners.length;
            for (; i < l; i++) {
                listeners[i].call(server, req, res);
            }
        }
    });
    socketController(server, options, yin)
}

export async function listen(options, yin) {
    const network = await yin.system.network
    makeServerBasic(options, yin)
    const http = await import('http')
    const server = http.createServer(yin.httpServer);
    socketController(server, options, yin)
    server.listen(network.port || 80)
    console.log(...yinConsole.success("开始监听于端口：", network.port || 80));
    return server
}

export function socketController(server, option, yin) {
    const io = new Server(server, {
        path: option.path + '.io',
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
            const p = new Place(place)
            try {
                const object = yin.getFromCache(p)
                if (object && object[p.key] !== value && nodeId !== yin.nodeId) {
                    await object._manageable(socket.user)
                    object._initialized = false
                    object[p.key] = value
                    object._changed = true
                    object._initialized = true
                    object._module.pull(object, p.key, value, nodeId)
                }
            } catch (e) {
            }
        })
        socket.on('watch', async ({place}) => {
            const p = new Place(place)
            try {
                const object = await yin.get(p)
                await object._manageable(socket.user)
                socket.join(place)
            } catch (e) {
            }
        })
    })

    io.of('/manage').use(async (socket, next) => {
        if (socket.handshake.auth?.token)
            try {
                const res = await jsonwebtoken.verify(socket.handshake.auth?.token, yin.system.secret);
                socket.user = await yin.User.get(res._id)
                next()
            } catch (e) {
                next(new Error('授权失败，无法校验的token'))
            }
        else
            next(new Error('授权失败，未找到token'))
    });
    yin.regSocket(io)
}


export function httpController(options, yin) {
    const app = new Koa(), router = Router({prefix: options.path + '.object'})

    app.use(cors({maxAge: 604800}))
    app.use(koaBody())
    app.use(koaStatic('./public'))
    /**
     * 自动处理yin内部的错误信息
     */
    app.use(async (ctx, next) => {
        try {
            await next()
        } catch (e) {
            if (e.code) {
                ctx.status = e.code
                ctx.body = e
            } else {
                throw e
            }
        }
    });


    app.use(async (ctx, next) => {
        const token = ctx.request.headers["authorization"]
        if (token) {
            try {
                const res = await jsonwebtoken.verify(token.slice(7), yin.system.secret)
                if (res._id)
                    ctx.user = await yin.User.get(res._id)
            } catch (e) {
                ctx.user = {}
            }
        } else
            ctx.user = {}
        ctx.body = await next()
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
        const router = module.api.makeRouter(app, Router({prefix: options.path + '.object/' + module.name}))
        app.use(router.routes())
    })

    return app
}

function makeYinRes(yin, res = {}) {
    for (let k in yin) {
        const v = yin[k]
        if (v instanceof Array)
            res[k] = makeYinRes(v, [])
        else if (v && v.name)
            res[k] = v.name
        else
            res[k] = v
    }
    return res
}

