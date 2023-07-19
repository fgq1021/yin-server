import{d as C,u as v,_ as $,r,o as i,c,a as m,w as s,F as w,e as u,f as o,b as n,t as B,g as p,p as F,h as A}from"./index-1a95506c.js";const T=C({name:"AuthView",setup(){return{message:v()}},data(){return{_tel:"",code:"",_password:"",confirmPassword:"",device:"",msg:"",time:60,backTo:null,register:!1}},computed:{uninitialized(){return this.$yin.system.uninitialized}},methods:{getCode(){this.$yin.User.auth.code.get(this._tel).then(e=>{this.device=e.device,this.time=60;let t=setInterval(()=>{this.time?this.time--:clearInterval(t)},1e3)}).catch(e=>{this.msg=e.message})},auth(){this.$yin.User.auth.code.auth(this).then(e=>{if(this.message.success((e.username||e._tel)+" 登录成功"),this.$route.name==="auth")if(this.$route.query.code){const t=this.$route.query.state;t?(this.backTo=localStorage.getItem(t),localStorage.removeItem(t),this.back()):(this.backTo="/",this.back())}else this.$route.query.url?(this.backTo=this.$route.query.url,this.back()):(this.backTo="/",this.back());else this.$emit("close")}).catch(e=>{this.msg=e.response.data.msg||e.message})},authWX(){if(this.isWX&&!this._store.state.user.wx.openid&&!this.$route.query.code){let e=this.$route.query.url,t;e&&(t="authBackUrl"+new Date().getTime(),localStorage.setItem(t,e)),this.$yin.User.auth.wx.auth(t||"")}else this.$route.query.code&&this.$yin.User.auth.wx.getUserInfo(this.$route.query.code).then(()=>{const e=this.$route.query.state;e?(this.backTo=localStorage.getItem(e),localStorage.removeItem(e),this.back()):(this.backTo="/",this.back())}).catch(e=>this.userInfo=e)},async reg(){try{const e=await this.$yin.User.create({_tel:this._tel,_password:this._password});this.message.success((e._title||e._tel)+" 注册成功"),this.$route.query.url?(this.backTo=this.$route.query.url,this.back()):(this.backTo="/",this.back())}catch(e){console.log(e),this.msg=e.response.data.msg||e.message}},async authPassword(){try{const e=await this.$yin.User.authPassword(this._tel,this._password);this.message.success((e._title||e._tel)+" 登录成功"),this.$route.query.url?(this.backTo=this.$route.query.url,this.back()):this.back()}catch(e){console.log(e),this.msg=e.response.data.msg||e.message}},back(){console.log(this.backTo),this.backTo?this.$router.push(this.backTo):this.$router.go(-1)},waitForAuth(){setTimeout(()=>{this.$yin.me._id?this.back():this.$yin.me.token?this.waitForAuth():this.back()},100)}},mounted(){this.authWX(),this.$yin.me._id?this.back():this.$yin.me._token&&this.waitForAuth(),this.$yin.system.uninitialized&&(this.register=!0)}});const b=e=>(F("data-v-84bfa0d8"),e=e(),A(),e),D={class:"auth"},E={key:0,class:"authing"},q=b(()=>p("p",null,"此时注册的用户将为管理员",-1)),I={key:1,class:"btn raw"},U={key:2,class:"btn raw"},S=b(()=>p("p",{class:"title"},"输入手机号自动登录/注册",-1)),V={class:"btn raw"};function P(e,t,z,N,W,X){const k=r("n-h4"),d=r("n-input"),h=r("n-form-item-row"),l=r("n-button"),y=r("n-tab-pane"),f=r("n-input-group"),_=r("n-tabs"),g=r("n-card");return i(),c("div",D,[e.$yin.me._token&&!e.$yin.me._id?(i(),c("div",E," 受权中... ")):(i(),m(g,{key:1,title:"引.object - 对象操作台",class:"table"},{default:s(()=>[e.$yin.system.uninitialized?(i(),c(w,{key:0},[u(k,null,{default:s(()=>[o("初始化")]),_:1}),q],64)):n("",!0),u(_,{"default-value":"password",size:"large"},{default:s(()=>[u(y,{name:"password",tab:"密码"},{default:s(()=>[u(h,{label:"手机号"},{default:s(()=>[u(d,{value:e._tel,"onUpdate:value":t[0]||(t[0]=a=>e._tel=a),type:"tel",placeholder:"请输入手机号"},null,8,["value"])]),_:1}),u(h,{label:"密码",feedback:e.msg},{default:s(()=>[u(d,{value:e._password,"onUpdate:value":t[1]||(t[1]=a=>e._password=a),type:"password",center:"",clearable:"",placeholder:"请输入密码"},null,8,["value"])]),_:1},8,["feedback"]),e.register?(i(),m(h,{key:0,label:"确认密码"},{default:s(()=>[u(d,{value:e.confirmPassword,"onUpdate:value":t[2]||(t[2]=a=>e.confirmPassword=a),type:"password",center:"",clearable:"",placeholder:"再次输入密码"},null,8,["value"])]),_:1})):n("",!0),e.register?n("",!0):(i(),c("div",I,[u(l,{onClick:e.authPassword,block:"",type:"primary"},{default:s(()=>[o("登录")]),_:1},8,["onClick"]),u(l,{onClick:t[3]||(t[3]=a=>e.register=!0),block:"",type:"default"},{default:s(()=>[o("注册")]),_:1})])),e.register?(i(),c("div",U,[u(l,{onClick:t[4]||(t[4]=a=>e.register=!1),block:"",type:"default"},{default:s(()=>[o("登录")]),_:1}),u(l,{onClick:e.reg,block:"",type:"primary"},{default:s(()=>[o("注册")]),_:1},8,["onClick"])])):n("",!0)]),_:1}),u(y,{name:"code",tab:"验证码"},{default:s(()=>[S,u(h,{label:"手机号"},{default:s(()=>[u(d,{value:e._tel,"onUpdate:value":t[5]||(t[5]=a=>e._tel=a),type:"tel",placeholder:"请输入手机号"},null,8,["value"])]),_:1}),u(h,{label:"短信验证码",feedback:e.msg},{default:s(()=>[u(f,null,{default:s(()=>[u(d,{value:e.code,"onUpdate:value":t[6]||(t[6]=a=>e.code=a),center:"",clearable:"",placeholder:"请输入短信验证码",autocomplete:"one-time-code"},null,8,["value"]),e.device?n("",!0):(i(),m(l,{key:0,disabled:e._tel==="",type:"primary",onClick:e.getCode},{default:s(()=>[o(" 发送验证码 ")]),_:1},8,["disabled","onClick"])),e.device&&e.time>0?(i(),m(l,{key:1,disabled:!0,type:"primary"},{default:s(()=>[o(" 已发送("+B(e.time)+") ",1)]),_:1})):n("",!0),e.device&&e.time===0?(i(),m(l,{key:2,type:"primary",onClick:e.getCode},{default:s(()=>[o(" 再次发送 ")]),_:1},8,["onClick"])):n("",!0)]),_:1})]),_:1},8,["feedback"]),p("div",V,[u(l,{type:"primary",block:"",onClick:e.auth},{default:s(()=>[o("登录/注册")]),_:1},8,["onClick"])])]),_:1})]),_:1})]),_:1}))])}const M=$(T,[["render",P],["__scopeId","data-v-84bfa0d8"]]);export{M as default};
