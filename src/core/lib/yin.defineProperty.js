export function hideProperty(target, property) {
    Object.defineProperty(target, property, {enumerable: false, writable: true})
}

export function lockProperty(target, property, value) {
    Object.defineProperty(target, property, {value, enumerable: false, writable: false, configurable: false})
}

export function showProperty(target, property) {
    Object.defineProperty(target, property, {enumerable: true})
}

export const yinDefineProperty = {
    hideProperty, lockProperty, showProperty
}
