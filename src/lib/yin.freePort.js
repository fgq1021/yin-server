import net from "net";

export async function yinFreePort(port) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();

        const timeout = () => {
            resolve(port);
            socket.destroy();
        };

        const next = () => {
            socket.destroy();
            resolve(yinFreePort(++port));
        };

        setTimeout(timeout, 10);
        socket.on("timeout", timeout);

        socket.on("connect", () => next());

        socket.on("error", error => {
            if (error.code !== "ECONNREFUSED")
                reject(error);
            else
                resolve(port);
        });

        socket.connect(port, "0.0.0.0");
    });
}
