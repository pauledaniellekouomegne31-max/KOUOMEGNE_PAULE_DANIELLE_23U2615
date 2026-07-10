const TOTAL_STEPS = 4;
let currentStep = 1;

const progFill   = document.getElementById("progFill");
const curStep    = document.getElementById("curStep");
const btnPrev    = document.getElementById("btnPrev");
const btnNext    = document.getElementById("btnNext");
const btnSubmit  = document.getElementById("btnSubmit");
const submitTxt  = document.getElementById("submitTxt");
const submitLoad = document.getElementById("submitLoad");
const formError  = document.getElementById("formError");

document.addEventListener("DOMContentLoaded", () => {
  updateUI();
  initStarRatings();
});

btnNext.addEventListener("click", () => {
  if (validateStep(currentStep)) {
    currentStep++;
    showStep(currentStep);
  }
});

btnPrev.addEventListener("click", () => {
  currentStep--;
  showStep(currentStep);
});

function showStep(step) {
  document.querySelectorAll(".form-step").forEach(s => s.classList.remove("active"));
  document.querySelector(`.form-step[data-step="${step}"]`).classList.add("active");
  updateUI();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateUI() {
  progFill.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;

  document.querySelectorAll(".plbl").forEach(l => {
    l.classList.toggle("active", parseInt(l.dataset.s) === currentStep);
  });

  curStep.textContent = currentStep;

  btnPrev.style.display   = currentStep === 1 ? "none" : "inline-block";
  btnNext.style.display   = currentStep === TOTAL_STEPS ? "none" : "inline-block";
  btnSubmit.style.display = currentStep === TOTAL_STEPS ? "inline-flex" : "none";
}

function validateStep(step) {
  formError.classList.add("hidden");
  formError.textContent = "";

  const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
  const inputs = stepEl.querySelectorAll("input[required], select[required], textarea[required]");

  for (const input of inputs) {
    if (input.type === "radio") continue;
    if (!input.value.trim()) {
      showError("Veuillez remplir tous les champs obligatoires (*).");
      input.focus();
      return false;
    }
  }

  const requiredRadioNames = new Set();
  stepEl.querySelectorAll("input[type='radio'][required]").forEach(r => {
    requiredRadioNames.add(r.name);
  });

  for (const name of requiredRadioNames) {
    const anyChecked = stepEl.querySelector(`input[type='radio'][name='${name}']:checked`);
    if (!anyChecked) {
      showError("Veuillez répondre à toutes les questions obligatoires (*).");
      return false;
    }
  }

  return true;
}

function showError(msg) {
  formError.textContent = msg;
  formError.classList.remove("hidden");
  formError.scrollIntoView({ behavior: "smooth", block: "center" });
}

function initStarRatings() {
  document.querySelectorAll(".stars-row").forEach(ratingEl => {
    const fieldName   = ratingEl.dataset.name;
    const hiddenInput = document.getElementById(fieldName);
    const stars       = ratingEl.querySelectorAll(".star");

    stars.forEach(star => {
      star.addEventListener("mouseenter", () => {
        const val = parseInt(star.dataset.v);
        stars.forEach(s => s.classList.toggle("active", parseInt(s.dataset.v) <= val));
      });

      ratingEl.addEventListener("mouseleave", () => {
        const selected = parseInt(hiddenInput.value) || 0;
        stars.forEach(s => s.classList.toggle("active", parseInt(s.dataset.v) <= selected));
      });

      star.addEventListener("click", () => {
        const val = parseInt(star.dataset.v);
        hiddenInput.value = val;
        stars.forEach(s => s.classList.toggle("active", parseInt(s.dataset.v) <= val));
      });
    });
  });
}

document.getElementById("mainForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateStep(4)) return;

  submitTxt.style.display  = "none";
  submitLoad.style.display = "inline";
  btnSubmit.disabled = true;

  const form = e.target;
  const data = {};

  form.querySelectorAll("input:not([type='radio']):not([type='checkbox']), select, textarea").forEach(el => {
    if (el.name) data[el.name] = el.value;
  });

  form.querySelectorAll("input[type='radio']:checked").forEach(r => {
    data[r.name] = r.value;
  });

  const services = [];
  form.querySelectorAll("input[name='services_ann']:checked").forEach(c => {
    services.push(c.value);
  });
  data["services_ann"] = services;

  try {
    const res = await fetch("/api/soumettre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.ok) {
      window.location.href = "/merci";
    } else {
      showError("Erreur : " + result.msg);
      submitTxt.style.display  = "inline";
      submitLoad.style.display = "none";
      btnSubmit.disabled = false;
    }
  } catch (err) {
    showError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    submitTxt.style.display  = "inline";
    submitLoad.style.display = "none";
    btnSubmit.disabled = false;
  }
});
