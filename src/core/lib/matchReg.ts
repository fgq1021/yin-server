export function matchReg(array) {
    for (let i in array) {
        if (typeof array[i] === "string") {
            const reg = array[i].match(/^\/(.+)\/(.?)/);
            if (reg) {
                array[i] = new RegExp(reg[1], reg[2]);
            }
        }
    }
    return array;
}