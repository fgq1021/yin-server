import {yin} from "../index.js";
import child_process from "child_process";
import cluster from "cluster";
import {yinConsole} from "../src/core/index.js";
import http from "http";

async function startCluster() {
    try {

        if (cluster.isPrimary) {
            await yin.start()

            // 衍生工作进程。
            for (let i = 0; i < 8; i++) {
                cluster.fork();
            }

            cluster.on('exit', (worker, code, signal) => {
                console.log(...yinConsole.error(`${yin.nodeId} 终止运行`, worker.process.pid, code, signal))
            });
        }
        else {
            yin.isChild = true
            await yin.start()
            await yin.listen()
            console.log(`Worker ${process.pid} started`);
        }
    }
    catch (e) {
        console.error(e)
    }
}

async function start() {
    try {
        await yin.start()
        await yin.listen()
        console.log(yin)
    }
    catch (e) {
        console.error(e)
        throw e
    }
}

start()

process.on('unhandledRejection', function (err) {
    console.error('未捕获')
    throw err
    // process.abort()
    // if (module.exports.abort) {
    //     process.abort()
    // }
    // process.exit(1)
})








