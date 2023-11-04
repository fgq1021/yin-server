import os from "node:os";
import {yinStatus} from "../core/index.js";

/**
 * 网络:Model
 *
 * @typedef {Object} 网络
 * @property {Information} info  网络信息 - 可访问的地址
 * @property {Number} port  端口
 * @property {String} tokenSecret  令牌密钥 - 用户身份令牌 User._token 的生成密钥，修改此项后所有用户需要重新登录。
 * @property {Function} resetTokenSecret  重置令牌密钥
 * @property {Boolean} ssl  传输层安全协议SSL/TLS - 开启安全协议以启用超文本传输安全协议HTTPS
 * @property {String} cert  安全协议证书
 * @property {String} key  安全协议密钥
 *
 * @todo 脚本删除和重命名后需要重启服务,完成调试后最好也重启一下
 */
export default {
    _id: ['Model.64255d2e375d586f431da9d3'],
    _setter: {
        ssl(value, target) {
            // console.log(!!value, this)
            target.ssl = !!value
            if (value && this.port === 80) {
                this.port = 443
            }
            else if (this.port === 443 && this._.model?.port) {
                this.port = this._.model.port
            }
            return true
        }
    },
    _getter: {},
    async resetTokenSecret(req, user = this._module.yin.me) {
        await this._manageable(user)
        const passwordLength = Number(req) || 64,
            chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let password = "";
        for (let i = 0; i <= passwordLength; i++) {
            const randomNumber = Math.floor(Math.random() * chars.length);
            password += chars.substring(randomNumber, randomNumber + 1);
        }
        this.tokenSecret = password;
        await this._save(user)
        return this.tokenSecret
    },
    network: [],
    async isRoot() {
        // const owner = await this._owner
      //  console.log(this._owner.valueOf() === this._yin.me._id)
        if (this._owner.valueOf() === this._yin.me._id)
            return
        return yinStatus.UNAUTHORIZED('非管理员禁止运行此函数')
    },
    getHost() {
        this.network = []
        const osType = os.type(),
            netInfo = os.networkInterfaces()

        let info = '',
            network

        if (osType === 'Windows_NT') {
            for (let dev in netInfo) {
                //win7的网络信息中显示为本地连接，win10显示为以太网
                if (dev === '本地连接' || dev === '以太网') {
                    network = netInfo[dev]
                }
            }
        }
        else if (osType === 'Linux') {
            network = netInfo.eth0
        }
        else if (osType === 'Darwin') {
            network = netInfo.en0
        }

        for (let net of network) {
            const url = this.makeUrl(net, this.port)
            if (url) {
                this.network.push(net)
                info += `<a href="${url}" target="_blank"><p>${url}</p></a>`
            }
        }
        this.info = info

        // if (!this.host) {
        //     this.host = this.makeUrl(this.network[0], this.port)
        // }

        return this.network;
    },
    makeUrl(network, port) {
        const pre = this.ssl ? 'https://' : 'http://',
            aft = [80, 443].includes(port) ? '' : `:${port}`
        let ip = network.address

        if (network.family === 'IPv6') {
            if (network.scopeid === 0)
                ip = '[' + network.address + ']'
            else
                ip = false
        }
        if (ip)
            return pre + ip + aft
    },
    async created() {
        await this.resetTokenSecret()
    },
    async mounted() {
        try {
            await this.isRoot()
            this.getHost()
        }
        catch (e) {
        }
    }
}
