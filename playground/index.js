import {yin} from "../src/yin.server.js";

console.log(yin)

async function start() {
    await yin.start()
    try {
        await yin.listen()
    } catch (e) {
        throw e
    }
}


start()
