import {Module} from "../core/module";
import {YinObject} from "../core/object";

export class ElementModule extends Module {
    public name = 'Element'

    constructor(yin, controller) {
        super(yin, controller);
        const _this = this
        this.Object = class Element extends YinObject {
            public $name = 'Element'

            get $api() {
                return _this
            }
        }
        this.init()
    }
}




