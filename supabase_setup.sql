-- ============================================================
-- CoiffData — Script SQL Supabase
-- Exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS reponses (
    id              BIGSERIAL PRIMARY KEY,
    sexe            TEXT,
    tranche_age     TEXT,
    quartier_res    TEXT,
    profession      TEXT,
    freq_visite     TEXT,
    nom_salon       TEXT,
    ville           TEXT,
    quartier_salon  TEXT,
    type_salon      TEXT,
    nb_coiffeurs    TEXT,
    services_ann    TEXT,        -- JSON array en texte
    type_coiffure   TEXT,
    duree_min       INTEGER,
    produits        TEXT,
    prix_fcfa       INTEGER,
    paiement        TEXT,
    pourboire       TEXT,
    note_generale   INTEGER,
    note_accueil    INTEGER,
    note_qualite    INTEGER,
    note_proprete   INTEGER,
    note_qp         INTEGER,
    recommandation  TEXT,
    commentaire     TEXT,
    soumis_le       TIMESTAMPTZ DEFAULT NOW()
);

-- Activer la sécurité au niveau des lignes (RLS)
ALTER TABLE reponses ENABLE ROW LEVEL SECURITY;

-- Autoriser INSERT public (formulaire anonyme)
CREATE POLICY "insert_public" ON reponses
    FOR INSERT TO anon WITH CHECK (true);

-- Autoriser SELECT uniquement pour service_role (backend admin)
CREATE POLICY "select_service" ON reponses
    FOR SELECT TO service_role USING (true);
