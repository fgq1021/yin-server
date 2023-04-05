"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yinConsole = void 0;
exports.yinConsole = {
    log(...data) {
        console.log('[引]', ...data);
    },
    warn(...data) {
        console.warn('[引]', '[警告]', ...data);
    }
};
