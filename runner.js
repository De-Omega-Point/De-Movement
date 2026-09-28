(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.DeMovementRunner=factory();
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';

class Runner{
 constructor(plan){
   this.plan=plan;
   this.items=(plan?.blocks||[]).flatMap(b=>(b.movements||[]).map(m=>({blockId:b.id,blockLabel:b.label,...m})));
   this.index=0;this.set=1;this.phase='idle';this.remaining=0;this.completedSets=0;this.started=false;this.finished=this.items.length===0;
 }
 current(){
   if(this.finished)return null;
   const item=this.items[this.index];
   return {...item,currentSet:this.set,totalSets:item.protocol.sets};
 }
 isTimed(){
   const c=this.current();
   return !!c&&['hold','time'].includes(c.protocol.kind);
 }
 start(){
   this.started=true;
   if(this.isTimed()){this.phase='work';this.remaining=this.current().protocol.seconds;}
   else this.phase='work';
   return this.snapshot();
 }
 completeSet(){
   if(this.finished)return this.snapshot();
   const c=this.current();
   this.completedSets++;
   const rest=c.protocol.rest||0;
   if(this.set<c.protocol.sets){
     this.set++;
   }else if(this.index<this.items.length-1){
     this.index++;this.set=1;
   }else{
     this.finished=true;this.phase='finished';this.remaining=0;return this.snapshot();
   }
   this.phase=rest>0?'rest':'idle';this.remaining=rest;
   return this.snapshot();
 }
 tick(){
   if(!['work','rest'].includes(this.phase)||this.remaining<=0)return this.snapshot();
   this.remaining--;
   if(this.remaining<=0){
     if(this.phase==='work'&&this.isTimed())return this.completeSet();
     this.phase='idle';this.remaining=0;
   }
   return this.snapshot();
 }
 skipRest(){if(this.phase==='rest'){this.phase='idle';this.remaining=0}return this.snapshot()}
 snapshot(){return {index:this.index,set:this.set,phase:this.phase,remaining:this.remaining,completedSets:this.completedSets,finished:this.finished,started:this.started,current:this.current()}}
}
return {Runner};
});