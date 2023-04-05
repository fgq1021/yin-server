"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJson = void 0;
function parseJson(d) {
    if (d)
        return JSON.parse(JSON.stringify(d));
    return d;
}
exports.parseJson = parseJson;
