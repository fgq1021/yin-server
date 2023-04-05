export class Place extends String {
    public placeList

    constructor(...place) {
        let p = place[0] || ''
        for (let i = 1; i < place.length; i++) {
            p += '.' + place[i]
        }
        super(p);
        Object.defineProperty(this, 'placeList', {value: p.placeList || p.split('.'), enumerable: false})
    }

    get module() {
        return this.placeList[0]
    }

    get id() {
        return this.placeList[1]
    }

    get key() {
        return this.placeList[2]
    }

    get meta() {
        return this.placeList[3]
    }

    get index() {
        return this.placeList[3] || 'default'
    }


    get idKey() {
        return this.id + '.' + this.key
    }

    get parent() {
        return new Place(this.module, this.id)
    }
}