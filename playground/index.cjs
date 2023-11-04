const {randomFillSync} = require('crypto');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const Koa = require('koa');
const app = new Koa();

// response


const busboy = require('busboy');
const cors = require("@koa/cors");
const {bodyParser} = require("@koa/bodyparser");
const Router = require("@koa/router");

const random = (() => {
    const buf = Buffer.alloc(16);
    return () => randomFillSync(buf).toString('hex');
})();

console.log(os.tmpdir())


app.use(cors({maxAge: 604800}))
app.use(bodyParser())
const router = Router({prefix: '/yin.object/File/'})


router.post('/', ctx => {
    console.log(ctx)
    const {req, res} = ctx


    return new Promise((resolve, reject) => {
        const bb = busboy({headers: req.headers});
        bb.on('file', (name, file, info) => {
            const saveTo = path.join(os.tmpdir(), `busboy-upload-${random()}`);
            file.pipe(fs.createWriteStream(saveTo));
        });
        bb.on('close', () => {
            res.writeHead(200, {'Connection': 'close'});
            res.end(`That's all folks!`);
        });
        req.pipe(bb);
    })
})

app.use(router.routes())

// app.use((ctx, next) => {
//     console.log(ctx)
//     next()
//     // const {req, res} = ctx
//     // if (req.method === 'POST') {
//     //     const bb = busboy({headers: req.headers});
//     //     bb.on('file', (name, file, info) => {
//     //         const saveTo = path.join(os.tmpdir(), `busboy-upload-${random()}`);
//     //         file.pipe(fs.createWriteStream(saveTo));
//     //     });
//     //     bb.on('close', () => {
//     //         res.writeHead(200, {'Connection': 'close'});
//     //         res.end(`That's all folks!`);
//     //     });
//     //     req.pipe(bb);
//     //     return;
//     // }
//     // res.writeHead(404);
//     // res.end();
// });

// const server = http.createServer(app.callback());
//
// server.listen(80);
app.listen(80)

// http.createServer((req, res) => {
//     if (req.method === 'POST') {
//         const bb = busboy({headers: req.headers});
//         bb.on('file', (name, file, info) => {
//             const saveTo = path.join(os.tmpdir(), `busboy-upload-${random()}`);
//             file.pipe(fs.createWriteStream(saveTo));
//         });
//         bb.on('close', () => {
//             res.writeHead(200, {'Connection': 'close'});
//             res.end(`That's all folks!`);
//         });
//         req.pipe(bb);
//         return;
//     }
//     res.writeHead(404);
//     res.end();
// }).listen(80, () => {
//     console.log('Listening for requests');
// });
