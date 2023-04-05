export const yinConsole = {
    log(...data) {
        console.log('[引]', ...data)
    },
    warn(...data) {
        console.warn('[引]', '[警告]', ...data)
    }
}
