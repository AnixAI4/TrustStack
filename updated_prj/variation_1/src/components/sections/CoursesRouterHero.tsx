"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Cpu, GraduationCap, Rocket, Scale, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ConstellationHeroConfig, HeroColorKey, HeroIconKey, HeroNode } from "@/content/hero-configs";
import { HeroRotationDots, HeroTabGlow } from "@/components/ui/HeroRotationIndicator";

const COLORS: Record<HeroColorKey, string> = {
  accent: "var(--accent-rgb)", gold: "var(--gold-rgb)", amber: "var(--amber-rgb)", blue: "var(--blue-rgb)",
  brand: "var(--brand-rgb)", green: "var(--green-rgb)", red: "var(--red-rgb)",
};
const ICONS: Partial<Record<HeroIconKey, LucideIcon>> = {
  "shield-check": ShieldCheck, rocket: Rocket, "graduation-cap": GraduationCap, scale: Scale, cpu: Cpu, "book-open": BookOpen,
};
const DESCRIPTIONS: Record<string,string> = {
  "For citizens & families":"Know and exercise personal-data rights with confidence.",
  "For founders & SMEs":"Build the minimum compliant stack without a large legal team.",
  "For DPOs & privacy leads":"Operate DPDP compliance end to end as a practitioner.",
  "For legal, risk & compliance":"Translate the Act and Rules into defensible governance.",
  "For engineering & security":"Turn privacy obligations into product and security controls.",
  "For students & aspirants":"Build a strong foundation for a privacy career.",
};

export function CoursesRouterHero({ word, easyWord, nodes=[] }: ConstellationHeroConfig){
  const reduce=!!useReducedMotion(); const [active,setActive]=useState(0); const [engaged,setEngaged]=useState(false);
  const node=nodes[active]??nodes[0]; const color=node?`rgb(${COLORS[node.colorKey]})`:"var(--blue)";
  useEffect(()=>{if(reduce||nodes.length<2)return;const t=setTimeout(()=>setActive(c=>(c+1)%nodes.length),4200);return()=>clearTimeout(t)},[active,nodes.length,reduce]);
  return <section className="page-hero route-hero-standard relative overflow-hidden border-b border-line" data-course-router="" data-track-index={active} data-track={node?.name??""}
    onPointerEnter={()=>setEngaged(true)} onPointerLeave={()=>setEngaged(false)} onFocusCapture={()=>setEngaged(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setEngaged(false)}}
    style={{background:"linear-gradient(140deg,var(--bg),var(--surface-2) 52%,var(--bg))"}}>
    <div className="pointer-events-none absolute inset-0 opacity-55" aria-hidden="true" style={{backgroundImage:"linear-gradient(rgb(var(--green-rgb)/.045) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--blue-rgb)/.045) 1px,transparent 1px)",backgroundSize:"40px 40px",maskImage:"linear-gradient(90deg,transparent,black 30%,black)"}}/>
    <div className="route-hero-inner container-x"><div className="route-hero-grid lg:grid-cols-[.68fr_1.32fr]">
      <div className="relative z-10"><p className="font-mono text-label font-semibold uppercase tracking-wider text-text-faint">Role-routing academy</p>
        <h1 className="route-hero-title mt-3 font-display font-bold tracking-tight text-text"><span data-rm="normal">{word}</span><span data-rm="easy">{easyWord??word}</span></h1>
        <div key={node?.name} className="mt-5" aria-live="polite">
          <div className="font-mono text-label uppercase tracking-wider text-text-faint">Track {String(active+1).padStart(2,"0")} / {String(nodes.length).padStart(2,"0")}</div><p className="mt-2 font-display text-3xl font-semibold" style={{color}}>{node?.name}</p><p className="mt-3 max-w-lg text-base leading-relaxed text-text-muted">{node?DESCRIPTIONS[node.name]:""}</p>
        </div></div>
      <CourseSwitchyard nodes={nodes} active={active} engaged={engaged} reduce={reduce}/>
    </div><CourseTabs nodes={nodes} active={active} setActive={setActive} reduce={reduce}/>
    <HeroRotationDots count={nodes.length} active={active} onSelect={setActive} getColorVar={(i)=>COLORS[nodes[i].colorKey]} label="Show"/>
    </div>
  </section>;
}

function CourseSwitchyard({nodes,active,engaged,reduce}:{nodes:readonly HeroNode[];active:number;engaged:boolean;reduce:boolean}){
  const positions=[{x:0,y:10},{x:0,y:117},{x:0,y:224},{x:422,y:10},{x:422,y:117},{x:422,y:224}];
  return <div className="route-hero-stage relative hidden lg:block" aria-hidden="true"><motion.div className="absolute left-1/2 top-2 h-[304px] w-[540px]" style={{x:"-50%"}} initial={false} animate={{y:engaged?-2:0}} transition={reduce?{duration:.2}:{duration:.55,ease:"easeOut"}}>
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 540 304" fill="none">{positions.map((p,i)=><motion.path key={i} d={`M ${p.x+(i<3?118:0)} ${p.y+35} C ${i<3?210:330} ${p.y+35}, ${i<3?210:330} 152, 270 152`} stroke={`rgb(${COLORS[nodes[i]?.colorKey??"blue"]} / ${i===active?.72:.2})`} strokeWidth={i===active?3:1.3} animate={{pathLength:i<=active?1:.35}}/>)}</svg>
    <div className="absolute left-1/2 top-1/2 z-20 grid h-40 w-40 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-green bg-bg shadow-[0_0_65px_rgb(var(--green-rgb)/.22)]"><div className="text-center"><GraduationCap className="mx-auto h-9 w-9 text-green" strokeWidth={1.45}/><span className="mt-2 block font-mono text-label font-semibold uppercase tracking-wider text-text">DPDP Core</span><span className="mt-1 block font-display text-3xl font-semibold text-text">6</span><span className="font-mono text-label uppercase tracking-wider text-text-faint">Tracks</span></div></div>
    {nodes.map((node,i)=>{const Icon=ICONS[node.iconKey]??BookOpen;const p=positions[i];const selected=i===active;return <motion.div key={node.name} className="absolute flex h-[70px] w-[118px] items-center gap-3 border bg-surface px-3 shadow-card" style={{left:p.x,top:p.y,color:`rgb(${COLORS[node.colorKey]})`}} animate={{x:selected?(i<3?18:-18):0,scale:selected?1.08:.94,opacity:selected?1:.55,borderColor:selected?`rgb(${COLORS[node.colorKey]}/.76)`:"var(--line)"}} transition={reduce?{duration:.2}:{type:"spring",stiffness:190,damping:22}}><Icon className="h-5 w-5" strokeWidth={1.6}/><span className="font-mono text-label font-semibold uppercase tracking-wider text-text">{node.short}</span></motion.div>})}
  </motion.div></div>;
}

function CourseTabs({nodes,active,setActive,reduce}:{nodes:readonly HeroNode[];active:number;setActive:(i:number)=>void;reduce:boolean}){return <div className="route-hero-tabs border-t border-line lg:grid-cols-6" role="tablist" aria-label="Course personas">{nodes.map((node,i)=>{const Icon=ICONS[node.iconKey]??BookOpen;const selected=i===active;return <button key={node.name} type="button" role="tab" aria-selected={selected} onClick={()=>setActive(i)} className={`group relative flex min-h-20 items-center gap-3 border-b border-line px-3 text-left transition-colors hover:bg-surface-2/60 lg:border-b-0 lg:border-r lg:last:border-r-0 ${selected?"bg-surface-2/70":""}`}>{selected&&<HeroTabGlow colorVar={COLORS[node.colorKey]} reduce={reduce}/>}<Icon className="relative h-5 w-5 shrink-0" style={{color:`rgb(${COLORS[node.colorKey]})`}}/><span className={`relative ${selected?"font-semibold text-text":"text-text-muted"}`}>{node.short}</span>{selected&&<span className="absolute inset-x-0 bottom-0 h-[3px]" style={{background:`rgb(${COLORS[node.colorKey]} / 0.28)`}}/>}</button>})}</div>}