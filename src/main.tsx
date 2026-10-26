import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2,
  ClipboardList, Download, Leaf, Printer, RefreshCw, RotateCcw, Save,
  ShieldCheck, Ticket, TriangleAlert, Wallet, X
} from 'lucide-react';
import { scenarios, groups, roles, events } from './data';
import './style.css';

type Activity = { timestamp: string; text: string };
type FormState = {
  scenario: number;
  foods: string[];
  meals: { breakfast: string; lunch: string; dinner: string };
  role: number;
  adjustment: string;
  event: number;
  alternative: string;
  criteria: string[];
  service: string;
  reflection: string;
  outside: string;
  threeDay: string;
  indicator: string;
  difficulty: string;
  countermeasure: string;
  logs: Activity[];
};
const STORE = 'family-food-step-pages-v1';
const EMPTY: FormState = {
  scenario: -1, foods: [], meals: {breakfast:'', lunch:'', dinner:''},
  role: -1, adjustment:'', event:-1, alternative:'', criteria:[], service:'',
  reflection:'', outside:'', threeDay:'', indicator:'', difficulty:'',
  countermeasure:'', logs:[]
};
const TITLES = ['가족의 요청', '식사 구성하기', '직무 선택하기', '돌발 상황 대응하기', '성찰과 다음 단계'];
const QUESTIONS = [
  '우리 가족의 식생활 요청은 무엇일까?',
  '우리 가족에게 알맞은 식사는 어떻게 구성할까?',
  '어떤 직무의 관점으로 식생활 문제를 해결할까?',
  '식재료의 가격과 공급이 달라지면 어떻게 할까?',
  '가족이 실천할 일과 외부 지원이 필요한 일은 무엇일까?'
];
const asset = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
const mealNames: {id:keyof FormState['meals']; label:string; hint:string}[] = [
  {id:'breakfast',label:'아침',hint:'예: 달걀밥과 과일'},
  {id:'lunch',label:'점심',hint:'예: 두부채소비빔밥'},
  {id:'dinner',label:'저녁',hint:'예: 고등어구이와 나물'}
];
const readSaved = (): FormState => {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return EMPTY;
    const data = JSON.parse(raw) as Partial<FormState>;
    return { ...EMPTY, ...data, meals: {...EMPTY.meals,...data.meals}, logs: Array.isArray(data.logs) ? data.logs : [] };
  } catch { return EMPTY; }
};
const getStepFromUrl = () => {
  const match = window.location.hash.match(/^#\/step\/(\d)$/);
  return match ? Math.min(5,Math.max(1,Number(match[1]))) : 1;
};

function App() {
  const [state,setState] = useState<FormState>(readSaved);
  const [step,setStep] = useState(getStepFromUrl);
  const [recordOpen,setRecordOpen] = useState(false);
  const [ticketOpen,setTicketOpen] = useState(false);
  const [notice,setNotice] = useState('');
  const selectedScenario = state.scenario >= 0 ? scenarios[state.scenario] : null;
  const selectedFoods = useMemo(() => groups.flatMap(g=>g.items).filter(i=>state.foods.includes(i.name)),[state.foods]);
  const foodCost = selectedFoods.reduce((sum,food)=>sum+food.price,0);
  const basicGroups = groups.slice(0,5);
  const coveredGroups = groups.filter(g=>g.items.some(food=>state.foods.includes(food.name))).length;
  const budget = selectedScenario?.budget ?? 30000;
  const selectedRole = state.role >= 0 ? roles[state.role] : null;
  const selectedEvent = state.event >= 0 ? events[state.event] : null;
  const completed = [
    state.scenario >= 0,
    basicGroups.every(g=>g.items.some(item=>state.foods.includes(item.name))) && Object.values(state.meals).some(v=>v.trim().length>0),
    state.role >= 0 && !!state.adjustment.trim(),
    state.event >= 0 && !!state.alternative && state.criteria.length>0 && !!state.service,
    !!state.reflection.trim() && !!state.outside.trim() && !!state.threeDay.trim() && !!state.indicator.trim() && !!state.difficulty.trim() && !!state.countermeasure.trim()
  ];
  const score = completed.filter(Boolean).length;
  const update = (values: Partial<FormState>) => setState(v=>({...v,...values}));
  const showNotice = (message: string) => {setNotice(message); window.setTimeout(()=>setNotice(''),3200)};
  useEffect(()=>localStorage.setItem(STORE,JSON.stringify(state)),[state]);
  useEffect(()=>{
    const fromHash = ()=>setStep(getStepFromUrl());
    window.addEventListener('hashchange',fromHash);
    window.addEventListener('popstate',fromHash);
    return ()=>{window.removeEventListener('hashchange',fromHash);window.removeEventListener('popstate',fromHash);};
  },[]);
  const navigate = (page:number)=>{
    if(page<1||page>5)return;
    setStep(page);
    window.history.pushState(null,'',`#/step/${page}`);
    window.scrollTo({top:0,behavior:'auto'});
    document.title=`${page}단계 ${TITLES[page-1]} | 건강하고 지속가능한 식생활 설계`;
  };
  const saveLog = (text:string)=>{update({logs:[{timestamp:new Date().toLocaleString('ko-KR'),text},...state.logs]});showNotice('나의 활동 기록에 저장했어요.');};
  const toggleFood = (food:string)=>update({foods:state.foods.includes(food)?state.foods.filter(f=>f!==food):[...state.foods,food]});
  const download = ()=>{
    const data = [
      '건강하고 지속가능한 식생활 설계 — 나의 활동 기록',
      `가족 요청: ${selectedScenario?.title ?? '미선택'}`,
      `가족 조건: 예산 ${won(budget)}, 조리 ${selectedScenario?.minutes ?? '-'}분, 알레르기 ${selectedScenario?.allergy ?? '-'}`,
      `식재료: ${state.foods.join(', ')}`,
      `식비 예상: ${won(foodCost)}`,
      ...mealNames.map(m=>`${m.label}: ${state.meals[m.id]}`),
      `선택 직무: ${selectedRole?.title ?? '미선택'}`,
      `직무 조정안: ${state.adjustment}`,
      `돌발 상황: ${selectedEvent?.title ?? '미선택'}`,
      `대체 방안: ${state.alternative}`,
      `판단 기준: ${state.criteria.join(', ')}`,
      `도움받을 서비스: ${state.service}`,
      `가족 실천: ${state.reflection}`,
      `외부 지원: ${state.outside}`,
      `3일 실천 행동: ${state.threeDay}`,
      `확인 지표: ${state.indicator}`,
      `예상 어려움: ${state.difficulty}`,
      `대응책: ${state.countermeasure}`
    ].join('\n');
    const url = URL.createObjectURL(new Blob([data],{type:'text/plain;charset=utf-8'}));
    const a = document.createElement('a'); a.href=url; a.download='건강하고-지속가능한-식생활-설계-활동기록.txt';a.click();
    URL.revokeObjectURL(url);
  };
  return <div className="app-shell">
    <header className="site-header">
      <div className="header-content">
        <button className="site-brand" onClick={()=>navigate(1)} aria-label="1단계로 돌아가기"><Leaf size={22} aria-hidden="true"/><span>건강하고 지속가능한 식생활 설계</span></button>
        <div className="header-right"><span className="completion-count">학습 진행 {score}/5</span><button className="record-button" onClick={()=>setRecordOpen(true)}><ClipboardList size={18} aria-hidden="true"/> 나의 기록</button></div>
      </div>
    </header>
    <section className="storybook-hero" aria-label="건강하고 지속가능한 식생활 설계 소개">
      <div className="hero-composition">
        <img className="hero-illustration hero-learner" src={asset('hero-student.webp')} alt="숲길을 탐험하는 중학생과 강아지"/>
        <div className="hero-main-copy"><p className="hero-eyebrow">STORYBOOK FOOD MISSION</p><h1>건강하고 지속가능한<br/><span>식생활 설계</span></h1><p className="hero-caption">우리 가족의 식생활을 바꾸는 다섯 가지 미션</p></div>
        <img className="hero-illustration hero-countryside" src={asset('hero-village.webp')} alt="꽃과 나무가 어우러진 동화 속 마을"/>
      </div>
    </section>
    <main className="main-area">
      <nav className="step-nav" aria-label="학습 단계 선택">
        {TITLES.map((name,i)=> <button key={name} onClick={()=>navigate(i+1)} aria-current={step===i+1?'step':undefined} className={`step-tab ${step===i+1?'is-current':''} ${completed[i]?'is-complete':''}`}>
          <span className="step-bubble">{completed[i]?<Check size={19} strokeWidth={3} aria-label="완료"/>:i+1}</span>
          <span className="step-label"><small>STEP {i+1}</small>{name}</span>
          {completed[i]&&<span className="tiny-clear">CLEAR</span>}
        </button>)}
      </nav>
      <div className="scene-shell" key={step}>
        <header className="scene-heading">
          <span className="scene-number">{step}</span>
          <div><span className="scene-overline">MISSION {step} / 5</span><h2>{TITLES[step-1]}</h2><p>{QUESTIONS[step-1]}</p></div>
          <span className={`big-clear ${completed[step-1]?'visible':''}`} aria-label={completed[step-1]?'미션 완료':'미션 미완료'}>{completed[step-1]?'CLEAR':'진행 중'}</span>
        </header>
        {step===1&&<section className="scene-body step-one" aria-label="1단계 가족의 요청">
          <div className="intro-strip"><BookOpen size={19}/><span>10가지 가족의 요청 중 하나를 선택하거나 랜덤 미션을 뽑으세요.</span><button className="secondary-action" onClick={()=>{let next=Math.floor(Math.random()*scenarios.length);if(next===state.scenario)next=(next+1)%scenarios.length;update({scenario:next});}}><RefreshCw size={17}/> 랜덤 선택</button></div>
          <div className="request-grid">{scenarios.map((item,i)=><button type="button" key={item.title} aria-pressed={state.scenario===i} className={`request-card ${state.scenario===i?'selected':''}`} onClick={()=>update({scenario:i})}>
            <div className="request-illustration"><img src={asset(`request-art-${i}.webp`)} alt="" loading="lazy"/></div>
            <strong>{item.title}</strong><span className="request-desc">{item.desc}</span>{state.scenario===i&&<span className="check-mark"><Check size={16}/></span>}
          </button>)}</div>
          {selectedScenario?<div className="decision-note"><ShieldCheck size={20}/><div><strong>선택한 가족의 요청</strong><p>{selectedScenario.request}</p><div className="condition-tags"><span>예산 {won(selectedScenario.budget)}</span><span>조리 시간 {selectedScenario.minutes}분</span><span>알레르기 {selectedScenario.allergy}</span><span>선호: {selectedScenario.preference}</span></div></div></div>:<p className="empty-hint">가족 요청 카드를 선택하면 조건이 표시됩니다.</p>}
        </section>}
        {step===2&&<section className="scene-body" aria-label="2단계 식사 구성하기">
          <div className="condition-banner"><Leaf size={22}/><div><strong>{selectedScenario?.title ?? '가족 요청이 아직 선택되지 않았습니다.'}</strong><p>예산 {won(budget)} · 조리 {selectedScenario?.minutes??'-'}분 · 알레르기 {selectedScenario?.allergy??'-'} · 선호 {selectedScenario?.preference??'-'}</p></div>{!selectedScenario&&<button onClick={()=>navigate(1)}>1단계에서 선택</button>}</div>
          <div className="section-mini-heading"><h3>식품군별 식재료 선택하기</h3><p>6가지 식품군 중 골고루 선택해 보세요. 유지·당류는 적당한 사용을 고려하세요.</p></div>
          <div className="food-grid">{groups.map(g=><article key={g.id} className={`food-card ${g.className}`}>
            <div className="food-card-head"><div className="food-illustration"><img src={asset(g.illustration)} alt="" loading="lazy"/></div><div><h4>{g.name}</h4><p>{g.desc}</p></div></div>
            <div className="food-picks">{g.items.map(food=><button type="button" key={food.name} aria-pressed={state.foods.includes(food.name)} className={state.foods.includes(food.name)?'selected':''} onClick={()=>toggleFood(food.name)}><span>{food.name}</span>{state.foods.includes(food.name)&&<Check size={14}/>}</button>)}</div>
          </article>)}</div>
          <div className="meal-planning"><div className="section-mini-heading"><h3>하루 식사 초안 만들기</h3><p>가족의 생활 시간과 조리 부담을 고려하여 직접 입력하세요.</p></div><div className="meal-grid">{mealNames.map(m=><label key={m.id} className="meal-entry"><span>{m.label}</span><input type="text" value={state.meals[m.id]} onChange={e=>update({meals:{...state.meals,[m.id]:e.target.value}})} placeholder={m.hint}/></label>)}</div></div>
          <div className="cost-summary"><Wallet size={20}/><div><strong>현재 선택 재료 {selectedFoods.length}개 · {coveredGroups}/6 식품군</strong><p>예상 식재료 비용 {won(foodCost)} / 예산 {won(budget)} {foodCost>budget&&<span className="cost-over">초과 {won(foodCost-budget)}</span>}</p></div></div>
          {selectedScenario?.allergy==='우유' && state.foods.some(x=>['우유','치즈','플레인 요구르트','그릭요구르트','액상 요구르트'].includes(x)) && <p className="allergy-alert"><TriangleAlert size={17}/> 우유 알레르기 조건이 있습니다. 선택한 유제품을 다시 확인하세요. 실제 구매 시 알레르기 표시도 확인해야 합니다.</p>}
          <p className="evaluation-hint">※ 표시된 비용은 교육용 가상 가격입니다. 실제 영양 균형이나 알레르기 안전성을 자동 보장하지 않습니다.</p>
        </section>}
        {step===3&&<section className="scene-body" aria-label="3단계 직무 선택하기">
          <div className="section-mini-heading"><h3>내가 수행할 직무를 선택하세요</h3><p>다른 담당자의 의견까지 확인한 뒤 가족의 식단과 장보기를 조정합니다.</p></div>
          <div className="roles-grid">{roles.map((r,i)=><button key={r.title} className={`role-choice role-${i} ${state.role===i?'selected':''}`} aria-pressed={state.role===i} onClick={()=>update({role:i})}>
            <div className="role-illustration"><img src={asset(`role-art-${i}.webp`)} alt=""/></div><strong>{r.title}</strong><span>{r.desc}</span><span className="role-action">{state.role===i?'선택한 직무 ✓':'이 직무 선택하기'}</span>
          </button>)}</div>
          <div className="role-activity"><div><h3>예산 조정 회의</h3><p>가족 예산 {won(budget)} / 현재 선택 비용 {won(foodCost)}</p><p className={`budget-result ${foodCost>budget?'over':''}`}>{foodCost>budget?`예산을 ${won(foodCost-budget)} 초과했습니다. 어떤 부분을 조정할까요?`:'예산 범위 이내입니다. 계획의 다른 조건도 검토해 보세요.'}</p></div><div className="role-dialog"><h4>{selectedRole?`${selectedRole.title}의 관점`:'관심 있는 직무를 먼저 선택하세요'}</h4><p>{selectedRole?.advice??'식단 기획·구매·재고 관리·예산 분석 직무를 살펴보세요.'}</p><h4>다른 직무 담당자의 의견</h4><div className="other-opinions">{roles.filter((_,i)=>i!==state.role).map(r=><p key={r.title}><strong>{r.title}</strong> — {r.advice}</p>)}</div></div></div>
          <label className="field-label" htmlFor="role-adjust">협의 후 결정한 조정 방안</label><select id="role-adjust" value={state.adjustment} onChange={e=>update({adjustment:e.target.value})}><option value="">조정안을 선택하세요</option>{Array.from(new Set([...roles.map(r=>r.adjust),'식품군을 유지하며 식사 구성 변경','조리 시간에 맞도록 메뉴 단순화'])).map(v=><option key={v}>{v}</option>)}</select>
        </section>}
        {step===4&&<section className="scene-body" aria-label="4단계 돌발 상황 대응하기">
          <div className="section-mini-heading"><h3>돌발 상황 카드 5가지</h3><p>상황을 선택하고 가격·영양·알레르기·지속가능성 등을 검토해 해결책을 찾으세요.</p></div>
          <div className="event-grid">{events.map((e,i)=><button type="button" className={`event-choice ${state.event===i?'selected':''}`} aria-pressed={state.event===i} key={e.title} onClick={()=>update({event:i,alternative:'',service:'',criteria:[]})}><span className="event-number">{i+1}</span><span>{e.title}</span>{state.event===i?<CheckCircle2 size={20}/>:<ArrowRight size={19}/>}</button>)}</div>
          {selectedEvent?<div className="event-work"><div className="event-question"><TriangleAlert size={20}/><div><strong>{selectedEvent.title}</strong><p>{selectedEvent.note}</p></div></div><div className="event-fields"><label className="field-block">대체할 식품 또는 대응 방법<select value={state.alternative} onChange={e=>update({alternative:e.target.value})}><option value="">선택하세요</option>{selectedEvent.options.map(o=><option key={o}>{o}</option>)}</select></label><fieldset className="criteria-box"><legend>대체 식품을 선택하는 판단 기준 (여러 개 선택 가능)</legend><div>{['영양','가격','알레르기','조리 시간','환경 영향','보관 기간'].map(x=><label key={x}><input type="checkbox" checked={state.criteria.includes(x)} onChange={e=>update({criteria:e.target.checked?[...state.criteria,x]:state.criteria.filter(v=>v!==x)})}/><span>{x}</span></label>)}</div></fieldset><label className="field-block">도움을 받을 수 있는 정보·서비스<select value={state.service} onChange={e=>update({service:e.target.value})}><option value="">선택하세요</option>{['원재료·알레르기 표시 확인','공공 식품정보·영양 정보','가격 비교 서비스','지역 식재료·유통 정보','식단 설계 및 영양 상담'].map(x=><option key={x}>{x}</option>)}</select></label></div></div>:<div className="empty-hint">위의 돌발 상황 중 하나를 선택하면 해결 활동이 나타납니다.</div>}
        </section>}
        {step===5&&<section className="scene-body" aria-label="5단계 성찰과 다음 단계">
          <div className="section-mini-heading"><h3>오늘의 의사결정을 돌아보세요</h3><p>가족이 직접 할 수 있는 일과 직업·서비스의 도움이 필요한 일을 구분해 보세요.</p></div>
          <div className="reflection-grid"><label>가족이 직접 실천할 수 있는 일<textarea value={state.reflection} onChange={e=>update({reflection:e.target.value})} placeholder="예: 냉장고 재고를 확인한 후 필요한 것만 구매하기"/></label><label>외부 지원이 필요한 일<textarea value={state.outside} onChange={e=>update({outside:e.target.value})} placeholder="예: 알레르기 표시와 정확한 식품 정보를 제공받기"/></label></div>
          <div className="next-ticket-form"><div className="section-mini-heading"><h3>다음 차시를 위한 3일 실천 계획</h3><p>실천한 후 확인할 수 있는 구체적인 지표를 정하세요.</p></div><div className="planning-grid"><label>3일 동안 실천할 행동<input value={state.threeDay} onChange={e=>update({threeDay:e.target.value})} placeholder="예: 보유 재료 먼저 사용하기"/></label><label>확인할 지표<input value={state.indicator} onChange={e=>update({indicator:e.target.value})} placeholder="예: 재고 활용 횟수"/></label><label>예상되는 어려움<input value={state.difficulty} onChange={e=>update({difficulty:e.target.value})} placeholder="예: 가족별 식사 시간이 다름"/></label><label>대응책<input value={state.countermeasure} onChange={e=>update({countermeasure:e.target.value})} placeholder="예: 전날 일정 확인하기"/></label></div></div>
          <div className="ticket-box"><div className="ticket-heading"><Ticket size={22}/><strong>NEXT STEP TICKET</strong></div><div className="ticket-content"><div><small>MISSION</small><strong>건강하고 지속가능한 식생활 설계</strong></div><div><small>STEP</small><strong>4</strong></div></div><div className="ticket-direction"><div><small>FROM</small>해결 방안 모색</div><ArrowRight size={26}/><div><small>TO</small>실천 및 성찰</div></div><button className="ticket-create" type="button" disabled={!completed[4]} onClick={()=>{setTicketOpen(true);saveLog(`다음 단계 티켓 발급 / 3일 실천: ${state.threeDay}`);}}><Ticket size={18}/> 다음 단계 티켓 생성</button></div>
        </section>}
        <div className="scene-footer"><button type="button" className="nav-prev" disabled={step===1} onClick={()=>navigate(step-1)}><ArrowLeft size={18}/> 이전 단계</button><div className="footer-message"><CheckCircle2 size={17}/>{completed[step-1]?'미션을 완료했습니다! CLEAR 도장이 찍혔어요.':'활동을 완료하면 CLEAR 도장이 자동으로 표시됩니다.'}</div>{step<5?<button className="nav-next" onClick={()=>navigate(step+1)}>다음 STEP <ArrowRight size={18}/></button>:<button className="nav-next" onClick={()=>setRecordOpen(true)}>나의 기록 보기 <BookOpen size={18}/></button>}</div>
      </div>
      <div className="forest-foot" aria-hidden="true"><span className="leaf-dot"/><span className="leaf-dot"/><span className="leaf-dot"/></div>
    </main>
    {recordOpen&&<div className="modal-back" role="presentation" onMouseDown={()=>setRecordOpen(false)}><section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="record-title" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" aria-label="닫기" onClick={()=>setRecordOpen(false)}><X/></button><h2 id="record-title"><BookOpen size={23}/> 나의 활동 기록</h2><p>완료한 미션 {score}/5 · 가족 요청: {selectedScenario?.title??'미선택'}</p><div className="record-progress">{completed.map((done,i)=><span key={i} className={done?'done':''}>{i+1} {done?'CLEAR':'진행 중'}</span>)}</div><div className="record-buttons"><button onClick={download}><Download size={17}/> 전체 기록 다운로드</button><button onClick={()=>{if(window.confirm('학습 내용을 모두 초기화할까요?')){setState({...EMPTY});showNotice('학습 내용을 초기화했습니다.');setRecordOpen(false);navigate(1)}}}><RotateCcw size={17}/> 초기화</button></div><h3>저장한 기록</h3>{state.logs.length?state.logs.map((entry,i)=><article className="record-line" key={`${entry.timestamp}-${i}`}><small>{entry.timestamp}</small><p>{entry.text}</p></article>):<p>아직 저장된 활동 기록이 없습니다. 5단계에서 티켓을 발급하면 기록이 저장됩니다.</p>}</section></div>}
    {ticketOpen&&<div className="modal-back" role="presentation" onMouseDown={()=>setTicketOpen(false)}><section className="modal-sheet ticket-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-title" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" aria-label="닫기" onClick={()=>setTicketOpen(false)}><X/></button><h2 id="ticket-title">다음 단계 티켓 발급 완료!</h2><div className="ticket-box printed"><div className="ticket-heading"><Ticket/>NEXT STEP TICKET</div><div className="ticket-content"><div><small>MISSION</small><strong>건강하고 지속가능한 식생활 설계</strong></div><div><small>STEP</small><strong>4</strong></div></div><div className="ticket-direction"><div><small>FROM</small>해결 방안 모색</div><ArrowRight/><div><small>TO</small>실천 및 성찰</div></div><p><strong>3일 실천:</strong> {state.threeDay}</p><p><strong>확인 지표:</strong> {state.indicator}</p><p><strong>예상 어려움:</strong> {state.difficulty}</p><p><strong>대응책:</strong> {state.countermeasure}</p></div><div className="record-buttons"><button onClick={download}><Download size={17}/> 내용 저장</button><button onClick={()=>window.print()}><Printer size={17}/> 인쇄</button></div></section></div>}
    {notice&&<div role="status" className="toast"><Save size={18}/>{notice}</div>}
  </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
