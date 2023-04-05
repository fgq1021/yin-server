import {Module} from "../core/module";
import {YinObject} from "../core/object";
import {Key, Types} from "../core/key";
import {Place} from "../core/place";

export class ModelModule extends Module {
    public name = 'Model'
    // 下一步要把Type写成单独的模块，并且用SSR生成表单，以此动态添加类型输入
    public Place = Place
    public Types = Types
    public Key = Key

    constructor(yin, controller) {
        super(yin, controller);
        const _this = this
        this.Object = class Model extends YinObject {
            public $name = 'Model'

            get $api() {
                return _this
            }

            get $model() {
                return (user?) => this.$api.get(this.$.model || this.$id, user)
            }

            set $model(o) {
                super.$model = o
            }

            async $readable(user?) {
                return true
            }
        }
        this.init()
    }


}




