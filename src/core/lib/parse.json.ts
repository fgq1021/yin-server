export function parseJson(d) {
    if (d)
        return JSON.parse(JSON.stringify(d));
    return d;
}