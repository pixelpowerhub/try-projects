// ============================================================
// INDIC MONOPOLY - v2.0 Complete
// Changes: Password system, restore on refresh, auto-terminate,
//          real-time announcements, focus management, chat sounds
// ============================================================

if(window.location.protocol==='file:'){
  document.body.innerHTML='<div style="font-family:sans-serif;background:#1A0A00;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px"><div style="background:rgba(255,255,255,.08);border:2px solid #FF6B00;border-radius:16px;padding:36px;max-width:500px;text-align:center;color:#fff"><div style="font-size:3rem;margin-bottom:16px">&#9888;</div><h2 style="color:#F0C040;margin-bottom:12px">Please use local server!</h2><p style="color:rgba(255,255,255,.7);line-height:1.7">Run <strong>START-GAME.bat</strong> or open via <strong>http://localhost:8080</strong></p></div></div>';
  throw new Error('file:// not supported');
}


var COLORS={
  red:'#C62828',blue:'#1565C0',green:'#2E7D32',pink:'#AD1457',
  yellow:'#F9A825',orange:'#E65100',brown:'#4E342E',
  white:'rgba(205,205,205,.85)',purple:'#6A1B9A',
  station:'#37474F',public_:'#00695C'
};
var PCOLORS=['#FF6B00','#1565C0','#2E7D32','#AD1457','#6A1B9A','#E65100'];
var START_MONEY=1500,SALARY=200,JAIL=10,GO_JAIL=28;
var INACTIVE_TIMEOUT=2*60*1000; // 2 minutes


// Global state
var db=null,myId=null,myName='',myGid=null,isHost=false,gs=null;
var bd=null,cells=[],jTimers={},wrL=[],gL=null,myTurn=false,joiningG=null,selSell=null;
// The plaintext room password is only ever kept in memory on the
// host's own device (set right after they type it, or when they
// restore with it) - it is NEVER stored in or read back from the
// database, and is only shown to the host, never other players.
var myRoomPass=null;
var inactiveTimer=null;

// Firebase helpers
function R(p){return db.ref(p);}
function fSet(p,v){return R(p).set(v);}
function fGet(p){return R(p).once('value');}
function fUpd(p,v){return R(p).update(v);}
function fDel(p){return R(p).remove();}
function fOn(p,cb){R(p).on('value',cb);}
function fOff(p){try{R(p).off();}catch(e){}}

// Utils
function uid(){return Math.random().toString(36).substr(2,9)+Date.now().toString(36);}
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
var m_esc={'&':'&amp;','<':'&lt;','>':'&gt;'};m_esc['"']='&quot;';m_esc["'"]='&#39;';
function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return m_esc[c];});}
function G(id){return document.getElementById(id);}
function showScreen(id){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');s.style.display='none';});
  var el=G(id);if(el){el.style.display='flex';el.classList.add('active');}
}
function openM(id){G(id).classList.add('open');}
function closeM(id){G(id).classList.remove('open');}
function load(on){if(on){G('loader').classList.add('on');}else{G('loader').classList.remove('on');}}
function focusEl(id){setTimeout(function(){var el=G(id);if(el)el.focus();},80);}

function announce(msg){
  var el=document.createElement('div');
  el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.className='sr-only';el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(function(){el.remove();},3000);
}

function toast(title,body,btns,ms){
  if(ms===undefined)ms=5000;
  var area=G('notif-area');
  var n=document.createElement('div');
  n.className='notif';n.setAttribute('role','alert');
  n.innerHTML='<div class="notif-title">'+title+'</div><div>'+body+'</div>';
  if(btns){
    var row=document.createElement('div');row.className='notif-btns';
    btns.forEach(function(b){
      var btn=document.createElement('button');
      btn.textContent=b.label;btn.className=b.cls||'';
      btn.onclick=function(){b.fn();n.remove();};
      row.appendChild(btn);
    });
    n.appendChild(row);
  }
  area.appendChild(n);
  if(ms>0&&!btns)setTimeout(function(){n.remove();},ms);
  return n;
}

// ── CELLS ─────────────────────────────────────────────────────
function makeCells(board){
  var b=board.colors;
  return [
    {id:0, name:'START Go!',     type:'salary',  icon:'&#127937;',price:0,  rent:0},
    {id:1, name:b.red[0],        type:'property',color:'red',     price:400,rent:40},
    {id:2, name:b.red[1],        type:'property',color:'red',     price:420,rent:42},
    {id:3, name:'Community Chest',type:'random', icon:'&#127922;',price:0,  rent:0},
    {id:4, name:b.red[2],        type:'property',color:'red',     price:440,rent:44},
    {id:5, name:b.stations[0],   type:'station', icon:'&#9992;',  price:300,rent:50},
    {id:6, name:b.blue[0],       type:'property',color:'blue',    price:300,rent:30},
    {id:7, name:b.blue[1],       type:'property',color:'blue',    price:320,rent:32},
    {id:8, name:'Income Tax',    type:'tax',     icon:'&#128184;',price:0,  rent:100},
    {id:9, name:b.blue[2],       type:'property',color:'blue',    price:340,rent:34},
    {id:10,name:'JAIL Visit',    type:'corner',  icon:'&#128274;',price:0,  rent:0},
    {id:11,name:b.green[0],      type:'property',color:'green',   price:380,rent:38},
    {id:12,name:'Public Works 1',type:'public',  icon:'&#127963;',price:250,rent:30},
    {id:13,name:b.green[1],      type:'property',color:'green',   price:360,rent:36},
    {id:14,name:b.green[2],      type:'property',color:'green',   price:370,rent:37},
    {id:15,name:b.stations[1],   type:'station', icon:'&#128641;',price:300,rent:50},
    {id:16,name:b.pink[0],       type:'property',color:'pink',    price:350,rent:35},
    {id:17,name:'Chance',        type:'random',  icon:'&#10067;', price:0,  rent:0},
    {id:18,name:b.pink[1],       type:'property',color:'pink',    price:340,rent:34},
    {id:19,name:b.pink[2],       type:'property',color:'pink',    price:360,rent:36},
    {id:20,name:'FREE Parking',  type:'corner',  icon:'&#127359;',price:0,  rent:0},
    {id:21,name:b.yellow[0],     type:'property',color:'yellow',  price:320,rent:32},
    {id:22,name:b.yellow[1],     type:'property',color:'yellow',  price:330,rent:33},
    {id:23,name:'Community Chest',type:'random', icon:'&#127922;',price:0,  rent:0},
    {id:24,name:b.yellow[2],     type:'property',color:'yellow',  price:340,rent:34},
    {id:25,name:b.stations[2],   type:'station', icon:'&#128641;',price:300,rent:50},
    {id:26,name:b.orange[0],     type:'property',color:'orange',  price:280,rent:28},
    {id:27,name:b.orange[1],     type:'property',color:'orange',  price:290,rent:29},
    {id:28,name:'GO TO JAIL',    type:'corner',  icon:'&#128110;',price:0,  rent:0},
    {id:29,name:b.orange[2],     type:'property',color:'orange',  price:300,rent:30},
    {id:30,name:b.brown[0],      type:'property',color:'brown',   price:260,rent:26},
    {id:31,name:'Public Works 2',type:'public',  icon:'&#127959;',price:250,rent:30},
    {id:32,name:b.brown[1],      type:'property',color:'brown',   price:270,rent:27},
    {id:33,name:b.brown[2],      type:'property',color:'brown',   price:280,rent:28},
    {id:34,name:b.stations[3],   type:'station', icon:'&#9992;',  price:300,rent:50},
    {id:35,name:b.white[0],      type:'property',color:'white',   price:240,rent:24},
    {id:36,name:'Chance',        type:'random',  icon:'&#10067;', price:0,  rent:0},
    {id:37,name:b.purple[0],     type:'property',color:'purple',  price:350,rent:35},
    {id:38,name:'Public Works 3',type:'public',  icon:'&#127795;',price:200,rent:25},
    {id:39,name:'SALARY +200',   type:'salary',  icon:'&#128176;',price:0,  rent:0},
    {id:40,name:'Luxury Tax',    type:'tax',     icon:'&#128142;',price:0,  rent:150}
  ];
}

function cellPos(){
  var p={};var i;
  for(i=0;i<=9;i++){p[i]={col:String(i+1),row:'10'};}
  p[10]={col:'10',row:'10'};
  for(i=11;i<=19;i++){p[i]={col:'10',row:String(10-(i-10))};}
  for(i=20;i<=28;i++){p[i]={col:String(10-(i-19)),row:'1'};}
  for(i=29;i<=36;i++){p[i]={col:'1',row:String(i-27)};}
  p[37]={col:'6',row:'10'};p[38]={col:'7',row:'10'};
  p[39]={col:'8',row:'10'};p[40]={col:'9',row:'10'};
  return p;
}

function populateBoards(){
  var sel=G('inp-board');sel.innerHTML='';
  BOARDS.forEach(function(b){
    var o=document.createElement('option');
    o.value=b.id;o.textContent=b.name+' ('+b.capital+')';
    sel.appendChild(o);
  });
}

// ── ACCOUNT / SIGN-IN ─────────────────────────────────────────
// Optional: playing as a guest works fully. Signing in with Google
// just remembers your name/avatar and lets you restore a hosted
// game on this account without needing the room password.
function wireGoogleSignIn(){
  var btn=G('btn-google-signin'),out=G('btn-signout'),who=G('account-status');
  if(!btn)return; // page doesn't include the optional account UI
  btn.addEventListener('click',async function(){
    load(true);
    try{
      await signInWithGoogle();
      toast('Signed In','You are now signed in with Google.',null,3000);
    }catch(err){
      console.error('Google sign-in failed:',err);
      toast('Sign-in Error','Could not sign in with Google. Please try again.',null,4000);
    }finally{load(false);}
  });
  if(out)out.addEventListener('click',async function(){
    try{await signOutToGuest();}catch(e){}
  });
  document.addEventListener('auth-changed',function(){
    updateAccountUI();
  });
  updateAccountUI();
  function updateAccountUI(){
    if(!who)return;
    if(AUTH.user&&!AUTH.isAnonymous){
      who.textContent='Signed in as '+(AUTH.displayName||'Google user');
      btn.style.display='none';
      if(out)out.style.display='inline-block';
      var cn=G('inp-cname'),jn=G('inp-jname');
      if(cn&&!cn.value)cn.value=AUTH.displayName||'';
      if(jn&&!jn.value)jn.value=AUTH.displayName||'';
    }else{
      who.textContent='Playing as guest';
      btn.style.display='inline-block';
      if(out)out.style.display='none';
    }
  }
}

// ── HOME ──────────────────────────────────────────────────────
G('btn-create').addEventListener('click',function(){
  populateBoards();
  G('inp-cname').value='';G('inp-gpass').value='';
  openM('modal-create');focusEl('inp-cname');
});
G('btn-join').addEventListener('click',function(){
  showScreen('screen-lobby');loadLobby();
});
G('btn-restore').addEventListener('click',function(){
  G('inp-rpass').value='';G('restore-list').innerHTML='';
  openM('modal-restore');focusEl('inp-rpass');
});
G('btn-back-lobby').addEventListener('click',function(){showScreen('screen-home');});
G('btn-cancel-create').addEventListener('click',function(){closeM('modal-create');});
G('btn-cancel-join').addEventListener('click',function(){closeM('modal-join');});
G('btn-cancel-restore').addEventListener('click',function(){closeM('modal-restore');});

// ── CREATE GAME ───────────────────────────────────────────────
G('btn-do-create').addEventListener('click',async function(){
  var name=G('inp-cname').value.trim();
  var pass=G('inp-gpass').value.trim();
  var boardId=G('inp-board').value;
  if(!name){toast('Warning','Please enter your name.');focusEl('inp-cname');return;}
  if(!isValidRoomPass(pass)){toast('Warning','Please enter a 4-6 digit numeric password.');focusEl('inp-gpass');return;}
  load(true);
  var board=BOARDS.find(function(b){return b.id===boardId;})||BOARDS[0];
  await AUTH.ready;
  myId=AUTH.uid;myName=name;isHost=true;
  var gid=uid();myGid=gid;
  bd=board;cells=makeCells(board);
  var me={id:myId,name:name,color:PCOLORS[0],money:START_MONEY,position:0,properties:[],turns:0,bankrupt:false};
  var passHash=await sha256Hex(pass);
  myRoomPass=pass;
  var gdata={
    id:gid,boardId:boardId,boardName:board.name,
    hostId:myId,hostUid:AUTH.uid,hostPassHash:passHash,status:'waiting',
    createdAt:Date.now(),lastActivity:Date.now(),
    players:{},currentTurn:myId,turnIndex:0,playerOrder:[myId]
  };
  gdata.players[myId]=me;
  try{
    await fSet('games/'+gid,gdata);
    closeM('modal-create');load(false);SND.play('create');
    startInactiveTimer(gid);
    enterWaiting(gid,myId,gdata);
  }catch(err){
    load(false);console.error('Create error:',err);
    toast('Error','Could not create game. Check Firebase Console.');
  }
});

// ── INACTIVE TIMER ────────────────────────────────────────────
function startInactiveTimer(gid){
  if(inactiveTimer)clearTimeout(inactiveTimer);
  inactiveTimer=setTimeout(async function(){
    try{
      var s=await fGet('games/'+gid+'/lastActivity');
      var last=s.val()||0;
      if(Date.now()-last>=INACTIVE_TIMEOUT){
        await fDel('games/'+gid);
        toast('Game Ended','Game was inactive for 2 minutes and has been terminated.',null,6000);
        showScreen('screen-home');
      }
    }catch(e){}
  },INACTIVE_TIMEOUT);
}

function touchActivity(){
  if(myGid)fUpd('games/'+myGid,{lastActivity:Date.now()});
}

// ── RESTORE GAME ──────────────────────────────────────────────
G('btn-do-restore').addEventListener('click',async function(){
  var pass=G('inp-rpass').value.trim();
  if(!pass){toast('Warning','Please enter your password.');focusEl('inp-rpass');return;}
  load(true);
  try{
    await AUTH.ready;
    var snap=await fGet('games');
    var all=snap.val()||{};
    var passHash=await sha256Hex(pass);
    var found=[];
    Object.values(all).forEach(function(g){
      if(!g||g.status==='ended')return;
      // Prefer matching by signed-in identity (works with no password
      // typed at all, more secure); fall back to the room password
      // hash for cross-device restore.
      if((g.hostUid&&g.hostUid===AUTH.uid)||g.hostPassHash===passHash){found.push(g);}
    });
    load(false);
    if(!found.length){
      toast('Not Found','No active game found with this password.',null,4000);
      return;
    }
    var g=found[0];
    // Restore as host
    myGid=g.id;myId=g.hostId;isHost=true;
    if(g.hostPassHash===passHash)myRoomPass=pass;
    bd=BOARDS.find(function(b){return b.id===g.boardId;})||BOARDS[0];
    cells=makeCells(bd);
    var hostPlayer=g.players&&g.players[g.hostId];
    myName=hostPlayer?hostPlayer.name:'Host';
    closeM('modal-restore');
    toast('Restored!','Your game has been restored successfully!',null,3000);
    touchActivity();
    if(g.status==='waiting'){
      enterWaiting(g.id,myId,g);
    }else{
      enterGame(g.id,myId,g);
    }
  }catch(err){
    load(false);console.error('Restore error:',err);
    toast('Error','Could not restore game.');
  }
});

// ── LOBBY ─────────────────────────────────────────────────────
async function loadLobby(){
  var list=G('lobby-list');
  list.innerHTML='<div class="empty-lobby"><div style="font-size:2rem;margin-bottom:10px">&#8635;</div>Loading games...</div>';
  try{
    var snap=await fGet('games');
    var all=snap.val()||{};
    // Auto-cleanup inactive games older than 2min
    var now=Date.now();
    var open=Object.values(all).filter(function(g){
      if(!g||g.status==='ended')return false;
      var age=now-(g.lastActivity||g.createdAt||0);
      return age<INACTIVE_TIMEOUT;
    });
    if(!open.length){
      list.innerHTML='<div class="empty-lobby"><div style="font-size:2rem;margin-bottom:10px">&#127922;</div>No games available right now.<br><span style="font-size:.86rem;display:block;margin-top:6px">Please create one otherwise check back later!</span></div>';
      return;
    }
    list.innerHTML='';
    open.forEach(function(g){
      var pc=g.players?Object.keys(g.players).length:0;
      var hn=g.players&&g.hostId&&g.players[g.hostId]?g.players[g.hostId].name:'?';
      var card=document.createElement('div');
      card.className='g-card';card.setAttribute('role','listitem');card.setAttribute('tabindex','0');
      card.setAttribute('aria-label',g.boardName+' game by '+hn+', '+pc+' player(s)');
      card.innerHTML='<div class="gc-name">'+esc(g.boardName)+' Board</div>'
        +'<div class="gc-host">Host: <strong>'+esc(hn)+'</strong></div>'
        +'<div class="gc-players">&#128101; '+pc+' player'+(pc!==1?'s':'')+' waiting</div>'
        +'<div class="gc-board">&#128205; '+esc(g.boardName||'India')+'</div>';
      card.onclick=function(){openJoinModal(g);};
      card.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openJoinModal(g);}};
      list.appendChild(card);
    });
  }catch(err){
    list.innerHTML='<div class="empty-lobby">Could not load games. Check Firebase connection.</div>';
    console.error('Lobby error:',err);
  }
}

function openJoinModal(g){
  joiningG=g;
  G('join-info').textContent='Joining '+g.boardName+' game by '+((g.players&&g.hostId&&g.players[g.hostId])?g.players[g.hostId].name:'host');
  G('inp-jname').value='';G('inp-jpass').value='';
  openM('modal-join');focusEl('inp-jname');
}

// ── JOIN GAME ─────────────────────────────────────────────────
G('btn-do-join').addEventListener('click',async function(){
  var name=G('inp-jname').value.trim();
  var pass=G('inp-jpass').value.trim();
  if(!name){toast('Warning','Please enter your name.');focusEl('inp-jname');return;}
  if(!joiningG)return;

  await AUTH.ready;

  // If password entered, treat as host restore
  if(pass){
    var enteredHash=await sha256Hex(pass);
    if(enteredHash!==joiningG.hostPassHash){toast('Wrong Password','Incorrect host password.',null,4000);return;}
    load(true);
    myRoomPass=pass;
    myGid=joiningG.id;myId=joiningG.hostId;isHost=true;myName=name;
    bd=BOARDS.find(function(b){return b.id===joiningG.boardId;})||BOARDS[0];
    cells=makeCells(bd);
    closeM('modal-join');load(false);
    toast('Restored!','You have restored your host session!',null,3000);
    touchActivity();
    enterWaiting(joiningG.id,myId,joiningG);
    return;
  }

  // Normal join
  load(true);
  myId=AUTH.uid;myName=name;myGid=joiningG.id;isHost=false;
  bd=BOARDS.find(function(b){return b.id===joiningG.boardId;})||BOARDS[0];
  cells=makeCells(bd);
  var reqId=uid();
  try{
    await fSet('games/'+joiningG.id+'/joinRequests/'+reqId,{
      id:reqId,playerId:myId,playerName:name,timestamp:Date.now(),status:'pending'
    });
    SND.play('join_req');closeM('modal-join');load(false);
    var gname=joiningG.boardName;
    var waitN=toast('Request Sent','Waiting for host to admit you to '+esc(gname)+' game...',null,0);
    var done=false;
    var timer=setTimeout(async function(){
      if(!done){done=true;waitN.remove();toast('No Response','No one responded. Please try again later.',null,6000);try{await fDel('games/'+joiningG.id+'/joinRequests/'+reqId);}catch(e){}}
    },30000);
    var poll=setInterval(async function(){
      if(done){clearInterval(poll);return;}
      try{
        var s=await fGet('games/'+joiningG.id+'/joinRequests/'+reqId);
        var req=s.val();
        if(!req){clearInterval(poll);return;}
        if(req.status==='admitted'){
          done=true;clearInterval(poll);clearTimeout(timer);
          waitN.remove();SND.play('joined');
          toast('Welcome!','You have been admitted!',null,4000);
          var pi=req.playerIndex||1;
          var me={id:myId,name:name,color:PCOLORS[pi%PCOLORS.length],money:START_MONEY,position:0,properties:[],turns:0,bankrupt:false};
          await fSet('games/'+joiningG.id+'/players/'+myId,me);
          await fDel('games/'+joiningG.id+'/joinRequests/'+reqId);
          var gs2=await fGet('games/'+joiningG.id);
          enterWaiting(joiningG.id,myId,gs2.val());
        }else if(req.status==='denied'){
          done=true;clearInterval(poll);clearTimeout(timer);
          waitN.remove();toast('Request Denied','Your request has been rejected.',null,5000);
          try{await fDel('games/'+joiningG.id+'/joinRequests/'+reqId);}catch(e){}
        }
      }catch(e){}
    },1200);
  }catch(err){
    load(false);toast('Error','Could not send join request.');console.error('Join error:',err);
  }
});

// ── WAITING ROOM ──────────────────────────────────────────────
function enterWaiting(gid,pid,gdata){
  showScreen('screen-waiting');
  G('wr-board').textContent=gdata.boardName;
  G('wr-code').textContent=gid.substr(0,8).toUpperCase();
  // Only the host ever sees the room password - it is never stored
  // in the database and never sent to other players.
  G('wr-pass').style.display=isHost?'block':'none';
  G('wr-pass-val').textContent=(isHost&&myRoomPass)?myRoomPass:'-';
  var sb=G('btn-start-game');
  sb.style.display=isHost?'block':'none';
  sb.disabled=true;sb.textContent='Need 1 more player...';
  stopWaiting();
  fOn('games/'+gid,function(snap){
    var gd=snap.val();if(!gd)return;
    gs=gd;
    G('wr-board').textContent=gd.boardName;
    updateWaitingUI(gd,pid);
    if(isHost&&gd.joinRequests){
      Object.keys(gd.joinRequests).forEach(function(rid){
        var req=gd.joinRequests[rid];
        if(req&&req.status==='pending'&&!jTimers[rid])handleJoinReq(gid,rid,req);
      });
    }
    if(gd.status==='playing'&&gd.players&&gd.players[pid]){
      stopWaiting();
      bd=BOARDS.find(function(b){return b.id===gd.boardId;})||BOARDS[0];
      cells=makeCells(bd);
      enterGame(gid,pid,gd);
    }
    // Terminate if ended
    if(gd.status==='ended'){stopWaiting();showScreen('screen-home');toast('Game Ended','The game has ended.',null,4000);}
  });
  wrL.push(gid);
}

function stopWaiting(){wrL.forEach(function(g){fOff('games/'+g);});wrL=[];}

function updateWaitingUI(gd,pid){
  var list=G('wr-players');list.innerHTML='';
  if(!gd.players)return;
  var players=Object.values(gd.players).filter(Boolean);
  players.forEach(function(p){
    var chip=document.createElement('div');chip.className='p-chip';chip.setAttribute('role','listitem');
    chip.innerHTML='<div class="p-av" style="background:'+p.color+'" aria-hidden="true">'+esc(p.name[0].toUpperCase())+'</div>'
      +'<div class="p-chip-name">'+esc(p.name)+(p.id===pid?' (You)':'')+'</div>'
      +(p.id===gd.hostId?'<span class="host-badge">HOST</span>':'');
    list.appendChild(chip);
  });
  var cnt=players.length;
  G('wr-status').textContent=cnt<2?'Waiting for at least 1 more player...':cnt+' players ready!';
  if(isHost){var sb=G('btn-start-game');sb.disabled=cnt<2;sb.textContent=cnt<2?'Need '+(2-cnt)+' more':'Start Game ('+cnt+' players)';}
}

function handleJoinReq(gid,rid,req){
  SND.play('join_req');
  var pname=req.playerName;
  announce(pname+' wants to join your room!');
  var n=toast('Join Request','<strong>'+esc(pname)+'</strong> wants to join!',[
    {label:'Admit',cls:'btn-admit',fn:function(){admitP(gid,rid,req);}},
    {label:'Deny', cls:'btn-deny', fn:function(){denyP(gid,rid);}}
  ],0);
  jTimers[rid]=setTimeout(async function(){n.remove();delete jTimers[rid];await denyP(gid,rid);},30000);
}

async function admitP(gid,rid,req){
  clearTimeout(jTimers[rid]);delete jTimers[rid];
  var s=await fGet('games/'+gid+'/players');
  var pi=s.val()?Object.keys(s.val()).length:1;
  await fUpd('games/'+gid+'/joinRequests/'+rid,{status:'admitted',playerIndex:pi});
  touchActivity();
}

async function denyP(gid,rid){
  clearTimeout(jTimers[rid]);delete jTimers[rid];
  try{await fUpd('games/'+gid+'/joinRequests/'+rid,{status:'denied'});}catch(e){}
}

G('btn-start-game').addEventListener('click',async function(){
  if(!isHost||!myGid)return;
  var s=await fGet('games/'+myGid+'/players');
  var order=Object.keys(s.val()||{});
  await fUpd('games/'+myGid,{status:'playing',currentTurn:order[0],turnIndex:0,playerOrder:order,lastUpdated:Date.now(),lastActivity:Date.now()});
});

G('btn-leave-wr').addEventListener('click',async function(){
  stopWaiting();
  if(myGid&&myId){
    try{await fDel('games/'+myGid+'/players/'+myId);}catch(e){}
    if(isHost){try{await fDel('games/'+myGid);}catch(e){}}
  }
  myGid=null;myId=null;isHost=false;
  showScreen('screen-home');
});

// ── GAME ──────────────────────────────────────────────────────
function enterGame(gid,pid,gdata){
  showScreen('screen-game');
  G('side-gname').textContent=gdata.boardName+' Board';
  G('side-bname').textContent=(isHost&&myRoomPass)?('Host Password: '+myRoomPass):(bd?bd.capital+', India':'');
  renderBoard(gdata);updateGameUI(gdata,pid);renderChat(gdata);
  if(gL)fOff('games/'+gL);
  gL=gid;
  fOn('games/'+gid,function(snap){
    var gd=snap.val();if(!gd)return;
    var oldTurn=gs?gs.currentTurn:null;
    gs=gd;
    renderBoard(gd);updateGameUI(gd,pid);renderChat(gd);
    // Announce turn change
    if(oldTurn&&gd.currentTurn&&gd.currentTurn!==oldTurn){
      var cur=gd.players&&gd.players[gd.currentTurn];
      if(cur){
        if(gd.currentTurn===pid){
          announce('Your turn! Roll the dice.');
          focusEl('btn-roll');
        }else{
          announce('It is '+cur.name+' turn.');
        }
      }
    }
    // Check for player leaving
    if(gd.players){
      Object.values(gd.players).forEach(function(p){
        if(p&&p.bankrupt&&p.id!==pid){
          // already announced via sysMsg
        }
      });
    }
    if(gd.status==='ended'&&gd.winnerId){
      var w=gd.players&&gd.players[gd.winnerId];
      if(w)showWin(w,gd.winnerId===pid);
    }
    if(gd.status==='terminated'){
      toast('Game Terminated','The game has been terminated.',null,5000);
      if(gL){fOff('games/'+gL);gL=null;}
      showScreen('screen-home');
    }
  });
}

function renderBoard(gd){
  var board=G('game-board');board.innerHTML='';
  var center=document.createElement('div');center.className='b-center';
  center.style.cssText='grid-column:2/10;grid-row:2/10;';
  center.innerHTML='<div class="b-flag" aria-hidden="true">&#127470;&#127475;</div><div class="b-title">Indic Monopoly</div><div class="b-sub">India\'s Own Board Game</div>';
  board.appendChild(center);
  var pos=cellPos();
  var props=(gd&&gd.properties)?gd.properties:{};
  var plys=(gd&&gd.players)?Object.values(gd.players).filter(Boolean):[];
  cells.forEach(function(cell,idx){
    var p=pos[idx];if(!p)return;
    var el=document.createElement('div');
    el.className='cell'+(cell.type==='corner'?' corner-cell':'')+((cell.type==='property'||cell.type==='station'||cell.type==='public')?' can-click':'');
    el.style.cssText='grid-column:'+p.col+';grid-row:'+p.row+';';
    el.setAttribute('role','gridcell');el.setAttribute('tabindex','0');
    el.setAttribute('aria-label',cell.name+(cell.price?', RS'+cell.price:'')+(cell.rent&&cell.type!=='salary'?', Rent RS'+cell.rent:''));
    if(cell.type==='property'||cell.type==='station'){
      var bar=document.createElement('div');bar.className='c-bar';
      bar.style.background=COLORS[cell.color]||COLORS.station;
      bar.setAttribute('aria-hidden','true');el.appendChild(bar);
    }
    var prop=props[idx];
    if(prop){
      var ow=gd.players&&gd.players[prop.ownerId];
      if(ow){var dot=document.createElement('div');dot.className='o-dot';dot.style.background=ow.color;dot.title='Owned by '+ow.name;el.appendChild(dot);}
    }
    if(cell.icon){var ic=document.createElement('div');ic.className='c-icon';ic.setAttribute('aria-hidden','true');ic.innerHTML=cell.icon;el.appendChild(ic);}
    var nm=document.createElement('div');nm.className='c-name';nm.setAttribute('aria-hidden','true');nm.textContent=cell.name;el.appendChild(nm);
    if(cell.price>0){var pr=document.createElement('div');pr.className='c-price';pr.setAttribute('aria-hidden','true');pr.textContent='RS'+cell.price;el.appendChild(pr);}
    var here=plys.filter(function(p2){return p2.position===idx&&!p2.bankrupt;});
    if(here.length){
      var tc=document.createElement('div');tc.className='tok-wrap';tc.setAttribute('aria-hidden','true');
      here.forEach(function(p2){var tok=document.createElement('div');tok.className='tok';tok.style.background=p2.color;tok.textContent=p2.name[0].toUpperCase();tc.appendChild(tok);});
      el.appendChild(tc);
    }
    if(cell.type==='property'||cell.type==='station'||cell.type==='public'){
      el.onclick=function(){viewProp(idx,gd);};
      el.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();viewProp(idx,gd);}};
    }
    board.appendChild(el);
  });
}

function updateGameUI(gd,pid){
  if(!gd||!gd.players)return;
  var order=gd.playerOrder||Object.keys(gd.players);
  var plys=order.map(function(id){return gd.players[id];}).filter(Boolean);
  var strip=G('pstrip');strip.innerHTML='';
  plys.forEach(function(p){
    var row=document.createElement('div');
    row.className='p-row'+(p.id===gd.currentTurn?' my-turn':'');
    row.setAttribute('role','listitem');
    row.setAttribute('aria-label',p.name+': RS'+p.money+(p.bankrupt?' Bankrupt':'')+(p.id===gd.currentTurn?' current turn':''));
    row.innerHTML='<div class="p-av2" style="background:'+p.color+'" aria-hidden="true">'+esc(p.name[0].toUpperCase())+'</div>'
      +'<div class="p-name'+(p.bankrupt?' p-out':'')+'">'+esc(p.name)+(p.id===pid?' &#128100;':'')+'</div>'
      +'<div class="p-money'+(p.bankrupt?' p-out':'')+'">RS'+p.money+'</div>';
    strip.appendChild(row);
  });
  var cur=gd.currentTurn&&gd.players[gd.currentTurn];
  if(cur){
    var mine=gd.currentTurn===pid;
    myTurn=mine;
    G('turn-bar').innerHTML=mine?'<strong>&#127922; Your Turn! Roll the dice!</strong>':'&#127922; '+esc(cur.name)+' is playing...';
    var rb=G('btn-roll');rb.disabled=!mine;
    rb.style.opacity=mine?'1':'0.4';
    rb.style.display=mine?'block':'none';
    rb.textContent=mine?'&#127922; Roll Dice — Your Turn!':'&#127922; Roll Dice';
  }
}

// ── ROLL ──────────────────────────────────────────────────────
G('btn-roll').addEventListener('click',async function(){
  if(!myTurn||!myGid||!myId)return;
  var gd=gs;if(!gd||gd.currentTurn!==myId)return;
  var player=gd.players[myId];if(!player||player.bankrupt)return;
  G('btn-roll').disabled=true;myTurn=false;
  touchActivity();
  var d1=rnd(1,6),d2=rnd(1,6);
  SND.play('dice');
  G('die1').classList.add('spin');G('die2').classList.add('spin');
  setTimeout(function(){G('die1').classList.remove('spin');G('die2').classList.remove('spin');},600);
  var DICE=['','&#9856;','&#9857;','&#9858;','&#9859;','&#9860;','&#9861;'];
  G('die1').innerHTML=DICE[d1];G('die2').innerHTML=DICE[d2];
  G('dice-result').textContent='Rolled: '+d1+' + '+d2+' = '+(d1+d2);
  var old=player.position||0;
  var pos=(old+d1+d2)%41;
  var money=player.money;
  if(pos<old){money+=SALARY;SND.play('salary');sysMsg(esc(player.name)+' collected salary RS'+SALARY+'!');}
  if(pos===39){money+=SALARY;SND.play('salary');sysMsg(esc(player.name)+' landed on Salary! +RS'+SALARY);}
  if(pos===GO_JAIL){pos=JAIL;sysMsg(esc(player.name)+' went to Jail!');}
  var cell=cells[pos];
  G('dice-moved').textContent='-> '+cell.name;
  await fUpd('games/'+myGid+'/players/'+myId,{position:pos,money:money,turns:(player.turns||0)+1});
  var freshSnap=await fGet('games/'+myGid);
  var freshGd=freshSnap.val();if(freshGd)gs=freshGd;
  var freshMe=Object.assign({},freshGd?freshGd.players[myId]:player,{position:pos,money:money});
  await landOn(pos,cell,freshGd||gd,freshMe);
});

async function landOn(pos,cell,gd,player){
  if(cell.type==='salary'){await nextTurn(gd);}
  else if(cell.type==='tax'){
    SND.play('tax');var after=player.money-cell.rent;
    await fUpd('games/'+myGid+'/players/'+myId,{money:after});
    showInfo('Tax Collected!',cell.name+' - You paid RS'+cell.rent+' tax!','-RS'+cell.rent,'loss');
    await waitInfo();if(after<=0){await goBankrupt();}else{await nextTurn(gd);}
  }else if(cell.type==='random'){await doEvent(gd,player);}
  else if(cell.type==='station'){SND.play('airport');await doProp(pos,cell,gd,player);}
  else if(cell.type==='property'||cell.type==='public'){await doProp(pos,cell,gd,player);}
  else if(cell.type==='corner'){if(pos===JAIL)sysMsg(esc(player.name)+' is Just Visiting Jail!');await nextTurn(gd);}
  else{await nextTurn(gd);}
}

async function doProp(pos,cell,gd,player){
  var ps=await fGet('games/'+myGid+'/properties/'+pos);
  var prop=ps.val();
  if(!prop){
    // Announce property info
    sysMsg(esc(myName)+' landed on '+esc(cell.name)+' (RS'+cell.price+')');
    await new Promise(function(resolve){
      var col=COLORS[cell.color]||COLORS.station||COLORS.public_||'#555';
      G('prop-cbar').style.background=col;
      G('mp-h').textContent=cell.name;
      G('prop-tag').textContent=(cell.type==='station'?'Station':(cell.type==='public'?'Public Property':cell.color+' Property')).toUpperCase();
      G('prop-stats').innerHTML='<div class="p-stat"><span class="lbl">Price</span><span>RS'+cell.price+'</span></div>'
        +'<div class="p-stat"><span class="lbl">Base Rent</span><span>RS'+cell.rent+'</span></div>'
        +'<div class="p-stat"><span class="lbl">Your Cash</span><span>RS'+player.money+'</span></div>';
      G('prop-owner').innerHTML='<div class="p-owner-msg"><strong>'+esc(cell.name)+'</strong> - Current price RS'+cell.price+', Rent RS'+cell.rent+'. Do you want to buy?</div>';
      var acts=G('prop-acts');acts.innerHTML='';
      var canBuy=player.money>=cell.price;
      var skip=document.createElement('button');skip.className='btn-s';skip.textContent='Skip';
      skip.onclick=function(){closeM('modal-prop');resolve();};
      var buy=document.createElement('button');buy.className='btn-p';
      buy.textContent=canBuy?'Buy RS'+cell.price:"Can't Afford";buy.disabled=!canBuy;
      buy.onclick=async function(){
        closeM('modal-prop');SND.play('prop');
        await fUpd('games/'+myGid+'/players/'+myId,{money:player.money-cell.price});
        await fSet('games/'+myGid+'/properties/'+pos,{pos:pos,ownerId:myId,ownerName:myName,price:cell.price,currentRent:cell.rent,boughtAt:Date.now()});
        var op=(await fGet('games/'+myGid+'/players/'+myId+'/properties')).val()||[];
        await fSet('games/'+myGid+'/players/'+myId+'/properties',[].concat(op,[pos]));
        sysMsg('&#127968; '+esc(myName)+' bought '+esc(cell.name)+' for RS'+cell.price+'!');
        resolve();
      };
      acts.appendChild(skip);acts.appendChild(buy);
      openM('modal-prop');
      // Focus buy button if can afford
      if(canBuy)setTimeout(function(){buy.focus();},80);else setTimeout(function(){skip.focus();},80);
    });
    var fg=(await fGet('games/'+myGid)).val();if(fg)gs=fg;
    await nextTurn(gs||gd);
  }else if(prop.ownerId===myId){
    showInfo('Your Property!',cell.name+' is yours! Looking great!','','');
    await waitInfo();await nextTurn(gd);
  }else{
    var os=await fGet('games/'+myGid+'/players/'+prop.ownerId);
    var owner=os.val();if(!owner||owner.bankrupt){await nextTurn(gd);return;}
    var rent=prop.currentRent||cell.rent;
    if(cell.type==='property'){
      var cc=cells.filter(function(c){return c.type==='property'&&c.color===cell.color;});
      var ps2=(await fGet('games/'+myGid+'/properties')).val()||{};
      var allOwned=cc.every(function(c){return ps2[c.id]&&ps2[c.id].ownerId===prop.ownerId;});
      if(allOwned)rent=Math.floor(rent*1.2);
    }
    if(cell.type==='station'){SND.play('railway');}else{SND.play('pay_r');}
    sysMsg('&#128176; '+esc(myName)+' landed on '+esc(owner.name)+'\'s '+esc(cell.name)+'. Rent: RS'+rent);
    if(player.money<rent){await cantPay(player,rent,prop.ownerId,owner,gd);}
    else{
      await fUpd('games/'+myGid+'/players/'+myId,{money:player.money-rent});
      await fUpd('games/'+myGid+'/players/'+prop.ownerId,{money:owner.money+rent});
      await fUpd('games/'+myGid+'/properties/'+pos,{currentRent:Math.floor(rent*1.05)});
      showInfo('Wow Beautiful Property!','Wow this property is very beautiful! This property is owned by <strong>'+esc(owner.name)+'</strong>. You pay RS'+rent+' to this user.','-RS'+rent,'loss');
      await waitInfo();await nextTurn(gd);
    }
  }
}

async function doEvent(gd,player){
  var ev=bd.events[Math.floor(Math.random()*bd.events.length)];
  var amount=ev.amount;
  if(ev.bday){
    var as=await fGet('games/'+myGid+'/players');var all=as.val()||{};var total=0;
    var pids=Object.keys(all);
    for(var i=0;i<pids.length;i++){
      var pid=pids[i];var p=all[pid];
      if(pid!==myId&&!p.bankrupt&&p.money>=10){total+=10;await fUpd('games/'+myGid+'/players/'+pid,{money:p.money-10});}
    }
    amount=total;
    await fUpd('games/'+myGid+'/players/'+myId,{money:player.money+total});
  }else{
    await fUpd('games/'+myGid+'/players/'+myId,{money:player.money+amount});
  }
  if(ev.gain||amount>0)SND.play('bonus');
  var da=amount>=0?'+RS'+amount:'-RS'+Math.abs(amount);
  sysMsg('&#127922; '+esc(myName)+': '+esc(ev.text)+' ('+da+')');
  showInfo(ev.icon+' Random Event!',ev.text,da,amount>=0?'gain':'loss');
  await waitInfo();
  if(player.money+amount<=0){await goBankrupt();}else{await nextTurn(gd);}
}

async function cantPay(player,rentDue,ownerId,owner,gd){
  var mps=(await fGet('games/'+myGid+'/players/'+myId+'/properties')).val()||[];
  var allPs=(await fGet('games/'+myGid+'/properties')).val()||{};
  if(!mps.length){
    SND.play('losing');
    sysMsg('&#128128; '+esc(myName)+' is bankrupt and has no properties to sell!');
    showInfo('Bankrupt!','You don\'t have enough Money to pay rent RS'+rentDue+' and have no properties to sell. You are eliminated!','','loss');
    await waitInfo();await goBankrupt();return;
  }
  return new Promise(function(resolve){
    G('sell-reason').textContent='You don\'t have enough Money to pay rent RS'+rentDue+'. You have RS'+player.money+'. Please sell any property!';
    var sl=G('sell-list');sl.innerHTML='';selSell=null;G('btn-sell-ok').disabled=true;
    mps.forEach(function(pp){
      var cd=cells[pp];if(!cd)return;
      var pd=allPs[pp];var sp=Math.floor(((pd&&pd.price)||cd.price)*0.6);
      var col=COLORS[cd.color]||COLORS.station||'#888';
      var item=document.createElement('div');
      item.className='sell-item';item.setAttribute('role','listitem');item.setAttribute('tabindex','0');
      item.setAttribute('aria-label',cd.name+', Sell for RS'+sp);
      item.innerHTML='<div class="si-dot" style="background:'+col+'" aria-hidden="true"></div>'
        +'<div style="flex:1"><div class="si-name">'+esc(cd.name)+'</div><div class="si-rent">Rent: RS'+((pd&&pd.currentRent)||cd.rent)+'</div></div>'
        +'<div class="si-val">Sell: RS'+sp+'</div>';
      item.onclick=function(){document.querySelectorAll('.sell-item').forEach(function(i){i.classList.remove('sel');});item.classList.add('sel');selSell=pp;G('btn-sell-ok').disabled=false;};
      item.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();item.click();}};
      sl.appendChild(item);
    });
    openM('modal-sell');focusEl('sell-list');
    G('btn-sell-ok').onclick=async function(){
      if(selSell===null)return;
      var pp=selSell,cd=cells[pp],pd=allPs[pp];
      var sp=Math.floor(((pd&&pd.price)||cd.price)*0.6);
      SND.play('pay_r');closeM('modal-sell');
      await fDel('games/'+myGid+'/properties/'+pp);
      var np=mps.filter(function(x){return x!==pp;});
      await fSet('games/'+myGid+'/players/'+myId+'/properties',np);
      var nm=player.money+sp;
      await fUpd('games/'+myGid+'/players/'+myId,{money:nm});
      sysMsg('&#128246; '+esc(myName)+' sold '+esc(cd.name)+' for RS'+sp);
      if(nm>=rentDue){
        await fUpd('games/'+myGid+'/players/'+myId,{money:nm-rentDue});
        await fUpd('games/'+myGid+'/players/'+ownerId,{money:owner.money+rentDue});
        var fg=(await fGet('games/'+myGid)).val();if(fg)gs=fg;await nextTurn(gs||gd);
      }else{
        var fg2=(await fGet('games/'+myGid)).val();if(fg2)gs=fg2;
        await cantPay(Object.assign({},player,{money:nm,properties:np}),rentDue,ownerId,owner,fg2||gd);
      }
      resolve();
    };
    G('btn-sell-cancel').onclick=async function(){closeM('modal-sell');SND.play('losing');await goBankrupt();resolve();};
  });
}

async function goBankrupt(){
  SND.play('losing');
  await fUpd('games/'+myGid+'/players/'+myId,{bankrupt:true,money:0});
  sysMsg('&#128128; '+esc(myName)+' is bankrupt and eliminated from the game!');
  // Check if only 1 player left
  var fresh=(await fGet('games/'+myGid+'/players')).val()||{};
  var alive=Object.values(fresh).filter(function(p){return !p.bankrupt;});
  if(alive.length===1){
    await fUpd('games/'+myGid,{status:'ended',winnerId:alive[0].id});
  } else {
    // If this player was current turn, move to next
    if(gs&&gs.currentTurn===myId){await nextTurn(gs);}
  }
}

async function nextTurn(gd){
  if(!gd||!gd.playerOrder)return;
  var alive=gd.playerOrder.filter(function(id){return gd.players&&gd.players[id]&&!gd.players[id].bankrupt;});
  if(!alive.length)return;
  var cur=alive.indexOf(gd.currentTurn);
  var next=alive[(cur+1)%alive.length];
  touchActivity();
  await fUpd('games/'+myGid,{currentTurn:next,turnIndex:(cur+1)%alive.length,lastUpdated:Date.now(),lastActivity:Date.now()});
}

// ── INFO MODAL ─────────────────────────────────────────────────
function showInfo(title,desc,amount,type){
  var parts=title.split(' ');
  G('ev-icon').innerHTML=parts[0];
  G('mi-h').textContent=parts.slice(1).join(' ');
  G('ev-desc').innerHTML=desc;G('ev-amt').textContent=amount;
  G('ev-amt').className='ev-amt '+(type||'');
  openM('modal-info');focusEl('btn-info-ok');
  announce(title+'. '+desc+'. '+amount);
}
function waitInfo(){
  return new Promise(function(resolve){
    var btn=G('btn-info-ok');
    var h=function(){btn.removeEventListener('click',h);closeM('modal-info');resolve();};
    btn.addEventListener('click',h);
  });
}

function viewProp(pos,gd){
  var cell=cells[pos];if(!cell)return;
  var prop=gd&&gd.properties&&gd.properties[pos];
  var col=COLORS[cell.color]||COLORS.station||'#555';
  G('prop-cbar').style.background=col;G('mp-h').textContent=cell.name;
  G('prop-tag').textContent=(cell.type==='station'?'Station':(cell.type==='public'?'Public Property':cell.color+' Property')).toUpperCase();
  G('prop-stats').innerHTML='<div class="p-stat"><span class="lbl">Price</span><span>RS'+cell.price+'</span></div>'
    +'<div class="p-stat"><span class="lbl">Rent</span><span>RS'+(prop?prop.currentRent:cell.rent)+'</span></div>';
  if(prop){
    var ow=gd.players&&gd.players[prop.ownerId];
    G('prop-owner').innerHTML='<div class="p-owner-msg">Owned by <span class="oname">'+esc(ow?ow.name:prop.ownerName)+'</span>. Current rent: RS'+(prop.currentRent||cell.rent)+'</div>';
  }else{
    G('prop-owner').innerHTML='<div class="p-owner-msg">This property is available to buy!</div>';
  }
  var acts=G('prop-acts');acts.innerHTML='';
  var cb=document.createElement('button');cb.className='btn-p';cb.textContent='Close';
  cb.onclick=function(){closeM('modal-prop');};acts.appendChild(cb);
  openM('modal-prop');focusEl('prop-acts');
}

// ── ACTION BUTTONS ─────────────────────────────────────────────
// btn-cash removed
G('btn-myprops').addEventListener('click',function(){
  if(!gs||!myId)return;var p=gs.players&&gs.players[myId];
  showVProps('My Properties',p?p.properties||[]:[]);
});
// btn-allprops removed
G('btn-others').addEventListener('click',function(){
  if(!gs||!myId)return;
  var others=Object.keys(gs.properties||{}).map(Number).filter(function(pp){var pr=gs.properties[pp];return pr&&pr.ownerId!==myId;});
  if(!others.length){showInfo('Others','Other players own no properties yet.','','');return;}
  showVProps('Others Properties',others);
});

function showVProps(title,positions){
  G('mvp-h').textContent=title;var c=G('vprops-content');c.innerHTML='';
  if(!positions||!positions.length){
    c.style.display='block';c.innerHTML='<p style="color:rgba(255,255,255,.38)">No properties to display.</p>';
  }else{
    c.style.display='grid';var props=(gs&&gs.properties)?gs.properties:{};
    positions.forEach(function(pp){
      var cd=cells[pp];if(!cd)return;
      var pd=props[pp];var col=COLORS[cd.color]||COLORS.station||'#888';
      var ow=pd&&gs.players&&gs.players[pd.ownerId];
      var item=document.createElement('div');item.className='vp-item';item.style.borderLeftColor=col;
      item.innerHTML='<div class="vp-name">'+esc(cd.name)+'</div>'
        +'<div class="vp-price">RS'+cd.price+(pd?' - '+esc(ow?ow.name:pd.ownerName):'  - Available')+'</div>'
        +'<div class="vp-rent">Rent: RS'+(pd?pd.currentRent:cd.rent)+'</div>';
      c.appendChild(item);
    });
  }
  openM('modal-vprops');
}
G('btn-close-vprops').addEventListener('click',function(){closeM('modal-vprops');});
G('btn-leave-game').addEventListener('click',async function(){
  if(!confirm('Are you sure you want to leave the game?'))return;
  // Terminate game entirely when anyone leaves
  if(myGid){
    try{
      await fUpd('games/'+myGid,{status:'terminated',lastActivity:Date.now()});
    }catch(e){}
  }
  if(gL){fOff('games/'+gL);gL=null;}
  myGid=null;myId=null;isHost=false;gs=null;
  showScreen('screen-home');
});

// ── CHAT ──────────────────────────────────────────────────────
function sysMsg(msg){
  if(!myGid)return;
  fSet('games/'+myGid+'/chat/s'+uid(),{sender:'',text:msg,sys:true,ts:Date.now()});
}
G('btn-chat-send').addEventListener('click',sendChat);
G('chat-inp').addEventListener('keydown',function(e){if(e.key==='Enter')sendChat();});
function sendChat(){
  var inp=G('chat-inp'),txt=inp.value.trim();
  if(!txt||!myGid)return;
  inp.value='';SND.play('message');
  fSet('games/'+myGid+'/chat/m'+uid(),{sender:myName,text:txt,sys:false,ts:Date.now(),pid:myId});
}
var lastChatCount=0;
function renderChat(gd){
  if(!gd||!gd.chat)return;
  var box=G('chat-box');
  var msgs=Object.values(gd.chat).sort(function(a,b){return a.ts-b.ts;});
  var atBot=box.scrollHeight-box.scrollTop<=box.clientHeight+60;
  // Play sound for new incoming messages (not own)
  if(msgs.length>lastChatCount&&lastChatCount>0){
    var newMsgs=msgs.slice(lastChatCount);
    newMsgs.forEach(function(m){
      if(!m.sys&&m.pid&&m.pid!==myId){SND.play('message');}
    });
  }
  lastChatCount=msgs.length;
  box.innerHTML='';
  msgs.forEach(function(m){
    var d=document.createElement('div');
    d.className='chat-msg'+(m.sys?' sys-msg':'');
    if(m.sys){d.innerHTML=m.text;}
    else{
      var p=gs&&gs.players&&gs.players[m.pid];
      var col=p?p.color:'#888';
      // Format: "Kritika said hi"
      d.innerHTML='<div class="chat-sender" style="color:'+col+'">'+esc(m.sender)+' said</div>'+esc(m.text);
    }
    box.appendChild(d);
  });
  if(atBot)box.scrollTop=box.scrollHeight;
}

// ── WIN ────────────────────────────────────────────────────────
function showWin(winner,isMe){
  document.querySelectorAll('.modal-bg.open').forEach(function(m){m.classList.remove('open');});
  G('mw-h').textContent=isMe?'You Won!':winner.name+' Won!';
  G('win-desc').textContent=isMe?'Congratulations! You are the Indic Monopoly Champion!':'Congratulations to '+winner.name+'!';
  openM('modal-win');
  announce(isMe?'Congratulations! You won the game!':winner.name+' has won the game!');
  if(isMe){SND.play('win');doConfetti();}
  // Clean up game after 10 seconds
  setTimeout(async function(){try{await fDel('games/'+myGid);}catch(e){}},10000);
}
G('btn-win-home').addEventListener('click',function(){
  closeM('modal-win');G('confetti-wrap').innerHTML='';
  if(gL){fOff('games/'+gL);gL=null;}
  myGid=null;myId=null;isHost=false;gs=null;
  showScreen('screen-home');
});
function doConfetti(){
  var w=G('confetti-wrap');w.innerHTML='';
  var cols=['#FF6B00','#C9971A','#2E7D32','#1565C0','#AD1457','#F9A825'];
  for(var i=0;i<80;i++){
    var p=document.createElement('div');p.className='cfp';
    p.style.cssText='left:'+Math.random()*100+'%;background:'+cols[rnd(0,cols.length-1)]
      +';width:'+rnd(6,14)+'px;height:'+rnd(6,14)+'px;border-radius:'+(Math.random()>.5?'50%':'2px')
      +';animation-duration:'+rnd(2,5)+'s;animation-delay:'+Math.random()*2+'s;top:-10px;';
    w.appendChild(p);
  }
  setTimeout(function(){w.innerHTML='';},7000);
}

// ── ESC ────────────────────────────────────────────────────────
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    var m=document.querySelector('.modal-bg.open');
    if(m&&m.id!=='modal-prop'&&m.id!=='modal-info'&&m.id!=='modal-sell')m.classList.remove('open');
  }
});

// ── BOOT ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded',async function(){
  console.log('Indic Monopoly v2.1 starting...');
  try{
    initFirebase();
    initAuth();
    console.log('Firebase connected OK!');
  }catch(err){
    console.error('Firebase init failed:',err);
    toast('Firebase Error','Could not connect to Firebase. Make sure Realtime Database and Anonymous Authentication are enabled in the Firebase Console.',null,0);
    showScreen('screen-home');
    return;
  }
  showScreen('screen-home');
  try{
    await AUTH.ready;
    console.log('Secure session ready.');
  }catch(e){
    console.error('Auth failed:',e);
  }
  wireGoogleSignIn();
  console.log('Game ready!');
});

