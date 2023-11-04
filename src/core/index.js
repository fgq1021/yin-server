// import {fileURLToPath} from 'url';
// import {resolve, dirname} from 'path';
// import fs from "fs";
//
// const __dirname = dirname(fileURLToPath(import.meta.url));
//
// const dirs = fs.readdirSync(__dirname)
//
// console.log(import.meta, __dirname, dirs)
// const modules = {}
// for (let dir of dirs) {
//     if (dir !== 'index.js') {
//         const sub = fs.readdirSync(resolve(__dirname, dir))
//         for (let module of sub) {
//             modules[module] = await import(`./${dir}/${module}`)
//         }
//     }
// }


//core
export * from './core/yin.js'
export * from './core/object.js'
export * from './core/key.js'
export * from './core/module.js'
export * from './core/array.js'
export * from './core/place.js'
export * from './core/type.js'
export * from './core/cab.js'

//client
export * from './client/controller.client.js'
export * from './client/yin.client.js'
export * from './client/user.controller.client.js'
export * from './client/file.controller.client.js'

//lib
export * from './lib/yin.request.js'
export * from './lib/yin.assign.js'
export * from './lib/yin.color.js'
export * from './lib/yin.console.js'
export * from './lib/yin.status.js'
export * from './lib/yin.defineProperty.js'
export * from './lib/yin.file.path.js'

//basic modules
export * from './modules/element.module.js'
export * from './modules/model.module.js'
export * from './modules/system.module.js'
export * from './modules/user.module.js'
export * from './modules/file.module.js'
