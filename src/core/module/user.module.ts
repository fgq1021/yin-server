import {Module} from "../core/module";
import {YinObject} from "../core/object";
import {ModuleSchema} from "../core/module.schema";
import {yinStatus} from "../lib/yin.status";

export class UserModule extends Module {
    public name = 'User'
    public schema = new ModuleSchema({
        $wx: {
            openid: String,
            unionid: String,
            userInfo: {}
        },
        $tel: {
            index: true,
            unique: true,
            type: Number
        },
        $passwordHash: String,
        $passwordUpdateTime: {
            type: Date,
            default: Date.now
        },
        $objectUpdateTime: {
            type: Date,
            default: Date.now
        }
    })

    constructor(yin, controller) {
        super(yin, controller);
        const _this = this
        this.Object = class User extends YinObject {
            public $name = 'User'

            get $api() {
                return _this
            }

            get $owner() {
                return (user?) => this.$api.yin.User.get(this.$.owner || this.$id, user)
            }

            set $owner(o) {
                super.$owner = o
            }

            $manage(user?) {
                return this.$api.children(this.$name + '.' + this.$id + '.$manage', user)
            }

            $read(user?) {
                return this.$api.children(this.$name + '.' + this.$id + '.$read', user)
            }


            async $readable(user?) {
                return true
            }

            async $manageable(user): Promise<boolean> {
                if (!user && this.$api.yin.client)
                    user = this.$api.yin.me
                if (user?.$id === this.$id)
                    return true
                return super.$manageable(user);
            }
        }

        this.init()
    }

    createRoot(object) {
        return this.api.createRoot(object)
    }


    async authPassword(tel: string, password: string) {
        const user = await this.api.authPassword(tel, password);
        return this.assign(user)
    }

    async auth(id?: string) {
        const user = await this.api.auth(id)
        return this.assign(user)
    }
}






