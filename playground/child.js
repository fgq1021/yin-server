import http from "http";

console.log(process.pid)
process.on('message', (m, value) => {
    // console.log(m, value)
    process.send(m)

});
