const CONFIG = {
  latitude: 40.845,
  longitude: -73.866,
  locationName: "Van Nest · The Bronx, NY",
  timezone: "America/New_York",
  marketEndpoint: "./api/market"
};

const zenbotSnapshot = {
  asOf: "November 25, 2026 · 1:42 PM ET",
  delayed: true,
  gainers: [
    ["FCUV", "Focus Universal", 42.3], ["BNAI", "Brand Engagement Network", 35.9],
    ["HPQ", "HP Inc.", 10.8], ["COGT", "Cogent Biosciences", 9.2],
    ["LI", "Li Auto", 9.1], ["CSIQ", "Canadian Solar", 7.5],
    ["CNH", "CNH Industrial", 6.8], ["SEDG", "SolarEdge Technologies", 6.6]
  ].map(([symbol,name,change]) => ({symbol,name,changePercent:change})),
  losers: [
    ["AMBA", "Ambarella", -20.3], ["NTNX", "Nutanix", -17.8],
    ["SHOE", "Shoe Carnival", -16.9], ["URBN", "Urban Outfitters", -10.8],
    ["SNDK", "Sandisk", -8.4], ["AMBQ", "Ambiq Micro", -7.5],
    ["MU", "Micron Technology", -7.4], ["NVDA", "NVIDIA", -5.3]
  ].map(([symbol,name,change]) => ({symbol,name,changePercent:change}))
};

const $ = (id) => document.getElementById(id);
let weatherData = null;
let marketData = { gainers: zenbotSnapshot.gainers, losers: zenbotSnapshot.losers, asOf: zenbotSnapshot.asOf, live: false };
let activeMoverTab = "gainers";
let celsius = false;
let alertDismissed = false;

const weatherCodes = {
  0:["Clear sky","clear_day"],1:["Mostly clear","partly_cloudy_day"],2:["Partly cloudy","partly_cloudy_day"],3:["Overcast","cloud"],
  45:["Fog","foggy"],48:["Depositing rime fog","foggy"],51:["Light drizzle","rainy_light"],53:["Drizzle","rainy"],55:["Heavy drizzle","rainy"],
  56:["Freezing drizzle","weather_hail"],57:["Freezing drizzle","weather_hail"],61:["Light rain","rainy_light"],63:["Rain","rainy"],65:["Heavy rain","rainy"],
  66:["Freezing rain","weather_hail"],67:["Freezing rain","weather_hail"],71:["Light snow","cloudy_snowing"],73:["Snow","cloudy_snowing"],75:["Heavy snow","snowing_heavy"],
  77:["Snow grains","cloudy_snowing"],80:["Rain showers","rainy_light"],81:["Rain showers","rainy"],82:["Heavy rain showers","rainy"],
  85:["Snow showers","weather_snowy"],86:["Heavy snow showers","weather_snowy"],95:["Thunderstorm","thunderstorm"],96:["Thunderstorm with hail","thunderstorm"],99:["Thunderstorm with hail","thunderstorm"]
};
function wx(code){return weatherCodes[code] || ["Changing skies","cloud"]}
function fmtTime(value){if(!value)return "--";return new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",timeZone:CONFIG.timezone}).format(new Date(value));}
function formatDate(){const n=new Date();$('dateLabel').textContent=new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric",timeZone:CONFIG.timezone}).format(n).toUpperCase();}
function temperature(value){return Math.round(celsius?(value-32)*5/9:value)+"°";}
function showToast(message){const t=$('toast');t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2300);}
function setWeatherError(message=""){$('weatherError').textContent=message;}

async function loadWeather(){
  const params = new URLSearchParams({latitude:CONFIG.latitude,longitude:CONFIG.longitude,current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m",hourly:"temperature_2m,precipitation_probability,weather_code",daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",temperature_unit:"fahrenheit",wind_speed_unit:"mph",precipitation_unit:"inch",timezone:CONFIG.timezone,forecast_days:"7"});
  const response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`,{cache:"no-store"});
  if(!response.ok)throw new Error(`Weather service returned ${response.status}`);
  weatherData=await response.json(); renderWeather();
  $('weatherUpdated').textContent=`Updated ${new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",timeZone:CONFIG.timezone}).format(new Date())} · ${CONFIG.locationName}`;
  setWeatherError("");
}
function renderWeather(){
  if(!weatherData)return;
  const c=weatherData.current, [description,icon]=wx(c.weather_code);
  $('temperature').textContent=temperature(c.temperature_2m);
  $('weatherTitle').textContent=description;
  $('feelsLike').textContent=`Feels like ${temperature(c.apparent_temperature)}`;
  $('weatherSymbol').innerHTML=`<span class="material-symbols-rounded">${icon}</span>`;
  $('windValue').textContent=`${Math.round(c.wind_speed_10m)} mph`;
  $('humidityValue').textContent=`${c.relative_humidity_2m}%`;
  $('precipValue').textContent=`${Number(c.precipitation||0).toFixed(2)} in`;
  const today=weatherData.daily;
  $('sunriseValue').textContent=fmtTime(today.sunrise[0]);
  $('sunsetValue').textContent=fmtTime(today.sunset[0]);
  const now=Date.now(),rise=new Date(today.sunrise[0]).getTime(),set=new Date(today.sunset[0]).getTime();
  $('sunProgress').style.width=`${Math.max(0,Math.min(100,(now-rise)/(set-rise)*100))}%`;
  renderHourly();renderDaily();
}
function renderHourly(){
  const h=weatherData.hourly; const now=new Date(); let start=h.time.findIndex(t=>new Date(t).getTime()>=now.getTime()-30*60*1000); if(start<0)start=0;
  $('hourlyForecast').innerHTML=h.time.slice(start,start+12).map((t,i)=>{const ix=start+i,[desc,icon]=wx(h.weather_code[ix]);const label=i===0?"Now":new Intl.DateTimeFormat("en-US",{hour:"numeric",timeZone:CONFIG.timezone}).format(new Date(t));const rain=h.precipitation_probability[ix]??0;return `<div class="hour-card ${i===0?'now':''}"><span class="hour-time">${label}</span><span class="material-symbols-rounded" aria-label="${desc}">${icon}</span><strong class="hour-temp">${temperature(h.temperature_2m[ix])}</strong><span class="hour-rain">${rain>0?`${rain}% rain`:'—'}</span></div>`}).join("");
}
function renderDaily(){
  const d=weatherData.daily, low=Math.min(...d.temperature_2m_min),high=Math.max(...d.temperature_2m_max),span=Math.max(1,high-low);
  $('dailyForecast').innerHTML=d.time.map((date,i)=>{const day=new Date(`${date}T12:00:00`);const name=i===0?"Today":i===1?"Tomorrow":new Intl.DateTimeFormat("en-US",{weekday:"short",timeZone:CONFIG.timezone}).format(day);const [desc,icon]=wx(d.weather_code[i]);const left=(d.temperature_2m_min[i]-low)/span*100,width=Math.max(9,(d.temperature_2m_max[i]-d.temperature_2m_min[i])/span*100);return `<div class="day-row"><span class="day-name">${name}</span><span class="material-symbols-rounded" title="${desc}">${icon}</span><span class="day-low">${temperature(d.temperature_2m_min[i])}</span><div class="range-track"><span style="margin-left:${left}%;width:${width}%"></span></div><span class="day-high">${temperature(d.temperature_2m_max[i])}</span><span class="day-rain">${d.precipitation_probability_max[i]||0}%</span></div>`}).join("");
}
function sparkline(seed,up){let vals=Array.from({length:14},(_,i)=>Math.sin((i+seed)*1.12)*.25+Math.cos((i+seed)*.49)*.28+i/14*(up?.45:-.45));let min=Math.min(...vals),max=Math.max(...vals);let points=vals.map((v,i)=>`${(i/(vals.length-1))*72},${22-(v-min)/(max-min||1)*19}`).join(" ");return `<svg viewBox="0 0 72 25" preserveAspectRatio="none"><polyline points="${points}" fill="none" stroke="${up?'#07976b':'#d75a68'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
function renderMovers(){
  const rows=(marketData[activeMoverTab]||[]).filter(x=>{const q=$('stockSearch').value.trim().toLowerCase();return !q||x.symbol.toLowerCase().includes(q)||String(x.name||"").toLowerCase().includes(q)});
  $('moverList').innerHTML=rows.length?rows.slice(0,12).map((x,i)=>{const up=x.changePercent>=0;const name=x.name||x.symbol;const p=(up?"+":"")+Number(x.changePercent).toFixed(2)+"%";return `<div class="mover-row"><div class="ticker-mark">${escapeHtml(x.symbol.slice(0,4))}</div><div class="ticker-name"><strong>${escapeHtml(x.symbol)}</strong><small>${escapeHtml(name)}</small></div><div class="spark">${sparkline(i+3,up)}</div><div class="change ${up?'positive':'negative'}">${p}<small>today</small></div></div>`}).join(""):`<div class="loading-card">No tickers match that search.</div>`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function loadMarket(){
  try{
    const r=await fetch(CONFIG.marketEndpoint,{cache:"no-store"});if(!r.ok)throw new Error("No market proxy configured");const data=await r.json();
    if(!Array.isArray(data.gainers)||!Array.isArray(data.losers))throw new Error("Unexpected market response");
    marketData={...data,live:true};$('marketStatus').textContent="Live market movers";$('marketSource').textContent=`Yahoo Finance market screener · refreshed ${new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}. Market data may be delayed.`;
  }catch(e){
    marketData={gainers:zenbotSnapshot.gainers,losers:zenbotSnapshot.losers,asOf:zenbotSnapshot.asOf,live:false};$('marketStatus').textContent="Saved market snapshot · not live";$('marketSource').textContent=`ZenBot snapshot captured ${zenbotSnapshot.asOf}. Historical reference only; this GitHub Pages version does not have a live stock-data server.`;
  }
  renderMovers();
}
async function refreshAll(){
  $('refreshButton').classList.add('refreshing');
  const tasks=await Promise.allSettled([loadWeather(),loadMarket()]);
  if(tasks[0].status==='rejected'){setWeatherError("Could not refresh · check your connection");$('weatherUpdated').textContent="Weather feed unavailable · try refresh";}
  $('refreshButton').classList.remove('refreshing');formatDate();
}
function init(){
  formatDate();refreshAll();
  $('refreshButton').addEventListener('click',()=>{showToast("Refreshing your dashboard…");refreshAll()});
  $('unitToggle').addEventListener('click',()=>{celsius=!celsius;$('unitToggle').innerHTML=celsius?"°C <span>/</span> °F":"°F <span>/</span> °C";renderWeather()});
  $('gainersTab').addEventListener('click',()=>setMoverTab('gainers'));
  $('losersTab').addEventListener('click',()=>setMoverTab('losers'));
  $('stockSearch').addEventListener('input',renderMovers);
  $('dismissAlert').addEventListener('click',()=>{$('weatherAlert').hidden=true;alertDismissed=true});
  $('shareButton').addEventListener('click',async()=>{if(navigator.share){try{await navigator.share({title:'Dayline',text:'Bronx weather and market movers',url:location.href})}catch(e){}}else{try{await navigator.clipboard.writeText(location.href);showToast('Link copied')}catch(e){showToast('Use your browser share menu')}}});
  if('serviceWorker'in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
  // The API service supplies official local alerts when deployed with the Pages function.
  loadAlerts();
}
function setMoverTab(which){activeMoverTab=which;$('gainersTab').classList.toggle('active',which==='gainers');$('losersTab').classList.toggle('active',which==='losers');$('gainersTab').setAttribute('aria-selected',String(which==='gainers'));$('losersTab').setAttribute('aria-selected',String(which==='losers'));renderMovers();}
async function loadAlerts(){
  try{const r=await fetch(`https://api.weather.gov/alerts/active?point=${CONFIG.latitude},${CONFIG.longitude}`,{headers:{Accept:'application/geo+json'},cache:'no-store'});if(!r.ok)return;const data=await r.json();const alert=(data.features||[]).find(x=>!alertDismissed&&x.properties&&x.properties.severity!=='Unknown');if(!alert)return;const p=alert.properties;$('alertTitle').textContent=p.event||'Weather alert';$('alertText').textContent=(p.headline||p.description||'An official weather alert is active for the area.').split('\n')[0];$('alertSource').textContent=`National Weather Service · ${p.expires?`Expires ${new Date(p.expires).toLocaleString()}`:'Active alert'}`;$('weatherAlert').hidden=false;}catch(e){/* optional function: omit alert card when not deployed */}
}
document.addEventListener('DOMContentLoaded',init);
