/* Hanya aktif di dalam APK (Capacitor). Di browser biasa file ini tidak berbuat apa-apa. */
(function(){
  var C=window.Capacitor;
  if(!C||!C.isNativePlatform||!C.isNativePlatform())return;

  // 1) MediaPipe + model pose dimuat offline dari ./vendor (diisi saat build oleh scripts/prepare-vendor.mjs)
  window.PC_VENDOR={dir:'./vendor'};

  // 1b) WebView Android sering tidak punya speechSynthesis -> sediakan polyfill memakai plugin TTS native
  var TTS=C.registerPlugin?C.registerPlugin('TextToSpeech'):(C.Plugins&&C.Plugins.TextToSpeech);
  if(TTS&&!window.speechSynthesis){
    var cur=null;
    window.SpeechSynthesisUtterance=function(t){this.text=t==null?'':String(t);this.lang='id-ID';this.rate=1;this.pitch=1;this.volume=1;this.voice=null;};
    window.speechSynthesis={
      speaking:false,pending:false,paused:false,onvoiceschanged:null,
      getVoices:function(){return [];},
      resume:function(){},pause:function(){},
      cancel:function(){cur=null;this.speaking=false;try{TTS.stop().catch(function(){});}catch(e){}},
      speak:function(u){
        var self=this,me=u;cur=me;
        var txt=(u.text||'').trim();
        if(!txt||u.volume===0){setTimeout(function(){if(me.onend)me.onend({});},0);return;}
        self.speaking=true;
        if(me.onstart)setTimeout(function(){if(cur===me&&me.onstart)me.onstart({});},0);
        TTS.speak({text:txt,lang:u.lang||'id-ID',rate:u.rate||1,pitch:u.pitch||1,volume:u.volume==null?1:u.volume,category:'ambient',queueStrategy:0})
          .then(function(){if(cur!==me)return;cur=null;self.speaking=false;if(me.onend)me.onend({});})
          .catch(function(e){if(cur!==me)return;cur=null;self.speaking=false;if(me.onerror)me.onerror({error:String(e&&e.message||e||'tts-error')});});
      }
    };
  }

  // 2) WebView Android tidak punya SpeechRecognition -> pakai plugin native, dibungkus agar API-nya sama
  var SR=C.registerPlugin?C.registerPlugin('SpeechRecognition'):(C.Plugins&&C.Plugins.SpeechRecognition);
  if(!SR||window.SpeechRecognition||window.webkitSpeechRecognition)return;
  var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms)})};

  function NativeSR(){this.lang='id-ID';this.continuous=true;this.interimResults=true;this.maxAlternatives=1;this._on=false;}
  NativeSR.prototype._emit=function(m,fin){
    var r=m.map(function(t){return{transcript:t,confidence:1}});r.isFinal=fin;
    if(this.onresult)this.onresult({resultIndex:0,results:[r]});};
  NativeSR.prototype._finish=function(){if(!this._on)return;this._on=false;if(this.onend)this.onend();};
  NativeSR.prototype.start=function(){
    var s=this;if(s._on)throw new Error('InvalidStateError');s._on=true;
    (async function(){
      try{
        await sleep(250);   // jeda kecil agar mesin suara Android tidak "busy" saat dimulai ulang
        var pr=await SR.checkPermissions();
        if(pr.speechRecognition!=='granted')pr=await SR.requestPermissions();
        if(pr.speechRecognition!=='granted'){if(s.onerror)s.onerror({error:'not-allowed'});s._finish();return;}
        await SR.removeAllListeners();
        await SR.addListener('partialResults',function(d){if(s._on&&d&&d.matches&&d.matches.length)s._emit(d.matches,false);});
        await SR.addListener('listeningState',function(d){if(d&&d.status==='stopped')s._finish();});
        if(s.onstart)s.onstart();
        var res=await SR.start({language:s.lang,maxResults:3,partialResults:true,popup:false});
        if(res&&res.matches&&res.matches.length)s._emit(res.matches,true);
      }catch(e){
        if(s.onerror)s.onerror({error:/permission/i.test(String(e&&e.message))?'not-allowed':'aborted'});
        s._finish();}
    })();
  };
  NativeSR.prototype.stop=NativeSR.prototype.abort=function(){
    var s=this;if(!s._on)return;try{SR.stop().catch(function(){});}catch(e){}
    setTimeout(function(){s._finish();},400);};
  window.SpeechRecognition=window.webkitSpeechRecognition=NativeSR;
})();
