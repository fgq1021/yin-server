import {Module} from "../core/module";
import {YinObject} from "../core/object";

export class SystemModule extends Module {
    public name = 'System'

    constructor(yin, controller) {
        super(yin, controller);
        const _this = this
        this.Object = class System extends YinObject {
            public $name = 'System'

            get $api() {
                return _this.yin.vue.markRaw(_this)
            }

            async $readable(user): Promise<boolean> {
                return this.$manageable(user)
            }

            async $manageable(user): Promise<boolean> {
                return this.$api.yin.me?.$isRoot && (user.$id === this.$api.yin.me.$id);
            }
        }
        this.init()
    }
}