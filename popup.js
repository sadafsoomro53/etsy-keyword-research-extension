const $=id=>document.getElementById(id);
let records=[];
const aliases={
 keyword:["keyword","search term","query","phrase","tag"],
 competition:["competition","etsy competition","results","listing count"],
 avg_views:["avg views","average views","views","etsy views","estimated views"],
 avg_price:["avg price","average price","price","average listing price"],
 favs_view:["favs/view","favs / view","favorites/views","favourites/views","fav/view","favs per view"],
 google_volume:["google search volume","google volume","search volume status","google sv"],
 trend_12m:["search trends (12 months)","12 month trend","12-month trend","trend","search trend"],
 country:["searchers by country","top country","country","countries"],
 kd:["keyword difficulty","difficulty","kd"],
 evidence_url:["screenshot/proof","proof","evidence url","source url","url","link"]
};
function clean(s){return String(s??"").trim()}
function norm(s){return clean(s).toLowerCase().replace(/[^a-z0-9%]+/g," ").trim()}
function findValue(row, key){
 const keys=aliases[key]||[key]; const entries=Object.entries(row);
 for(const alias of keys){const a=norm(alias);for(const [k,v] of entries)if(norm(k)===a)return clean(v)}
 for(const alias of keys){const a=norm(alias);for(const [k,v] of entries)if(norm(k).includes(a)||a.includes(norm(k)))return clean(v)}
 return "";
}
function number(v){if(v===null||v===undefined||v==="")return null;let s=String(v).replace(/[$,%\s]/g,"").replace(/,/g,"");let mult=1;if(/k$/i.test(s)){mult=1000;s=s.slice(0,-1)}if(/m$/i.test(s)){mult=1000000;s=s.slice(0,-1)}const n=Number(s);return Number.isFinite(n)?n*mult:null}
function parseBoolGoogle(v){const s=norm(v);return s==="green"||s==="good"||s.includes("green good")||s.includes("high")||s==="healthy"}
function countryMatch(v,target){const s=norm(v);const aliases={usa:["usa","united states","us"],uk:["uk","united kingdom","gb","britain"],canada:["canada","ca"],germany:["germany","de"]};return target.split(",").some(c=>(aliases[norm(c)]||[norm(c)]).some(a=>s.includes(a)))}
function validate(r,target){
 const fail=[];
 const comp=number(r.competition), views=number(r.avg_views), price=number(r.avg_price), fav=number(r.favs_view), kd=number(r.kd);
 if(comp===null)fail.push("Competition missing");else if(!(comp<50000))fail.push("Competition ≥ 50,000");
 if(views===null)fail.push("Avg views missing");else if(!(views>5000))fail.push("Avg views ≤ 5,000");
 if(price===null)fail.push("Avg price missing");else if(!(price>2))fail.push("Avg price ≤ $2");
 if(fav===null)fail.push("Favs/view missing");else if(!(fav>1))fail.push("Favs/view ≤ 1%");
 if(!r.google_volume)fail.push("Google volume missing");else if(!parseBoolGoogle(r.google_volume))fail.push("Google volume not Green/Good");
 const t=norm(r.trend_12m);
 if(!t)fail.push("12-month trend missing");else if(!(t.includes("stable")||t.includes("grow")||t.includes("increas")||t.includes("rising")))fail.push("Trend not Stable/Growing");
 if(!r.country)fail.push("Country missing");else if(!countryMatch(r.country,target))fail.push("Target country not confirmed");
 if(kd===null)fail.push("KD missing");else if(!(kd<50))fail.push("KD ≥ 50");
 r.status=fail.length?"CHECK":"PASS";r.failed_criteria=fail.join("; ");return r;
}
function dedupe(arr){const map=new Map();for(const r of arr){const k=norm(r.keyword);if(k){if(!map.has(k))map.set(k,r);else{const old=map.get(k);for(const f of Object.keys(r))if(!old[f]&&r[f])old[f]=r[f];}}}return [...map.values()]}
function update(){
 $("total").textContent=records.length;
 $("passed").textContent=records.filter(r=>r.status==="PASS").length;
 $("checked").textContent=records.filter(r=>r.status!=="PASS").length;
 $("exportPass").disabled=!records.some(r=>r.status==="PASS");
 $("exportAll").disabled=!records.length;
}
function status(s){$("status").textContent=s}
function csvParse(text){
 const rows=[];let row=[],cell="",quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&quoted&&n==='"'){cell+='"';i++}else if(c==='"'){quoted=!quoted}else if(c===','&&!quoted){row.push(cell);cell=""}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=""}else cell+=c}
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row);if(rows.length<2)return [];
 const headers=rows[0].map(x=>x.trim());return rows.slice(1).map(cols=>Object.fromEntries(headers.map((h,i)=>[h,cols[i]||""]))).map(raw=>{const r={};for(const k of Object.keys(aliases))r[k]=findValue(raw,k);r.discovery_method="RankKW CSV import";r.source="RankKW CSV import";return r}).filter(r=>r.keyword)
}
function serializeCsv(rows){
 const cols=["keyword","status","failed_criteria","competition","avg_views","avg_price","favs_view","google_volume","trend_12m","country","kd","discovery_method","source","evidence_url"];
 const esc=v=>{let s=String(v??"");return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
 return [cols.join(","),...rows.map(r=>cols.map(c=>esc(r[c])).join(","))].join("\r\n");
}
function downloadCsv(rows,name){
 const blob=new Blob(["\ufeff"+serializeCsv(rows)],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
$("generate").addEventListener("click",async()=>{
 const seed=$("seed").value.trim();if(!seed){status("Enter a seed keyword first.");return}
 const ideas=generateCandidates(seed,Number($("limit").value));
 records=dedupe([...records,...ideas]);update();
 await chrome.storage.local.set({records});
 status(`Generated ${ideas.length} candidate ideas. They remain CHECK until all required metrics are collected from real sources.`);
});
$("scan").addEventListener("click",async()=>{
 try{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.id){status("No active tab found.");return}
  const result=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>{
    const visible=e=>!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length);
    const tables=[...document.querySelectorAll("table")].filter(visible);
    const extracted=[];
    for(const table of tables){
      const trs=[...table.querySelectorAll("tr")];if(trs.length<2)continue;
      const headers=[...trs[0].querySelectorAll("th,td")].map(x=>x.innerText.trim());
      for(const tr of trs.slice(1)){
        const vals=[...tr.querySelectorAll("td,th")].map(x=>x.innerText.trim());if(!vals.length)continue;
        const obj={};headers.forEach((h,i)=>obj[h]=vals[i]||"");
        const links=[...tr.querySelectorAll("a[href]")].map(a=>a.href);if(links[0])obj["evidence_url"]=links[0];
        extracted.push(obj);
      }
    }
    // Also capture visible Etsy result titles as unqualified candidates when no table exists.
    if(!extracted.length && location.hostname.endsWith("etsy.com")){
      const els=[...document.querySelectorAll("a[href*='/listing/']")].filter(visible);
      for(const a of els){const title=(a.innerText||a.getAttribute("aria-label")||"").trim();if(title.length>3)extracted.push({keyword:title, evidence_url:a.href, source:"Etsy visible listing title"});}
    }
    return {title:document.title,url:location.href,rows:extracted,body:document.body.innerText.slice(0,30000)};
  }});
  const data=result?.[0]?.result;if(!data){status("Could not read this tab. Click the extension while the source tab is active and try again.");return}
  let found=[];
  if(data.rows.length){
   found=data.rows.map(raw=>{const r={};for(const k of Object.keys(aliases))r[k]=findValue(raw,k);r.discovery_method="Visible source scan";r.source=data.url;r.keyword=r.keyword||findValue(raw,"keyword");return r}).filter(r=>r.keyword);
  } else if(data.body){
   const suggestions=data.body.split(/\n/).map(x=>x.trim()).filter(x=>x.length>3&&x.length<100);
   found=suggestions.filter(x=>/autocomplete|suggest|related search/i.test(x)).map(keyword=>({keyword,discovery_method:"Visible page text",source:data.url}));
  }
  const target=$("country").value;
  found=found.map(r=>validate(r,target));
  records=dedupe([...records,...found]);await chrome.storage.local.set({records});update();
  status(`Scanned "${data.title}". Captured ${found.length} rows. ${found.filter(r=>r.status==="PASS").length} passed; incomplete or failed records remain CHECK.`);
 }catch(e){status("Scan failed: "+e.message+". Try opening the source tab first.");}
});
$("import").addEventListener("click",async()=>{
 const file=$("csvfile").files[0];if(!file){status("Choose a CSV file first.");return}
 try{const parsed=csvParse(await file.text());if(!parsed.length){status("Could not find a keyword column. Check the CSV headers or export from RankKW.");return}
 records=dedupe([...records,...parsed.map(r=>validate(r,$("country").value))]);await chrome.storage.local.set({records});update();
 status(`Imported ${parsed.length} rows and checked each against all 8 mandatory criteria. Only fully evidenced PASS rows qualify.`);
 }catch(e){status("CSV import error: "+e.message)}
});
$("exportPass").addEventListener("click",()=>{const rows=records.filter(r=>r.status==="PASS");if(!rows.length)return;downloadCsv(rows,"etsy-keywords-PASS.csv");status(`Exported ${rows.length} qualified keywords.`)});
$("exportAll").addEventListener("click",()=>downloadCsv(records,"etsy-keyword-research-audit.csv"));
$("clear").addEventListener("click",async()=>{records=[];await chrome.storage.local.remove("records");update();status("Session cleared.")});
(async()=>{const saved=await chrome.storage.local.get("records");records=Array.isArray(saved.records)?saved.records:[];update()})();
