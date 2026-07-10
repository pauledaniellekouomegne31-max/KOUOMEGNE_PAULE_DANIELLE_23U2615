const GOLD       = "#C9A84C";
const GOLD_LIGHT = "#E8C97A";
const ACCENT     = "#E8534A";
const SUCCESS    = "#4CAF7D";
const MUTED      = "#9A9490";
const CARD_BG    = "#1E1E1E";

const PALETTE = [
  "#C9A84C", "#E8534A", "#4CAF7D", "#6B9FD4",
  "#E8A84C", "#A84CE8", "#4CE8C9", "#E84CA8",
  "#8BC34A", "#FF9800"
];

Chart.defaults.color = "#9A9490";
Chart.defaults.borderColor = "rgba(255,255,255,0.06)";
Chart.defaults.font.family = "'Outfit', sans-serif";

let charts = {};

document.addEventListener("DOMContentLoaded", loadStats);

async function loadStats() {
  document.getElementById("loader").style.display = "block";
  document.getElementById("kpiRow").style.display   = "none";
  document.getElementById("chartsWrap").style.display = "none";
  document.getElementById("noData").style.display   = "none";

  try {
    const res = await fetch("/api/stats");
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }

    const data = await res.json();
    document.getElementById("loader").style.display = "none";

    if (!data.total || data.total === 0) {
      document.getElementById("noData").style.display = "block";
      return;
    }

    document.getElementById("kpiRow").style.display     = "grid";
    document.getElementById("chartsWrap").style.display = "flex";

    renderKPIs(data);
    renderPrestations(data.coiffures);
    renderSexe(data.sexe);
    renderPrix(data.prix_par_coiffure);
    renderPaiement(data.paiement);
    renderReco(data.reco);
    renderVilles(data.villes);
    renderFreq(data.freq_visite);
    renderRadar(data.notes_radar);
    renderDuree(data.duree_par_coiffure);
    renderProfession(data.profession);
    renderTypeSalon(data.type_salon);
    renderEvolution(data.evolution);

  } catch (err) {
    document.getElementById("loader").innerHTML =
      `<p style="color:#E8534A">Erreur de chargement des données.<br/>
      <button onclick="loadStats()" style="margin-top:12px;padding:8px 18px;background:#C9A84C;color:#0F0F0F;border:none;border-radius:50px;cursor:pointer;">Réessayer</button></p>`;
  }
}

function renderKPIs(data) {
  document.getElementById("kTotal").textContent = data.total.toLocaleString("fr-FR");
  document.getElementById("kPrix").textContent  = data.prix_moyen ? data.prix_moyen.toLocaleString("fr-FR") : "—";
  document.getElementById("kNote").textContent  = data.note_moy ? `${data.note_moy} ⭐` : "—";
  document.getElementById("kVille").textContent = data.ville_top || "—";
  document.getElementById("kDuree").textContent = data.duree_moy ? data.duree_moy : "—";
}

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// ── Graphique : Prestations demandées ──
function renderPrestations(data) {
  destroyChart("prestations");
  const labels = Object.keys(data);
  const values = Object.values(data);

  charts["prestations"] = new Chart(document.getElementById("cCoiffures"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Nombre de clients",
        data: values,
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length] + "CC"),
        borderColor:      labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 1.5,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.04)" } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

// ── Graphique : Répartition Hommes / Femmes ──
function renderSexe(data) {
  destroyChart("sexe");
  charts["sexe"] = new Chart(document.getElementById("cSexe"), {
    type: "doughnut",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: [GOLD + "CC", ACCENT + "CC", SUCCESS + "CC"],
        borderColor:     [GOLD, ACCENT, SUCCESS],
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      cutout: "62%",
      plugins: {
        legend: { position: "bottom", labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8 } }
      }
    }
  });
}

// ── Graphique : Prix moyen par coiffure ──
function renderPrix(data) {
  destroyChart("prix");
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const labels = sorted.map(e => e[0]);
  const values = sorted.map(e => e[1]);

  charts["prix"] = new Chart(document.getElementById("cPrix"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Prix moyen (FCFA)",
        data: values,
        backgroundColor: GOLD + "99",
        borderColor: GOLD,
        borderWidth: 1.5,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => `${ctx.parsed.x.toLocaleString("fr-FR")} FCFA` }
        }
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { callback: v => v.toLocaleString("fr-FR") } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

// ── Graphique : Moyens de paiement ──
function renderPaiement(data) {
  destroyChart("paiement");
  charts["paiement"] = new Chart(document.getElementById("cPaiement"), {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: [SUCCESS + "CC", GOLD + "CC", ACCENT + "CC"],
        borderColor:     [SUCCESS, GOLD, ACCENT],
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom", labels: { padding: 16, usePointStyle: true } } }
    }
  });
}

// ── Graphique : Notes moyennes par critère (radar) ──
function renderRadar(data) {
  destroyChart("radar");
  charts["radar"] = new Chart(document.getElementById("cRadar"), {
    type: "radar",
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: "Moyenne /5",
        data: Object.values(data),
        backgroundColor: GOLD + "22",
        borderColor: GOLD,
        borderWidth: 2,
        pointBackgroundColor: GOLD,
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0, max: 5,
          ticks: { stepSize: 1, backdropColor: "transparent", font: { size: 10 } },
          grid: { color: "rgba(255,255,255,0.06)" },
          angleLines: { color: "rgba(255,255,255,0.06)" },
          pointLabels: { font: { size: 11 } }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// ── Graphique : Recommandation du salon ──
function renderReco(data) {
  destroyChart("reco");
  charts["reco"] = new Chart(document.getElementById("cReco"), {
    type: "doughnut",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: [SUCCESS + "CC", ACCENT + "CC", GOLD + "CC"],
        borderColor:     [SUCCESS, ACCENT, GOLD],
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      cutout: "55%",
      plugins: { legend: { position: "bottom", labels: { padding: 16, usePointStyle: true } } }
    }
  });
}

// ── Graphique : Évolution des soumissions dans le temps ──
function renderEvolution(data) {
  destroyChart("evolution");
  const labels = Object.keys(data).sort();
  const values = labels.map(d => data[d]);
  charts["evolution"] = new Chart(document.getElementById("cEvolution"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Soumissions",
        data: values,
        borderColor: GOLD,
        backgroundColor: GOLD + "18",
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: GOLD,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { maxTicksLimit: 10 } },
        y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { stepSize: 1 }, beginAtZero: true }
      }
    }
  });
}

// ── Graphique : Fréquentation par ville ──
function renderVilles(data) {
  destroyChart("villes");
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(e => e[0]);
  const values = sorted.map(e => e[1]);

  charts["villes"] = new Chart(document.getElementById("cVilles"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Nombre de réponses",
        data: values,
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length] + "BB"),
        borderColor:     labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 1.5,
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { stepSize: 1 }, beginAtZero: true }
      }
    }
  });
}

// ── Graphique : Fréquence de visite ──
function renderFreq(data) {
  destroyChart("freq");
  charts["freq"] = new Chart(document.getElementById("cFreq"), {
    type: "bar",
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: "Nombre de clients",
        data: Object.values(data),
        backgroundColor: GOLD_LIGHT + "AA",
        borderColor: GOLD_LIGHT,
        borderWidth: 1.5,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.04)" } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

// ── Graphique : Durée moyenne par coiffure ──
function renderDuree(data) {
  destroyChart("duree");
  charts["duree"] = new Chart(document.getElementById("cDuree"), {
    type: "bar",
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: "Durée moyenne (min)",
        data: Object.values(data),
        backgroundColor: ACCENT + "99",
        borderColor: ACCENT,
        borderWidth: 1.5,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: "rgba(255,255,255,0.04)" }, beginAtZero: true }
      }
    }
  });
}

// ── Graphique : Profil socioprofessionnel ──
function renderProfession(data) {
  destroyChart("profession");
  charts["profession"] = new Chart(document.getElementById("cProfession"), {
    type: "doughnut",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: Object.keys(data).map((_, i) => PALETTE[i % PALETTE.length] + "CC"),
        borderColor:     Object.keys(data).map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      cutout: "55%",
      plugins: { legend: { position: "bottom", labels: { padding: 12, usePointStyle: true, font: { size: 10 } } } }
    }
  });
}

// ── Graphique : Type de salon ──
function renderTypeSalon(data) {
  destroyChart("typeSalon");
  charts["typeSalon"] = new Chart(document.getElementById("cTypeSalon"), {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: Object.keys(data).map((_, i) => PALETTE[i % PALETTE.length] + "CC"),
        borderColor:     Object.keys(data).map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom", labels: { padding: 12, usePointStyle: true, font: { size: 10 } } } }
    }
  });
}
