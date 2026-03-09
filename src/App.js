import React, { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";

// ==================== FIREBASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyAdTnxzwnS8j9MIg3QqVLUv-mL8j78qPro",
  authDomain: "porto-humano.firebaseapp.com",
  projectId: "porto-humano",
  storageBucket: "porto-humano.firebasestorage.app",
  messagingSenderId: "32993616001",
  appId: "1:32993616001:web:98e6190ec49931baaa6d80",
  measurementId: "G-MXTNCJ7Q0Z"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== CONSTANTES ====================
const GESTOR_SECRET_CODE = "GESTOR2024";
const AREAS = ['Operações','Logística','Segurança','Administrativo','Manutenção','Recursos Humanos','Tecnologia','Qualidade','Planejamento','Engenharia'];
const EQUIPES = ['A','B','C','D','E','F','G'];

// ==================== HOOKS ====================
const useWindowSize = () => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handle = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return size;
};

// ==================== UTILS ====================
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// ==================== TEMA ====================
const T = {
  bg: '#060D18', surf: '#0C1827', surf2: '#111F33', border: '#1A2E48',
  gold: '#C9A84C', goldL: '#E8C97A', blue: '#1D5FD4', blueL: '#5B9CF8',
  teal: '#0E9E91', tealL: '#2ACEC0', green: '#16A34A', greenL: '#4ADE80',
  orange: '#EA580C', orangeL: '#FB923C', red: '#DC2626', redL: '#F87171',
  purple: '#7C3AED', purpleL: '#A78BFA', text: '#F1F5F9', textS: '#8AA0B8', textM: '#4A6278',
};

// ==================== GLOBAL STYLES ====================
const injectGlobalStyles = () => {
  if (document.getElementById('ph-styles')) return;
  const style = document.createElement('style');
  style.id = 'ph-styles';
  style.innerHTML = `
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html { font-size: 16px; -webkit-text-size-adjust: 100%; }
    body { background: ${T.bg}; color: ${T.text}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow-x: hidden; min-height: 100dvh; }
    input, select, textarea, button { font-family: inherit; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: ${T.surf2}; }
    ::-webkit-scrollbar-thumb { background: ${T.gold}; border-radius: 4px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
    .fade-up { animation: fadeUp 0.35s ease both; }
    .fade-in { animation: fadeIn 0.3s ease both; }
    .ph-spinner { animation: spin 0.9s linear infinite; }
    /* Layout */
    .ph-layout { display: flex; min-height: 100dvh; }
    .ph-main { flex: 1; min-width: 0; overflow-y: auto; overflow-x: hidden; }
    /* Sidebar desktop */
    .ph-sidebar { width: 240px; min-width: 240px; background: ${T.surf}; border-right: 1px solid ${T.border}; display: flex; flex-direction: column; height: 100dvh; position: sticky; top: 0; flex-shrink: 0; }
    /* Mobile nav */
    .ph-mobile-header { display: none; position: fixed; top: 0; left: 0; right: 0; background: ${T.surf}; border-bottom: 1px solid ${T.border}; padding: 0 16px; height: 56px; align-items: center; justify-content: space-between; z-index: 200; }
    .ph-mobile-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: ${T.surf}; border-top: 1px solid ${T.border}; z-index: 200; padding: 6px 0 max(6px, env(safe-area-inset-bottom)); }
    .ph-mobile-nav-inner { display: flex; overflow-x: auto; scrollbar-width: none; gap: 0; }
    .ph-mobile-nav-inner::-webkit-scrollbar { display: none; }
    .ph-mobile-nav-btn { flex: 1; min-width: 56px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 4px 6px; border: none; background: none; cursor: pointer; color: ${T.textM}; transition: color 0.2s; }
    .ph-mobile-nav-btn.active { color: ${T.gold}; }
    .ph-mobile-nav-btn.active-manager { color: ${T.purpleL}; }
    .ph-mobile-nav-icon { font-size: 18px; line-height: 1; }
    .ph-mobile-nav-label { font-size: 9px; font-weight: 600; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60px; }
    @media (max-width: 768px) {
      .ph-sidebar { display: none !important; }
      .ph-mobile-header { display: flex !important; }
      .ph-mobile-nav { display: block !important; }
      .ph-main { padding-top: 56px; padding-bottom: calc(64px + env(safe-area-inset-bottom)); }
      .ph-topbar { display: none !important; }
    }
    @media (min-width: 769px) {
      .ph-mobile-header, .ph-mobile-nav { display: none !important; }
    }
    /* Grid helpers */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
    .grid-5 { display: grid; grid-template-columns: repeat(5,1fr); gap: 16px; }
    @media (max-width: 768px) {
      .grid-2 { grid-template-columns: 1fr; gap: 12px; }
      .grid-3 { grid-template-columns: 1fr 1fr; gap: 10px; }
      .grid-5 { grid-template-columns: 1fr 1fr; gap: 10px; }
    }
    @media (max-width: 480px) {
      .grid-3 { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
};

const showMessage = (message, type = 'success') => {
  const container = document.getElementById('ph-msg') || (() => {
    const d = document.createElement('div');
    d.id = 'ph-msg';
    d.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:360px;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(d);
    return d;
  })();
  const msg = document.createElement('div');
  msg.style.cssText = `background:${type==='success'?T.green:type==='error'?T.red:T.blue};color:#fff;padding:12px 18px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:fadeUp 0.3s ease;font-family:Inter,sans-serif;font-size:14px;font-weight:500;pointer-events:auto;`;
  msg.textContent = message;
  container.appendChild(msg);
  setTimeout(() => { msg.style.opacity='0'; msg.style.transition='opacity 0.3s'; setTimeout(()=>msg.remove(),300); }, 3500);
};

// ==================== UI COMPONENTS ====================
const Button = ({ children, onClick, variant='primary', size='md', disabled, icon, fullWidth, style={} }) => {
  const variants = {
    primary: { background:`linear-gradient(135deg,${T.gold},${T.goldL})`, color:'#080E18', border:'none' },
    secondary: { background:T.surf2, color:T.text, border:`1px solid ${T.border}` },
    ghost: { background:'transparent', color:T.gold, border:'none' },
    danger: { background:T.red, color:'#fff', border:'none' },
    success: { background:T.green, color:'#fff', border:'none' },
  };
  const sizes = {
    sm: { padding:'7px 14px', fontSize:'12px' },
    md: { padding:'11px 22px', fontSize:'14px' },
    lg: { padding:'14px 30px', fontSize:'16px' },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'7px',
        borderRadius:'10px', fontFamily:'Inter,sans-serif', fontWeight:600,
        cursor:disabled?'not-allowed':'pointer', transition:'all 0.2s', outline:'none',
        opacity:disabled?0.5:1, width:fullWidth?'100%':'auto',
        whiteSpace:'nowrap',
        ...variants[variant], ...sizes[size], ...style
      }}
    >
      {icon&&<span>{icon}</span>}
      {children}
    </button>
  );
};

const Card = ({ children, padding='24px', style={} }) => (
  <div style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:'16px', padding, ...style }}>
    {children}
  </div>
);

const Badge = ({ children, color=T.gold, style={} }) => (
  <span style={{
    background:`${color}22`, color, border:`1px solid ${color}44`,
    borderRadius:'6px', padding:'3px 10px', fontSize:'11px', fontWeight:700,
    fontFamily:'Inter,sans-serif', display:'inline-block', whiteSpace:'nowrap', ...style
  }}>
    {children}
  </span>
);

const Progress = ({ value, max=100, color=T.gold, height=8, label, showPercentage=true }) => {
  const pct = Math.min(100,(value/max)*100);
  return (
    <div style={{width:'100%'}}>
      {label&&(
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'5px',fontSize:'12px',color:T.textS,gap:'8px'}}>
          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{label}</span>
          {showPercentage&&<span style={{color,fontWeight:700,flexShrink:0}}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div style={{background:T.surf2,borderRadius:height,height:`${height}px`,overflow:'hidden'}}>
        <div style={{width:`${pct}%`,height:'100%',background:`linear-gradient(90deg,${color},${color}BB)`,borderRadius:height,transition:'width 0.4s ease'}}/>
      </div>
    </div>
  );
};

const Avatar = ({ name, size=40, color=T.gold }) => {
  const initials = name.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0,2);
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:`linear-gradient(135deg,${color}44,${color}22)`,
      border:`2px solid ${color}`, display:'flex', alignItems:'center',
      justifyContent:'center', fontSize:size*0.3, fontWeight:700,
      fontFamily:'Inter,sans-serif', color, flexShrink:0
    }}>
      {initials}
    </div>
  );
};

const Input = ({ label, value, onChange, type='text', placeholder, required, error, style={} }) => (
  <div style={{marginBottom:'14px',...style}}>
    {label&&<label style={{display:'block',marginBottom:'5px',fontSize:'12px',color:T.textS,fontWeight:500}}>
      {label} {required&&<span style={{color:T.red}}>*</span>}
    </label>}
    <input
      type={type} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} required={required}
      style={{
        width:'100%', background:T.surf2, border:`1px solid ${error?T.red:T.border}`,
        borderRadius:'10px', padding:'11px 14px', color:T.text,
        fontSize:'14px', outline:'none', transition:'border-color 0.2s',
        WebkitAppearance:'none',
      }}
    />
    {error&&<p style={{color:T.redL,fontSize:'11px',marginTop:'4px'}}>{error}</p>}
  </div>
);

const Select = ({ label, value, onChange, options, placeholder, required, error, style={} }) => (
  <div style={{marginBottom:'14px',...style}}>
    {label&&<label style={{display:'block',marginBottom:'5px',fontSize:'12px',color:T.textS,fontWeight:500}}>
      {label} {required&&<span style={{color:T.red}}>*</span>}
    </label>}
    <select
      value={value} onChange={e=>onChange(e.target.value)}
      style={{
        width:'100%', background:T.surf2, border:`1px solid ${error?T.red:T.border}`,
        borderRadius:'10px', padding:'11px 14px', color:value?T.text:T.textM,
        fontSize:'14px', outline:'none', cursor:'pointer', WebkitAppearance:'none',
      }}
    >
      <option value="" disabled hidden>{placeholder||'Selecione...'}</option>
      {options.map(opt=><option key={opt} value={opt}>{opt}</option>)}
    </select>
    {error&&<p style={{color:T.redL,fontSize:'11px',marginTop:'4px'}}>{error}</p>}
  </div>
);

const Textarea = ({ label, value, onChange, rows=4, placeholder, required }) => (
  <div style={{marginBottom:'14px'}}>
    {label&&<label style={{display:'block',marginBottom:'5px',fontSize:'12px',color:T.textS,fontWeight:500}}>
      {label} {required&&<span style={{color:T.red}}>*</span>}
    </label>}
    <textarea
      value={value} onChange={e=>onChange(e.target.value)}
      rows={rows} placeholder={placeholder}
      style={{
        width:'100%', background:T.surf2, border:`1px solid ${T.border}`,
        borderRadius:'10px', padding:'11px 14px', color:T.text,
        fontSize:'14px', outline:'none', resize:'vertical', fontFamily:'Inter,sans-serif',
      }}
    />
  </div>
);

const Spinner = () => (
  <div style={{width:'22px',height:'22px',borderRadius:'50%',border:`3px solid ${T.border}`,borderTopColor:T.gold,animation:'spin 0.9s linear infinite'}}/>
);

const LikertScale = ({ question, value, onChange, index }) => {
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  return (
    <div style={{background:T.surf2,borderRadius:'12px',padding:isMobile?'14px':'18px',marginBottom:'12px',border:`1px solid ${T.border}`}}>
      <p style={{fontSize:isMobile?'13px':'14px',marginBottom:'14px',color:T.text,fontWeight:500,lineHeight:1.6}}>
        <span style={{color:T.gold,fontWeight:700,marginRight:'6px'}}>{index}.</span>
        {question}
      </p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:isMobile?'4px':'8px',marginBottom:'6px'}}>
        {[1,2,3,4,5].map(v=>(
          <button key={v} onClick={()=>onChange(v)} style={{
            padding:isMobile?'9px 2px':'10px 4px', borderRadius:'8px',
            border:`1.5px solid ${value===v?T.gold:T.border}`,
            background:value===v?`${T.gold}22`:'transparent',
            color:value===v?T.gold:T.textS, cursor:'pointer',
            fontSize:isMobile?'14px':'15px', fontWeight:value===v?700:400, transition:'all 0.15s',
          }}>
            {v}
          </button>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',color:T.textM}}>
        <span>Discordo</span>
        <span>Concordo</span>
      </div>
    </div>
  );
};

// ==================== FIREBASE HELPERS ====================
const saveTestResult = async (userId, testKey, data) => {
  try { await setDoc(doc(db,'users',userId,'results',testKey),{...data,updatedAt:new Date().toISOString()}); return true; }
  catch(e) { console.error(e); return false; }
};
const loadUserResults = async (userId) => {
  try {
    const snap = await getDocs(collection(db,'users',userId,'results'));
    const r={}; snap.forEach(d=>{r[d.id]=d.data();}); return r;
  } catch(e) { return {}; }
};
const savePDI = async (userId, data) => {
  try { await setDoc(doc(db,'users',userId,'pdi','current'),{...data,updatedAt:new Date().toISOString()}); return true; }
  catch(e) { return false; }
};
const loadPDI = async (userId) => {
  try { const s=await getDoc(doc(db,'users',userId,'pdi','current')); return s.exists()?s.data():null; }
  catch(e) { return null; }
};
const saveNotification = async (userId, notif) => {
  try { await setDoc(doc(collection(db,'users',userId,'notifications'),notif.id),notif); return true; }
  catch(e) { return false; }
};
const loadNotifications = async (userId) => {
  try {
    const snap=await getDocs(collection(db,'users',userId,'notifications'));
    const n=[]; snap.forEach(d=>n.push(d.data()));
    return n.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  } catch(e) { return []; }
};
const markNotificationAsRead = async (userId, id) => {
  try { await updateDoc(doc(db,'users',userId,'notifications',id),{read:true,readAt:new Date().toISOString()}); return true; }
  catch(e) { return false; }
};
const deleteNotification = async (userId, id) => {
  try { await deleteDoc(doc(db,'users',userId,'notifications',id)); return true; }
  catch(e) { return false; }
};
const loadAllUsers = async () => {
  try { const snap=await getDocs(collection(db,'users')); const u=[]; snap.forEach(d=>u.push({id:d.id,...d.data()})); return u; }
  catch(e) { return []; }
};
const deleteUserResults = async (userId) => {
  try {
    const snap=await getDocs(collection(db,'users',userId,'results'));
    await Promise.all(snap.docs.map(d=>deleteDoc(d.ref))); return true;
  } catch(e) { return false; }
};
const deleteUser = async (userId) => {
  try {
    await deleteUserResults(userId);
    await deleteDoc(doc(db,'users',userId,'pdi','current'));
    const nsnap=await getDocs(collection(db,'users',userId,'notifications'));
    await Promise.all(nsnap.docs.map(d=>deleteDoc(d.ref)));
    await deleteDoc(doc(db,'users',userId)); return true;
  } catch(e) { return false; }
};

// ==================== SCORING ====================
const scoreDisc = (answers) => {
  const c={D:0,I:0,S:0,C:0};
  Object.values(answers).forEach(v=>{if(c[v]!==undefined)c[v]++;});
  const t=Object.values(c).reduce((a,b)=>a+b,0)||1;
  return {D:Math.round(c.D/t*100),I:Math.round(c.I/t*100),S:Math.round(c.S/t*100),C:Math.round(c.C/t*100)};
};
const scoreBigFive = (answers) => {
  const d={O:[],C:[],E:[],A:[],N:[]};
  BF_Q.forEach(q=>{const r=answers[q.id];if(r===undefined)return;d[q.dim].push(q.r?6-r:r);});
  const res={};
  Object.keys(d).forEach(k=>{res[k]=d[k].length?Math.round(d[k].reduce((a,b)=>a+b,0)/d[k].length/5*100):0;});
  return res;
};
const scoreValues = (answers) => {
  const s={};
  VAL_Q.forEach(q=>{s[q.v]=answers[q.id]||0;});
  return Object.entries(s).sort((a,b)=>b[1]-a[1]).map(([v,s])=>({v,s}));
};
const scoreEQ = (answers) => {
  const d={};
  EQ_Q.forEach(q=>{if(!d[q.dim])d[q.dim]=[];d[q.dim].push(answers[q.id]||0);});
  const r={};
  Object.keys(d).forEach(k=>{r[k]=Math.round(d[k].reduce((a,b)=>a+b,0)/d[k].length/5*100);});
  r.total=Math.round(Object.values(r).reduce((a,b)=>a+b,0)/Object.keys(r).length);
  return r;
};
const scoreInterests = (answers) => {
  const a={};
  INT_Q.forEach(q=>{if(!a[q.area])a[q.area]=[];a[q.area].push(answers[q.id]||0);});
  const r={};
  Object.keys(a).forEach(k=>{r[k]=Math.round(a[k].reduce((a,b)=>a+b,0)/a[k].length/5*100);});
  return Object.entries(r).sort((a,b)=>b[1]-a[1]).map(([area,score])=>({area,score}));
};

// ==================== QUESTIONÁRIOS ====================

// DISC: cada pergunta tem exatamente uma opção por tipo (D, I, S, C).
// O usuário escolhe a que mais se identifica, gerando um perfil real.
const DISC_Q = [
  {id:1, text:"Qual adjetivo melhor descreve você no trabalho?", opts:[
    {t:"Determinado e orientado a resultados", d:"D"},
    {t:"Entusiasta e comunicativo", d:"I"},
    {t:"Paciente e colaborativo", d:"S"},
    {t:"Preciso e analítico", d:"C"}
  ]},
  {id:2, text:"Em situações de alta pressão, você:", opts:[
    {t:"Age rapidamente e assume o controle", d:"D"},
    {t:"Mantém o otimismo e energiza a equipe", d:"I"},
    {t:"Mantém a calma e apoia os colegas", d:"S"},
    {t:"Analisa os fatos com cuidado antes de agir", d:"C"}
  ]},
  {id:3, text:"Seu maior ponto forte no trabalho é:", opts:[
    {t:"Foco em resultados e cumprimento de metas", d:"D"},
    {t:"Facilidade de comunicação e persuasão", d:"I"},
    {t:"Consistência, lealdade e confiabilidade", d:"S"},
    {t:"Atenção aos detalhes e busca por qualidade", d:"C"}
  ]},
  {id:4, text:"Como você prefere tomar decisões importantes?", opts:[
    {t:"Rápido e com confiança nas próprias convicções", d:"D"},
    {t:"Baseando-me na intuição e no impacto nas pessoas", d:"I"},
    {t:"Com calma, ouvindo todos os envolvidos", d:"S"},
    {t:"Com dados, análise e planejamento cuidadoso", d:"C"}
  ]},
  {id:5, text:"O que mais te motiva no ambiente de trabalho?", opts:[
    {t:"Superar desafios e conquistar metas ambiciosas", d:"D"},
    {t:"Reconhecimento, interação e trabalho em equipe", d:"I"},
    {t:"Estabilidade, harmonia e bons relacionamentos", d:"S"},
    {t:"Qualidade, excelência e fazer as coisas certas", d:"C"}
  ]},
  {id:6, text:"Diante de um conflito, você tende a:", opts:[
    {t:"Enfrentar diretamente e resolver de imediato", d:"D"},
    {t:"Conversar abertamente e tentar convencer", d:"I"},
    {t:"Evitar e buscar conciliação e harmonia", d:"S"},
    {t:"Analisar quem está certo baseando-se em fatos", d:"C"}
  ]},
  {id:7, text:"Como os seus colegas costumam te descrever?", opts:[
    {t:"Direto, focado e determinado", d:"D"},
    {t:"Animado, sociável e inspirador", d:"I"},
    {t:"Calmo, prestativo e confiável", d:"S"},
    {t:"Organizado, meticuloso e cuidadoso", d:"C"}
  ]},
  {id:8, text:"Ao iniciar um novo projeto, sua abordagem é:", opts:[
    {t:"Assumir o comando e agir rapidamente", d:"D"},
    {t:"Apresentar ideias e engajar as pessoas", d:"I"},
    {t:"Garantir que todos estejam alinhados antes", d:"S"},
    {t:"Elaborar um planejamento detalhado", d:"C"}
  ]},
  {id:9, text:"O que mais te incomoda no trabalho?", opts:[
    {t:"Lentidão, burocracia e falta de resultados", d:"D"},
    {t:"Rotina sem interação social e sem novidades", d:"I"},
    {t:"Mudanças constantes e ambiente imprevisível", d:"S"},
    {t:"Erros, imprecisões e falta de padrões claros", d:"C"}
  ]},
  {id:10, text:"Ao liderar uma equipe, você prioriza:", opts:[
    {t:"Resultados concretos e metas claras", d:"D"},
    {t:"Engajamento, motivação e moral do grupo", d:"I"},
    {t:"Harmonia, bem-estar e coesão da equipe", d:"S"},
    {t:"Processos corretos, qualidade e rigor", d:"C"}
  ]},
  {id:11, text:"Em reuniões, você costuma:", opts:[
    {t:"Defender sua posição com firmeza e objetividade", d:"D"},
    {t:"Falar bastante, animar o grupo e propor ideias", d:"I"},
    {t:"Ouvir com atenção e apoiar o consenso", d:"S"},
    {t:"Apresentar dados, análises e questionar detalhes", d:"C"}
  ]},
  {id:12, text:"Qual é sua maior necessidade no trabalho?", opts:[
    {t:"Autonomia e liberdade para agir", d:"D"},
    {t:"Reconhecimento, aprovação e interação", d:"I"},
    {t:"Segurança, estabilidade e previsibilidade", d:"S"},
    {t:"Clareza, processos bem definidos e padrões", d:"C"}
  ]},
  {id:13, text:"Seu estilo de comunicação é:", opts:[
    {t:"Direto, objetivo e assertivo", d:"D"},
    {t:"Expressivo, entusiástico e envolvente", d:"I"},
    {t:"Gentil, atencioso e paciente", d:"S"},
    {t:"Formal, preciso e bem fundamentado", d:"C"}
  ]},
  {id:14, text:"Como você reage a mudanças no trabalho?", opts:[
    {t:"Abraça se trouxer resultados melhores mais rápido", d:"D"},
    {t:"Se anima com as novas possibilidades", d:"I"},
    {t:"Prefere mudanças graduais e bem planejadas", d:"S"},
    {t:"Avalia riscos e impactos antes de aceitar", d:"C"}
  ]},
  {id:15, text:"Ao receber uma nova tarefa desafiadora, você:", opts:[
    {t:"Define o objetivo e começa a agir imediatamente", d:"D"},
    {t:"Compartilha com alguém e discute ideias", d:"I"},
    {t:"Verifica como encaixa na rotina e planeja com calma", d:"S"},
    {t:"Levanta todos os requisitos e detalhes antes de começar", d:"C"}
  ]},
  {id:16, text:"O que você mais valoriza em uma equipe?", opts:[
    {t:"Eficiência, agilidade e foco em resultados", d:"D"},
    {t:"Criatividade, bom humor e relacionamento", d:"I"},
    {t:"Cooperação, lealdade e espírito de equipe", d:"S"},
    {t:"Competência técnica e compromisso com qualidade", d:"C"}
  ]},
  {id:17, text:"Você se sente mais realizado quando:", opts:[
    {t:"Alcança uma meta desafiadora ou supera um obstáculo", d:"D"},
    {t:"Recebe elogios e reconhecimento pelo seu trabalho", d:"I"},
    {t:"Sente que foi útil e contribuiu para a equipe", d:"S"},
    {t:"Entrega um trabalho impecável e sem erros", d:"C"}
  ]},
  {id:18, text:"Na hora de resolver um problema complexo, você:", opts:[
    {t:"Age logo com base na experiência e ajusta no caminho", d:"D"},
    {t:"Busca opiniões diversas e faz brainstorm", d:"I"},
    {t:"Segue os procedimentos já estabelecidos", d:"S"},
    {t:"Pesquisa, analisa profundamente e busca a melhor solução", d:"C"}
  ]},
  {id:19, text:"Como você lida com prazos apertados?", opts:[
    {t:"Foca totalmente e entrega, sem desculpas", d:"D"},
    {t:"Se energiza com a pressão mas pode se dispersar", d:"I"},
    {t:"Planeja com antecedência para não se estressar", d:"S"},
    {t:"Organiza todas as etapas com muito cuidado", d:"C"}
  ]},
  {id:20, text:"Qual é o seu maior desafio pessoal no trabalho?", opts:[
    {t:"Ouvir mais e desacelerar antes de agir", d:"D"},
    {t:"Manter o foco e ser mais organizado", d:"I"},
    {t:"Lidar melhor com mudanças e imprevistos", d:"S"},
    {t:"Ser mais flexível e menos perfeccionista", d:"C"}
  ]},
  {id:21, text:"Em trabalhos em grupo, você costuma:", opts:[
    {t:"Assumir a liderança naturalmente", d:"D"},
    {t:"Motivar o grupo e manter o ânimo", d:"I"},
    {t:"Apoiar os colegas e garantir coesão", d:"S"},
    {t:"Revisar o trabalho e garantir que esteja correto", d:"C"}
  ]},
  {id:22, text:"Seu ambiente de trabalho ideal é:", opts:[
    {t:"Desafiador, dinâmico e com liberdade de ação", d:"D"},
    {t:"Animado, com muita interação e colaboração social", d:"I"},
    {t:"Estável, harmonioso e com boas relações", d:"S"},
    {t:"Organizado, silencioso e com processos claros", d:"C"}
  ]},
  {id:23, text:"Como as pessoas te percebem na organização?", opts:[
    {t:"Um executor que entrega resultados consistentes", d:"D"},
    {t:"Uma pessoa carismática, influente e inspiradora", d:"I"},
    {t:"Um apoio confiável e estável para a equipe", d:"S"},
    {t:"Um especialista criterioso, rigoroso e confiável", d:"C"}
  ]},
  {id:24, text:"Em momentos de crise organizacional, você:", opts:[
    {t:"Assume o comando e lidera a solução", d:"D"},
    {t:"Mantém o moral e inspira o grupo a seguir em frente", d:"I"},
    {t:"Oferece suporte emocional e estabilidade à equipe", d:"S"},
    {t:"Diagnostica a causa raiz e propõe uma solução estruturada", d:"C"}
  ]},
];

const BF_Q = [
  {id:1,t:"Gosto de explorar novas ideias e conceitos.",dim:"O",r:false},
  {id:2,t:"Tenho muita curiosidade sobre o mundo ao meu redor.",dim:"O",r:false},
  {id:3,t:"Aprecio arte, música ou expressões culturais diversas.",dim:"O",r:false},
  {id:4,t:"Prefiro trabalhar com rotinas conhecidas ao invés de novidades.",dim:"O",r:true},
  {id:5,t:"Gosto de pensar em questões filosóficas ou abstratas.",dim:"O",r:false},
  {id:6,t:"Tenho pouco interesse em assuntos científicos ou técnicos novos.",dim:"O",r:true},
  {id:7,t:"Gosto de aprender sobre culturas e contextos diferentes.",dim:"O",r:false},
  {id:8,t:"Prefiro o convencional ao inovador na maioria das situações.",dim:"O",r:true},
  {id:9,t:"Busco constantemente novas experiências e aventuras.",dim:"O",r:false},
  {id:10,t:"Sou uma pessoa criativa e com imaginação fértil.",dim:"O",r:false},
  {id:11,t:"Sou muito organizado(a) e metódico(a) no trabalho.",dim:"C",r:false},
  {id:12,t:"Cumpro prazos e compromissos com facilidade e pontualidade.",dim:"C",r:false},
  {id:13,t:"Planejo minhas tarefas antes de executá-las cuidadosamente.",dim:"C",r:false},
  {id:14,t:"Costumo deixar coisas importantes para depois (procrastino).",dim:"C",r:true},
  {id:15,t:"Presto muita atenção aos detalhes no meu trabalho.",dim:"C",r:false},
  {id:16,t:"Me desorganizo facilmente sob pressão e prazos apertados.",dim:"C",r:true},
  {id:17,t:"Tenho autodisciplina para concluir tarefas difíceis.",dim:"C",r:false},
  {id:18,t:"Sou persistente mesmo diante de obstáculos e dificuldades.",dim:"C",r:false},
  {id:19,t:"Gosto de ter tudo em ordem e no seu devido lugar.",dim:"C",r:false},
  {id:20,t:"Busco sempre a excelência e a qualidade no que faço.",dim:"C",r:false},
  {id:21,t:"Sinto energia ao estar com outras pessoas.",dim:"E",r:false},
  {id:22,t:"Prefiro ficar sozinho(a) a maior parte do tempo.",dim:"E",r:true},
  {id:23,t:"Me sinto bem sendo o centro das atenções em eventos sociais.",dim:"E",r:false},
  {id:24,t:"Me sinto à vontade em situações sociais e com desconhecidos.",dim:"E",r:false},
  {id:25,t:"Tenho muita energia e entusiasmo natural no dia a dia.",dim:"E",r:false},
  {id:26,t:"Costumo ser tímido(a) com pessoas que não conheço.",dim:"E",r:true},
  {id:27,t:"Gosto de conversar e conhecer pessoas novas.",dim:"E",r:false},
  {id:28,t:"Me sinto esgotado(a) após longos períodos de interação social.",dim:"E",r:true},
  {id:29,t:"Sou uma pessoa falante e comunicativa.",dim:"E",r:false},
  {id:30,t:"Prefiro atividades em grupo a atividades solitárias.",dim:"E",r:false},
  {id:31,t:"Me preocupo genuinamente com o bem-estar dos outros.",dim:"A",r:false},
  {id:32,t:"Evito conflitos e busco harmonia nas relações.",dim:"A",r:false},
  {id:33,t:"Confio facilmente nas pessoas e em suas intenções.",dim:"A",r:false},
  {id:34,t:"Às vezes sou frio(a) ou indiferente com os outros.",dim:"A",r:true},
  {id:35,t:"Gosto de ajudar os outros mesmo sem receber nada em troca.",dim:"A",r:false},
  {id:36,t:"Tenho tendência a ser crítico(a) e julgar as pessoas.",dim:"A",r:true},
  {id:37,t:"Sou empático(a) com as dificuldades das pessoas.",dim:"A",r:false},
  {id:38,t:"Costumo priorizar minhas necessidades acima das dos outros.",dim:"A",r:true},
  {id:39,t:"Sou cooperativo e trabalho bem em equipe.",dim:"A",r:false},
  {id:40,t:"Acredito que as pessoas têm boas intenções.",dim:"A",r:false},
  {id:41,t:"Me preocupo excessivamente com as coisas.",dim:"N",r:false},
  {id:42,t:"Me sinto emocionalmente estável na maioria das situações.",dim:"N",r:true},
  {id:43,t:"Fico facilmente ansioso(a) ou nervoso(a) com situações novas.",dim:"N",r:false},
  {id:44,t:"Me recupero rapidamente de situações estressantes.",dim:"N",r:true},
  {id:45,t:"Frequentemente me sinto desanimado(a) sem razão aparente.",dim:"N",r:false},
  {id:46,t:"Tenho dificuldade em controlar minhas emoções sob pressão.",dim:"N",r:false},
  {id:47,t:"Tenho confiança em mim mesmo(a) na maioria das situações.",dim:"N",r:true},
  {id:48,t:"Me estresso facilmente quando muitas coisas acontecem ao mesmo tempo.",dim:"N",r:false},
  {id:49,t:"Sou uma pessoa calma e tranquila na maior parte do tempo.",dim:"N",r:true},
  {id:50,t:"Costumo levar as críticas para o lado pessoal.",dim:"N",r:false},
];

const VAL_Q = [
  {id:1,t:"É importante ter segurança e estabilidade no trabalho.",v:"Segurança"},
  {id:2,t:"O reconhecimento pelo meu trabalho é fundamental para mim.",v:"Reconhecimento"},
  {id:3,t:"Busco constantemente crescimento e desenvolvimento pessoal.",v:"Crescimento"},
  {id:4,t:"A qualidade do que faço é inegociável para mim.",v:"Qualidade"},
  {id:5,t:"Trabalhar em equipe é essencial para minha satisfação.",v:"Colaboração"},
  {id:6,t:"Tenho forte senso de responsabilidade com a comunidade.",v:"Impacto Social"},
  {id:7,t:"Busco desafios e inovações constantes no trabalho.",v:"Inovação"},
  {id:8,t:"A autonomia para tomar decisões é muito importante.",v:"Autonomia"},
  {id:9,t:"Priorizo o equilíbrio entre trabalho e vida pessoal.",v:"Equilíbrio"},
  {id:10,t:"Valorizo muito a lealdade e o compromisso com a organização.",v:"Lealdade"},
  {id:11,t:"Ética e integridade são valores inegociáveis.",v:"Integridade"},
  {id:12,t:"Gosto de influenciar e inspirar outras pessoas.",v:"Liderança"},
  {id:13,t:"Busco eficiência e produtividade em tudo que faço.",v:"Eficiência"},
  {id:14,t:"Diversidade e inclusão são valores que defendo ativamente.",v:"Diversidade"},
  {id:15,t:"Aprendo continuamente e sempre busco novos conhecimentos.",v:"Aprendizado"},
  {id:16,t:"Minha família e vida pessoal têm prioridade absoluta.",v:"Família"},
  {id:17,t:"Busco justiça e equidade no ambiente de trabalho.",v:"Justiça"},
  {id:18,t:"Valorizo a liberdade de expressão e pensamento.",v:"Liberdade"},
  {id:19,t:"Tenho orgulho de pertencer a esta organização.",v:"Pertencimento"},
  {id:20,t:"Busco harmonia e paz no ambiente de trabalho.",v:"Harmonia"},
];

const EQ_Q = [
  {id:1,t:"Reconheço facilmente quando estou com raiva ou frustrado(a).",dim:"Autoconsciência"},
  {id:2,t:"Entendo como minhas emoções afetam meu comportamento e decisões.",dim:"Autoconsciência"},
  {id:3,t:"Consigo nomear com precisão o que estou sentindo no momento.",dim:"Autoconsciência"},
  {id:4,t:"Percebo quando estou sob pressão antes que seja tarde demais.",dim:"Autoconsciência"},
  {id:5,t:"Sei identificar meus pontos fortes e áreas de melhoria.",dim:"Autoconsciência"},
  {id:6,t:"Consigo controlar minhas reações em situações de conflito.",dim:"Autorregulação"},
  {id:7,t:"Mantenho a calma mesmo sob alta pressão e estresse.",dim:"Autorregulação"},
  {id:8,t:"Adapto meu comportamento conforme o contexto e as pessoas.",dim:"Autorregulação"},
  {id:9,t:"Penso antes de agir em situações emocionalmente intensas.",dim:"Autorregulação"},
  {id:10,t:"Sei lidar com críticas sem me sentir pessoalmente atacado.",dim:"Autorregulação"},
  {id:11,t:"Me mantenho motivado(a) mesmo diante de dificuldades.",dim:"Motivação"},
  {id:12,t:"Busco alcançar metas além do que é esperado de mim.",dim:"Motivação"},
  {id:13,t:"Tenho energia e entusiasmo mesmo em tarefas rotineiras.",dim:"Motivação"},
  {id:14,t:"Me recupero rapidamente após fracassos ou decepções.",dim:"Motivação"},
  {id:15,t:"Estabeleço metas desafiadoras e me esforço para alcançá-las.",dim:"Motivação"},
  {id:16,t:"Percebo quando um colega está triste ou sobrecarregado.",dim:"Empatia"},
  {id:17,t:"Me preocupo genuinamente com os sentimentos das pessoas.",dim:"Empatia"},
  {id:18,t:"Consigo me colocar no lugar de outras pessoas facilmente.",dim:"Empatia"},
  {id:19,t:"Adapto minha comunicação ao estado emocional do outro.",dim:"Empatia"},
  {id:20,t:"Ofereço apoio quando alguém está passando por dificuldades.",dim:"Empatia"},
  {id:21,t:"Consigo influenciar positivamente o humor do meu time.",dim:"Habilidades Sociais"},
  {id:22,t:"Resolvo conflitos de forma eficaz e respeitosa.",dim:"Habilidades Sociais"},
  {id:23,t:"Construo relacionamentos de confiança com facilidade.",dim:"Habilidades Sociais"},
  {id:24,t:"Colaboro efetivamente em equipes diversas e multidisciplinares.",dim:"Habilidades Sociais"},
  {id:25,t:"Sei ouvir ativamente e demonstrar interesse pelo que dizem.",dim:"Habilidades Sociais"},
];

const INT_Q = [
  {id:1,t:"Gosto de trabalhar com equipamentos e maquinários pesados.",area:"Operações Portuárias"},
  {id:2,t:"Me interessa coordenar o fluxo de carga e descarga de navios.",area:"Operações Portuárias"},
  {id:3,t:"Gosto de trabalhar em ambientes externos e dinâmicos.",area:"Operações Portuárias"},
  {id:4,t:"Tenho interesse em operar guindastes e equipamentos de grande porte.",area:"Operações Portuárias"},
  {id:5,t:"Me atrai a ideia de trabalhar no cais, próximo aos navios.",area:"Operações Portuárias"},
  {id:6,t:"Gosto de acompanhar a movimentação de cargas em tempo real.",area:"Operações Portuárias"},
  {id:7,t:"Tenho curiosidade sobre como funciona a logística portuária.",area:"Operações Portuárias"},
  {id:8,t:"Gosto de organizar e planejar fluxos de trabalho e rotas.",area:"Logística"},
  {id:9,t:"Me interessa trabalhar com rastreamento e gestão de cargas.",area:"Logística"},
  {id:10,t:"Tenho interesse em otimizar processos e reduzir desperdícios.",area:"Logística"},
  {id:11,t:"Gosto de analisar dados e métricas de desempenho logístico.",area:"Logística"},
  {id:12,t:"Me interessa planejar rotas e otimizar o transporte de cargas.",area:"Logística"},
  {id:13,t:"Gosto de trabalhar com sistemas de gestão de estoques.",area:"Logística"},
  {id:14,t:"Gosto de trabalhar com computadores e sistemas digitais.",area:"Tecnologia & Inovação"},
  {id:15,t:"Me interessa aprender sobre automação e novas tecnologias.",area:"Tecnologia & Inovação"},
  {id:16,t:"Tenho curiosidade sobre como a tecnologia transforma o trabalho.",area:"Tecnologia & Inovação"},
  {id:17,t:"Gosto de programar ou desenvolver soluções tecnológicas.",area:"Tecnologia & Inovação"},
  {id:18,t:"Me interessa trabalhar com inteligência artificial e dados.",area:"Tecnologia & Inovação"},
  {id:19,t:"Me preocupo muito com a segurança dos colegas no trabalho.",area:"Segurança & Meio Ambiente"},
  {id:20,t:"Gosto de identificar riscos e propor medidas preventivas.",area:"Segurança & Meio Ambiente"},
  {id:21,t:"Me preocupo com o impacto ambiental das operações.",area:"Segurança & Meio Ambiente"},
  {id:22,t:"Tenho interesse em normas regulamentadoras e segurança do trabalho.",area:"Segurança & Meio Ambiente"},
  {id:23,t:"Gosto de realizar treinamentos e orientações sobre segurança.",area:"Segurança & Meio Ambiente"},
  {id:24,t:"Gosto de trabalhar com documentos, contratos e registros.",area:"Administrativo & Financeiro"},
  {id:25,t:"Me interessa entender regulamentações e normas portuárias.",area:"Administrativo & Financeiro"},
  {id:26,t:"Gosto de trabalhar com números e análises financeiras.",area:"Administrativo & Financeiro"},
  {id:27,t:"Tenho interesse em processos de compras e licitações.",area:"Administrativo & Financeiro"},
  {id:28,t:"Gosto de organizar arquivos e documentos administrativos.",area:"Administrativo & Financeiro"},
  {id:29,t:"Tenho interesse em apoiar o desenvolvimento das pessoas.",area:"Pessoas & RH"},
  {id:30,t:"Gosto de resolver conflitos e mediar situações difíceis.",area:"Pessoas & RH"},
  {id:31,t:"Me interessa entender como as pessoas se motivam e aprendem.",area:"Pessoas & RH"},
  {id:32,t:"Gosto de realizar entrevistas e processos seletivos.",area:"Pessoas & RH"},
  {id:33,t:"Me interessa trabalhar com treinamento e desenvolvimento.",area:"Pessoas & RH"},
  {id:34,t:"Gosto de liderar e orientar equipes para alcançar resultados.",area:"Liderança & Gestão"},
  {id:35,t:"Me sinto confortável tomando decisões difíceis.",area:"Liderança & Gestão"},
  {id:36,t:"Gosto de desenvolver outras pessoas e ajudá-las a crescer.",area:"Liderança & Gestão"},
  {id:37,t:"Tenho facilidade para delegar tarefas e acompanhar resultados.",area:"Liderança & Gestão"},
  {id:38,t:"Gosto de planejar estrategicamente o futuro da equipe.",area:"Liderança & Gestão"},
  {id:39,t:"Tenho interesse em processos de qualidade e melhoria contínua.",area:"Qualidade & Processos"},
  {id:40,t:"Gosto de mapear processos e identificar oportunidades de melhoria.",area:"Qualidade & Processos"},
];

const DISC_PROFILES = {
  D:{label:"Dominância",color:T.red,icon:"⚡",desc:"Orientado a resultados, direto e decisivo. Você aprecia desafios e age rapidamente para superar obstáculos. Sua força está na liderança por resultados."},
  I:{label:"Influência",color:T.orange,icon:"✨",desc:"Comunicativo, entusiasta e persuasivo. Você motiva as pessoas ao seu redor e tem facilidade em criar conexões. Sua força está nas relações humanas."},
  S:{label:"Estabilidade",color:T.green,icon:"🌿",desc:"Paciente, confiável e colaborativo. Você é o pilar da equipe, trazendo consistência e apoio. Sua força está na confiabilidade e trabalho em equipe."},
  C:{label:"Conformidade",color:T.blue,icon:"🎯",desc:"Analítico, preciso e sistemático. Você busca qualidade e excelência em tudo que faz. Sua força está na análise e no pensamento crítico."},
};

const BF_LABELS = {
  O:{label:"Abertura",desc:"Curiosidade intelectual, criatividade e abertura a novas experiências."},
  C:{label:"Conscienciosidade",desc:"Organização, autodisciplina, orientação a metas e confiabilidade."},
  E:{label:"Extroversão",desc:"Energia social, assertividade e tendência a buscar estimulação externa."},
  A:{label:"Amabilidade",desc:"Cooperação, empatia, confiança e orientação para os outros."},
  N:{label:"Neuroticismo",desc:"Estabilidade emocional e resiliência diante do estresse."},
};

// ==================== TEST COMPONENTS ====================
const DiscTest = ({ existing, onComplete }) => {
  const [answers, setAnswers] = useState(existing?.answers||{});
  const [current, setCurrent] = useState(0);
  const [showResult, setShowResult] = useState(!!existing);
  const [scores, setScores] = useState(existing?.scores||null);
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const total = DISC_Q.length;
  const answered = Object.keys(answers).length;

  const handleAnswer = (qid, type) => {
    const newA = {...answers,[qid]:type};
    setAnswers(newA);
    if(current<total-1) setTimeout(()=>setCurrent(c=>c+1),280);
  };
  const handleSubmit = () => {
    const sc = scoreDisc(answers);
    setScores(sc);
    setShowResult(true);
    onComplete({answers,scores:sc,completedAt:new Date().toISOString()});
  };

  if(showResult&&scores){
    const primary = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
    const profile = DISC_PROFILES[primary[0]];
    return (
      <div style={{padding:isMobile?'16px':'32px',maxWidth:'800px',margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
          <Button size="sm" variant="ghost" onClick={()=>setShowResult(false)}>← Refazer</Button>
          <h2 style={{margin:0,fontSize:isMobile?'18px':'22px'}}>Resultado DISC</h2>
        </div>
        <div className="grid-2">
          <Card style={{borderColor:profile.color+'44'}}>
            <div style={{display:'flex',gap:'12px',alignItems:'flex-start',marginBottom:'14px',flexWrap:'wrap'}}>
              <span style={{fontSize:'36px'}}>{profile.icon}</span>
              <div>
                <div style={{fontSize:'11px',color:T.textS,marginBottom:'2px'}}>Perfil Dominante</div>
                <h3 style={{margin:'0 0 6px',fontSize:isMobile?'17px':'20px',color:profile.color}}>Perfil {primary[0]} — {profile.label}</h3>
                <Badge color={profile.color}>{primary[1]}% dominância</Badge>
              </div>
            </div>
            <p style={{color:T.textS,fontSize:'13px',lineHeight:1.7}}>{profile.desc}</p>
          </Card>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            {Object.entries(DISC_PROFILES).map(([k,v])=>(
              <div key={k} style={{background:T.surf2,borderRadius:'10px',padding:'12px',border:`1px solid ${scores[k]===Math.max(...Object.values(scores))?v.color+'44':T.border}`}}>
                <div style={{fontSize:'10px',color:v.color,fontWeight:700,marginBottom:'2px'}}>{k} — {v.label}</div>
                <div style={{fontSize:'20px',fontWeight:800}}>{scores[k]}%</div>
                <Progress value={scores[k]} color={v.color} height={4}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const q = DISC_Q[current];
  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'700px',margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px',flexWrap:'wrap'}}>
        <span style={{fontSize:'24px'}}>🧭</span>
        <div style={{flex:1}}>
          <h2 style={{margin:'0 0 2px',fontSize:isMobile?'18px':'22px'}}>Teste DISC</h2>
          <p style={{margin:0,fontSize:'12px',color:T.textS}}>{total} questões · Escolha a opção que mais representa você</p>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:'18px',fontWeight:800,color:T.gold}}>{current+1}/{total}</div>
        </div>
      </div>
      <Progress value={(answered/total)*100} color={T.gold}/>
      <Card style={{marginTop:'20px'}}>
        <p style={{fontSize:isMobile?'14px':'16px',marginBottom:'20px',lineHeight:1.6,fontWeight:500}}>{q.text}</p>
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {q.opts.map((opt,i)=>(
            <button key={i} onClick={()=>handleAnswer(q.id,opt.d)} style={{
              padding:isMobile?'11px 14px':'13px 16px', borderRadius:'12px',
              border:`1.5px solid ${answers[q.id]===opt.d?DISC_PROFILES[opt.d].color:T.border}`,
              background:answers[q.id]===opt.d?DISC_PROFILES[opt.d].color+'22':T.surf2,
              color:answers[q.id]===opt.d?DISC_PROFILES[opt.d].color:T.text,
              cursor:'pointer', textAlign:'left', fontSize:'13px',
              fontWeight:answers[q.id]===opt.d?700:400, display:'flex', alignItems:'center', gap:'10px',
            }}>
              <span style={{width:'26px',height:'26px',borderRadius:'7px',background:DISC_PROFILES[opt.d].color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'12px',color:DISC_PROFILES[opt.d].color,flexShrink:0}}>
                {opt.d}
              </span>
              {opt.t}
            </button>
          ))}
        </div>
      </Card>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:'16px',gap:'12px'}}>
        <Button size="sm" variant="secondary" onClick={()=>setCurrent(c=>Math.max(0,c-1))} disabled={current===0}>← Anterior</Button>
        {current<total-1
          ? <Button size="sm" onClick={()=>setCurrent(c=>c+1)} disabled={!answers[q.id]}>Próxima →</Button>
          : <Button onClick={handleSubmit} disabled={answered<total}>Ver Resultado ({answered}/{total})</Button>
        }
      </div>
    </div>
  );
};

const BigFiveTest = ({ existing, onComplete }) => {
  const [answers, setAnswers] = useState(existing?.answers||{});
  const [showResult, setShowResult] = useState(!!existing);
  const [scores, setScores] = useState(existing?.scores||null);
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const answered = Object.keys(answers).length;
  const total = BF_Q.length;

  const handleSubmit = () => {
    const sc = scoreBigFive(answers);
    setScores(sc);
    setShowResult(true);
    onComplete({answers,scores:sc,completedAt:new Date().toISOString()});
  };

  if(showResult&&scores){
    return (
      <div style={{padding:isMobile?'16px':'32px',maxWidth:'800px',margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
          <Button size="sm" variant="ghost" onClick={()=>setShowResult(false)}>← Refazer</Button>
          <h2 style={{margin:0,fontSize:isMobile?'18px':'22px'}}>Perfil Big Five</h2>
        </div>
        <div className="grid-2">
          <Card>
            <h4 style={{margin:'0 0 14px',fontSize:'13px'}}>Seus Traços</h4>
            {Object.entries(BF_LABELS).map(([k,v])=>{
              const sc=scores[k];
              const color=sc>=70?T.green:sc>=40?T.teal:T.orange;
              return (
                <div key={k} style={{marginBottom:'14px'}}>
                  <Progress value={sc} label={v.label} color={color} height={6}/>
                  <p style={{fontSize:'10px',color:T.textM,marginTop:'3px'}}>{v.desc}</p>
                </div>
              );
            })}
          </Card>
          <Card>
            <h4 style={{margin:'0 0 12px',fontSize:'13px'}}>Interpretação</h4>
            <p style={{fontSize:'13px',color:T.textS,lineHeight:1.7}}>
              O Big Five avalia cinco grandes dimensões da personalidade. Pontuações altas (acima de 70%) indicam forte presença do traço, enquanto pontuações baixas (abaixo de 40%) sugerem maior necessidade de desenvolvimento. Sua combinação única de traços forma sua personalidade e influencia como você trabalha e se relaciona.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'700px',margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px',flexWrap:'wrap'}}>
        <span style={{fontSize:'24px'}}>🧠</span>
        <div style={{flex:1}}>
          <h2 style={{margin:'0 0 2px',fontSize:isMobile?'18px':'22px'}}>Big Five</h2>
          <p style={{margin:0,fontSize:'12px',color:T.textS}}>{total} afirmações · 1 (Discordo) a 5 (Concordo)</p>
        </div>
        <div style={{fontWeight:800,fontSize:'16px',color:T.teal}}>{answered}/{total}</div>
      </div>
      <Progress value={(answered/total)*100} color={T.teal}/>
      <div style={{marginTop:'20px'}}>
        {BF_Q.map((q,i)=>(
          <LikertScale key={q.id} question={q.t} value={answers[q.id]} onChange={v=>setAnswers(a=>({...a,[q.id]:v}))} index={i+1}/>
        ))}
      </div>
      <Button onClick={handleSubmit} disabled={answered<total} fullWidth style={{marginTop:'8px'}}>
        Ver Resultado ({answered}/{total} respondidas)
      </Button>
    </div>
  );
};

const ValuesTest = ({ existing, onComplete }) => {
  const [answers, setAnswers] = useState(existing?.answers||{});
  const [showResult, setShowResult] = useState(!!existing);
  const [scores, setScores] = useState(existing?.scores||null);
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const answered = Object.keys(answers).length;
  const total = VAL_Q.length;

  const handleSubmit = () => {
    const sc = scoreValues(answers);
    setScores(sc);
    setShowResult(true);
    onComplete({answers,scores:sc,completedAt:new Date().toISOString()});
  };

  if(showResult&&scores){
    const top5 = scores.slice(0,5);
    return (
      <div style={{padding:isMobile?'16px':'32px',maxWidth:'800px',margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
          <Button size="sm" variant="ghost" onClick={()=>setShowResult(false)}>← Refazer</Button>
          <h2 style={{margin:0,fontSize:isMobile?'18px':'22px'}}>Seus Valores Essenciais</h2>
        </div>
        <div className="grid-2">
          <div>
            <Card style={{marginBottom:'14px'}}>
              <h4 style={{margin:'0 0 14px',fontSize:'13px',color:T.gold}}>🏆 Top 5 Valores</h4>
              {top5.map((item,i)=>(
                <div key={i} style={{marginBottom:'10px'}}>
                  <Progress value={(item.s/5)*100} label={item.v} color={i===0?T.gold:i<3?T.teal:T.blue} height={6}/>
                </div>
              ))}
            </Card>
            <Card>
              <p style={{fontSize:'12px',color:T.textS,lineHeight:1.7}}>
                Seus valores mais altos revelam o que genuinamente te motiva. Busque situações de trabalho alinhadas a esses valores para maior satisfação profissional.
              </p>
            </Card>
          </div>
          <Card>
            <h4 style={{margin:'0 0 14px',fontSize:'13px'}}>Mapa de Valores</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={scores.slice(0,8).map(i=>({name:i.v.substring(0,10),value:i.s}))} layout="vertical" margin={{left:0,right:16}}>
                <XAxis type="number" domain={[0,5]} tick={{fill:T.textS,fontSize:10}}/>
                <YAxis type="category" dataKey="name" tick={{fill:T.textS,fontSize:10}} width={72}/>
                <Tooltip contentStyle={{background:T.surf2,border:`1px solid ${T.border}`,borderRadius:8,color:T.text}}/>
                <Bar dataKey="value" fill={T.gold} radius={[0,6,6,0]} name="Nível"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'700px',margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px',flexWrap:'wrap'}}>
        <span style={{fontSize:'24px'}}>💎</span>
        <div style={{flex:1}}>
          <h2 style={{margin:'0 0 2px',fontSize:isMobile?'18px':'22px'}}>Meus Valores</h2>
          <p style={{margin:0,fontSize:'12px',color:T.textS}}>{total} afirmações · 1 a 5</p>
        </div>
        <div style={{fontWeight:800,fontSize:'16px',color:T.gold}}>{answered}/{total}</div>
      </div>
      <Progress value={(answered/total)*100} color={T.gold}/>
      <div style={{marginTop:'20px'}}>
        {VAL_Q.map((q,i)=>(
          <LikertScale key={q.id} question={q.t} value={answers[q.id]} onChange={v=>setAnswers(a=>({...a,[q.id]:v}))} index={i+1}/>
        ))}
      </div>
      <Button onClick={handleSubmit} disabled={answered<total} fullWidth style={{marginTop:'8px'}}>
        Ver Resultado ({answered}/{total} respondidas)
      </Button>
    </div>
  );
};

const EQTest = ({ existing, onComplete }) => {
  const [answers, setAnswers] = useState(existing?.answers||{});
  const [showResult, setShowResult] = useState(!!existing);
  const [scores, setScores] = useState(existing?.scores||null);
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const answered = Object.keys(answers).length;
  const total = EQ_Q.length;

  const handleSubmit = () => {
    const sc = scoreEQ(answers);
    setScores(sc);
    setShowResult(true);
    onComplete({answers,scores:sc,completedAt:new Date().toISOString()});
  };

  const dims = ['Autoconsciência','Autorregulação','Motivação','Empatia','Habilidades Sociais'];

  if(showResult&&scores){
    return (
      <div style={{padding:isMobile?'16px':'32px',maxWidth:'800px',margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
          <Button size="sm" variant="ghost" onClick={()=>setShowResult(false)}>← Refazer</Button>
          <h2 style={{margin:0,fontSize:isMobile?'18px':'22px'}}>Inteligência Emocional</h2>
        </div>
        <div className="grid-2">
          <div>
            <Card style={{marginBottom:'14px',textAlign:'center',borderColor:T.orange+'44'}}>
              <div style={{fontSize:'44px',fontWeight:800,color:T.orange,marginBottom:'4px'}}>{scores.total}%</div>
              <Badge color={T.orange}>{scores.total>=80?'Avançada':scores.total>=60?'Boa':scores.total>=40?'Em Desenvolvimento':'Inicial'}</Badge>
              <p style={{fontSize:'12px',color:T.textS,marginTop:'10px',lineHeight:1.6}}>A Inteligência Emocional pode ser desenvolvida ao longo da vida.</p>
            </Card>
            <Card>
              {dims.map(d=>(
                <div key={d} style={{marginBottom:'10px'}}>
                  <Progress value={scores[d]||0} label={d} color={T.orange} height={6}/>
                </div>
              ))}
            </Card>
          </div>
          <Card>
            <h4 style={{margin:'0 0 14px',fontSize:'13px'}}>Radar Emocional</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dims.map(d=>({name:d.substring(0,10),value:scores[d]||0}))} margin={{top:8,bottom:16}}>
                <XAxis dataKey="name" tick={{fill:T.textS,fontSize:9}}/>
                <YAxis domain={[0,100]} tick={{fill:T.textS,fontSize:9}}/>
                <Tooltip contentStyle={{background:T.surf2,border:`1px solid ${T.border}`,borderRadius:8,color:T.text}}/>
                <Bar dataKey="value" fill={T.orange} radius={[4,4,0,0]} name="%"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'700px',margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px',flexWrap:'wrap'}}>
        <span style={{fontSize:'24px'}}>❤️</span>
        <div style={{flex:1}}>
          <h2 style={{margin:'0 0 2px',fontSize:isMobile?'18px':'22px'}}>Inteligência Emocional</h2>
          <p style={{margin:0,fontSize:'12px',color:T.textS}}>{total} afirmações · 1 a 5</p>
        </div>
        <div style={{fontWeight:800,fontSize:'16px',color:T.orange}}>{answered}/{total}</div>
      </div>
      <Progress value={(answered/total)*100} color={T.orange}/>
      <div style={{marginTop:'20px'}}>
        {EQ_Q.map((q,i)=>(
          <LikertScale key={q.id} question={q.t} value={answers[q.id]} onChange={v=>setAnswers(a=>({...a,[q.id]:v}))} index={i+1}/>
        ))}
      </div>
      <Button onClick={handleSubmit} disabled={answered<total} fullWidth style={{marginTop:'8px'}}>
        Ver Resultado ({answered}/{total} respondidas)
      </Button>
    </div>
  );
};

const InterestsTest = ({ existing, onComplete }) => {
  const [answers, setAnswers] = useState(existing?.answers||{});
  const [showResult, setShowResult] = useState(!!existing);
  const [scores, setScores] = useState(existing?.scores||null);
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const answered = Object.keys(answers).length;
  const total = INT_Q.length;

  const handleSubmit = () => {
    const sc = scoreInterests(answers);
    setScores(sc);
    setShowResult(true);
    onComplete({answers,scores:sc,completedAt:new Date().toISOString()});
  };

  if(showResult&&scores){
    const top3 = scores.slice(0,3);
    return (
      <div style={{padding:isMobile?'16px':'32px',maxWidth:'800px',margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
          <Button size="sm" variant="ghost" onClick={()=>setShowResult(false)}>← Refazer</Button>
          <h2 style={{margin:0,fontSize:isMobile?'18px':'22px'}}>Áreas de Interesse</h2>
        </div>
        <div className="grid-2">
          <div>
            <Card style={{marginBottom:'14px'}}>
              <h4 style={{margin:'0 0 14px',fontSize:'13px',color:T.purpleL}}>🌟 Suas Top 3 Áreas</h4>
              {top3.map((item,i)=>(
                <div key={i} style={{marginBottom:'14px'}}>
                  <Progress value={item.score} label={item.area} color={i===0?T.purple:T.blue} height={6}/>
                </div>
              ))}
            </Card>
            <Card>
              <p style={{fontSize:'12px',color:T.textS,lineHeight:1.7}}>
                Esses resultados indicam afinidade — não necessariamente experiência. Use para conversar com seu gestor sobre desenvolvimento e movimentações de carreira.
              </p>
            </Card>
          </div>
          <Card>
            <h4 style={{margin:'0 0 12px',fontSize:'13px'}}>Todas as Áreas</h4>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={scores.slice(0,8).map(s=>({name:s.area.substring(0,14),value:s.score}))} layout="vertical" margin={{left:0,right:16}}>
                <XAxis type="number" domain={[0,100]} tick={{fill:T.textS,fontSize:9}}/>
                <YAxis type="category" dataKey="name" tick={{fill:T.textS,fontSize:9}} width={82}/>
                <Tooltip contentStyle={{background:T.surf2,border:`1px solid ${T.border}`,borderRadius:8,color:T.text}}/>
                <Bar dataKey="value" radius={[0,6,6,0]} name="%">
                  {scores.slice(0,8).map((_,i)=><Cell key={i} fill={i<3?T.purple:T.blue}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'700px',margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px',flexWrap:'wrap'}}>
        <span style={{fontSize:'24px'}}>🔭</span>
        <div style={{flex:1}}>
          <h2 style={{margin:'0 0 2px',fontSize:isMobile?'18px':'22px'}}>Explorar Áreas</h2>
          <p style={{margin:0,fontSize:'12px',color:T.textS}}>{total} afirmações · 1 a 5</p>
        </div>
        <div style={{fontWeight:800,fontSize:'16px',color:T.purple}}>{answered}/{total}</div>
      </div>
      <Progress value={(answered/total)*100} color={T.purple}/>
      <div style={{marginTop:'20px'}}>
        {INT_Q.map((q,i)=>(
          <LikertScale key={q.id} question={q.t} value={answers[q.id]} onChange={v=>setAnswers(a=>({...a,[q.id]:v}))} index={i+1}/>
        ))}
      </div>
      <Button onClick={handleSubmit} disabled={answered<total} fullWidth style={{marginTop:'8px'}}>
        Ver Resultado ({answered}/{total} respondidas)
      </Button>
    </div>
  );
};

// ==================== EMPLOYEE COMPONENTS ====================
const EmployeeProfile = ({ results }) => {
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  if(!results||Object.keys(results).length===0){
    return (
      <div style={{padding:isMobile?'16px':'32px'}}>
        <Card style={{textAlign:'center',padding:'48px 24px'}}>
          <div style={{fontSize:'48px',marginBottom:'12px'}}>🧭</div>
          <h3 style={{color:T.textS,marginBottom:'8px'}}>Nenhum teste concluído ainda</h3>
          <p style={{color:T.textM,fontSize:'13px'}}>Complete os testes para ver seu perfil.</p>
        </Card>
      </div>
    );
  }
  const { disc, bigFive, values, eq, interests } = results;
  const discPrimary = disc&&Object.entries(disc.scores).sort((a,b)=>b[1]-a[1])[0];

  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'900px',margin:'0 auto'}}>
      <h2 style={{fontSize:isMobile?'18px':'22px',marginBottom:'20px'}}>📊 Meu Perfil Completo</h2>
      <div className="grid-3" style={{marginBottom:'20px'}}>
        {discPrimary&&(
          <Card style={{textAlign:'center',borderColor:DISC_PROFILES[discPrimary[0]].color+'44',padding:'16px'}}>
            <div style={{fontSize:'24px'}}>{DISC_PROFILES[discPrimary[0]].icon}</div>
            <div style={{fontSize:'10px',color:T.textM,margin:'4px 0'}}>Perfil DISC</div>
            <div style={{fontWeight:800,fontSize:'15px',color:DISC_PROFILES[discPrimary[0]].color}}>Perfil {discPrimary[0]}</div>
            <div style={{fontSize:'11px',color:T.textS}}>{DISC_PROFILES[discPrimary[0]].label}</div>
          </Card>
        )}
        {eq?.scores?.total&&(
          <Card style={{textAlign:'center',borderColor:T.orange+'44',padding:'16px'}}>
            <div style={{fontSize:'24px'}}>❤️</div>
            <div style={{fontSize:'10px',color:T.textM,margin:'4px 0'}}>Int. Emocional</div>
            <div style={{fontWeight:800,fontSize:'22px',color:T.orange}}>{eq.scores.total}%</div>
          </Card>
        )}
        {values?.scores&&(
          <Card style={{textAlign:'center',borderColor:T.gold+'44',padding:'16px'}}>
            <div style={{fontSize:'24px'}}>💎</div>
            <div style={{fontSize:'10px',color:T.textM,margin:'4px 0'}}>Valor Principal</div>
            <div style={{fontWeight:800,fontSize:'13px',color:T.gold}}>{values.scores[0]?.v||'—'}</div>
          </Card>
        )}
      </div>
      {bigFive&&(
        <Card style={{marginBottom:'14px'}}>
          <h4 style={{margin:'0 0 14px',fontSize:'13px'}}>Big Five — Personalidade</h4>
          {Object.entries(BF_LABELS).map(([k,v])=>{
            const sc=bigFive.scores[k];
            return <div key={k} style={{marginBottom:'10px'}}><Progress value={sc} label={v.label} color={sc>=70?T.green:sc>=40?T.teal:T.orange} height={6}/></div>;
          })}
        </Card>
      )}
      {interests?.scores&&(
        <Card>
          <h4 style={{margin:'0 0 14px',fontSize:'13px'}}>🔭 Áreas de Interesse</h4>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
            {interests.scores.slice(0,6).map((item,i)=>(
              <div key={i} style={{background:T.surf2,borderRadius:'8px',padding:'8px 12px',border:`1px solid ${i<3?T.purple+'44':T.border}`}}>
                <div style={{fontSize:'12px',fontWeight:700,color:i<3?T.purpleL:T.textS}}>{item.area}</div>
                <div style={{fontSize:'10px',color:T.textM}}>{item.score}% afinidade</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const EmployeePDI = ({ pdi, onMarkGoalDone }) => {
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  if(!pdi){
    return (
      <div style={{padding:isMobile?'16px':'32px'}}>
        <h2 style={{fontSize:isMobile?'18px':'22px',marginBottom:'16px'}}>🚀 Meu PDI</h2>
        <Card style={{textAlign:'center',padding:'48px 24px'}}>
          <div style={{fontSize:'48px',marginBottom:'12px'}}>📋</div>
          <h3 style={{color:T.textS,marginBottom:'8px'}}>PDI ainda não definido</h3>
          <p style={{color:T.textM,fontSize:'13px'}}>Aguarde seu gestor criar seu Plano de Desenvolvimento.</p>
        </Card>
      </div>
    );
  }
  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'800px',margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'10px'}}>
        <h2 style={{margin:0,fontSize:isMobile?'18px':'22px'}}>🚀 Meu PDI</h2>
        <Badge color={pdi.status==='active'?T.green:pdi.status==='completed'?T.gold:T.blue}>
          {pdi.status==='active'?'Ativo':pdi.status==='completed'?'Concluído':'Rascunho'}
        </Badge>
      </div>
      <div className="grid-2" style={{marginBottom:'16px'}}>
        <Card>
          <h4 style={{margin:'0 0 10px',color:T.greenL,fontSize:'13px'}}>💪 Pontos Fortes</h4>
          {(pdi.strengths||[]).map((s,i)=>(
            <div key={i} style={{display:'flex',gap:'8px',marginBottom:'5px',fontSize:'13px'}}>
              <span style={{color:T.greenL}}>✦</span>{s}
            </div>
          ))}
        </Card>
        <Card>
          <h4 style={{margin:'0 0 10px',color:T.orangeL,fontSize:'13px'}}>🌱 A Desenvolver</h4>
          {(pdi.improvements||[]).map((s,i)=>(
            <div key={i} style={{display:'flex',gap:'8px',marginBottom:'5px',fontSize:'13px'}}>
              <span style={{color:T.orangeL}}>→</span>{s}
            </div>
          ))}
        </Card>
      </div>
      <Card style={{marginBottom:'16px'}}>
        <h4 style={{margin:'0 0 14px',fontSize:'13px'}}>🎯 Metas e Objetivos</h4>
        {(pdi.goals||[]).map((g,i)=>(
          <div key={i} style={{background:T.surf2,borderRadius:'12px',padding:'14px',marginBottom:'10px',border:`1px solid ${T.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px',flexWrap:'wrap',gap:'8px'}}>
              <div style={{fontSize:'13px',fontWeight:700,flex:1}}>{g.goal}</div>
              <div>
                {g.status==='done'
                  ? <Badge color={T.green}>✓ Concluída</Badge>
                  : <Button size="sm" variant="secondary" onClick={()=>onMarkGoalDone(i)}>Marcar como concluída</Button>
                }
              </div>
            </div>
            {g.deadline&&<div style={{fontSize:'11px',color:T.textM,marginBottom:'8px'}}>📅 Prazo: {new Date(g.deadline).toLocaleDateString('pt-BR')}</div>}
            <Progress value={g.progress||0} color={g.status==='done'?T.green:T.teal}/>
            {g.actions&&g.actions.length>0&&(
              <div style={{marginTop:'10px'}}>
                <div style={{fontSize:'11px',color:T.textS,marginBottom:'4px'}}>Ações:</div>
                {g.actions.filter(a=>a).map((a,ai)=>(
                  <div key={ai} style={{fontSize:'12px',color:T.text,marginBottom:'2px'}}>• {a}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>
      {pdi.notes&&(
        <Card>
          <h4 style={{margin:'0 0 8px',fontSize:'13px',color:T.blueL}}>💬 Notas do Gestor</h4>
          <p style={{fontSize:'13px',color:T.textS,lineHeight:1.7,margin:0}}>{pdi.notes}</p>
        </Card>
      )}
    </div>
  );
};

const EmployeeNotifications = ({ notifications=[], onMarkRead, onDelete }) => {
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  if(notifications.length===0){
    return (
      <div style={{padding:isMobile?'16px':'32px',maxWidth:'700px',margin:'0 auto'}}>
        <h2 style={{fontSize:isMobile?'18px':'22px',marginBottom:'20px'}}>🔔 Avisos e Mensagens</h2>
        <Card style={{textAlign:'center',padding:'40px 24px'}}><p style={{color:T.textM}}>Nenhuma mensagem recebida ainda.</p></Card>
      </div>
    );
  }
  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:isMobile?'18px':'22px',marginBottom:'20px'}}>🔔 Avisos e Mensagens</h2>
      {notifications.map(n=>(
        <div key={n.id} style={{background:n.read?T.surf:T.surf2,border:`1px solid ${n.read?T.border:T.gold+'44'}`,borderRadius:'12px',padding:isMobile?'14px':'16px 20px',marginBottom:'10px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px',flexWrap:'wrap',gap:'8px'}}>
            <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
              <span>{n.type==='feedback'?'💬':n.type==='warning'?'⚠️':'📣'}</span>
              <span style={{fontWeight:700,fontSize:'13px',color:n.read?T.textS:T.text}}>{n.fromName}</span>
              {!n.read&&<Badge color={T.gold}>Novo</Badge>}
            </div>
            <span style={{fontSize:'11px',color:T.textM}}>{new Date(n.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
          <p style={{margin:'0 0 10px',fontSize:'13px',color:T.textS,lineHeight:1.6}}>{n.message}</p>
          <div style={{display:'flex',gap:'8px',justifyContent:'flex-end',flexWrap:'wrap'}}>
            {!n.read&&<Button size="sm" variant="secondary" onClick={()=>onMarkRead(n.id)}>Marcar como lida</Button>}
            <Button size="sm" variant="danger" onClick={()=>onDelete(n.id)}>Excluir</Button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== NAVIGATION COMPONENTS ====================
const EmployeeSidebar = ({ screen, setScreen, user, unread=0 }) => {
  const items = [
    {id:'e_home',icon:'🏠',label:'Início'},
    {id:'e_disc',icon:'🧭',label:'Teste DISC'},
    {id:'e_bigfive',icon:'🧠',label:'Big Five'},
    {id:'e_values',icon:'💎',label:'Valores'},
    {id:'e_eq',icon:'❤️',label:'Int. Emocional'},
    {id:'e_interests',icon:'🔭',label:'Explorar'},
    {id:'e_profile',icon:'📊',label:'Meu Perfil'},
    {id:'e_pdi',icon:'🚀',label:'Meu PDI'},
    {id:'e_notif',icon:'🔔',label:`Avisos${unread?` (${unread})`:''}`},
  ];
  return (
    <div className="ph-sidebar">
      <div style={{padding:'20px 18px',borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px'}}>
          <span style={{fontSize:'22px'}}>⚓</span>
          <span style={{fontWeight:700,fontSize:'15px',color:T.gold}}>Porto Humano</span>
        </div>
        <div style={{fontSize:'11px',color:T.textM}}>Jornada de Desenvolvimento</div>
      </div>
      <div style={{padding:'12px 10px',flex:1,overflowY:'auto'}}>
        {items.map(item=>(
          <button key={item.id} onClick={()=>setScreen(item.id)} style={{
            display:'flex',alignItems:'center',gap:'10px',width:'100%',
            padding:'11px 12px',borderRadius:'10px',border:'none',
            background:screen===item.id?`${T.gold}22`:'transparent',
            color:screen===item.id?T.gold:T.textS,
            fontSize:'13px',fontWeight:screen===item.id?600:400,cursor:'pointer',marginBottom:'2px',textAlign:'left',
          }}>
            <span style={{fontSize:'15px'}}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
      <div style={{padding:'16px 18px',borderTop:`1px solid ${T.border}`}}>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <Avatar name={user.name} size={36}/>
          <div style={{overflow:'hidden'}}>
            <div style={{fontWeight:600,fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</div>
            <div style={{fontSize:'10px',color:T.textM}}>{user.dept} · Equipe {user.equipe}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeMobileNav = ({ screen, setScreen, unread=0, onLogout }) => {
  const items = [
    {id:'e_home',icon:'🏠',label:'Início'},
    {id:'e_disc',icon:'🧭',label:'DISC'},
    {id:'e_bigfive',icon:'🧠',label:'Big Five'},
    {id:'e_values',icon:'💎',label:'Valores'},
    {id:'e_eq',icon:'❤️',label:'IE'},
    {id:'e_interests',icon:'🔭',label:'Áreas'},
    {id:'e_profile',icon:'📊',label:'Perfil'},
    {id:'e_pdi',icon:'🚀',label:'PDI'},
    {id:'e_notif',icon:'🔔',label:`Avisos${unread?`·${unread}`:''}` },
  ];
  return (
    <>
      <div className="ph-mobile-header">
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <span style={{fontSize:'18px'}}>⚓</span>
          <span style={{fontWeight:700,fontSize:'15px',color:T.gold}}>Porto Humano</span>
        </div>
        <button onClick={onLogout} style={{background:'none',border:'none',color:T.textS,fontSize:'12px',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Sair</button>
      </div>
      <div className="ph-mobile-nav">
        <div className="ph-mobile-nav-inner">
          {items.map(item=>(
            <button key={item.id} className={`ph-mobile-nav-btn${screen===item.id?' active':''}`} onClick={()=>setScreen(item.id)}>
              <span className="ph-mobile-nav-icon">{item.icon}</span>
              <span className="ph-mobile-nav-label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

const ManagerSidebar = ({ screen, setScreen, user }) => {
  const items = [
    {id:'m_home',icon:'📊',label:'Dashboard'},
    {id:'m_employees',icon:'👥',label:'Colaboradores'},
    {id:'m_pdis',icon:'🚀',label:'Gestão de PDIs'},
    {id:'m_messages',icon:'📬',label:'Enviar Avisos'},
    {id:'m_reports',icon:'📋',label:'Relatórios'},
  ];
  return (
    <div className="ph-sidebar">
      <div style={{padding:'20px 18px',borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
          <span style={{fontSize:'22px'}}>⚓</span>
          <span style={{fontWeight:700,fontSize:'15px',color:T.gold}}>Porto Humano</span>
        </div>
        <Badge color={T.purple}>Gestor</Badge>
      </div>
      <div style={{padding:'12px 10px',flex:1,overflowY:'auto'}}>
        {items.map(item=>(
          <button key={item.id} onClick={()=>setScreen(item.id)} style={{
            display:'flex',alignItems:'center',gap:'10px',width:'100%',
            padding:'11px 12px',borderRadius:'10px',border:'none',
            background:screen===item.id?`${T.purple}22`:'transparent',
            color:screen===item.id?T.purpleL:T.textS,
            fontSize:'13px',fontWeight:screen===item.id?600:400,cursor:'pointer',marginBottom:'2px',textAlign:'left',
          }}>
            <span style={{fontSize:'15px'}}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
      <div style={{padding:'16px 18px',borderTop:`1px solid ${T.border}`}}>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <Avatar name={user.name} size={36} color={T.purple}/>
          <div style={{overflow:'hidden'}}>
            <div style={{fontWeight:600,fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</div>
            <div style={{fontSize:'10px',color:T.textM}}>{user.pos}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ManagerMobileNav = ({ screen, setScreen, onLogout }) => {
  const items = [
    {id:'m_home',icon:'📊',label:'Dashboard'},
    {id:'m_employees',icon:'👥',label:'Equipe'},
    {id:'m_pdis',icon:'🚀',label:'PDIs'},
    {id:'m_messages',icon:'📬',label:'Avisos'},
    {id:'m_reports',icon:'📋',label:'Relatórios'},
  ];
  return (
    <>
      <div className="ph-mobile-header">
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <span style={{fontSize:'18px'}}>⚓</span>
          <span style={{fontWeight:700,fontSize:'15px',color:T.gold}}>Porto Humano</span>
          <Badge color={T.purple}>Gestor</Badge>
        </div>
        <button onClick={onLogout} style={{background:'none',border:'none',color:T.textS,fontSize:'12px',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Sair</button>
      </div>
      <div className="ph-mobile-nav">
        <div className="ph-mobile-nav-inner">
          {items.map(item=>(
            <button key={item.id} className={`ph-mobile-nav-btn${screen===item.id?' active-manager':''}`} onClick={()=>setScreen(item.id)}>
              <span className="ph-mobile-nav-icon">{item.icon}</span>
              <span className="ph-mobile-nav-label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// ==================== LOGIN SCREEN ====================
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('employee');
  const [isRegistering, setIsRegistering] = useState(false);
  const [rd, setRd] = useState({name:'',email:'',password:'',confirmPassword:'',accessCode:'',area:'',funcao:'',equipe:''});
  const { width } = useWindowSize();
  const isMobile = width <= 500;

  const handleLogin = async () => {
    setLoading(true); setError('');
    try {
      const uc = await signInWithEmailAndPassword(auth, email, password);
      const uDoc = await getDoc(doc(db,'users',uc.user.uid));
      if(!uDoc.exists()){await signOut(auth);setError('Usuário não encontrado');setLoading(false);return;}
      const ud = {id:uc.user.uid,...uDoc.data()};
      if(mode==='manager'&&ud.role!=='manager'){setError('Use o login de colaborador.');await signOut(auth);setLoading(false);return;}
      if(mode==='employee'&&ud.role!=='employee'){setError('Use o acesso de Gestor.');await signOut(auth);setLoading(false);return;}
      onLogin(ud);
    } catch(e) { setError('E-mail ou senha incorretos.'); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if(!rd.name||!rd.email||!rd.password||!rd.area||!rd.funcao||!rd.equipe){setError('Preencha todos os campos obrigatórios');return;}
    if(rd.password.length<6){setError('Senha mínimo 6 caracteres');return;}
    if(rd.password!==rd.confirmPassword){setError('As senhas não coincidem');return;}
    setLoading(true); setError('');
    try {
      const uc = await createUserWithEmailAndPassword(auth,rd.email,rd.password);
      const role = rd.accessCode===GESTOR_SECRET_CODE?'manager':'employee';
      await setDoc(doc(db,'users',uc.user.uid),{
        name:rd.name,email:rd.email.toLowerCase(),role,dept:rd.area,pos:rd.funcao,
        equipe:rd.equipe,avatar:rd.name.split(' ').map(n=>n[0]).join('').toUpperCase().substring(0,2),
        createdAt:new Date().toISOString()
      });
      showMessage('Registro realizado! Faça login.','success');
      setRd({name:'',email:'',password:'',confirmPassword:'',accessCode:'',area:'',funcao:'',equipe:''});
      setIsRegistering(false);
    } catch(e) {
      setError(e.code==='auth/email-already-in-use'?'E-mail já em uso.':'Erro ao registrar.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',
      background:`radial-gradient(ellipse at 20% 50%,${T.gold}11 0%,transparent 60%),radial-gradient(ellipse at 80% 50%,${T.blue}11 0%,transparent 60%),${T.bg}`,
      padding:'20px',
    }}>
      <div style={{width:'100%',maxWidth:isMobile?'100%':'460px'}}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{fontSize:'56px',marginBottom:'8px'}}>⚓</div>
          <h1 style={{
            fontSize:isMobile?'26px':'34px',margin:'0 0 4px',
            background:`linear-gradient(135deg,${T.gold},${T.goldL})`,
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
          }}>Porto Humano</h1>
          <p style={{color:T.textS,margin:0,fontSize:'13px'}}>Terminal Portuário · Jornada de Desenvolvimento</p>
        </div>
        <Card>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'20px',background:T.surf2,borderRadius:'12px',padding:'4px'}}>
            {[{v:'employee',l:'👤 Colaborador'},{v:'manager',l:'🏛️ Gestor'}].map(m=>(
              <button key={m.v} onClick={()=>{setMode(m.v);setIsRegistering(false);}} style={{
                padding:'9px',borderRadius:'8px',border:'none',
                background:!isRegistering&&mode===m.v?T.gold:'transparent',
                color:!isRegistering&&mode===m.v?'#080E18':T.textS,
                fontFamily:'Inter,sans-serif',fontWeight:600,fontSize:'13px',cursor:'pointer',
              }}>{m.l}</button>
            ))}
          </div>
          {!isRegistering?(
            <>
              <Input label="E-mail" value={email} onChange={setEmail} type="email" placeholder="seu@email.com" required/>
              <Input label="Senha" value={password} onChange={setPassword} type="password" placeholder="••••••••" required/>
              {error&&<div style={{background:`${T.red}22`,border:`1px solid ${T.red}44`,borderRadius:'8px',padding:'10px 14px',marginBottom:'14px',color:T.redL,fontSize:'13px'}}>{error}</div>}
              <Button onClick={handleLogin} disabled={loading} fullWidth>{loading?<Spinner/>:'Entrar'}</Button>
              <button onClick={()=>setIsRegistering(true)} style={{width:'100%',background:'none',border:'none',color:T.blueL,fontSize:'13px',cursor:'pointer',marginTop:'14px',padding:'8px',fontFamily:'Inter,sans-serif'}}>
                Não tem conta? Registrar
              </button>
            </>
          ):(
            <>
              <Input label="Nome Completo" value={rd.name} onChange={v=>setRd({...rd,name:v})} placeholder="Seu nome" required/>
              <Input label="E-mail" value={rd.email} onChange={v=>setRd({...rd,email:v})} type="email" placeholder="seu@email.com" required/>
              <Select label="Área" value={rd.area} onChange={v=>setRd({...rd,area:v})} options={AREAS} placeholder="Selecione sua área" required/>
              <Input label="Função" value={rd.funcao} onChange={v=>setRd({...rd,funcao:v})} placeholder="Ex: Operador, Analista..." required/>
              <Select label="Equipe" value={rd.equipe} onChange={v=>setRd({...rd,equipe:v})} options={EQUIPES} placeholder="Selecione sua equipe" required/>
              <Input label="Senha" value={rd.password} onChange={v=>setRd({...rd,password:v})} type="password" placeholder="mínimo 6 caracteres" required/>
              <Input label="Confirmar Senha" value={rd.confirmPassword} onChange={v=>setRd({...rd,confirmPassword:v})} type="password" placeholder="repita a senha" required/>
              <Input label="Código de Acesso (opcional)" value={rd.accessCode} onChange={v=>setRd({...rd,accessCode:v})} placeholder="deixe em branco para colaborador"/>
              {error&&<div style={{background:`${T.red}22`,border:`1px solid ${T.red}44`,borderRadius:'8px',padding:'10px 14px',marginBottom:'14px',color:T.redL,fontSize:'13px'}}>{error}</div>}
              <Button onClick={handleRegister} disabled={loading} fullWidth>{loading?<Spinner/>:'Registrar'}</Button>
              <button onClick={()=>setIsRegistering(false)} style={{width:'100%',background:'none',border:'none',color:T.blueL,fontSize:'13px',cursor:'pointer',marginTop:'14px',padding:'8px',fontFamily:'Inter,sans-serif'}}>
                Voltar para login
              </button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

// ==================== EMPLOYEE HOME ====================
const EmployeeHome = ({ user, results, pdi, notifications, setScreen }) => {
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const tests = [
    {id:'e_disc',name:'DISC',icon:'🧭',done:!!results?.disc,desc:'Perfil comportamental'},
    {id:'e_bigfive',name:'Big Five',icon:'🧠',done:!!results?.bigFive,desc:'Personalidade'},
    {id:'e_values',name:'Valores',icon:'💎',done:!!results?.values,desc:'O que te move'},
    {id:'e_eq',name:'Int. Emocional',icon:'❤️',done:!!results?.eq,desc:'Competência emocional'},
    {id:'e_interests',name:'Interesses',icon:'🔭',done:!!results?.interests,desc:'Áreas de afinidade'},
  ];
  const completed = tests.filter(t=>t.done).length;
  const progress = (completed/tests.length)*100;
  const unread = notifications?.filter(n=>!n.read).length||0;
  const R = 28;
  const circ = 2*Math.PI*R;

  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'1200px',margin:'0 auto'}}>
      <div style={{marginBottom:'24px'}}>
        <h1 style={{fontSize:isMobile?'22px':'30px',margin:'0 0 3px'}}>Olá, {user.name.split(' ')[0]}! 👋</h1>
        <p style={{color:T.textS,margin:0,fontSize:isMobile?'12px':'14px'}}>{user.dept} · {user.pos} · Equipe {user.equipe}</p>
      </div>
      {unread>0&&(
        <div onClick={()=>setScreen('e_notif')} style={{background:`linear-gradient(135deg,${T.orange}22,${T.orange}11)`,border:`1px solid ${T.orange}44`,borderRadius:'12px',padding:'14px 16px',marginBottom:'20px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{fontSize:'20px'}}>🔔</span>
          <div>
            <div style={{fontWeight:700,color:T.orangeL,fontSize:'14px'}}>Você tem {unread} aviso{unread>1?'s':''} não lido{unread>1?'s':''}</div>
            <div style={{fontSize:'11px',color:T.textS}}>Toque para ver</div>
          </div>
        </div>
      )}
      <div className="grid-2" style={{marginBottom:'24px'}}>
        <Card>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'14px',gap:'12px'}}>
            <div>
              <h3 style={{margin:'0 0 4px',fontSize:isMobile?'15px':'17px'}}>Jornada de Autoconhecimento</h3>
              <p style={{margin:0,fontSize:'12px',color:T.textS}}>{completed} de {tests.length} etapas concluídas</p>
            </div>
            <div style={{position:'relative',width:64,height:64,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="64" height="64" style={{position:'absolute',transform:'rotate(-90deg)'}}>
                <circle cx="32" cy="32" r={R} fill="none" stroke={T.border} strokeWidth="4"/>
                <circle cx="32" cy="32" r={R} fill="none" stroke={T.gold} strokeWidth="4" strokeDasharray={`${circ*progress/100} ${circ}`} strokeLinecap="round"/>
              </svg>
              <span style={{fontWeight:800,fontSize:'13px',color:T.gold}}>{Math.round(progress)}%</span>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
            {tests.map(t=>(
              <div key={t.id} onClick={()=>setScreen(t.id)} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:T.surf2,borderRadius:'10px',cursor:'pointer',border:`1px solid ${t.done?T.green+'44':T.border}`}}>
                <span style={{fontSize:'16px'}}>{t.done?'✅':t.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',fontWeight:600,color:t.done?T.greenL:T.text}}>{t.name}</div>
                  <div style={{fontSize:'11px',color:T.textM}}>{t.desc}</div>
                </div>
                <span style={{fontSize:'11px',color:t.done?T.greenL:T.gold,flexShrink:0}}>{t.done?'✓':isMobile?'→':'Iniciar →'}</span>
              </div>
            ))}
          </div>
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:isMobile?'12px':'16px'}}>
          <Card>
            <h3 style={{margin:'0 0 14px',fontSize:isMobile?'14px':'16px'}}>📌 Meu PDI</h3>
            {pdi?(
              <div>
                <div style={{marginBottom:'10px'}}><Badge color={pdi.status==='active'?T.green:T.gold}>{pdi.status==='active'?'Ativo':'Concluído'}</Badge></div>
                {pdi.goals?.slice(0,2).map((g,i)=>(
                  <div key={i} style={{marginBottom:'10px'}}><Progress value={g.progress||0} label={g.goal.substring(0,30)+(g.goal.length>30?'...':'')} color={T.teal} height={5}/></div>
                ))}
                <Button size="sm" variant="ghost" onClick={()=>setScreen('e_pdi')}>Ver PDI completo →</Button>
              </div>
            ):(
              <div style={{textAlign:'center',padding:'16px 0',color:T.textM,fontSize:'12px'}}>
                <div style={{fontSize:'28px',marginBottom:'6px'}}>📋</div>PDI ainda não definido
              </div>
            )}
          </Card>
          <Card>
            <h3 style={{margin:'0 0 10px',fontSize:isMobile?'14px':'16px'}}>🎯 Próximos Passos</h3>
            {completed===0&&<p style={{color:T.textS,fontSize:'13px'}}>Comece pelo teste DISC para descobrir seu perfil!</p>}
            {completed>0&&completed<tests.length&&<p style={{color:T.textS,fontSize:'13px'}}>Continue! Você está a {tests.length-completed} passo{tests.length-completed>1?'s':''} de completar seu perfil.</p>}
            {completed===tests.length&&<div style={{color:T.greenL,fontSize:'13px'}}>🌟 Incrível! Você completou toda a jornada!</div>}
            <Button size="sm" variant="secondary" onClick={()=>setScreen('e_profile')} style={{marginTop:'10px'}}>Ver Perfil Completo</Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ==================== MANAGER DASHBOARD ====================
const ManagerDashboard = ({ users, allResults, allPDIs, allNotifications, setScreen, setSelectedEmployee }) => {
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const employees = users.filter(u=>u.role==='employee');
  const totalTests = 5;
  const completionData = employees.map(e=>{
    const res=allResults[e.id]||{};
    const done=['disc','bigFive','values','eq','interests'].filter(k=>!!res[k]).length;
    return {name:e.name.split(' ')[0],done,pct:Math.round((done/totalTests)*100)};
  });
  const avgCompletion = completionData.length?Math.round(completionData.reduce((a,b)=>a+b.pct,0)/completionData.length):0;
  const withPDI = employees.filter(e=>allPDIs[e.id]).length;
  const completedPDIs = employees.filter(e=>allPDIs[e.id]?.status==='completed').length;
  const msgStats = (()=>{
    let s=0,r=0;
    employees.forEach(e=>{const n=allNotifications[e.id]||[];s+=n.length;r+=n.filter(x=>x.read).length;});
    return {totalSent:s,readRate:s?Math.round(r/s*100):0};
  })();

  const stats = [
    {icon:'👥',val:employees.length,label:'Colaboradores',color:T.blue},
    {icon:'📊',val:`${avgCompletion}%`,label:'Completude Média',color:T.gold},
    {icon:'🚀',val:withPDI,label:'PDIs Ativos',color:T.green},
    {icon:'✅',val:completedPDIs,label:'PDIs Concluídos',color:T.purple},
    {icon:'📬',val:`${msgStats.readRate}%`,label:'Taxa de Leitura',color:T.teal},
  ];

  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'1200px',margin:'0 auto'}}>
      <h1 style={{fontSize:isMobile?'20px':'26px',marginBottom:'4px'}}>Dashboard do Gestor</h1>
      <p style={{color:T.textS,fontSize:'13px',marginBottom:'24px'}}>Visão geral da equipe</p>
      <div className="grid-5" style={{marginBottom:'24px'}}>
        {stats.map((s,i)=>(
          <Card key={i} style={{textAlign:'center',padding:isMobile?'14px':'18px'}}>
            <div style={{fontSize:'22px',marginBottom:'4px'}}>{s.icon}</div>
            <div style={{fontWeight:800,fontSize:isMobile?'18px':'22px',color:s.color}}>{s.val}</div>
            <div style={{fontSize:'10px',color:T.textS,marginTop:'2px'}}>{s.label}</div>
          </Card>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2fr 1fr',gap:isMobile?'14px':'20px',marginBottom:'20px'}}>
        <Card>
          <h4 style={{margin:'0 0 14px',fontSize:'14px'}}>Progresso da Equipe</h4>
          <ResponsiveContainer width="100%" height={isMobile?140:180}>
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fill:T.textS,fontSize:10}}/>
              <YAxis domain={[0,100]} tick={{fill:T.textS,fontSize:9}}/>
              <Tooltip contentStyle={{background:T.surf2,border:`1px solid ${T.border}`,borderRadius:8,color:T.text}}/>
              <Bar dataKey="pct" fill={T.gold} radius={[5,5,0,0]} name="Completude %"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h4 style={{margin:'0 0 14px',fontSize:'14px'}}>Por Área</h4>
          <div style={{maxHeight:isMobile?140:180,overflow:'auto'}}>
            {Object.entries(employees.reduce((acc,e)=>{const a=e.dept||'N/A';acc[a]=(acc[a]||0)+1;return acc;},{})).map(([area,count])=>(
              <div key={area} style={{display:'flex',justifyContent:'space-between',marginBottom:'6px',padding:'2px 0'}}>
                <span style={{fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,marginRight:'8px'}}>{area}</span>
                <Badge color={T.blue}>{count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
          <h4 style={{margin:0,fontSize:'14px'}}>Lista de Colaboradores</h4>
          <Button size="sm" onClick={()=>setScreen('m_employees')}>Ver todos →</Button>
        </div>
        {employees.slice(0,4).map(e=>{
          const res=allResults[e.id]||{};
          const done=['disc','bigFive','values','eq','interests'].filter(k=>!!res[k]).length;
          return (
            <div key={e.id} onClick={()=>{setSelectedEmployee(e);setScreen('m_employee_detail');}} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 0',borderBottom:`1px solid ${T.border}`,cursor:'pointer',flexWrap:'wrap'}}>
              <Avatar name={e.name} size={36}/>
              <div style={{flex:1,minWidth:'120px'}}>
                <div style={{fontSize:'13px',fontWeight:600}}>{e.name}</div>
                <div style={{fontSize:'11px',color:T.textM}}>{e.dept} · Equipe {e.equipe}</div>
              </div>
              <div style={{width:'80px'}}><Progress value={(done/totalTests)*100} color={T.teal} height={5}/></div>
              <span style={{fontSize:'11px',color:T.textS,minWidth:'28px'}}>{done}/{totalTests}</span>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

// ==================== MANAGER EMPLOYEES ====================
const ManagerEmployees = ({ users, allResults, allPDIs, setScreen, setSelectedEmployee, onResetTests, onDeleteUser }) => {
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterEquipe, setFilterEquipe] = useState('');
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const employees = users.filter(u=>u.role==='employee').filter(e=>{
    const ms=search===''||e.name.toLowerCase().includes(search.toLowerCase())||e.dept?.toLowerCase().includes(search.toLowerCase());
    return ms&&(filterArea===''||e.dept===filterArea)&&(filterEquipe===''||e.equipe===filterEquipe);
  });

  const handleResetPassword = async (user) => {
    try { await sendPasswordResetEmail(auth,user.email); showMessage(`Reset enviado para ${user.email}`,'success'); }
    catch { showMessage('Erro ao enviar reset','error'); }
  };
  const handleDelete = async (userId) => {
    if(window.confirm('Excluir este colaborador? Todos os dados serão perdidos.')) {
      const ok = await onDeleteUser(userId);
      if(ok) showMessage('Colaborador excluído!','success');
    }
  };

  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'1000px',margin:'0 auto'}}>
      <h2 style={{fontSize:isMobile?'18px':'22px',marginBottom:'16px'}}>👥 Colaboradores</h2>
      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'2fr 1fr 1fr',gap:'10px',marginBottom:'16px'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{background:T.surf,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'10px 14px',color:T.text,fontSize:'13px',outline:'none'}}/>
        <select value={filterArea} onChange={e=>setFilterArea(e.target.value)} style={{background:T.surf,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'10px 12px',color:T.text,fontSize:'13px',outline:'none'}}>
          <option value="">Todas as áreas</option>
          {AREAS.map(a=><option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterEquipe} onChange={e=>setFilterEquipe(e.target.value)} style={{background:T.surf,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'10px 12px',color:T.text,fontSize:'13px',outline:'none'}}>
          <option value="">Todas as equipes</option>
          {EQUIPES.map(q=><option key={q} value={q}>Equipe {q}</option>)}
        </select>
      </div>
      {employees.map(e=>{
        const res=allResults[e.id]||{};
        const done=['disc','bigFive','values','eq','interests'].filter(k=>!!res[k]).length;
        const pdi=allPDIs[e.id];
        const dp=res.disc&&Object.entries(res.disc.scores).sort((a,b)=>b[1]-a[1])[0];
        return (
          <Card key={e.id} style={{marginBottom:'10px',padding:isMobile?'12px':'16px'}}>
            <div style={{display:'flex',flexDirection:isMobile?'column':'row',alignItems:isMobile?'stretch':'center',gap:'12px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',flex:1}}>
                <Avatar name={e.name} size={isMobile?36:42} color={dp?DISC_PROFILES[dp[0]].color:T.gold}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',gap:'6px',alignItems:'center',marginBottom:'4px',flexWrap:'wrap'}}>
                    <span style={{fontWeight:700,fontSize:isMobile?'13px':'14px'}}>{e.name}</span>
                    {pdi&&<Badge color={pdi.status==='completed'?T.gold:T.green}>PDI</Badge>}
                    {dp&&<Badge color={DISC_PROFILES[dp[0]].color}>{dp[0]}</Badge>}
                  </div>
                  <div style={{fontSize:'11px',color:T.textM,marginBottom:'6px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.email} · {e.dept} · Equipe {e.equipe}</div>
                  <Progress value={(done/5)*100} color={T.teal} label={`${done}/5 testes`} height={5}/>
                </div>
              </div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap',justifyContent:isMobile?'flex-start':'flex-end'}}>
                <Button size="sm" onClick={()=>{setSelectedEmployee(e);setScreen('m_employee_detail');}}>Analisar</Button>
                <Button size="sm" variant="secondary" onClick={()=>{setSelectedEmployee(e);setScreen('m_pdi_editor');}}>PDI</Button>
                <Button size="sm" variant="secondary" onClick={()=>handleResetPassword(e)}>🔑</Button>
                <Button size="sm" variant="danger" onClick={()=>onResetTests(e.id)}>Reset</Button>
                <Button size="sm" variant="danger" onClick={()=>handleDelete(e.id)}>🗑️</Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// ==================== MANAGER EMPLOYEE DETAIL ====================
const ManagerEmployeeDetail = ({ employee, results, pdi, setScreen, setSelectedEmployee }) => {
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  if(!results||Object.keys(results).length===0){
    return (
      <div style={{padding:isMobile?'16px':'32px',maxWidth:'800px',margin:'0 auto'}}>
        <Button size="sm" variant="ghost" onClick={()=>setScreen('m_employees')} style={{marginBottom:'16px'}}>← Voltar</Button>
        <Card style={{textAlign:'center',padding:'40px 24px'}}>
          <div style={{fontSize:'40px',marginBottom:'12px'}}>📊</div>
          <p style={{color:T.textS}}>Este colaborador ainda não completou nenhum teste.</p>
        </Card>
      </div>
    );
  }
  const {disc,bigFive,values,eq,interests}=results;
  const dp=disc&&Object.entries(disc.scores).sort((a,b)=>b[1]-a[1])[0];
  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'1000px',margin:'0 auto'}}>
      <Button size="sm" variant="ghost" onClick={()=>setScreen('m_employees')} style={{marginBottom:'16px'}}>← Voltar</Button>
      <div style={{display:'flex',flexDirection:isMobile?'column':'row',alignItems:isMobile?'flex-start':'center',gap:'14px',marginBottom:'20px'}}>
        <Avatar name={employee.name} size={isMobile?40:50} color={dp?DISC_PROFILES[dp[0]].color:T.gold}/>
        <div style={{flex:1}}>
          <h2 style={{margin:'0 0 3px',fontSize:isMobile?'18px':'22px'}}>{employee.name}</h2>
          <p style={{margin:'0 0 6px',color:T.textS,fontSize:'12px'}}>{employee.dept} · {employee.pos} · Equipe {employee.equipe}</p>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
            {disc&&<Badge color={DISC_PROFILES[dp[0]].color}>DISC {dp[0]}</Badge>}
            {eq&&<Badge color={T.orange}>IE: {eq.scores.total}%</Badge>}
            {pdi&&<Badge color={pdi.status==='completed'?T.gold:T.green}>PDI {pdi.status==='completed'?'✓':''}</Badge>}
          </div>
        </div>
        <Button onClick={()=>{setSelectedEmployee(employee);setScreen('m_pdi_editor');}}>✏️ Editar PDI</Button>
      </div>
      <div className="grid-2" style={{marginBottom:'16px'}}>
        {disc&&(
          <Card>
            <h4 style={{margin:'0 0 12px',fontSize:'13px'}}>🧭 Perfil DISC</h4>
            <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'14px',flexWrap:'wrap'}}>
              <span style={{fontSize:'28px'}}>{DISC_PROFILES[dp[0]].icon}</span>
              <div>
                <div style={{fontWeight:800,fontSize:'17px',color:DISC_PROFILES[dp[0]].color}}>Perfil {dp[0]}</div>
                <div style={{fontSize:'12px',color:T.textS}}>{DISC_PROFILES[dp[0]].label}</div>
              </div>
            </div>
            {Object.entries(disc.scores).map(([k,v])=>(
              <div key={k} style={{marginBottom:'8px'}}><Progress value={v} label={`${k} — ${DISC_PROFILES[k].label}`} color={DISC_PROFILES[k].color} height={5}/></div>
            ))}
          </Card>
        )}
        {bigFive&&(
          <Card>
            <h4 style={{margin:'0 0 12px',fontSize:'13px'}}>🧠 Big Five</h4>
            {Object.entries(BF_LABELS).map(([k,v])=>{
              const sc=bigFive.scores[k];
              return <div key={k} style={{marginBottom:'8px'}}><Progress value={sc} label={v.label} color={sc>=70?T.green:sc>=40?T.teal:T.orange} height={5}/></div>;
            })}
          </Card>
        )}
      </div>
      <div className="grid-2" style={{marginBottom:'16px'}}>
        {eq&&(
          <Card>
            <h4 style={{margin:'0 0 12px',fontSize:'13px'}}>❤️ Int. Emocional</h4>
            <div style={{textAlign:'center',marginBottom:'10px'}}><span style={{fontSize:'30px',fontWeight:800,color:T.orange}}>{eq.scores.total}%</span></div>
            {['Autoconsciência','Autorregulação','Motivação','Empatia','Habilidades Sociais'].map(d=>(
              <div key={d} style={{marginBottom:'7px'}}><Progress value={eq.scores[d]||0} label={d} color={T.orange} height={5}/></div>
            ))}
          </Card>
        )}
        {values&&(
          <Card>
            <h4 style={{margin:'0 0 12px',fontSize:'13px'}}>💎 Valores</h4>
            {values.scores.slice(0,5).map((item,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:'12px',color:i<3?T.goldL:T.textS,fontWeight:i<3?700:400}}>{i<3?'★':' '} {item.v}</span>
                <span style={{fontSize:'12px',fontWeight:700,color:T.gold}}>{item.s}/5</span>
              </div>
            ))}
          </Card>
        )}
      </div>
      {interests&&(
        <Card style={{marginBottom:'16px'}}>
          <h4 style={{margin:'0 0 12px',fontSize:'13px'}}>🔭 Áreas de Interesse</h4>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
            {interests.scores.slice(0,6).map((item,i)=>(
              <div key={i} style={{background:T.surf2,borderRadius:'8px',padding:'7px 11px',border:`1px solid ${i<3?T.purple+'44':T.border}`}}>
                <div style={{fontSize:'11px',fontWeight:700,color:i<3?T.purpleL:T.textS}}>{item.area}</div>
                <div style={{fontSize:'10px',color:T.textM}}>{item.score}%</div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {pdi&&(
        <Card>
          <h4 style={{margin:'0 0 14px',fontSize:'13px'}}>📋 PDI Atual</h4>
          <div style={{marginBottom:'10px'}}><Badge color={pdi.status==='completed'?T.gold:T.green}>{pdi.status==='completed'?'Concluído':'Em andamento'}</Badge></div>
          {pdi.goals?.map((g,i)=>(
            <div key={i} style={{background:T.surf2,borderRadius:'8px',padding:'10px',marginBottom:'6px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                <span style={{fontWeight:600,fontSize:'12px'}}>{g.goal}</span>
                {g.status==='done'&&<Badge color={T.green}>✓</Badge>}
              </div>
              <Progress value={g.progress||0} color={g.status==='done'?T.green:T.teal} height={5}/>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

// ==================== MANAGER PDI LIST ====================
const ManagerPDIList = ({ users, allPDIs, setScreen, setSelectedEmployee }) => {
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const pdisList = allPDIs?Object.entries(allPDIs).map(([uid,p])=>({userId:uid,...p})).filter(p=>p.status):[];
  const active=pdisList.filter(p=>p.status==='active');
  const draft=pdisList.filter(p=>p.status==='draft');
  const completed=pdisList.filter(p=>p.status==='completed');

  const PdiCard = ({pdi,badgeColor,badgeLabel,actions}) => {
    const user=users.find(u=>u.id===pdi.userId);
    if(!user) return null;
    const goals=pdi.goals||[];
    const done=goals.filter(g=>g.status==='done').length;
    return (
      <Card style={{marginBottom:'12px',borderColor:badgeColor+'33',padding:isMobile?'14px':'20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px',flexWrap:'wrap',gap:'8px'}}>
          <div>
            <h3 style={{margin:'0 0 3px',fontSize:isMobile?'14px':'15px'}}>{user.name}</h3>
            <p style={{margin:0,fontSize:'11px',color:T.textM}}>{user.dept} · {user.pos} · Equipe {user.equipe}</p>
          </div>
          <Badge color={badgeColor}>{badgeLabel}</Badge>
        </div>
        {goals.length>0&&<Progress value={(done/(goals.length||1))*100} color={T.teal} label={`${done}/${goals.length} ações`} height={5}/>}
        <div style={{marginTop:'12px',display:'flex',gap:'8px',flexWrap:'wrap'}}>{actions}</div>
      </Card>
    );
  };

  if(pdisList.length===0){
    return (
      <div style={{padding:isMobile?'16px':'32px',maxWidth:'900px',margin:'0 auto'}}>
        <h2 style={{fontSize:isMobile?'18px':'22px',marginBottom:'20px'}}>📋 Gestão de PDIs</h2>
        <Card style={{textAlign:'center',padding:'48px 24px'}}>
          <div style={{fontSize:'48px',marginBottom:'12px'}}>📋</div>
          <h3 style={{color:T.textS,marginBottom:'8px'}}>Nenhum PDI criado ainda</h3>
          <p style={{color:T.textM,fontSize:'13px',marginBottom:'16px'}}>Acesse a lista de colaboradores para criar PDIs.</p>
          <Button onClick={()=>setScreen('m_employees')}>Ver Colaboradores</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'900px',margin:'0 auto'}}>
      <h2 style={{fontSize:isMobile?'18px':'22px',marginBottom:'20px'}}>📋 Gestão de PDIs</h2>
      {active.length>0&&<>
        <h3 style={{marginBottom:'10px',fontSize:'14px',color:T.greenL}}>🟢 PDIs Ativos</h3>
        {active.map(p=>(
          <PdiCard key={p.userId} pdi={p} badgeColor={T.green} badgeLabel="Ativo" actions={[
            <Button key="e" size="sm" onClick={()=>{setSelectedEmployee(users.find(u=>u.id===p.userId));setScreen('m_pdi_editor');}}>Editar PDI</Button>,
            <Button key="v" size="sm" variant="secondary" onClick={()=>{setSelectedEmployee(users.find(u=>u.id===p.userId));setScreen('m_employee_detail');}}>Ver Perfil</Button>
          ]}/>
        ))}
      </>}
      {draft.length>0&&<>
        <h3 style={{marginBottom:'10px',fontSize:'14px',color:T.blueL}}>📝 Rascunhos</h3>
        {draft.map(p=>(
          <PdiCard key={p.userId} pdi={p} badgeColor={T.blue} badgeLabel="Rascunho" actions={[
            <Button key="e" size="sm" onClick={()=>{setSelectedEmployee(users.find(u=>u.id===p.userId));setScreen('m_pdi_editor');}}>Continuar</Button>
          ]}/>
        ))}
      </>}
      {completed.length>0&&<>
        <h3 style={{marginBottom:'10px',fontSize:'14px',color:T.goldL}}>✅ Concluídos</h3>
        {completed.map(p=>(
          <PdiCard key={p.userId} pdi={p} badgeColor={T.gold} badgeLabel="Concluído" actions={[
            <Button key="e" size="sm" variant="secondary" onClick={()=>{setSelectedEmployee(users.find(u=>u.id===p.userId));setScreen('m_pdi_editor');}}>Reabrir</Button>,
            <Button key="v" size="sm" variant="secondary" onClick={()=>{setSelectedEmployee(users.find(u=>u.id===p.userId));setScreen('m_employee_detail');}}>Ver Perfil</Button>
          ]}/>
        ))}
      </>}
    </div>
  );
};

// ==================== MANAGER MESSAGES ====================
const ManagerMessages = ({ users, onSendMessage }) => {
  const [to, setTo] = useState('all');
  const [type, setType] = useState('announcement');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const employees = users.filter(u=>u.role==='employee');

  const handleSend = () => {
    if(!message.trim()) return;
    const targets = to==='all'?employees.map(e=>e.id):[to];
    targets.forEach(tid=>onSendMessage({id:generateId(),toUserId:tid,type,message,fromName:'Gestor',createdAt:new Date().toISOString(),read:false}));
    setSent(true); setMessage('');
    setTimeout(()=>setSent(false),2500);
  };

  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:isMobile?'18px':'22px',marginBottom:'20px'}}>📬 Enviar Aviso ou Feedback</h2>
      <Card>
        <div style={{marginBottom:'14px'}}>
          <label style={{display:'block',marginBottom:'5px',fontSize:'12px',color:T.textS,fontWeight:600}}>Destinatário</label>
          <select value={to} onChange={e=>setTo(e.target.value)} style={{width:'100%',background:T.surf2,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'11px 14px',color:T.text,fontSize:'13px',outline:'none'}}>
            <option value="all">Todos os Colaboradores</option>
            {employees.map(e=><option key={e.id} value={e.id}>{e.name} ({e.dept} · Equipe {e.equipe})</option>)}
          </select>
        </div>
        <div style={{marginBottom:'14px'}}>
          <label style={{display:'block',marginBottom:'5px',fontSize:'12px',color:T.textS,fontWeight:600}}>Tipo</label>
          <div style={{display:'flex',gap:'6px'}}>
            {[{v:'announcement',l:'📣 Aviso'},{v:'feedback',l:'💬 Feedback'},{v:'warning',l:'⚠️ Atenção'}].map(t=>(
              <button key={t.v} onClick={()=>setType(t.v)} style={{
                flex:1,padding:'9px 6px',borderRadius:'8px',
                border:`1.5px solid ${type===t.v?T.gold:T.border}`,
                background:type===t.v?T.gold+'22':'transparent',
                color:type===t.v?T.gold:T.textS,cursor:'pointer',
                fontSize:isMobile?'11px':'13px',fontWeight:700,fontFamily:'Inter,sans-serif',
              }}>{t.l}</button>
            ))}
          </div>
        </div>
        <Textarea label="Mensagem" value={message} onChange={setMessage} rows={isMobile?4:5} placeholder="Escreva sua mensagem..."/>
        <div style={{display:'flex',gap:'12px',alignItems:'center',flexWrap:'wrap'}}>
          <Button onClick={handleSend} disabled={!message.trim()}>Enviar Mensagem</Button>
          {sent&&<Badge color={T.green}>✓ Enviado!</Badge>}
        </div>
      </Card>
    </div>
  );
};

// ==================== MANAGER REPORTS ====================
const ManagerReports = ({ users, allResults, allPDIs, allNotifications }) => {
  const { width } = useWindowSize();
  const isMobile = width <= 768;
  const employees = users.filter(u=>u.role==='employee');
  const testKeys=['disc','bigFive','values','eq','interests'];
  const testNames={disc:'DISC',bigFive:'Big Five',values:'Valores',eq:'IE',interests:'Interesses'};
  const completionByTest = testKeys.map(k=>({name:testNames[k],done:employees.filter(e=>(allResults[e.id]||{})[k]).length}));
  const discDistrib={D:0,I:0,S:0,C:0};
  employees.forEach(e=>{const d=(allResults[e.id]||{}).disc;if(d){const p=Object.entries(d.scores).sort((a,b)=>b[1]-a[1])[0];discDistrib[p[0]]++;}});
  const discChart=Object.entries(discDistrib).map(([k,v])=>({name:`${k}`,value:v,fill:DISC_PROFILES[k].color}));
  const avgEQ=(()=>{const es=employees.map(e=>(allResults[e.id]||{})?.eq?.scores?.total).filter(Boolean);return es.length?Math.round(es.reduce((a,b)=>a+b,0)/es.length):0;})();
  const topInterests=(()=>{const cnt={};employees.forEach(e=>{const i=(allResults[e.id]||{}).interests;if(i)i.scores.slice(0,3).forEach(a=>{cnt[a.area]=(cnt[a.area]||0)+1;});});return Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,5);})();
  const msgStats=(()=>{let s=0,r=0;employees.forEach(e=>{const n=allNotifications[e.id]||[];s+=n.length;r+=n.filter(x=>x.read).length;});return {totalSent:s,totalRead:r,readRate:s?Math.round(r/s*100):0};})();

  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'1200px',margin:'0 auto'}}>
      <h2 style={{fontSize:isMobile?'18px':'22px',marginBottom:'20px'}}>📋 Relatórios da Equipe</h2>
      <div className="grid-2" style={{marginBottom:'16px'}}>
        <Card>
          <h4 style={{margin:'0 0 14px',fontSize:'13px'}}>Completude por Teste</h4>
          <ResponsiveContainer width="100%" height={isMobile?140:180}>
            <BarChart data={completionByTest}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fill:T.textS,fontSize:10}}/>
              <YAxis tick={{fill:T.textS,fontSize:9}}/>
              <Tooltip contentStyle={{background:T.surf2,border:`1px solid ${T.border}`,borderRadius:8,color:T.text}}/>
              <Bar dataKey="done" fill={T.teal} radius={[4,4,0,0]} name="Concluídos"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h4 style={{margin:'0 0 14px',fontSize:'13px'}}>Distribuição DISC</h4>
          <ResponsiveContainer width="100%" height={isMobile?140:180}>
            <PieChart>
              <Pie data={discChart} cx="50%" cy="50%" outerRadius={isMobile?50:70} dataKey="value">
                {discChart.map((e,i)=><Cell key={i} fill={e.fill}/>)}
              </Pie>
              <Tooltip contentStyle={{background:T.surf2,border:`1px solid ${T.border}`,borderRadius:8,color:T.text}}/>
              <Legend wrapperStyle={{color:T.textS,fontSize:10}}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div className="grid-2">
        <Card>
          <h4 style={{margin:'0 0 14px',fontSize:'13px'}}>💡 Top Interesses da Equipe</h4>
          {topInterests.map(([area,count],i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
              <div style={{width:'22px',height:'22px',borderRadius:'50%',background:T.purple+'22',color:T.purpleL,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:800,flexShrink:0}}>{i+1}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:'12px',fontWeight:600,marginBottom:'3px'}}>{area}</div>
                <Progress value={(count/employees.length)*100} color={T.purple} height={4}/>
              </div>
              <span style={{fontSize:'11px',color:T.textS,flexShrink:0}}>{count}</span>
            </div>
          ))}
        </Card>
        <Card>
          <h4 style={{margin:'0 0 14px',fontSize:'13px'}}>📊 Indicadores Gerais</h4>
          {[
            {label:'IE Média da Equipe',value:`${avgEQ}%`,color:T.orange},
            {label:'Colaboradores com PDI',value:`${employees.filter(e=>allPDIs[e.id]).length}/${employees.length}`,color:T.green},
            {label:'PDIs Concluídos',value:`${employees.filter(e=>allPDIs[e.id]?.status==='completed').length}/${employees.length}`,color:T.gold},
            {label:'Mensagens Enviadas',value:msgStats.totalSent,color:T.blue},
            {label:'Taxa de Leitura',value:`${msgStats.readRate}%`,color:T.teal},
          ].map((item,i)=>(
            <div key={i} style={{background:T.surf2,borderRadius:'10px',padding:'11px 14px',marginBottom:'7px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'12px',color:T.textS}}>{item.label}</span>
              <span style={{fontWeight:800,fontSize:'15px',color:item.color}}>{item.value}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ==================== MANAGER PDI EDITOR ====================
const ManagerPDIEditor = ({ employee, pdi, onSave, onBack }) => {
  const [status, setStatus] = useState(pdi?.status||'draft');
  const [strengths, setStrengths] = useState((pdi?.strengths||[]).join('\n'));
  const [improvements, setImprovements] = useState((pdi?.improvements||[]).join('\n'));
  const [notes, setNotes] = useState(pdi?.notes||'');
  const [goals, setGoals] = useState(pdi?.goals||[
    {goal:'Melhorar comunicação em reuniões',deadline:'',progress:0,status:'active',actions:['Participar de treinamento de comunicação']},
    {goal:'Desenvolver habilidades de liderança',deadline:'',progress:0,status:'active',actions:['Buscar feedback da equipe']},
  ]);
  const { width } = useWindowSize();
  const isMobile = width <= 768;

  const addGoal=()=>setGoals(g=>[...g,{goal:'',deadline:'',progress:0,status:'active',actions:['']}]);
  const updateGoal=(i,f,v)=>setGoals(g=>g.map((item,idx)=>idx===i?{...item,[f]:v}:item));
  const removeGoal=i=>setGoals(g=>g.filter((_,idx)=>idx!==i));
  const addAction=i=>{const ng=[...goals];ng[i].actions=[...(ng[i].actions||[]),''];setGoals(ng);};
  const updateAction=(gi,ai,v)=>{const ng=[...goals];ng[gi].actions[ai]=v;setGoals(ng);};
  const removeAction=(gi,ai)=>{const ng=[...goals];ng[gi].actions=ng[gi].actions.filter((_,idx)=>idx!==ai);setGoals(ng);};

  const handleSave=()=>onSave({status,strengths:strengths.split('\n').filter(Boolean),improvements:improvements.split('\n').filter(Boolean),notes,goals:goals.map(g=>({...g,actions:(g.actions||[]).filter(Boolean)})),updatedAt:new Date().toISOString()});

  return (
    <div style={{padding:isMobile?'16px':'32px',maxWidth:'800px',margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
        <Button size="sm" variant="ghost" onClick={onBack}>← Voltar</Button>
        <h2 style={{margin:0,fontSize:isMobile?'17px':'20px'}}>PDI — {employee?.name}</h2>
      </div>
      <div style={{display:'flex',gap:'6px',marginBottom:'16px',flexWrap:'wrap'}}>
        {['draft','active','completed'].map(s=>(
          <button key={s} onClick={()=>setStatus(s)} style={{
            padding:'7px 14px',borderRadius:'8px',
            border:`1.5px solid ${status===s?(s==='active'?T.green:s==='completed'?T.gold:T.blue):T.border}`,
            background:status===s?(s==='active'?T.green+'22':s==='completed'?T.gold+'22':T.blue+'22'):'transparent',
            color:status===s?(s==='active'?T.greenL:s==='completed'?T.gold:T.blueL):T.textS,
            cursor:'pointer',fontSize:'12px',fontWeight:700,fontFamily:'Inter,sans-serif',
          }}>
            {s==='draft'?'Rascunho':s==='active'?'Ativo':'Concluído'}
          </button>
        ))}
      </div>
      <div className="grid-2" style={{marginBottom:'14px'}}>
        <Textarea label="💪 Pontos Fortes (um por linha)" value={strengths} onChange={setStrengths} rows={isMobile?4:5} placeholder="Comunicação eficaz"/>
        <Textarea label="🌱 A Desenvolver (um por linha)" value={improvements} onChange={setImprovements} rows={isMobile?4:5} placeholder="Gestão do tempo"/>
      </div>
      <Card style={{marginBottom:'14px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
          <h4 style={{margin:0,fontSize:'13px'}}>🎯 Metas e Objetivos</h4>
          <Button size="sm" variant="secondary" onClick={addGoal}>+ Adicionar Meta</Button>
        </div>
        {goals.map((g,i)=>(
          <div key={i} style={{background:T.surf2,borderRadius:'12px',padding:isMobile?'12px':'14px',marginBottom:'10px',border:`1px solid ${T.border}`}}>
            <div style={{display:'flex',gap:'8px',marginBottom:'8px',flexWrap:'wrap'}}>
              <input value={g.goal} onChange={e=>updateGoal(i,'goal',e.target.value)} placeholder="Descrição da meta..." style={{flex:2,minWidth:'160px',background:T.bg,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'8px 12px',color:T.text,fontSize:'13px',outline:'none'}}/>
              <input type="date" value={g.deadline} onChange={e=>updateGoal(i,'deadline',e.target.value)} style={{flex:1,minWidth:'130px',background:T.bg,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'8px 12px',color:T.text,fontSize:'13px',outline:'none'}}/>
              <Button size="sm" variant="danger" onClick={()=>removeGoal(i)}>✕</Button>
            </div>
            <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'8px',flexWrap:'wrap'}}>
              <span style={{fontSize:'11px',color:T.textS}}>Progresso:</span>
              <input type="range" min="0" max="100" value={g.progress||0} onChange={e=>updateGoal(i,'progress',Number(e.target.value))} style={{flex:1,accentColor:T.teal}}/>
              <span style={{fontSize:'12px',fontWeight:700,color:T.teal,minWidth:'34px'}}>{g.progress||0}%</span>
              <select value={g.status} onChange={e=>updateGoal(i,'status',e.target.value)} style={{background:T.surf,border:`1px solid ${T.border}`,borderRadius:'6px',padding:'4px 8px',color:T.text,fontSize:'11px',outline:'none'}}>
                <option value="active">Em andamento</option>
                <option value="done">Concluída</option>
              </select>
            </div>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                <span style={{fontSize:'11px',color:T.textS,fontWeight:600}}>Ações:</span>
                <Button size="sm" variant="secondary" onClick={()=>addAction(i)}>+</Button>
              </div>
              {(g.actions||['']).map((action,ai)=>(
                <div key={ai} style={{display:'flex',gap:'6px',marginBottom:'4px'}}>
                  <input value={action} onChange={e=>updateAction(i,ai,e.target.value)} placeholder="Descreva a ação..." style={{flex:1,background:T.bg,border:`1px solid ${T.border}`,borderRadius:'6px',padding:'6px 10px',color:T.text,fontSize:'12px',outline:'none'}}/>
                  {(g.actions||[]).length>1&&<Button size="sm" variant="danger" onClick={()=>removeAction(i,ai)}>✕</Button>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>
      <Textarea label="💬 Notas do Gestor" value={notes} onChange={setNotes} rows={3} placeholder="Observações gerais..."/>
      <Button onClick={handleSave} fullWidth>💾 Salvar PDI</Button>
    </div>
  );
};

// ==================== MAIN APP ====================
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('login');
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState({});
  const [pdis, setPdis] = useState({});
  const [notifications, setNotifications] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { injectGlobalStyles(); }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fu) => {
      if(fu){
        const ud=await getDoc(doc(db,'users',fu.uid));
        if(ud.exists()){
          setUser({id:fu.uid,...ud.data()});
          setScreen(ud.data().role==='manager'?'m_home':'e_home');
        }
      }
      setLoading(false);
    });
    return ()=>unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      const au = await loadAllUsers();
      setUsers(au);
      const rm={},pm={},nm={};
      for(const u of au.filter(u=>u.role==='employee')){
        const r=await loadUserResults(u.id);
        if(Object.keys(r).length>0) rm[u.id]=r;
        const p=await loadPDI(u.id);
        if(p) pm[u.id]=p;
        const n=await loadNotifications(u.id);
        if(n.length>0) nm[u.id]=n;
      }
      setResults(rm); setPdis(pm); setNotifications(nm);
    };
    load();
  }, []);

  const handleSaveResult = useCallback(async (uid,key,data) => {
    await saveTestResult(uid,key,data);
    setResults(p=>({...p,[uid]:{...(p[uid]||{}),[key]:data}}));
    showMessage('Teste salvo!','success');
  }, []);

  const handleSavePDI = useCallback(async (uid,data) => {
    const d={...data,userId:uid,createdAt:pdis[uid]?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
    await savePDI(uid,d);
    setPdis(p=>({...p,[uid]:d}));
    showMessage('PDI salvo!','success');
  }, [pdis]);

  const handleSendMessage = useCallback(async (msg) => {
    await saveNotification(msg.toUserId,msg);
    setNotifications(p=>({...p,[msg.toUserId]:[msg,...(p[msg.toUserId]||[])]}));
    showMessage('Mensagem enviada!','success');
  }, []);

  const handleMarkRead = useCallback(async (uid,msgId) => {
    await markNotificationAsRead(uid,msgId);
    setNotifications(p=>({...p,[uid]:(p[uid]||[]).map(n=>n.id===msgId?{...n,read:true,readAt:new Date().toISOString()}:n)}));
  }, []);

  const handleDeleteNotification = useCallback(async (uid,msgId) => {
    if(window.confirm('Excluir esta mensagem?')){
      await deleteNotification(uid,msgId);
      setNotifications(p=>({...p,[uid]:(p[uid]||[]).filter(n=>n.id!==msgId)}));
    }
  }, []);

  const handleResetTests = useCallback(async (uid) => {
    if(window.confirm('Reiniciar todos os testes deste colaborador?')){
      await deleteUserResults(uid);
      setResults(p=>{const n={...p};delete n[uid];return n;});
      showMessage('Testes reiniciados!','success');
    }
  }, []);

  const handleDeleteUser = useCallback(async (uid) => {
    const ok=await deleteUser(uid);
    if(ok){
      setUsers(p=>p.filter(u=>u.id!==uid));
      setResults(p=>{const n={...p};delete n[uid];return n;});
      setPdis(p=>{const n={...p};delete n[uid];return n;});
      setNotifications(p=>{const n={...p};delete n[uid];return n;});
    }
    return ok;
  }, []);

  const handleMarkGoalDone = useCallback(async (uid,gi) => {
    const pdi=pdis[uid]; if(!pdi) return;
    const ng=[...pdi.goals];
    ng[gi]={...ng[gi],status:'done',progress:100};
    const newStatus=ng.every(g=>g.status==='done')?'completed':pdi.status;
    const updated={...pdi,goals:ng,status:newStatus,updatedAt:new Date().toISOString()};
    await savePDI(uid,updated);
    setPdis(p=>({...p,[uid]:updated}));
    showMessage('Meta concluída!','success');
  }, [pdis]);

  const handleLogin = (ud) => {
    setUser(ud);
    setScreen(ud.role==='manager'?'m_home':'e_home');
    showMessage(`Bem-vindo, ${ud.name}!`,'success');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setScreen('login');
  };

  if(loading){
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100dvh',flexDirection:'column',gap:'16px',background:T.bg}}>
        <div style={{fontSize:'48px'}}>⚓</div>
        <Spinner/>
        <div style={{color:T.textS,fontSize:'13px'}}>Carregando sistema...</div>
      </div>
    );
  }

  if(!user||screen==='login') return <LoginScreen onLogin={handleLogin}/>;

  if(user.role==='employee'){
    const myResults=results[user.id]||{};
    const myPDI=pdis[user.id]||null;
    const myNotifs=notifications[user.id]||[];
    const unread=myNotifs.filter(n=>!n.read).length;

    const renderScreen=()=>{
      switch(screen){
        case 'e_home': return <EmployeeHome user={user} results={myResults} pdi={myPDI} notifications={myNotifs} setScreen={setScreen}/>;
        case 'e_disc': return <DiscTest existing={myResults.disc} onComplete={d=>handleSaveResult(user.id,'disc',d)}/>;
        case 'e_bigfive': return <BigFiveTest existing={myResults.bigFive} onComplete={d=>handleSaveResult(user.id,'bigFive',d)}/>;
        case 'e_values': return <ValuesTest existing={myResults.values} onComplete={d=>handleSaveResult(user.id,'values',d)}/>;
        case 'e_eq': return <EQTest existing={myResults.eq} onComplete={d=>handleSaveResult(user.id,'eq',d)}/>;
        case 'e_interests': return <InterestsTest existing={myResults.interests} onComplete={d=>handleSaveResult(user.id,'interests',d)}/>;
        case 'e_profile': return <EmployeeProfile results={myResults}/>;
        case 'e_pdi': return <EmployeePDI pdi={myPDI} onMarkGoalDone={i=>handleMarkGoalDone(user.id,i)}/>;
        case 'e_notif': return <EmployeeNotifications notifications={myNotifs} onMarkRead={id=>handleMarkRead(user.id,id)} onDelete={id=>handleDeleteNotification(user.id,id)}/>;
        default: return <EmployeeHome user={user} results={myResults} pdi={myPDI} notifications={myNotifs} setScreen={setScreen}/>;
      }
    };

    return (
      <div className="ph-layout">
        <EmployeeSidebar screen={screen} setScreen={setScreen} user={user} unread={unread}/>
        <EmployeeMobileNav screen={screen} setScreen={setScreen} unread={unread} onLogout={handleLogout}/>
        <div className="ph-main">
          <div className="ph-topbar" style={{display:'flex',justifyContent:'flex-end',padding:'10px 24px',borderBottom:`1px solid ${T.border}`,background:T.surf,position:'sticky',top:0,zIndex:10}}>
            <Button size="sm" variant="ghost" onClick={handleLogout}>Sair →</Button>
          </div>
          <div className="fade-in">
            {renderScreen()}
          </div>
        </div>
      </div>
    );
  }

  // Manager
  return (
    <div className="ph-layout">
      <ManagerSidebar screen={screen} setScreen={setScreen} user={user}/>
      <ManagerMobileNav screen={screen} setScreen={setScreen} onLogout={handleLogout}/>
      <div className="ph-main">
        <div className="ph-topbar" style={{display:'flex',justifyContent:'flex-end',padding:'10px 24px',borderBottom:`1px solid ${T.border}`,background:T.surf,position:'sticky',top:0,zIndex:10}}>
          <Button size="sm" variant="ghost" onClick={handleLogout}>Sair →</Button>
        </div>
        <div className="fade-in">
          {screen==='m_home'&&<ManagerDashboard users={users} allResults={results} allPDIs={pdis} allNotifications={notifications} setScreen={setScreen} setSelectedEmployee={setSelectedEmployee}/>}
          {screen==='m_employees'&&<ManagerEmployees users={users} allResults={results} allPDIs={pdis} setScreen={setScreen} setSelectedEmployee={setSelectedEmployee} onResetTests={handleResetTests} onDeleteUser={handleDeleteUser}/>}
          {screen==='m_employee_detail'&&selectedEmployee&&<ManagerEmployeeDetail employee={selectedEmployee} results={results[selectedEmployee.id]||{}} pdi={pdis[selectedEmployee.id]} setScreen={setScreen} setSelectedEmployee={setSelectedEmployee}/>}
          {screen==='m_pdis'&&<ManagerPDIList users={users} allPDIs={pdis} setScreen={setScreen} setSelectedEmployee={setSelectedEmployee}/>}
          {screen==='m_pdi_editor'&&selectedEmployee&&<ManagerPDIEditor employee={selectedEmployee} pdi={pdis[selectedEmployee.id]} onSave={d=>handleSavePDI(selectedEmployee.id,d)} onBack={()=>setScreen('m_pdis')}/>}
          {screen==='m_messages'&&<ManagerMessages users={users} onSendMessage={handleSendMessage}/>}
          {screen==='m_reports'&&<ManagerReports users={users} allResults={results} allPDIs={pdis} allNotifications={notifications}/>}
        </div>
      </div>
    </div>
  );
}
