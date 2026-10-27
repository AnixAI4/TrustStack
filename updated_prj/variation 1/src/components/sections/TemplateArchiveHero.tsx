"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ClipboardList, FileSignature, FileText, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ConstellationHeroConfig, HeroColorKey, HeroIconKey, HeroNode } from "@/content/hero-configs";
import { HeroRotationDots, HeroTabGlow } from "@/components/ui/HeroRotationIndicator";

const COLORS:Record<HeroColorKey,string>={accent:"var(--accent-rgb)",gold:"var(--gold-rgb)",amber:"var(--amber-rgb)",blue:"var(--blue-rgb)",brand:"var(--brand-rgb)",green:"var(--green-rgb)",red:"var(--red-rgb)"};
const ICONS:Partial<Record<HeroIconKey,LucideIcon>>={"file-text":FileText,"file-signature":FileSignature,"clipboard-list":ClipboardList,"shield-alert":ShieldAlert};
const DETAILS:Record<string,string>={Policies:"Internal and public policies for privacy, retention, cookies, employees and governance.",Agreements:"Processing, vendor and cross-border agreements for accountable data sharing.","Forms & notices":"Consent, rights-request and withdrawal documents for Data Principals.",Breach:"Notification packs and response playbooks for incident readiness."};

export function TemplateArchiveHero({word,easyWord,nodes=[]}:ConstellationHeroConfig){
  const reduce=!!useReducedMotion();const[active,setActive]=useState(0);const[engaged,setEngaged]=useState(false);const node=nodes[active]??nodes[0];const color=node?`rgb(${COLORS[node.colorKey]})`:"var(--blue)";
  useEffect(()=>{if(reduce||nodes.length<2)return;const t=setTimeout(()=>setActive(c=>(c+1)%nodes.length),4500);return()=>clearTimeout(t)},[active,nodes.length,reduce]);
  return <section className="page-hero route-hero-technical relative overflow-hidden border-b border-line" data-template-archive="" data-drawer-index={active} data-drawer={node?.name??""}
    onPointerEnter={()=>setEngaged(true)} onPointerLeave={()=>setEngaged(false)} onFocusCapture={()=>setEngaged(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setEngaged(false)}} style={{background:"linear-gradient(140deg,var(--bg),var(--surface-2) 52%,var(--bg))"}}>
    <div className="pointer-events-none absolute inset-0 opacity-55" aria-hidden="true" style={{backgroundImage:"linear-gradient(rgb(var(--amber-rgb)/.045) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--blue-rgb)/.04) 1px,transparent 1px)",backgroundSize:"40px 40px",maskImage:"linear-gradient(90deg,transparent,black 30%,black)"}}/>
    <div className="route-hero-inner container-x"><div className="route-hero-grid lg:grid-cols-[.78fr_1.22fr]">
      <div className="relative z-10 min-w-0"><p className="font-mono text-label font-semibold uppercase tracking-wider text-text-faint">DPDP document archive</p><h1 className="route-hero-title mt-3 min-w-0 break-words font-display font-bold tracking-tight text-text"><span data-rm="normal">{word}</span><span data-rm="easy">{easyWord??word}</span></h1>
      <div key={node?.name} className="mt-5" aria-live="polite"><div className="font-mono text-label uppercase tracking-wider text-text-faint">Drawer {String(active+1).padStart(2,"0")} / {String(nodes.length).padStart(2,"0")}</div><p className="mt-2 font-display text-3xl font-semibold" style={{color}}>{node?.name}</p><p className="mt-3 max-w-lg text-base leading-relaxed text-text-muted">{node?DETAILS[node.name]:""}</p></div></div>
      <ArchiveCabinet nodes={nodes} active={active} engaged={engaged} reduce={reduce}/>
    </div><ArchiveTabs nodes={nodes} active={active} setActive={setActive} reduce={reduce}/>
    <HeroRotationDots count={nodes.length} active={active} onSelect={setActive} getColorVar={(i)=>COLORS[nodes[i].colorKey]} label="Show"/>
    </div>
  </section>;
}

function ArchiveCabinet({nodes,active,engaged,reduce}:{nodes:readonly HeroNode[];active:number;engaged:boolean;reduce:boolean}){
  const activeDrawer=nodes[active];
  const activeColor=activeDrawer?`rgb(${COLORS[activeDrawer.colorKey]})`:"var(--blue)";
  const ActiveIcon=activeDrawer?(ICONS[activeDrawer.iconKey]??FileText):FileText;
  return <div className="route-hero-stage relative hidden min-w-0 overflow-hidden lg:block" aria-hidden="true"><motion.div data-archive-assembly="" className="absolute left-1/2 top-2 h-[320px] w-[560px]" style={{x:"-50%"}} initial={false} animate={{y:engaged?-3:0}} transition={reduce?{duration:.2}:{duration:.55,ease:"easeOut"}}>
    <div className="absolute bottom-2 left-[58px] h-5 w-[438px] border border-line bg-surface-2 shadow-card"/>
    <div className="absolute bottom-1 left-[84px] h-3 w-[386px] bg-bg/80 blur-md"/>

    <div className="absolute left-[74px] top-1 h-4 w-[294px] border border-line bg-surface-2" style={{clipPath:"polygon(3% 0,97% 0,100% 100%,0 100%)"}}/>
    <div className="absolute left-[358px] top-4 h-[276px] w-5 border-y border-r border-line bg-surface-2" style={{clipPath:"polygon(0 0,100% 4%,100% 96%,0 100%)"}}/>

    <div className="absolute left-[64px] top-3 h-[288px] w-[304px] border border-line bg-surface shadow-[0_30px_68px_-34px_rgb(var(--amber-rgb)/.34)]">
      <div className="absolute inset-x-3 top-3 flex h-10 items-center border border-line bg-bg px-3">
        <div className="min-w-0 font-mono text-label font-semibold uppercase tracking-wider text-text-faint">TrustStack / Archive</div>
        <div className="ml-auto flex shrink-0 items-center gap-2 pl-3 font-mono text-label uppercase tracking-wider text-text-faint"><span className="h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_10px_rgb(var(--green-rgb)/.7)]"/>04 files</div>
      </div>

      <div className="absolute inset-x-3 bottom-3 top-[64px] space-y-2">{nodes.map((drawer,i)=>{const Icon=ICONS[drawer.iconKey]??FileText;const selected=i===active;return <motion.div key={drawer.name} className="relative h-11 min-w-0" initial={false} animate={{opacity:selected?1:.62}} transition={reduce?{duration:.2}:{duration:.3}}>
        <div className="relative z-10 flex h-11 min-w-0 items-center gap-3 border bg-surface-2 px-3 shadow-sm" style={{color:`rgb(${COLORS[drawer.colorKey]})`,borderColor:selected?`rgb(${COLORS[drawer.colorKey]}/.78)`:"var(--line)",boxShadow:selected?"0 12px 26px -16px rgb(0 0 0 / .72)":"var(--shadow-card)"}}><span className="absolute inset-y-0 left-0 w-0.5" style={{background:selected?`rgb(${COLORS[drawer.colorKey]})`:"transparent"}}/><Icon className="h-5 w-5 shrink-0"/><span className="min-w-0 truncate font-mono text-label font-semibold uppercase tracking-wider text-text">{drawer.short}</span><span className="ml-auto font-mono text-label text-text-faint">{String(i+1).padStart(2,"0")}</span><span className="h-2 w-9 shrink-0 rounded-full border border-line bg-bg shadow-inner"/></div>
      </motion.div>})}</div>
    </div>
    <motion.div key={active} className="absolute left-[396px] top-[58px] h-[178px] w-[132px] border border-line bg-bg px-3 py-3 shadow-card" initial={reduce?false:{x:-16,opacity:0}} animate={{x:0,opacity:1}} transition={reduce?{duration:.2}:{type:"spring",stiffness:220,damping:24}}>
      <div className="flex items-center justify-between font-mono text-label font-semibold uppercase tracking-wider" style={{color:activeColor}}><span>Open file</span><span>{String(active+1).padStart(2,"0")}</span></div>
      <motion.div className="mt-3 h-px origin-left" style={{background:activeColor}} initial={{scaleX:0}} animate={{scaleX:1}} transition={{duration:reduce?0:.5,ease:"easeOut"}}/>
      <div className="mt-5 flex items-center gap-2"><ActiveIcon className="h-5 w-5" style={{color:activeColor}}/><span className="font-mono text-label font-semibold uppercase tracking-wider text-text-faint">DPDP pack</span></div>
      <div className="mt-5 h-px w-full bg-line"/><div className="mt-2 h-px w-[84%] bg-line"/><div className="mt-2 h-px w-[68%] bg-line"/>
      <p className="mt-4 line-clamp-2 text-xs font-semibold leading-tight text-text">{activeDrawer?.name}</p>
    </motion.div>
    <motion.div className="absolute left-[366px] top-[146px] h-px w-8 origin-left" style={{background:activeColor}} animate={{scaleX:reduce?1:[.25,1,.25],opacity:reduce?.5:[.25,1,.25]}} transition={{duration:reduce?0:2.4,ease:"easeInOut",repeat:reduce?0:Infinity}}/>
  </motion.div></div>;
}

function ArchiveTabs({nodes,active,setActive,reduce}:{nodes:readonly HeroNode[];active:number;setActive:(i:number)=>void;reduce:boolean}){return <div className="route-hero-tabs border-t border-line lg:grid-cols-4" role="tablist" aria-label="Template categories">{nodes.map((node,i)=>{const Icon=ICONS[node.iconKey]??FileText;const selected=i===active;return <button key={node.name} type="button" role="tab" aria-selected={selected} onClick={()=>setActive(i)} className={`group relative flex min-h-20 items-center justify-center gap-3 border-b border-line px-4 transition-colors hover:bg-surface-2/60 lg:border-b-0 lg:border-r lg:last:border-r-0 ${selected?"bg-surface-2/70":""}`}>{selected&&<HeroTabGlow colorVar={COLORS[node.colorKey]} reduce={reduce}/>}<Icon className="relative h-5 w-5 shrink-0" style={{color:`rgb(${COLORS[node.colorKey]})`}}/><span className={`relative min-w-0 text-sm leading-tight [overflow-wrap:anywhere] ${selected?"font-semibold text-text":"text-text-muted"}`}>{node.short}</span>{selected&&<span className="absolute inset-x-0 bottom-0 h-[3px]" style={{background:`rgb(${COLORS[node.colorKey]} / 0.28)`}}/>}</button>})}</div>}