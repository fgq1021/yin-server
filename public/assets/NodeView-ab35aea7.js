import{N as n}from"./nodeTree-8e6f9f4b.js";import{d as s,_ as c,r as a,o,c as r,a as i,b as p}from"./index-309f0393.js";import"./yinMenuItem-25df86b3.js";import"./Tabs-c7a3a444.js";const d=s({name:"NodeView",components:{NodeTree:n},props:["place"],data(){return{object:{}}},methods:{async init(){this.place&&(this.object=await this.$yin.get(this.place))}},mounted(){this.init()}}),m={class:"nodeView"};function _(e,l,f,h,u,b){const t=a("node-tree");return o(),r("div",m,[e.object._id?(o(),i(t,{key:0,object:e.object},null,8,["object"])):p("",!0)])}const w=c(d,[["render",_]]);export{w as default};
//# sourceMappingURL=NodeView-ab35aea7.js.map