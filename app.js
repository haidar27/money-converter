const currencies = [
  ['USD', '$', 'US Dollar'], ['IDR', 'Rp', 'Indonesian Rupiah'], ['EUR', '€', 'Euro'],
  ['GBP', '£', 'British Pound'], ['JPY', '¥', 'Japanese Yen'], ['SGD', 'S$', 'Singapore Dollar'],
  ['AUD', 'A$', 'Australian Dollar'], ['CAD', 'C$', 'Canadian Dollar'], ['CHF', 'CHF', 'Swiss Franc'],
  ['CNY', '¥', 'Chinese Yuan'], ['HKD', 'HK$', 'Hong Kong Dollar'], ['KRW', '₩', 'South Korean Won'],
  ['MYR', 'RM', 'Malaysian Ringgit'], ['THB', '฿', 'Thai Baht'], ['INR', '₹', 'Indian Rupee'],
  ['NZD', 'NZ$', 'New Zealand Dollar'], ['PHP', '₱', 'Philippine Peso'], ['VND', '₫', 'Vietnamese Dong'],
  ['AED', 'د.إ', 'UAE Dirham'], ['SAR', '﷼', 'Saudi Riyal']
];

const amountInput = document.querySelector('#amountInput');
const fromCurrency = document.querySelector('#fromCurrency');
const toCurrency = document.querySelector('#toCurrency');
const fromSymbol = document.querySelector('#fromSymbol');
const toSymbol = document.querySelector('#toSymbol');
const resultOutput = document.querySelector('#resultOutput');
const rateValue = document.querySelector('#rateValue');
const rateFrom = document.querySelector('#rateFrom');
const rateTo = document.querySelector('#rateTo');
const rateDate = document.querySelector('#rateDate');
const rateStatus = document.querySelector('#rateStatus');
const refreshBtn = document.querySelector('#refreshBtn');
const swapBtn = document.querySelector('#swapBtn');
const installBtn = document.querySelector('#installBtn');

const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 });
const amountFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
let currentRate = null;
let currentRateDate = null;
let pendingInstallPrompt = null;

function buildCurrencyOptions(select, selected){
  select.innerHTML = currencies.map(([code, symbol, name]) =>
    `<option value="${code}" ${code === selected ? 'selected' : ''}>${symbol}  ${code} — ${name}</option>`
  ).join('');
}

function currencyInfo(code){ return currencies.find(c => c[0] === code) || [code, code, code]; }
function setStatus(text){ rateStatus.textContent = text; }
function setSymbols(){
  fromSymbol.textContent = currencyInfo(fromCurrency.value)[1];
  toSymbol.textContent = currencyInfo(toCurrency.value)[1];
  rateFrom.textContent = fromCurrency.value;
  rateTo.textContent = toCurrency.value;
}
function formatConverted(value, code){
  const decimals = ['JPY','KRW','VND'].includes(code) ? 0 : 2;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value);
}
function cacheKey(){ return `rate:${fromCurrency.value}:${toCurrency.value}`; }
function saveCachedRate(data){
  try{ localStorage.setItem(cacheKey(), JSON.stringify({ ...data, savedAt: Date.now() })); } catch(e){}
}
function loadCachedRate(){
  try{ const raw = localStorage.getItem(cacheKey()); return raw ? JSON.parse(raw) : null; } catch(e){ return null; }
}

async function fetchRate({silent=false} = {}){
  setSymbols();
  if(fromCurrency.value === toCurrency.value){
    currentRate = 1;
    currentRateDate = new Date().toISOString().slice(0,10);
    rateValue.textContent = '1';
    rateDate.textContent = 'Same currency';
    setStatus('Ready');
    convert();
    return;
  }

  setStatus('Updating');
  if(!silent) refreshBtn.classList.add('loading-spin');

  const url = `https://api.frankfurter.dev/v2/rate/${fromCurrency.value.toLowerCase()}/${toCurrency.value.toLowerCase()}`;
  try{
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    if(!response.ok) throw new Error('Rate unavailable');
    const data = await response.json();
    currentRate = Number(data.rate);
    currentRateDate = data.date || new Date().toISOString().slice(0,10);
    saveCachedRate({ rate: currentRate, date: currentRateDate });
    rateValue.textContent = numberFmt.format(currentRate);
    rateDate.textContent = `Reference • ${currentRateDate}`;
    setStatus('Live');
    convert();
  }catch(error){
    const cached = loadCachedRate();
    if(cached?.rate){
      currentRate = Number(cached.rate);
      currentRateDate = cached.date;
      rateValue.textContent = numberFmt.format(currentRate);
      rateDate.textContent = `Cached • ${currentRateDate}`;
      setStatus('Offline');
      convert();
    }else{
      currentRate = null;
      rateValue.textContent = '—';
      rateDate.textContent = 'Could not fetch rate';
      resultOutput.textContent = '—';
      setStatus('Offline');
    }
  }finally{
    refreshBtn.classList.remove('loading-spin');
  }
}

function convert(){
  const amount = Number(String(amountInput.value).replace(',', '.'));
  if(!Number.isFinite(amount) || amount < 0 || currentRate == null){
    resultOutput.textContent = '—';
    return;
  }
  resultOutput.textContent = formatConverted(amount * currentRate, toCurrency.value);
}

amountInput.addEventListener('input', convert);
fromCurrency.addEventListener('change', () => fetchRate());
toCurrency.addEventListener('change', () => fetchRate());
refreshBtn.addEventListener('click', () => fetchRate());
swapBtn.addEventListener('click', () => {
  const oldFrom = fromCurrency.value;
  fromCurrency.value = toCurrency.value;
  toCurrency.value = oldFrom;
  fetchRate();
});

document.querySelectorAll('.quick-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    amountInput.value = btn.dataset.amount;
    convert();
    amountInput.focus();
  });
});

buildCurrencyOptions(fromCurrency, 'USD');
buildCurrencyOptions(toCurrency, 'IDR');
setSymbols();
fetchRate({silent:true});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  pendingInstallPrompt = event;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if(!pendingInstallPrompt) return;
  pendingInstallPrompt.prompt();
  await pendingInstallPrompt.userChoice;
  pendingInstallPrompt = null;
  installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => {
  installBtn.hidden = true;
  setStatus('Installed');
});

if('serviceWorker' in navigator){
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
