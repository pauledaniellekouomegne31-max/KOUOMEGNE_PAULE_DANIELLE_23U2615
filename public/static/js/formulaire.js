const TOTAL_STEPS = 4;
let currentStep = 1;

const progressBar  = document.getElementById("progressBar");
const stepNum      = document.getElementById("stepNum");
const btnPrev      = document.getElementById("btnPrev");
const btnNext      = document.getElementById("btnNext");
const btnSubmit    = document.getElementById("btnSubmit");
const submitText   = document.getElementById("submitText");
const submitLoader = document.getElementById("submitLoader");
const formError    = document.getElementById("form-error");

document.addEventListener("DOMContentLoaded", () => {
  updateUI();
  initRadioCards();
  initCheckboxCards();
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
  progressBar.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;

  document.querySelectorAll(".step-label").forEach(l => {
    l.classList.toggle("active", parseInt(l.dataset.step) === currentStep);
  });

 
  btnPrev.classList.toggle("hidden", currentStep === 1);
  btnNext.classList.toggle("hidden", currentStep === TOTAL_STEPS);
  btnSubmit.classList.toggle("hidden", currentStep !== TOTAL_STEPS);
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

  const radioGroups = {};
  stepEl.querySelectorAll("input[type='radio'][required]").forEach(r => {
    radioGroups[r.name] = radioGroups[r.name] || false;
    if (r.checked) radioGroups[r.name] = true;
  });

  for (const [name, checked] of Object.entries(radioGroups)) {
    if (!checked) {
      showError("Veuillez répondre à toutes les questions obligatoires (*).");
      return false;
    }
  }

  if (step === 4) {
    const starFields = ["note_generale", "note_accueil", "note_qualite", "note_proprete", "note_qualite_prix"];
    for (const field of starFields) {
      if (!document.getElementById(field).value) {
        showError("Veuillez attribuer une note à tous les critères (*).");
        return false;
      }
    }
  }

  return true;
}

function showError(msg) {
  formError.textContent = msg;
  formError.classList.remove("hidden");
  formError.scrollIntoView({ behavior: "smooth", block: "center" });
}

function initRadioCards() {
  document.querySelectorAll(".radio-card").forEach(card => {
    card.addEventListener("click", () => {
      const input = card.querySelector("input[type='radio']");
      input.checked = true;

      const name = input.name;
      document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
        r.closest(".radio-card").classList.remove("selected");
      });

      card.classList.add("selected");
    });
  });
}

function initCheckboxCards() {
  document.querySelectorAll(".check-card").forEach(card => {
    card.addEventListener("click", () => {
      const input = card.querySelector("input[type='checkbox']");
      input.checked = !input.checked;
      card.classList.toggle("selected", input.checked);
    });
  });
}

function initStarRatings() {
  document.querySelectorAll(".star-rating").forEach(ratingEl => {
    const fieldName = ratingEl.dataset.name;
    const hiddenInput = document.getElementById(fieldName);
    const stars = ratingEl.querySelectorAll(".star");

    stars.forEach(star => {
      star.addEventListener("mouseenter", () => {
        const val = parseInt(star.dataset.val);
        stars.forEach(s => {
          s.classList.toggle("active", parseInt(s.dataset.val) <= val);
        });
      });

      ratingEl.addEventListener("mouseleave", () => {
        const selected = parseInt(hiddenInput.value) || 0;
        stars.forEach(s => {
          s.classList.toggle("active", parseInt(s.dataset.val) <= selected);
        });
      });

      star.addEventListener("click", () => {
        const val = parseInt(star.dataset.val);
        hiddenInput.value = val;
        stars.forEach(s => {
          s.classList.toggle("active", parseInt(s.dataset.val) <= val);
        });
      });
    });
  });
}

document.getElementById("coiffForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateStep(4)) return;

  submitText.classList.add("hidden");
  submitLoader.classList.remove("hidden");
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
  form.querySelectorAll("input[name='services_annexes']:checked").forEach(c => {
    services.push(c.value);
  });
  data["services_annexes"] = services;

  try {
    const res = await fetch("/api/soumettre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.success) {
      window.location.href = "/merci";
    } else {
      showError("Erreur : " + result.message);
      submitText.classList.remove("hidden");
      submitLoader.classList.add("hidden");
      btnSubmit.disabled = false;
    }
  } catch (err) {
    showError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    submitText.classList.remove("hidden");
    submitLoader.classList.add("hidden");
    btnSubmit.disabled = false;
  }
});

