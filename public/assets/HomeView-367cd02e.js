import{N as o}from"./nodeTree-e6129310.js";import{d as n,u as i,_ as m,r,o as t,c as a,a as c,b as h}from"./index-1a95506c.js";import"./yinMenuItem-36095ba2.js";const d=n({name:"HomeView",components:{NodeTree:o},setup(){return{message:i()}},data(){return{msg:null,me:{}}},methods:{},mounted(){this.$yin.me._id?(this.me=this.$yin.me,this.$yin.on("disconnect",e=>{this.msg=this.message.warning(e,{duration:0}),setTimeout(()=>{this.msg.type="loading",this.msg.content="正在重新连接"},2e3)}),this.$yin.on("reconnect",e=>{this.msg.type="success",this.msg.content=e,setTimeout(()=>{this.msg.destroy()},2e3)})):this.$router.push("/auth")},watch:{me(e){e._id||this.$router.push("/auth")}}}),u={class:"home"};function p(e,_,g,l,$,f){const s=r("node-tree");return t(),a("div",u,[e.$yin.me._id?(t(),c(s,{key:0})):h("",!0)])}const B=m(d,[["render",p]]);export{B as default};