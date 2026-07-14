// ============================================================
// Indic Monopoly - Sound effects manager
// ============================================================
var SND={
  folder:'./sounds/',
  map:{
    bonus:'bonus.mp3',create:'create.mp3',dice:'dice.mp3',
    airport:'airport.mp3',join_req:'join_req.mp3',joined:'joined.mp3',
    losing:'losing.mp3',pay_r:['pay_r.mp3','pay_r1.mp3','pay_r2.mp3'],
    tax:'tax.mp3',railway:'railway.mp3',
    salary:['salary.mp3','salary2.mp3'],
    win:'win.mp3',prop:'prop.mp3',message:'message.mp3'
  },
  play:function(k){
    try{
      var f=this.map[k];
      if(Array.isArray(f))f=f[Math.floor(Math.random()*f.length)];
      if(!f)return;
      var a=new Audio(this.folder+f);
      a.volume=0.65;a.play().catch(function(){});
    }catch(e){}
  }
};
