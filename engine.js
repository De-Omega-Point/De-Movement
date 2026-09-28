(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DeMovementEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const PRIMARY = {
    control:{
      label:'Control',
      short:'Balance, invert, own the shape',
      objective:'Build calm body control in positions where balance and alignment matter.',
      success:'Finish with cleaner positions and fewer corrective movements than you started with.',
      accent:'lime',
      icon:'◒'
    },
    strength:{
      label:'Strength',
      short:'Push, pull, hold, carry',
      objective:'Build usable bodyweight strength through controlled ranges and repeatable positions.',
      success:'Complete the main strength work with clean reps and 1–3 good reps still in reserve.',
      accent:'coral',
      icon:'◆'
    },
    compression:{
      label:'Compression',
      short:'Core, pike, L-sit, shapes',
      objective:'Build active hip compression and trunk control that transfers into calisthenics skills.',
      success:'Own the end range without momentum, shrugging or losing trunk position.',
      accent:'violet',
      icon:'⌁'
    },
    locomotion:{
      label:'Move',
      short:'Crawl, travel, rotate',
      objective:'Develop whole-body coordination through ground-based travelling and transitions.',
      success:'Move smoothly in multiple directions while keeping breathing and control relaxed.',
      accent:'aqua',
      icon:'↝'
    },
    acrobatics:{
      label:'Acrobatics',
      short:'Roll, cartwheel, transition',
      objective:'Build orientation, floor confidence and soft acrobatic transitions without chasing risky tricks.',
      success:'Complete each pattern with quiet landings, clear exits and no rushed repetitions.',
      accent:'gold',
      icon:'✦'
    },
    mobility:{
      label:'Range',
      short:'Open, rotate, restore',
      objective:'Expand active, usable range while keeping the new range under muscular control.',
      success:'Finish feeling freer without forcing end range or creating pain.',
      accent:'blue',
      icon:'◌'
    }
  };

  const BLENDS = {
    none:{label:'No blend',short:'Keep the session singular and focused.'},
    locomotion:{label:'Ground movement',short:'Add travelling, crawling and multidirectional coordination.'},
    acrobatics:{label:'Soft acrobatics',short:'Add low-risk rolling, orientation and controlled transitions.'},
    mobility:{label:'Mobility',short:'Add active range and position ownership.'},
    strength:{label:'Strength support',short:'Add basic push, pull or leg strength around the main skill.'}
  };

  const ENERGY={
    steady:{label:'Steady',factor:1,copy:'Quality first. Keep breathing controlled and leave room for another round.'},
    charged:{label:'Charged',factor:1.12,copy:'More intent and density, but technique still sets the ceiling.'},
    gentle:{label:'Gentle',factor:.82,copy:'Reduce density, choose easier variations and move with extra margin.'}
  };

  function clampDuration(n){
    n=Number(n);
    return [25,40,55].includes(n)?n:40;
  }

  function validPrimary(key){return PRIMARY[key]?key:'control';}
  function validBlend(key,primary){
    if(!BLENDS[key]||key===primary)return 'none';
    return key;
  }
  function validEnergy(key){return ENERGY[key]?key:'steady';}

  function allocate(total,weights){
    const keys=Object.keys(weights);
    const raw=keys.map(k=>({k,v:total*weights[k]}));
    const result={};
    let used=0;
    raw.forEach((x,i)=>{
      const value=i===raw.length-1?total-used:Math.max(2,Math.round(x.v));
      result[x.k]=value;used+=value;
    });
    if(used!==total)result[keys[keys.length-1]]+=total-used;
    return result;
  }

  function buildBlocks(primary,blend,duration){
    const hasBlend=blend!=='none';
    const weights=hasBlend
      ? {prime:.14,skill:.26,strength:.24,blend:.20,range:.11,reflect:.05}
      : {prime:.15,skill:.30,strength:.29,range:.18,reflect:.08};
    const t=allocate(duration,weights);
    const p=PRIMARY[primary];
    const blocks=[
      {id:'prime',label:'Prime',minutes:t.prime,purpose:'Prepare wrists, shoulders, spine, hips and the positions you will use.'},
      {id:'skill',label:primary==='strength'?'Primary strength':'Primary skill',minutes:t.skill,purpose:p.objective},
      {id:'strength',label:primary==='mobility'?'Active strength':'Support strength',minutes:t.strength,purpose:'Build the strength that makes today’s movement repeatable rather than lucky.'}
    ];
    if(hasBlend)blocks.push({id:'blend',label:BLENDS[blend].label,minutes:t.blend,purpose:BLENDS[blend].short});
    blocks.push({id:'range',label:'Range',minutes:t.range,purpose:'Finish with active mobility that supports the positions trained today.'});
    blocks.push({id:'reflect',label:'Reflect',minutes:t.reflect,purpose:'Log control, confidence and effort so the next session can improve.'});
    return blocks.filter(b=>b.minutes>0);
  }

  function compose(input={}){
    const primary=validPrimary(input.primary);
    const blend=validBlend(input.blend||'none',primary);
    const duration=clampDuration(input.duration);
    const energy=validEnergy(input.energy);
    const p=PRIMARY[primary];
    const e=ENERGY[energy];
    const blocks=buildBlocks(primary,blend,duration);
    const goals=[
      p.success,
      blend!=='none'?BLENDS[blend].short:'Keep the session focused on one clear movement quality.',
      e.copy
    ];
    return {
      primary,blend,duration,energy,
      title:blend==='none'?p.label:`${p.label} + ${BLENDS[blend].label}`,
      objective:p.objective,
      success:p.success,
      promise:`${duration} minutes built around ${p.label.toLowerCase()}${blend==='none'?'':` with ${BLENDS[blend].label.toLowerCase()}`}.`,
      goals,blocks,
      accent:p.accent,
      icon:p.icon
    };
  }

  return {PRIMARY,BLENDS,ENERGY,compose};
});
