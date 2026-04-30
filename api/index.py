from flask import Flask, render_template, request, jsonify, redirect, url_for, session, send_file
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
import pandas as pd
import os
import io
import json
from datetime import datetime

load_dotenv()

app = Flask(__name__, template_folder='../templates', static_folder='../static')
app.secret_key = os.environ.get("SECRET_KEY", "coiffdata-secret-2026")
CORS(app)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://wpznjyekkzelucexkexo.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")                              
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin2026")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route("/")
def accueil():
    return render_template("index.html")

@app.route("/formulaire")
def formulaire():
    return render_template("formulaire.html")

@app.route("/merci")
def merci():
    return render_template("merci.html")

@app.route("/dashboard")
def dashboard():
    if not session.get("admin_connecte"):
        return redirect(url_for("login"))
    return render_template("dashboard.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    erreur = None
    if request.method == "POST":
        mdp = request.form.get("password")
        if mdp == ADMIN_PASSWORD:
            session["admin_connecte"] = True
            return redirect(url_for("dashboard"))
        else:
            erreur = "Mot de passe incorrect."
    return render_template("login.html", erreur=erreur)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("accueil"))

@app.route("/api/soumettre", methods=["POST"])
def soumettre():
    try:
        data = request.get_json()
        record = {
            "sexe":               data.get("sexe"),
            "tranche_age":        data.get("tranche_age"),
            "quartier_residence": data.get("quartier_residence"),
            "profession":         data.get("profession"),
            "frequence_visite":   data.get("frequence_visite"),
            "nom_salon":          data.get("nom_salon"),
            "ville":              data.get("ville"),
            "quartier_salon":     data.get("quartier_salon"),
            "type_salon":         data.get("type_salon"),
            "nb_coiffeurs":       data.get("nb_coiffeurs"),
            "services_annexes":   json.dumps(data.get("services_annexes", [])),
            "type_coiffure":      data.get("type_coiffure"),
            "duree":              data.get("duree"),
            "produits_utilises":  data.get("produits_utilises"),
            "prix_fcfa":          int(data.get("prix_fcfa", 0)),
            "moyen_paiement":     data.get("moyen_paiement"),
            "pourboire":          data.get("pourboire"),
            "note_generale":      int(data.get("note_generale", 0)),
            "note_accueil":       int(data.get("note_accueil", 0)),
            "note_qualite":       int(data.get("note_qualite", 0)),
            "note_proprete":      int(data.get("note_proprete", 0)),
            "note_qualite_prix":  int(data.get("note_qualite_prix", 0)),
            "recommandation":     data.get("recommandation"),
            "commentaire":        data.get("commentaire", ""),
            "date_soumission":    datetime.utcnow().isoformat()
        }
        supabase.table("reponses").insert(record).execute()
        return jsonify({"success": True, "message": "Réponse enregistrée avec succès."}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/api/stats")
def get_stats():
    if not session.get("admin_connecte"):
        return jsonify({"error": "Non autorisé"}), 401
    try:
        res = supabase.table("reponses").select("*").execute()
        rows = res.data
        if not rows:
            return jsonify({"total": 0})
        df = pd.DataFrame(rows)
        for col in ["note_generale", "note_accueil", "note_qualite", "note_proprete", "note_qualite_prix", "prix_fcfa"]:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        total = len(df)
        prix_moyen = round(df["prix_fcfa"].mean(), 0)
        note_moyenne = round(df["note_generale"].mean(), 2)
        ville_top = df["ville"].mode()[0] if not df["ville"].isna().all() else "N/A"
        
        stats_data = {
            "total": total,
            "prix_moyen": prix_moyen,
            "note_moyenne": note_moyenne,
            "ville_top": ville_top,
            "prestations": df["type_coiffure"].value_counts().to_dict(),
            "sexe": df["sexe"].value_counts().to_dict(),
            "paiement": df["moyen_paiement"].value_counts().to_dict(),
            "villes": df["ville"].value_counts().to_dict(),
            "recommandation": df["recommandation"].value_counts().to_dict(),
            "prix_par_coiffure": df.groupby("type_coiffure")["prix_fcfa"].mean().round(0).to_dict(),
            "notes_moyennes": {
                "Accueil": round(df["note_accueil"].mean(), 2),
                "Qualité": round(df["note_qualite"].mean(), 2),
                "Propreté": round(df["note_proprete"].mean(), 2),
                "Qualité/Prix": round(df["note_qualite_prix"].mean(), 2),
                "Général": round(df["note_generale"].mean(), 2),
            }
        }
        if "date_soumission" in df.columns:
            df["date_soumission"] = pd.to_datetime(df["date_soumission"])
            evolution = df.groupby(df["date_soumission"].dt.date).size().to_dict()
            stats_data["evolution"] = {str(k): v for k, v in evolution.items()}
        return jsonify(stats_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/export")
def export_csv():
    if not session.get("admin_connecte"):
        return jsonify({"error": "Non autorisé"}), 401
    try:
        res = supabase.table("reponses").select("*").execute()
        df = pd.DataFrame(res.data)
        output = io.StringIO()
        df.to_csv(output, index=False, encoding="utf-8-sig")
        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode("utf-8-sig")),
            mimetype="text/csv",
            as_attachment=True,
            download_name=f"coiffdata_export_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)