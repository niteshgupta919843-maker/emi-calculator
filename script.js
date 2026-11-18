const amountInput = document.querySelector('#amount');
const amountRange = document.querySelector('#amountRange');
const rateInput = document.querySelector('#rate');
const rateRange = document.querySelector('#rateRange');
const tenureInput = document.querySelector('#tenure');
const tenureRange = document.querySelector('#tenureRange');
const tenureUnitLabel = document.querySelector('#tenureUnit');
const tenureButtons = [...document.querySelectorAll('.tenure-switch button')];
let tenureUnit = 'years';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const compactInr = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
const formatRupees = value => `₹${inr.format(Math.round(value))}`;

function setRangeFill(range) {
  const min = Number(range.min);
  const max = Number(range.max);
  const percent = ((Number(range.value) - min) / (max - min)) * 100;
  range.style.background = `linear-gradient(to right, #326a4c ${percent}%, #e9eee8 ${percent}%)`;
}

function setTenureLimits() {
  const isYears = tenureUnit === 'years';
  const min = isYears ? 1 : 12;
  const max = isYears ? 30 : 360;
  const value = Math.max(min, Math.min(max, Math.round(Number(tenureInput.value) || min)));
  tenureInput.min = tenureRange.min = String(min);
  tenureInput.max = tenureRange.max = String(max);
  tenureInput.step = tenureRange.step = '1';
  tenureInput.value = tenureRange.value = String(value);
  tenureUnitLabel.textContent = isYears ? 'YEARS' : 'MONTHS';
  document.querySelector('#tenureMin').textContent = isYears ? '1 yr' : '12 mo';
  document.querySelector('#tenureMax').textContent = isYears ? '30 yrs' : '360 mo';
  tenureButtons.forEach(button => {
    const active = button.dataset.unit === tenureUnit;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  setRangeFill(tenureRange);
}

function calculate() {
  const principal = Math.max(0, Number(amountInput.value) || 0);
  const annualRate = Math.max(0, Number(rateInput.value) || 0);
  const months = tenureUnit === 'years' ? Number(tenureInput.value) * 12 : Number(tenureInput.value);
  const monthlyRate = annualRate / 1200;
  const emi = monthlyRate === 0
    ? principal / months
    : principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1);
  const total = emi * months;
  const interest = Math.max(0, total - principal);
  const principalShare = total ? (principal / total) * 360 : 360;

  document.querySelector('#emi').textContent = inr.format(Math.round(emi));
  document.querySelector('#principal').textContent = formatRupees(principal);
  document.querySelector('#interest').textContent = formatRupees(interest);
  document.querySelector('#total').textContent = formatRupees(total);
  document.querySelector('#chartTotal').textContent = compactInr.format(principal).replace('₹', '₹');
  document.querySelector('#donut').style.background = `conic-gradient(#326a4c 0deg ${principalShare}deg, #e9a66e ${principalShare}deg 360deg)`;
  document.querySelector('#donut').setAttribute('aria-label', `Principal ${formatRupees(principal)}, interest ${formatRupees(interest)}`);
  document.querySelector('#copyStatus').textContent = '';
}

function bindPair(input, range, min, max) {
  input.addEventListener('input', () => {
    const value = Math.max(min, Math.min(max, Number(input.value) || min));
    range.value = String(value);
    setRangeFill(range);
    calculate();
  });
  input.addEventListener('change', () => {
    input.value = String(Math.max(min, Math.min(max, Number(input.value) || min)));
  });
  range.addEventListener('input', () => {
    input.value = range.value;
    setRangeFill(range);
    calculate();
  });
  setRangeFill(range);
}

bindPair(amountInput, amountRange, 10000, 100000000);
bindPair(rateInput, rateRange, 0.1, 30);
tenureInput.addEventListener('input', () => {
  const value = Math.max(Number(tenureInput.min), Math.min(Number(tenureInput.max), Number(tenureInput.value) || Number(tenureInput.min)));
  tenureRange.value = String(value);
  setRangeFill(tenureRange);
  calculate();
});
tenureInput.addEventListener('change', () => {
  tenureInput.value = String(Math.max(Number(tenureInput.min), Math.min(Number(tenureInput.max), Number(tenureInput.value) || Number(tenureInput.min))));
});
tenureRange.addEventListener('input', () => {
  tenureInput.value = tenureRange.value;
  setRangeFill(tenureRange);
  calculate();
});
tenureButtons.forEach(button => button.addEventListener('click', () => {
  if (button.dataset.unit === tenureUnit) return;
  const months = tenureUnit === 'years' ? Number(tenureInput.value) * 12 : Number(tenureInput.value);
  tenureUnit = button.dataset.unit;
  tenureInput.value = String(tenureUnit === 'years' ? Math.round(months / 12) : months);
  setTenureLimits();
  calculate();
}));

document.querySelector('#shareButton').addEventListener('click', async () => {
  const emi = document.querySelector('#emi').textContent;
  const message = `Estimated EMI: ₹${emi}/month | Loan: ${formatRupees(Number(amountInput.value))} | Rate: ${rateInput.value}% p.a. | Tenure: ${tenureInput.value} ${tenureUnit}`;
  const status = document.querySelector('#copyStatus');
  try {
    await navigator.clipboard.writeText(message);
    status.textContent = 'Estimate copied to clipboard.';
  } catch {
    status.textContent = message;
  }
});

setTenureLimits();
calculate();
