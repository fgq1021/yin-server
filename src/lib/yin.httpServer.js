import Fastify from 'fastify'
import {Server} from "socket.io";
import {Place, yinConsole, yinError, yinStatus} from "../core/index.js";
import jsonwebtoken from "jsonwebtoken";
import {join} from "path";
import {yinFreePort} from "./yin.freePort.js";
import fs from "fs/promises";

export class yinHttpServer {
    server
    option
    yin
    http
    routes = {}

    /**
     * 由fastify和socket.io搭建网络访问
     * @param {Yin} yin
     */
    constructor(yin) {
        this.yin = yin
    }

    async init(server) {
        this.option = await this.yin.system.network
        // console.log(this.option)
        // this.option.prefix = (this.option.prefix || "/yin").replace(/\/$/, "")
        await this.httpController()

        // const http = await import('http'),
        //     s = http.createServer(() => {
        //     })
        //
        // const serverEvents = ['checkContinue'
        //     , 'checkExpectation'
        //     , 'clientError'
        //     , 'close'
        //     , 'connect'
        //     , 'connection'
        //     , 'dropRequest'
        //     , 'request'
        //     , 'upgrade']
        //
        // for (let e of serverEvents) {
        //     console.log(e, this.server.listeners(e).length)
        //     console.log(e, s.listeners(e).length)
        // }
        //
        //
        if (server) {

        }
    }

    /**
     * 集成服务
     * 暂时没水平像改koa那样接受一个server让fastify跑起来。。。
     * 而且加入静态托管后，几乎控制了所有路由。。。
     * @param server
     * @return {*}
     */
    makeHttpServer(server) {
        const path = this.option.prefix + '.object'

        // cache and clean up listeners
        const listeners = server.listeners("request").slice(0);
        server.removeAllListeners("request");

        // add request handler
        server.on("request", (req, res) => {
            // TODO use `path === new URL(...).pathname` in the next major release (ref: https://nodejs.org/api/url.html)
            if (path === req.url.slice(0, path.length)) {
                this.yin.httpServer(req, res)
            }
            else {
                let i = 0;
                const l = listeners.length;
                for (; i < l; i++) {
                    listeners[i].call(server, req, res);
                }
            }
        });


        this.socketController(server, this.option, this.yin)
        return server
    }

    async listen() {
        await this.init()
        const port = await yinFreePort(this.option.port || 80)
        return new Promise((resolve, reject) => {
            this.http.listen(
                {port: port, host: '::'},
                (err, address) => {
                    if (err) reject(err)
                    if (this.option.port !== port)
                        console.log(...yinConsole.warn(`端口${this.option.port}已占用`))
                    console.log(...yinConsole.success("网络访问已开始运行：", this.option.makeUrl(this.option.network[0], port)));
                    resolve(address)
                })

        })
    }


    async httpController() {
        const publicPath = join(this.yin.rootPath, 'public'),
            cabPath = join(this.yin.yinModulePath, 'public')

        this.http = Fastify({logger: false})
        this.http
            .register(await import('@fastify/multipart'), {
                limits: {
                    // 单次最多上传1T
                    fileSize: 1024 * 1024 * 1024 * 1024,
                    // 单次最多上传一百万个文件
                    parts: 1000000
                }
            })
            .register(await import('@fastify/static'), {root: publicPath, redirect: true})
            .register(await import('@fastify/cors'), {maxAge: 604800})
            .register(async app => {
                app.addHook('onRequest', async req => {
                    req.user = {}
                    const token = req.headers["authorization"]
                    if (token) {
                        try {
                            const res = await jsonwebtoken.verify(token.slice(7), this.option.tokenSecret)
                            if (res._id) req.user = await this.yin.User.get(res._id)
                        }
                        catch (e) {
                        }
                    }
                    // 对于非开放系统，防止巨型body
                    if (req.method !== 'GET' && !req.user._id)
                        return yinStatus.UNAUTHORIZED(`匿名用户禁止访问该地址 [${req.method}]${req.path}`)
                })

                // app.addHook('preSerialization', async (req, reply, value) => {
                //     console.log(req, value)
                // })
                app.setErrorHandler(function (err, request, reply) {
                    //console.log(err)
                    // 自动处理yin内部的错误信息
                    if (err instanceof yinError) reply.status(err.code).send(err.forFastifyReply())
                    else {
                        reply.status(500).send(new yinError(500, '服务器内部错误，请查看日志'))
                        console.log(...yinConsole.error(`#${err.code}`, `${err.message}[未捕获错误]\n\n`, err.stack))
                    }
                })

                app.get('/', async req => {
                    const res = {
                        title: this.yin.system._title,
                        instance: this.yin.system._id,
                        modules: this.yin.modules.map(m => m.name)
                    }
                    if (!this.yin.me._tel)
                        res.uninitialized = true
                    if (req.user === this.yin.me) {
                        res.me = this.yin.me
                        res.rootPath = this.yin.rootPath
                        res.scriptsFile = this.yin.scriptsFile
                    }
                    return res
                })

                app
                    .get('/scripts/:place', async req => {
                        if (req.user === this.yin.me)
                            return this.yin.readScript(req.params.place)
                        return yinStatus.UNAUTHORIZED('非管理员无权查看')
                    })
                    .post('/scripts/:place', async req => {
                        if (req.user === this.yin.me)
                            return this.yin.createScript(req.params.place, req.body)
                        return yinStatus.UNAUTHORIZED('非管理员无权创建')
                    })
                    .patch('/scripts/:place', async req => {
                        if (req.user === this.yin.me)
                            return this.yin.updateScript(req.params.place, req.body)
                        return yinStatus.UNAUTHORIZED('非管理员无权修改')
                    })


                this.yin.modules.forEach(module => {
                    app.register(async router => {
                        this.routes[module.name] = {}
                        router
                            .addHook('onRequest', async req => {
                                req.module = module.authProxy(req.user)
                                if (req.params.id)
                                    req.Object = await module.get(req.params.id, req.user)
                                if (req.Object && req.params.key)
                                    req.Key = req.Object._schemaMix[req.params.key]
                            })
                            .addHook("onRoute", r => this.routes[module.name][`${r.method}${r.routePath || '/'}`] = r)

                        await module.api.makeRouter(router, this)
                    }, {prefix: '/' + module.name})
                })
            }, {prefix: '/yin.object'})
            // yin.cab 路由
            .get('/yin.cab', (req, reply) => {
                reply.redirect('/yin.cab/')
            })
            .get('/yin.cab/*', async (req, reply) => {
                try {
                    await fs.stat(join(cabPath, req.url.slice(8)))
                    return await reply.sendFile(req.url.slice(8), cabPath)
                }
                catch (e) {
                    return await reply.sendFile('/', cabPath)
                }
            })
            .get('/yin.file/*', async (req, reply, done) => {
                await this.yin.File.getPath(decodeURIComponent(req.url), {})
                return reply.sendFile(req.url)
            })
            .setNotFoundHandler((req, reply, err) => {
                if (req.url === '/') reply.redirect('/yin.cab/')
                else if (req.url.slice(0, 12) === '/yin.object/') reply.status(404).send(new yinError(404, `未找到路由 ${req.method}:${req.url}`))
                else if (req.url.slice(0, 9) === '/yin.cab/') reply.sendFile(req.url.slice(8), cabPath)
                else reply.sendFile('index.html')
            })
        // .setErrorHandler((error, request, reply) => {
        //     console.log(error)
        //     reply.status(error.code).send(error)
        // })
        this.server = this.http.server
        this.socketController(this.http.server)
    }


    socketController(server) {
        const io = new Server(server, {
            path: '/yin.io',
            // allowEIO3: true,
            cors: {
                origin: "*",
                methods: ['GET', 'PUT', 'POST']
            }
        })

        io.use(async (socket, next) => {
            socket.user = {}
            if (socket.handshake.auth?.token)
                try {
                    const res = await jsonwebtoken.verify(socket.handshake.auth?.token, this.option.tokenSecret);
                    socket.user = await this.yin.User.get(res._id)
                }
                catch (e) {
                }
            next()
        });

        io.on('connection', socket => {
            // console.log(socket)
            // socket.on('watch', ({place}) => {
            //     socket.join(place)
            // })
            socket.on('pull', async ({place, value, nodeId}) => {
                // console.log(place)
                const p = new Place(place)
                try {
                    const object = this.yin.getFromCache(p)
                    if (object && object[p.key] !== value && nodeId !== this.yin.nodeId) {
                        await object._manageable(socket.user)
                        //console.log(p.key, value)
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
            socket.on('watch', async place => {
                if (place) {
                    const p = new Place(place)
                    try {
                        const object = await this.yin.get(p)
                        try {
                            await object._manageable(socket.user)
                            socket.join('manage-' + place)
                            socket.join(place)
                            if (p.index) await this.yin[p.module].children(p, socket.user)
                        }
                        catch (e) {
                            await object._readable(socket.user)
                            socket.join(place)
                            if (p.index) await this.yin[p.module].children(p, socket.user)
                        }
                    }
                    catch (e) {

                    }
                }
            })
            for (let module of this.yin.modules) {
                if (module.api.makeSocket instanceof Function)
                    module.api.makeSocket(socket, this)
            }
        })
        // io.of('/manage').on('connection', async socket => {
        //
        // })

        // io.of('/manage').use(async (socket, next) => {
        //     if (socket.handshake.auth?.token)
        //         try {
        //             const res = await jsonwebtoken.verify(socket.handshake.auth?.token, this.option.tokenSecret);
        //             socket.user = await this.yin.User.get(res._id)
        //             next()
        //         }
        //         catch (e) {
        //             next(new Error('授权失败，无法校验的token'))
        //         }
        //     else
        //         next(new Error('授权失败，未找到token'))
        // });
        this.yin.regSocket(io)
    }

}
