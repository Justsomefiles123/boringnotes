(() => {
  const $ = (sel) => document.querySelector(sel);

  const screens = { start: $('#screen-start'), gate: $('#screen-gate'), home: $('#screen-home') };

  const btnStart = $('#btnStart');
  const btnHow = $('#btnHow');
  const btnSound = $('#btnSound');
  const btnAgain = $('#btnAgain');
  const btnWhatsApp = $('#btnWhatsApp');

  const promptText = $('#promptText');
  const promptMeta = $('#promptMeta');
  const modal = $('#modal');
  const heart = $('#heart');

  const passcode = $('#passcode');
  const btnUnlock = $('#btnUnlock');
  const gateMsg = $('#gateMsg');

  // Passphrase gate (private-ish). Not stored, not sent anywhere.
  const PASSCODE = 'spoon'; // case-insensitive


  let soundOn = true;
  let lastMode = null;
  let lastPrompt = null;

  // Simple UI sounds using WebAudio (no external files)
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function beep(freq=440, duration=0.07){
    if(!soundOn) return;
    try{
      if(!audioCtx) audioCtx = new AudioCtx();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.value = 0.035;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      setTimeout(() => { o.stop(); }, duration*1000);
    }catch(e){ /* ignore */ }
  }

  function showScreen(which){
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[which].classList.add('active');
  }

  function pickRandom(arr){
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function setPrompt(mode){
    const bank = window.SQ_PROMPTS?.[mode];
    if(!bank) return;

    let candidate = pickRandom(bank);
    if(bank.length > 1 && lastPrompt && candidate.text === lastPrompt.text){
      candidate = pickRandom(bank);
    }

    lastMode = mode;
    lastPrompt = candidate;

    promptText.textContent = '> ' + candidate.text.replace(/\n/g, '\n> ');
    promptMeta.textContent = `> MODE: ${mode.toUpperCase()} • Nothing is saved.`;

    btnAgain.disabled = false;
    btnWhatsApp.disabled = false;

    beep(520, 0.06);
  }

  async function copyToClipboard(text){
    try{
      await navigator.clipboard.writeText(text);
      promptMeta.textContent = `> Copied to clipboard ✅ Paste into WhatsApp.`;
    }catch(e){
      promptMeta.textContent = `> Copy failed. Long-press to copy manually.`;
    }
  }

  function openWhatsApp(){
    if(!lastPrompt) return;
    const text = lastPrompt.whatsappText || lastPrompt.text;
    copyToClipboard(text);

    // Privacy-first: we don't embed a number. User pastes into their chat.
    window.open('https://wa.me/', '_blank', 'noopener,noreferrer');
    beep(740, 0.06);
  }

  btnStart.addEventListener('click', () => { beep(660, 0.06); showScreen('gate'); setTimeout(()=>passcode?.focus(), 60); });

  function tryUnlock(){
    const val = (passcode?.value || '').trim().toLowerCase();
    if(val === PASSCODE){
      gateMsg.textContent = '> Access granted ✅';
      beep(700, 0.06);
      showScreen('home');
      passcode.value = '';
    }else{
      gateMsg.textContent = '> Nope. Try again.';
      beep(220, 0.08);
    }
  }

  btnUnlock?.addEventListener('click', () => tryUnlock());
  passcode?.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      e.preventDefault();
      tryUnlock();
    }
  });


  btnHow.addEventListener('click', () => {
    beep(440, 0.05);
    if(typeof modal.showModal === 'function') modal.showModal();
    else alert('Pick a mode → get a prompt → send via WhatsApp. No uploads. No storage.');
  });

  btnSound.addEventListener('click', () => {
    soundOn = !soundOn;
    btnSound.textContent = soundOn ? 'SOUND: ON' : 'SOUND: OFF';
    btnSound.setAttribute('aria-pressed', String(soundOn));
    beep(300, 0.05);
  });

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if(card){
      const mode = card.getAttribute('data-mode');
      setPrompt(mode);
      return;
    }
  });

  btnAgain.addEventListener('click', () => { if(lastMode) setPrompt(lastMode); });
  btnWhatsApp.addEventListener('click', () => openWhatsApp());

  // Easter eggs
  let heartTaps = 0;
  let lastTapAt = 0;

  heart.addEventListener('click', () => {
    const now = Date.now();
    if(now - lastTapAt > 1200) heartTaps = 0;
    lastTapAt = now;
    heartTaps += 1;

    beep(880, 0.04);

    if(heartTaps === 5){
      setPrompt('slytherin');
      heartTaps = 0;
    }
  });

  // Top-left corner taps unlock Ravenclaw
  let cornerTaps = 0;
  document.addEventListener('click', (e) => {
    if(e.clientX <= 40 && e.clientY <= 40){
      cornerTaps += 1;
      beep(920, 0.04);
      if(cornerTaps >= 4){
        setPrompt('ravenclaw');
        cornerTaps = 0;
      }
    }
  });

})();