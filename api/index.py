import os
import io
import json
from datetime import datetime

from flask import (
    Flask, render_template, request,
    jsonify, redirect, url_for, session, send_file
)
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
import pandas as pd


load_dotenv()

app = Flask(
    __name__,
    template_folder="../templates",
    static_folder="../static"
)
app.secret_key = os.environ.get("SECRET_KEY", "coiffdata_secret_2026")
CORS(app)

SUPABASE_URL    = os.environ.get("SUPABASE_URL", "https://wpznjyekkzelucexkexo.supabase.co")
SUPABASE_KEY    = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwem5qeWVra3plbHVjZXhrZXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODY5NTksImV4cCI6MjA5MzA2Mjk1OX0.qanQjBmy3HfNODGmaFWO35W-FbqmLGP-iWtMKX60sDI")
ADMIN_PASSWORD  = os.environ.get("ADMIN_PASSWORD", "admin2026")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
TABLE = "reponses"




@app.route("/")
def accueil():
    return render_template("index.html")


@app.route("/formulaire")
def formulaire():
    return render_template("formulaire.html")


@app.route("/merci")
def merci():
    return render_template("merci.html")




@app.route("/login", methods=["GET", "POST"])
def login():
    erreur = None
    if request.method == "POST":
        if request.form.get("password") == ADMIN_PASSWORD:
            session["admin"] = True
            return redirect(url_for("dashboard"))
        erreur = "Mot de passe incorrect."
    return render_template("login.html", erreur=erreur)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("accueil"))




@app.route("/dashboard")
def dashboard():
    if not session.get("admin"):
        return redirect(url_for("login"))
    return render_template("dashboard.html")



@app.route("/api/soumettre", methods=["POST"])
def soumettre():
    try:
        d = request.get_json(force=True)
        if not d:
            return jsonify({"ok": False, "msg": "Données manquantes."}), 400

        record = {
            "sexe":           d.get("sexe"),
            "tranche_age":    d.get("tranche_age"),
            "quartier_res":   d.get("quartier_res"),
            "profession":     d.get("profession"),
            "freq_visite":    d.get("freq_visite"),
            "nom_salon":      d.get("nom_salon"),
            "ville":          d.get("ville"),
            "quartier_salon": d.get("quartier_salon"),
            "type_salon":     d.get("type_salon"),
            "nb_coiffeurs":   d.get("nb_coiffeurs"),
            "services_ann":   json.dumps(d.get("services_ann", []), ensure_ascii=False),
            "type_coiffure":  d.get("type_coiffure"),
            "duree_min":      _int(d.get("duree_min")),
            "produits":       d.get("produits"),
            "prix_fcfa":      _int(d.get("prix_fcfa")),
            "paiement":       d.get("paiement"),
            "pourboire":      d.get("pourboire"),
            "note_generale":  _int(d.get("note_generale")),
            "note_accueil":   _int(d.get("note_accueil")),
            "note_qualite":   _int(d.get("note_qualite")),
            "note_proprete":  _int(d.get("note_proprete")),
            "note_qp":        _int(d.get("note_qp")),
            "recommandation": d.get("recommandation"),
            "commentaire":    d.get("commentaire", ""),
            "soumis_le":      datetime.utcnow().isoformat(),
        }

        supabase.table(TABLE).insert(record).execute()
        return jsonify({"ok": True, "msg": "Réponse enregistrée."}), 201

    except Exception as exc:
        return jsonify({"ok": False, "msg": str(exc)}), 500


@app.route("/api/stats")
def stats():
    if not session.get("admin"):
        return jsonify({"error": "Non autorisé"}), 401

    try:
        res  = supabase.table(TABLE).select("*").execute()
        rows = res.data

        if not rows:
            return jsonify({"total": 0})

        df = pd.DataFrame(rows)

        # Colonnes numériques
        num_cols = ["note_generale", "note_accueil", "note_qualite",
                    "note_proprete", "note_qp", "prix_fcfa", "duree_min"]
        for c in num_cols:
            df[c] = pd.to_numeric(df[c], errors="coerce")

        total       = len(df)
        prix_moyen  = round(df["prix_fcfa"].mean(), 0)
        note_moy    = round(df["note_generale"].mean(), 2)
        ville_top   = df["ville"].mode()[0] if df["ville"].notna().any() else "N/A"
        duree_moy   = round(df["duree_min"].mean(), 0)

        # Évolution temporelle
        evolution = {}
        if "soumis_le" in df.columns:
            df["soumis_le"] = pd.to_datetime(df["soumis_le"], errors="coerce")
            evolution = {
                str(k): int(v)
                for k, v in df.groupby(df["soumis_le"].dt.date).size().items()
            }

        data = {
            "total":         total,
            "prix_moyen":    prix_moyen,
            "note_moy":      note_moy,
            "ville_top":     ville_top,
            "duree_moy":     duree_moy,

            # Distributions
            "coiffures":     _vc(df, "type_coiffure"),
            "sexe":          _vc(df, "sexe"),
            "villes":        _vc(df, "ville"),
            "paiement":      _vc(df, "paiement"),
            "reco":          _vc(df, "recommandation"),
            "freq_visite":   _vc(df, "freq_visite"),
            "type_salon":    _vc(df, "type_salon"),
            "profession":    _vc(df, "profession"),

            # Prix moyen par coiffure (histogramme)
            "prix_par_coiffure": (
                df.groupby("type_coiffure")["prix_fcfa"]
                .mean().round(0)
                .dropna()
                .astype(int)
                .to_dict()
            ),

            # Durée moyenne par coiffure
            "duree_par_coiffure": (
                df.groupby("type_coiffure")["duree_min"]
                .mean().round(0)
                .dropna()
                .astype(int)
                .to_dict()
            ),

            # Radar des notes
            "notes_radar": {
                "Accueil":       _safe_mean(df, "note_accueil"),
                "Qualité":       _safe_mean(df, "note_qualite"),
                "Propreté":      _safe_mean(df, "note_proprete"),
                "Qualité/Prix":  _safe_mean(df, "note_qp"),
                "Général":       _safe_mean(df, "note_generale"),
            },

            # Évolution temporelle
            "evolution": evolution,
        }

        return jsonify(data)

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500



@app.route("/api/export")
def export_csv():
    if not session.get("admin"):
        return jsonify({"error": "Non autorisé"}), 401

    try:
        res = supabase.table(TABLE).select("*").execute()
        df  = pd.DataFrame(res.data)
        buf = io.StringIO()
        df.to_csv(buf, index=False, encoding="utf-8-sig")
        buf.seek(0)
        nom = f"coiffdata_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        return send_file(
            io.BytesIO(buf.getvalue().encode("utf-8-sig")),
            mimetype="text/csv",
            as_attachment=True,
            download_name=nom,
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── Helpers ───────────────────────────────────────────────────────────────────

def _int(val):
    try:
        return int(val)
    except (TypeError, ValueError):
        return None


def _vc(df: pd.DataFrame, col: str) -> dict:
    if col not in df.columns:
        return {}
    return {str(k): int(v) for k, v in df[col].value_counts().items()}


def _safe_mean(df: pd.DataFrame, col: str) -> float:
    try:
        return round(float(df[col].mean()), 2)
    except Exception:
        return 0.0



if __name__ == "__main__":
    app.run(debug=True, port=5000)
