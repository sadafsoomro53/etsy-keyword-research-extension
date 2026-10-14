// Candidate generation is ideation only; no generated phrase is represented as measured search demand.
const MODIFIERS = [
"printable","digital download","editable","template","instant download","bundle","minimalist","aesthetic","personalized","custom",
"small business","commercial use","transparent png","svg","png","pdf","canva template","photoshop mockup","smart object","mockup bundle",
"hand holding","with hand","flat lay","lifestyle","neutral background","white background","cozy","vintage","retro","boho",
"cute","kawaii","minimal","modern","rustic","watercolor","japanese","floral","butterfly","halloween","christmas","wedding",
"birthday","baby shower","bridal shower","teacher gift","mom gift","pet lover","small shop","branding","social media",
"editable invitation","wall art","coloring pages","planner","resume template","website template","clipart","sticker","cricut",
"commercial license","instant printable","digital paper","seamless pattern","presentation template","business planner"
];
const AUDIENCES = ["for small business","for teachers","for students","for moms","for kids","for pet owners","for photographers","for Etsy sellers","for designers","for brides"];
const OCCASIONS = ["birthday","wedding","baby shower","bridal shower","Christmas","Halloween","Valentine's Day","Mother's Day","teacher appreciation","graduation"];
const FORMATS = ["digital download","editable template","printable PDF","SVG bundle","PNG bundle","Canva template","PSD mockup","instant download"];
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
function normalizeKeyword(s){return (s||"").toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ")}
function generateCandidates(seed, limit=150){
 const base=seed.trim(); if(!base) return [];
 const out=[], seen=new Set();
 const add=(phrase,method)=>{const k=normalizeKeyword(phrase);if(k && !seen.has(k)){seen.add(k);out.push({keyword:phrase.trim(),discovery_method:method,source:"Generated candidate",competition:"",avg_views:"",avg_price:"",favs_view:"",google_volume:"",trend_12m:"",country:"",kd:"",evidence_url:"",status:"CHECK",failed_criteria:"Metrics not yet collected"});}};
 add(base,"Seed keyword");
 MODIFIERS.forEach(m=>{add(`${base} ${m}`,"Modifier expansion");add(`${m} ${base}`,"Modifier expansion");});
 AUDIENCES.forEach(m=>add(`${base} ${m}`,"Audience / buyer intent"));
 OCCASIONS.forEach(m=>add(`${base} ${m}`,"Occasion discovery"));
 FORMATS.forEach(m=>add(`${base} ${m}`,"Digital / physical format analysis"));
 ALPHABET.forEach(letter=>{add(`${base} ${letter}`,"A–Z query expansion");add(`${base} ${letter} `+"", "A–Z query expansion");});
 const words=base.split(/\s+/);
 if(words.length===1){
   ["mockup","template","bundle","printable","digital","editable","svg","png","pdf","clipart","planner","invitation","wall art","coloring pages","sticker","website","resume","pattern"].forEach(n=>add(`${base} ${n}`,"Micro-niche branching"));
 }
 return out.slice(0,Math.max(1,limit));
}
