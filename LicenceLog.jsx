import { useState, useEffect } from "react";

/* ---------- storage shim ----------
   The app was built for the Claude artifact `window.storage` API
   ({ get, set, delete } returning { value } / truthy results, async).
   This shim reproduces that exact interface using plain browser
   localStorage, so every existing call site works unchanged once
   hosted as a standalone site. */
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        return { key, value: raw };
      } catch (e) {
        return null;
      }
    },
    async set(key, value) {
      try {
        localStorage.setItem(key, value);
        return { key, value };
      } catch (e) {
        return null;
      }
    },
    async delete(key) {
      try {
        localStorage.removeItem(key);
        return { key, deleted: true };
      } catch (e) {
        return null;
      }
    }
  };
}

/* ---------- species reference data ---------- */

const SPECIES = {
  gcn: {
    name: "Great crested newt",
    licenceCode: "CL08 (survey L1) / CL09 (survey L2)",
    methods: ["Torch survey", "Bottle trapping", "Egg search", "eDNA sampling", "HSI assessment", "Refuge/tile checking"],
    seasonNote: "Survey season mid-March to mid-June",
    refsNeeded: 2,
    requirements: [
      "Knowledge of GCN ecology and habitat needs",
      "Practical survey, capture and handling experience within last 3 years",
      "Working knowledge of relevant wildlife law and best practice",
      "CL08 (level 1) covers survey methods excluding capture; CL09 (level 2) adds capture and handling — apply for CL08 first if new to the species"
    ]
  },
  otter: {
    name: "Otter",
    licenceCode: "Individual mitigation / EPS licence",
    methods: ["Holt/couch search", "Spraint survey", "Field sign survey", "Riparian habitat assessment", "Camera trap monitoring"],
    seasonNote: "Surveyed year-round",
    refsNeeded: 2,
    requirements: [
      "Knowledge of otter ecology and habitat needs",
      "Practical survey experience within last 3 years",
      "Ability to assess site impact and plan effective mitigation and compensation (EPS licence requirement)",
      "Working knowledge of relevant wildlife law and best practice",
      "No dedicated survey class licence — experience is evidenced through written references, not registration"
    ]
  },
  watervole: {
    name: "Water vole",
    licenceCode: "CL31 (development) / CL24 (flood & drainage)",
    methods: ["Field sign survey", "Burrow survey", "Latrine survey", "Habitat assessment", "Displacement/mitigation works"],
    seasonNote: "Survey season April to September",
    refsNeeded: 2,
    requirements: [
      "Knowledge of water vole ecology and habitat needs",
      "Practical survey experience within last 3 years",
      "Ability to assess site impact and plan mitigation",
      "Working knowledge of relevant wildlife law and best practice",
      "CL31 covers displacement for development projects; CL24 covers flood defence, watercourse or drainage work — pick based on project type"
    ]
  },
  badger: {
    name: "Badger",
    licenceCode: "CL35 (interfere with setts)",
    methods: ["Main sett survey", "Outlier sett check", "Activity survey", "Sett classification", "Exclusion/mitigation works", "Artificial sett construction"],
    seasonNote: "Surveyed year-round, best Feb–May for cub activity",
    refsNeeded: 2,
    requirements: [
      "Knowledge of badger ecology and legislation (Protection of Badgers Act 1992)",
      "Practical survey experience within last 3 years",
      "Involvement in mitigation projects under supervision",
      "Ability to assess site impact and plan mitigation",
      "CL35 is the main development-related class licence — CL26 and CL27 are sector-specific (Forestry Commission, drainage boards) and not relevant to consultancy work"
    ]
  },
  dormouse: {
    name: "Hazel dormouse",
    licenceCode: "CL10a (survey L1) / CL10b (survey L2)",
    methods: ["Nest tube check", "Nest box check", "Hazelnut search", "Habitat assessment", "Footprint tunnel monitoring"],
    seasonNote: "Survey season April to November, nest tubes checked monthly",
    refsNeeded: 2,
    requirements: [
      "Knowledge of dormouse ecology and habitat needs",
      "Practical experience of nest tube/box use within last 3 years",
      "Working knowledge of relevant wildlife law and best practice",
      "CL10a (level 1) covers standard survey; CL10b (level 2) adds handling — apply for CL10a first",
      "Volunteers without direct nest tube experience can have a referee confirm necessary knowledge instead"
    ]
  },
  crayfish: {
    name: "White-clawed crayfish",
    licenceCode: "CL11 (survey/research) / CL23 (maintenance)",
    methods: ["Hand searching", "Trapping", "Torch survey (night)", "Habitat assessment"],
    seasonNote: "Survey season May to October, water temperature dependent",
    refsNeeded: 2,
    requirements: [
      "Knowledge of white-clawed crayfish ecology and threats (signal crayfish, crayfish plague biosecurity)",
      "Practical survey experience within last 3 years",
      "Working knowledge of relevant wildlife law and best practice",
      "Strict biosecurity protocol competence expected — disease transfer between catchments is a serious risk",
      "CL11 covers survey and research; CL23 is specifically for catching crayfish during maintenance works"
    ]
  },
  birds: {
    name: "Schedule 1 birds",
    licenceCode: "CL29 (barn owl) / individual licence (other species)",
    methods: ["Nest visit/monitoring", "Nest box check", "Breeding activity survey", "Species-specific survey", "Ringing (separate BTO permit)"],
    seasonNote: "Breeding season, species-dependent",
    refsNeeded: 1,
    requirements: [
      "Confident species identification",
      "Demonstrated competence with the target species",
      "Referee must have directly witnessed you checking nests or disturbing the species — the species must have been present during at least one witnessed survey",
      "CL29 is the only Schedule 1 class licence (barn owl survey for development); all other Schedule 1 species need an individual licence applied for per-species",
      "Choose species based on your own regional experience and interests — barn owl, kingfisher and peregrine are among the more commonly surveyed Schedule 1 species nationally"
    ]
  },
  natterjack: {
    name: "Natterjack toad",
    licenceCode: "Individual licence",
    methods: ["Torch survey", "Spawn string search", "Habitat assessment", "Refuge checking"],
    seasonNote: "Survey season April to July, coastal dune and heath sites",
    refsNeeded: 2,
    requirements: [
      "Knowledge of natterjack toad ecology and specialist habitat needs (dune slacks, coastal heath)",
      "Practical survey experience within last 3 years",
      "Ability to assess site impact and plan mitigation for EPS mitigation licence",
      "Working knowledge of relevant wildlife law and best practice",
      "No class survey licence exists for this species — apply for an individual licence, referencing similar amphibian licence experience"
    ]
  },
  reptiles: {
    name: "Reptiles",
    licenceCode: "None for common species / EPS licence for rare species",
    methods: ["Refugia survey", "Basking search", "Habitat assessment", "Translocation (common species, no licence needed)"],
    seasonNote: "Survey season April to September, avoid peak summer heat",
    refsNeeded: 2,
    requirements: [
      "Adder, grass snake, common lizard and slow worm do not require a licence to survey, handle or translocate — care and best practice still apply",
      "Only smooth snake and sand lizard are European Protected Species requiring a licence — both have a restricted range, confined mainly to heathland in Dorset, Hampshire and Surrey",
      "Outside that range this sheet is unlikely to lead to a licence application — still useful to log for CIEEM portfolio evidence of reptile survey competence",
      "If working in smooth snake/sand lizard range: knowledge of species ecology, survey experience, and ability to plan mitigation are required as for other EPS"
    ]
  },
  bats: {
    name: "Bats (all species)",
    licenceCode: "CL15–CL20 (survey) / CL21 (mitigation)",
    methods: ["Emergence/re-entry survey", "Activity transect", "Static detector deployment", "Roost inspection", "Hibernation survey"],
    seasonNote: "Activity season May to September, hibernation surveys Nov–Feb",
    refsNeeded: 2,
    requirements: [
      "CL15/CL16 are volunteer roost visitor licences (lower bar); CL17–CL20 are survey/research levels 1–4 with increasing scope",
      "CL21 mitigation licence needed for any work affecting a bat roost",
      "Knowledge of bat ecology, echolocation ID, practical survey experience and wildlife law all required"
    ]
  }
};

const SPECIES_ORDER = ["gcn", "otter", "watervole", "badger", "dormouse", "crayfish", "birds", "natterjack", "reptiles", "bats"];

const emptyEntry = () => ({ id: crypto.randomUUID(), date: "", site: "", method: "", supervisor: "", notes: "" });
const emptyReferee = () => ({ id: crypto.randomUUID(), name: "", licenceRef: "", organisation: "", confirmed: false });
const blankSpeciesData = () => ({ entries: [], referees: [] });
const blankAccountData = () => {
  const d = {};
  SPECIES_ORDER.forEach(k => { d[k] = blankSpeciesData(); });
  return d;
};

const COLORS = {
  bg: "#f6f4ee",
  panel: "#ffffff",
  border: "#e0dccd",
  borderStrong: "#c9c3ae",
  ink: "#25261f",
  inkMuted: "#726f60",
  inkFaint: "#a19c88",
  brand: "#2f4a30",
  brandLight: "#eaf1e6",
  brandText: "#3d5c3e",
  danger: "#8a4438",
  dangerBg: "#faeeec",
  warn: "#93690f",
  warnBg: "#fbf1de"
};

/* ---------- small shared UI pieces ---------- */

function Logo({ size = 26 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={COLORS.brand} />
        <path d="M9 21 C9 13, 14 9, 22 9 C22 16, 18 21, 11 22 Z" fill="#eaf1e6" />
        <line x1="10.5" y1="20.5" x2="20" y2="11" stroke={COLORS.brand} strokeWidth="1.1" />
      </svg>
      <span style={{ fontSize: "16px", fontWeight: 600, color: COLORS.ink, letterSpacing: "-0.01em" }}>LicenceLog</span>
    </div>
  );
}

function Button({ children, onClick, variant = "secondary", style, disabled, type = "button" }) {
  const base = {
    padding: "9px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
    border: "1px solid transparent",
    fontFamily: "inherit"
  };
  const variants = {
    primary: { background: COLORS.brand, color: "#fff", borderColor: COLORS.brand },
    secondary: { background: "#fff", color: COLORS.ink, borderColor: COLORS.borderStrong },
    ghost: { background: "transparent", color: COLORS.inkMuted, borderColor: "transparent" },
    danger: { background: "transparent", color: COLORS.danger, borderColor: "transparent" }
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ fontSize: "12px", color: COLORS.inkMuted, display: "block", marginBottom: "5px", fontWeight: 500 }}>
        {label}{required ? " *" : ""}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: "7px",
  border: `1px solid ${COLORS.border}`,
  fontSize: "13px",
  boxSizing: "border-box",
  fontFamily: "inherit",
  background: "#fff",
  color: COLORS.ink
};

/* ---------- auth screens ---------- */

/* ---------- dashboard / overview ---------- */

function readinessFor(sp, spData) {
  const entries3yr = spData.entries.filter(e => {
    if (!e.date) return false;
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 3);
    return new Date(e.date) >= cutoff;
  });
  const seasons = new Set(entries3yr.map(e => e.date.slice(0, 4))).size;
  const methods = new Set(entries3yr.map(e => e.method)).size;
  const confirmedRefs = spData.referees.filter(r => r.confirmed).length;
  return Math.min(100, Math.round(
    (Math.min(entries3yr.length, 10) / 10) * 35 +
    (Math.min(seasons, 2) / 2) * 20 +
    (Math.min(methods, sp.methods.length) / sp.methods.length) * 15 +
    (Math.min(confirmedRefs, sp.refsNeeded) / sp.refsNeeded) * 30
  ));
}

function readinessColor(v) {
  if (v >= 70) return COLORS.brandText;
  if (v >= 35) return COLORS.warn;
  return COLORS.danger;
}

function Dashboard({ accountData, onOpenSpecies }) {
  return (
    <div style={{ padding: "4px 0 20px" }}>
      <div style={{ fontSize: "13px", color: COLORS.inkMuted, marginBottom: "16px" }}>
        An overview of every species. Open one to log surveys and referees.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
        {SPECIES_ORDER.map(key => {
          const sp = SPECIES[key];
          const spData = accountData[key] || blankSpeciesData();
          const r = readinessFor(sp, spData);
          return (
            <div key={key} onClick={() => onOpenSpecies(key)} style={{
              background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px",
              padding: "16px", cursor: "pointer"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: COLORS.ink }}>{sp.name}</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: readinessColor(r) }}>{r}%</div>
              </div>
              <div style={{ height: "5px", background: "#eee9db", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
                <div style={{ height: "100%", width: `${r}%`, background: readinessColor(r), borderRadius: "3px" }} />
              </div>
              <div style={{ fontSize: "12px", color: COLORS.inkMuted }}>
                {spData.entries.length} survey{spData.entries.length !== 1 ? "s" : ""} logged
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- species detail screen ---------- */

function SpeciesDetail({ speciesKey, spData, onSave, onBack }) {
  const [view, setView] = useState("log");
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [draft, setDraft] = useState(emptyEntry());
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchDraft, setBatchDraft] = useState(emptyEntry());
  const [batchDates, setBatchDates] = useState("");
  const [showRefForm, setShowRefForm] = useState(false);
  const [refDraft, setRefDraft] = useState(emptyReferee());
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [showReadinessInfo, setShowReadinessInfo] = useState(false);

  const sp = SPECIES[speciesKey];

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const addEntry = (keepGoing) => {
    if (!draft.date || !draft.site || !draft.method) { showToast("Date, site and method are required"); return; }
    const next = { ...spData, entries: [...spData.entries, draft] };
    onSave(next);
    if (keepGoing) {
      setDraft({ ...emptyEntry(), date: draft.date, site: draft.site, supervisor: draft.supervisor });
      showToast("Entry logged — add the next method");
    } else {
      setDraft(emptyEntry());
      setShowEntryForm(false);
      showToast("Entry logged");
    }
  };

  const addBatch = () => {
    if (!batchDraft.site || !batchDraft.method || !batchDates.trim()) { showToast("Site, method and at least one date are required"); return; }
    const dates = batchDates.split(/[\n,]+/).map(d => d.trim()).filter(Boolean);
    const validDates = dates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (validDates.length === 0) { showToast("Use YYYY-MM-DD format, one date per line"); return; }
    const newEntries = validDates.map(date => ({ ...emptyEntry(), date, site: batchDraft.site, method: batchDraft.method, supervisor: batchDraft.supervisor, notes: batchDraft.notes }));
    onSave({ ...spData, entries: [...spData.entries, ...newEntries] });
    setBatchDraft(emptyEntry());
    setBatchDates("");
    setShowBatchForm(false);
    showToast(`${newEntries.length} entries logged`);
  };

  const duplicateEntry = (entry) => {
    setDraft({ ...emptyEntry(), site: entry.site, method: entry.method, supervisor: entry.supervisor });
    setShowEntryForm(true);
    showToast("Copied — just set the new date");
  };

  const doDelete = () => {
    if (!confirmDelete) return;
    onSave({ ...spData, entries: spData.entries.filter(e => e.id !== confirmDelete) });
    setConfirmDelete(null);
    showToast("Entry removed");
  };

  const addReferee = () => {
    if (!refDraft.name || !refDraft.licenceRef) { showToast("Name and licence reference are required"); return; }
    onSave({ ...spData, referees: [...spData.referees, refDraft] });
    setRefDraft(emptyReferee());
    setShowRefForm(false);
    showToast("Referee added");
  };

  const toggleRefConfirmed = (id) => {
    onSave({ ...spData, referees: spData.referees.map(r => r.id === id ? { ...r, confirmed: !r.confirmed } : r) });
  };

  const deleteReferee = (id) => {
    onSave({ ...spData, referees: spData.referees.filter(r => r.id !== id) });
  };

  const exportLog = () => {
    const rows = spData.entries.map(e => `${e.date}\t${e.site}\t${e.method}\t${e.supervisor}\t${e.notes || ""}`).join("\n");
    const header = "Date\tSite\tMethod\tSupervising ecologist\tNotes";
    const refLines = spData.referees.map(r => `${r.name} (${r.licenceRef})${r.organisation ? " — " + r.organisation : ""} — ${r.confirmed ? "confirmed willing" : "not yet confirmed"}`).join("\n");
    const content = `LicenceLog — ${sp.name} survey evidence\nExported ${new Date().toLocaleDateString("en-GB")}\nLicence: ${sp.licenceCode}\n\nSURVEY LOG (${spData.entries.length} entries)\n${header}\n${rows}\n\nREFEREES (${spData.referees.length})\n${refLines || "None added yet"}\n\n— Generated by LicenceLog. Evidence requirements sourced from Natural England guidance on gov.uk; always confirm current requirements before applying.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LicenceLog_${sp.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported");
  };

  const entries3yr = spData.entries.filter(e => {
    if (!e.date) return false;
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 3);
    return new Date(e.date) >= cutoff;
  });
  const seasonsCovered = new Set(entries3yr.map(e => e.date.slice(0, 4))).size;
  const methodsCovered = new Set(entries3yr.map(e => e.method)).size;
  const confirmedRefs = spData.referees.filter(r => r.confirmed).length;
  const readiness = readinessFor(sp, spData);

  const groupedEntries = Object.entries(
    [...spData.entries].sort((a, b) => b.date.localeCompare(a.date)).reduce((groups, e) => {
      const key = `${e.date}__${e.site}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
      return groups;
    }, {})
  );

  return (
    <div style={{ paddingBottom: "20px" }}>
      <div onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: COLORS.inkMuted, cursor: "pointer", marginBottom: "14px", width: "fit-content" }}>
        ← All species
      </div>

      <div style={{ fontSize: "20px", fontWeight: 600, color: COLORS.ink, marginBottom: "2px" }}>{sp.name}</div>
      <div style={{ fontSize: "12px", color: COLORS.inkFaint, marginBottom: "20px" }}>{sp.licenceCode}</div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "22px" }}>
        <div style={{ flex: "1 1 240px", background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "18px" }}>
          <div style={{ fontSize: "12px", color: COLORS.inkMuted, fontWeight: 500, marginBottom: "6px" }}>Readiness</div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: readinessColor(readiness) }}>{readiness}%</div>
          <div style={{ height: "6px", background: "#eee9db", borderRadius: "3px", marginTop: "8px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${readiness}%`, background: readinessColor(readiness), borderRadius: "3px" }} />
          </div>
          <div style={{ fontSize: "12px", color: COLORS.inkFaint, marginTop: "10px" }}>{sp.seasonNote}</div>
          <div onClick={() => setShowReadinessInfo(!showReadinessInfo)} style={{ fontSize: "11px", color: COLORS.brandText, marginTop: "10px", cursor: "pointer", fontWeight: 600 }}>
            {showReadinessInfo ? "Hide how this is calculated" : "How is this calculated?"}
          </div>
          {showReadinessInfo && (
            <div style={{ fontSize: "11.5px", color: COLORS.inkMuted, marginTop: "8px", lineHeight: 1.6, borderTop: `1px solid ${COLORS.border}`, paddingTop: "10px" }}>
              A rough guide, weighted across four things: survey count in the last 3 years (35%), spread across more than one season (20%), variety of methods used (15%), and confirmed referees (30%). It is not a Natural England assessment — only NE can judge whether your evidence is sufficient. Use it to spot gaps, not as a guarantee.
            </div>
          )}
        </div>
        <div style={{ flex: "1 1 240px", background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "18px" }}>
          <div style={{ fontSize: "12px", color: COLORS.inkMuted, fontWeight: 500, marginBottom: "12px" }}>At a glance</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><div style={{ fontSize: "20px", fontWeight: 700, color: COLORS.ink }}>{entries3yr.length}</div><div style={{ fontSize: "11px", color: COLORS.inkFaint }}>Surveys (3yr)</div></div>
            <div><div style={{ fontSize: "20px", fontWeight: 700, color: COLORS.ink }}>{seasonsCovered}</div><div style={{ fontSize: "11px", color: COLORS.inkFaint }}>Seasons</div></div>
            <div><div style={{ fontSize: "20px", fontWeight: 700, color: COLORS.ink }}>{methodsCovered}/{sp.methods.length}</div><div style={{ fontSize: "11px", color: COLORS.inkFaint }}>Methods tried</div></div>
            <div><div style={{ fontSize: "20px", fontWeight: 700, color: COLORS.ink }}>{confirmedRefs}/{sp.refsNeeded}</div><div style={{ fontSize: "11px", color: COLORS.inkFaint }}>Referees ready</div></div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "18px", borderBottom: `1px solid ${COLORS.border}` }}>
        {["log", "referees", "requirements"].map(v => (
          <div key={v} onClick={() => setView(v)} style={{
            padding: "9px 14px", fontSize: "13px", cursor: "pointer",
            color: view === v ? COLORS.brandText : COLORS.inkMuted, fontWeight: view === v ? 600 : 500,
            borderBottom: view === v ? `2px solid ${COLORS.brand}` : "2px solid transparent"
          }}>
            {v === "log" ? "Survey log" : v === "referees" ? "Referees" : "What NE wants"}
          </div>
        ))}
      </div>

      {view === "log" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ fontSize: "13px", color: COLORS.inkMuted }}>{spData.entries.length} entries logged</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {spData.entries.length > 0 && <Button onClick={exportLog}>Export</Button>}
              <Button onClick={() => setShowBatchForm(true)}>Log same visit, multiple dates</Button>
              <Button variant="primary" onClick={() => setShowEntryForm(true)}>Log a survey</Button>
            </div>
          </div>

          {showEntryForm && (
            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "18px", marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label="Date" required><input type="date" style={inputStyle} value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></Field>
                <Field label="Method" required>
                  <select style={inputStyle} value={draft.method} onChange={e => setDraft({ ...draft, method: e.target.value })}>
                    <option value="">Select method</option>
                    {sp.methods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Site" required><input style={inputStyle} placeholder="Site name or location" value={draft.site} onChange={e => setDraft({ ...draft, site: e.target.value })} /></Field>
              <Field label="Supervising ecologist"><input style={inputStyle} placeholder="Name of licensed ecologist supervising" value={draft.supervisor} onChange={e => setDraft({ ...draft, supervisor: e.target.value })} /></Field>
              <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: "60px" }} placeholder="Species present, conditions, outcome" value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></Field>
              <div style={{ fontSize: "12px", color: COLORS.inkFaint, marginBottom: "12px", lineHeight: 1.5 }}>
                Did more than one method on this visit? Save this one, then add the next — separate entries per method are stronger evidence than one entry listing several.
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <Button variant="primary" onClick={() => addEntry(false)}>Save entry</Button>
                <Button onClick={() => addEntry(true)}>Save and add another method for this day</Button>
                <Button variant="ghost" onClick={() => { setShowEntryForm(false); setDraft(emptyEntry()); }}>Cancel</Button>
              </div>
            </div>
          )}

          {showBatchForm && (
            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "18px", marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: COLORS.inkFaint, marginBottom: "12px", lineHeight: 1.5 }}>
                For a project with the same site, method and supervisor repeated across a season — like six visits to one pond. One entry is created per date.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label="Site" required><input style={inputStyle} value={batchDraft.site} onChange={e => setBatchDraft({ ...batchDraft, site: e.target.value })} /></Field>
                <Field label="Method" required>
                  <select style={inputStyle} value={batchDraft.method} onChange={e => setBatchDraft({ ...batchDraft, method: e.target.value })}>
                    <option value="">Select method</option>
                    {sp.methods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Supervising ecologist"><input style={inputStyle} value={batchDraft.supervisor} onChange={e => setBatchDraft({ ...batchDraft, supervisor: e.target.value })} /></Field>
              <Field label="Notes (applies to every date)"><textarea style={{ ...inputStyle, minHeight: "50px" }} value={batchDraft.notes} onChange={e => setBatchDraft({ ...batchDraft, notes: e.target.value })} /></Field>
              <Field label="Dates — one per line, YYYY-MM-DD" required>
                <textarea style={{ ...inputStyle, minHeight: "90px", fontFamily: "ui-monospace, monospace" }} placeholder={"2026-04-02\n2026-04-16\n2026-04-30"} value={batchDates} onChange={e => setBatchDates(e.target.value)} />
              </Field>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button variant="primary" onClick={addBatch}>Log all dates</Button>
                <Button variant="ghost" onClick={() => { setShowBatchForm(false); setBatchDraft(emptyEntry()); setBatchDates(""); }}>Cancel</Button>
              </div>
            </div>
          )}

          {spData.entries.length === 0 && !showEntryForm && !showBatchForm && (
            <div style={{ textAlign: "center", padding: "50px 20px", color: COLORS.inkFaint }}>
              <div style={{ fontSize: "14px", color: COLORS.ink, fontWeight: 500 }}>Start your {sp.name.toLowerCase()} log</div>
              <div style={{ fontSize: "13px", marginTop: "4px" }}>Log your first survey to start building your evidence record.</div>
            </div>
          )}

          {groupedEntries.map(([key, group]) => (
            <div key={key} style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "14px 16px", marginBottom: "8px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "baseline", marginBottom: "8px" }}>
                <span style={{ fontWeight: 600, fontSize: "14px", color: COLORS.ink }}>{group[0].site}</span>
                <span style={{ fontSize: "12px", color: COLORS.inkFaint }}>{group[0].date}</span>
                {group.length > 1 && <span style={{ fontSize: "11px", color: COLORS.brandText, background: COLORS.brandLight, padding: "2px 8px", borderRadius: "10px" }}>{group.length} methods</span>}
              </div>
              {group.map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingLeft: "4px", borderLeft: group.length > 1 ? `2px solid ${COLORS.border}` : "none", marginBottom: group.length > 1 ? "8px" : "0" }}>
                  <div style={{ paddingLeft: group.length > 1 ? "10px" : "0" }}>
                    <div style={{ fontSize: "13px", color: COLORS.ink }}>{e.method}{e.supervisor ? ` · supervised by ${e.supervisor}` : ""}</div>
                    {e.notes && <div style={{ fontSize: "12px", color: COLORS.inkFaint, marginTop: "3px" }}>{e.notes}</div>}
                  </div>
                  <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                    <Button variant="ghost" onClick={() => duplicateEntry(e)} style={{ padding: "4px 8px", fontSize: "12px" }}>Copy for new date</Button>
                    <Button variant="danger" onClick={() => setConfirmDelete(e.id)} style={{ padding: "4px 8px", fontSize: "12px" }}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {view === "referees" && (
        <div>
          <div style={{ background: COLORS.brandLight, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "14px 16px", marginBottom: "16px", fontSize: "13px", color: COLORS.brandText, lineHeight: 1.5 }}>
            Natural England requires {sp.refsNeeded} independent written reference{sp.refsNeeded > 1 ? "s" : ""} from wildlife professionals who already hold a similar licence and have directly witnessed your work with this species. This is usually the real bottleneck, not survey count.
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "13px", color: COLORS.inkMuted }}>{spData.referees.length} potential referee{spData.referees.length !== 1 ? "s" : ""}</div>
            <Button variant="primary" onClick={() => setShowRefForm(true)}>Add referee</Button>
          </div>
          {showRefForm && (
            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "18px", marginBottom: "16px" }}>
              <Field label="Name" required><input style={inputStyle} value={refDraft.name} onChange={e => setRefDraft({ ...refDraft, name: e.target.value })} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label="Their licence reference" required><input style={inputStyle} placeholder="e.g. 2024-12345-CL08" value={refDraft.licenceRef} onChange={e => setRefDraft({ ...refDraft, licenceRef: e.target.value })} /></Field>
                <Field label="Organisation"><input style={inputStyle} value={refDraft.organisation} onChange={e => setRefDraft({ ...refDraft, organisation: e.target.value })} /></Field>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button variant="primary" onClick={addReferee}>Save referee</Button>
                <Button variant="ghost" onClick={() => { setShowRefForm(false); setRefDraft(emptyReferee()); }}>Cancel</Button>
              </div>
            </div>
          )}
          {spData.referees.length === 0 && !showRefForm && (
            <div style={{ textAlign: "center", padding: "50px 20px", color: COLORS.inkFaint }}>
              <div style={{ fontSize: "14px", color: COLORS.ink, fontWeight: 500 }}>No referees added yet</div>
              <div style={{ fontSize: "13px", marginTop: "4px" }}>Add licensed ecologists who can vouch for your work.</div>
            </div>
          )}
          {spData.referees.map(r => (
            <div key={r.id} style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "14px 16px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", color: COLORS.ink }}>{r.name}</div>
                <div style={{ fontSize: "12px", color: COLORS.inkFaint }}>{r.licenceRef}{r.organisation ? ` · ${r.organisation}` : ""}</div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div onClick={() => toggleRefConfirmed(r.id)} style={{
                  padding: "6px 12px", borderRadius: "16px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${r.confirmed ? COLORS.brand : COLORS.border}`,
                  background: r.confirmed ? COLORS.brandLight : "#fff",
                  color: r.confirmed ? COLORS.brandText : COLORS.inkMuted
                }}>
                  {r.confirmed ? "Confirmed willing" : "Not yet confirmed"}
                </div>
                <Button variant="danger" onClick={() => deleteReferee(r.id)} style={{ padding: "4px 8px", fontSize: "12px" }}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "requirements" && (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: COLORS.ink, marginBottom: "14px" }}>What Natural England actually looks for</div>
          {sp.requirements.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-start" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: COLORS.brand, marginTop: "7px", flexShrink: 0 }} />
              <div style={{ fontSize: "13px", color: COLORS.ink, lineHeight: 1.5 }}>{r}</div>
            </div>
          ))}
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${COLORS.border}`, fontSize: "12px", color: COLORS.inkFaint, lineHeight: 1.6 }}>
            Source: gov.uk Natural England guidance on survey class licences and protected species licences. Requirements can change — always check gov.uk before applying.
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(30,28,20,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "22px", maxWidth: "340px", width: "100%" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: COLORS.ink, marginBottom: "6px" }}>Remove this entry?</div>
            <div style={{ fontSize: "13px", color: COLORS.inkMuted, marginBottom: "18px" }}>This can't be undone.</div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={doDelete} style={{ background: COLORS.dangerBg }}>Remove</Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: COLORS.ink, color: "#fff", padding: "10px 20px", borderRadius: "8px", fontSize: "13px", zIndex: 200 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ---------- root app ---------- */

export default function LicenceLog() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [screen, setScreen] = useState("dashboard");
  const [activeSpecies, setActiveSpecies] = useState(null);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await window.storage.get("licencelog-data").catch(() => null);
        if (stored?.value) {
          const parsed = JSON.parse(stored.value);
          let changed = false;
          SPECIES_ORDER.forEach(k => { if (!parsed[k]) { parsed[k] = blankSpeciesData(); changed = true; } });
          setData(parsed);
          if (changed) {
            try { await window.storage.set("licencelog-data", JSON.stringify(parsed)); } catch (e) { /* will retry on next save */ }
          }
        } else {
          setData(blankAccountData());
        }
      } catch (e) {
        setData(blankAccountData());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveSpeciesData = async (speciesKey, nextSpData) => {
    const next = { ...data, [speciesKey]: nextSpData };
    setData(next);
    try {
      const result = await window.storage.set("licencelog-data", JSON.stringify(next));
      if (!result) throw new Error("no result");
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  };

  const [showBackup, setShowBackup] = useState(false);
  const [restoreError, setRestoreError] = useState("");
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [showBackupNudge, setShowBackupNudge] = useState(false);

  const totalEntries = data ? SPECIES_ORDER.reduce((sum, k) => sum + (data[k]?.entries.length || 0), 0) : 0;

  useEffect(() => {
    if (!data || totalEntries < 5) return;
    const checkNudge = async () => {
      try {
        const seen = await window.storage.get("licencelog-backup-nudge-shown").catch(() => null);
        if (!seen?.value) setShowBackupNudge(true);
      } catch (e) { /* if we can't check, skip the nudge rather than risk showing it repeatedly */ }
    };
    checkNudge();
  }, [totalEntries, data]);

  const dismissNudge = async (openBackup) => {
    setShowBackupNudge(false);
    try { await window.storage.set("licencelog-backup-nudge-shown", "true"); } catch (e) { /* not critical */ }
    if (openBackup) setShowBackup(true);
  };

  const downloadBackup = () => {
    const payload = {
      product: "LicenceLog",
      exportedAt: new Date().toISOString(),
      version: 1,
      data
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LicenceLog_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreFromFile = (file) => {
    setRestoreError("");
    setRestoreBusy(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const incoming = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
        if (!incoming || typeof incoming !== "object") throw new Error("format");
        const merged = { ...blankAccountData() };
        SPECIES_ORDER.forEach(k => {
          if (incoming[k] && Array.isArray(incoming[k].entries) && Array.isArray(incoming[k].referees)) {
            merged[k] = incoming[k];
          }
        });
        setData(merged);
        const result = await window.storage.set("licencelog-data", JSON.stringify(merged));
        if (!result) throw new Error("save failed");
        setShowBackup(false);
      } catch (err) {
        setRestoreError("That file doesn't look like a valid LicenceLog backup.");
      } finally {
        setRestoreBusy(false);
      }
    };
    reader.onerror = () => { setRestoreError("Couldn't read that file — try again."); setRestoreBusy(false); };
    reader.readAsText(file);
  };

  if (loading || !data) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: COLORS.inkMuted, fontFamily: "system-ui, sans-serif", fontSize: "14px" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "system-ui, -apple-system, sans-serif", color: COLORS.ink }}>
      <div style={{ background: COLORS.panel, borderBottom: `1px solid ${COLORS.border}`, padding: "14px 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div onClick={() => { setScreen("dashboard"); setActiveSpecies(null); }} style={{ cursor: "pointer" }}>
            <Logo />
          </div>
          <Button onClick={() => setShowBackup(true)} style={{ padding: "7px 12px", fontSize: "12px" }}>Backup &amp; restore</Button>
        </div>
      </div>

      {saveError && (
        <div style={{ background: COLORS.dangerBg, borderBottom: `1px solid ${COLORS.border}`, padding: "8px 20px", textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: COLORS.danger }}>Your last change couldn't be saved. Check your connection — changes will retry automatically as you keep working.</span>
        </div>
      )}

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
        {screen === "dashboard" ? (
          <>
            <div style={{ fontSize: "20px", fontWeight: 600, marginBottom: "2px" }}>Your species licences</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: COLORS.inkFaint, marginBottom: "16px" }}>
              Your data lives in this browser only.
              <span onClick={() => setShowBackup(true)} style={{ color: COLORS.brandText, fontWeight: 600, cursor: "pointer" }}>Back it up regularly →</span>
            </div>
            <Dashboard
              accountData={data}
              onOpenSpecies={(key) => { setActiveSpecies(key); setScreen("species"); }}
            />
          </>
        ) : (
          <SpeciesDetail
            speciesKey={activeSpecies}
            spData={data[activeSpecies]}
            onSave={(next) => saveSpeciesData(activeSpecies, next)}
            onBack={() => { setScreen("dashboard"); setActiveSpecies(null); }}
          />
        )}
      </div>

      {showBackup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(30,28,20,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}
          onClick={() => setShowBackup(false)}>
          <div style={{ background: "#fff", borderRadius: "14px", padding: "24px", maxWidth: "420px", width: "100%" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "16px", fontWeight: 600, color: COLORS.ink, marginBottom: "4px" }}>Backup &amp; restore</div>
            <div style={{ fontSize: "13px", color: COLORS.inkMuted, marginBottom: "18px", lineHeight: 1.5 }}>
              Your data lives in this browser only. Download a backup regularly, especially before clearing browser data or switching devices.
            </div>

            <div style={{ background: COLORS.brandLight, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "14px", marginBottom: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.ink, marginBottom: "4px" }}>Download a backup</div>
              <div style={{ fontSize: "12px", color: COLORS.inkMuted, marginBottom: "10px" }}>Saves everything — every species, every entry, every referee — as one file.</div>
              <Button variant="primary" onClick={downloadBackup} style={{ width: "100%" }}>Download backup file</Button>
            </div>

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.ink, marginBottom: "4px" }}>Restore from a backup</div>
              <div style={{ fontSize: "12px", color: COLORS.inkMuted, marginBottom: "10px" }}>This replaces everything currently in the app with the contents of the file.</div>
              <input type="file" accept="application/json" disabled={restoreBusy}
                onChange={e => { if (e.target.files?.[0]) restoreFromFile(e.target.files[0]); e.target.value = ""; }}
                style={{ fontSize: "12px", width: "100%" }} />
              {restoreError && <div style={{ fontSize: "12px", color: COLORS.danger, marginTop: "8px" }}>{restoreError}</div>}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <Button variant="ghost" onClick={() => setShowBackup(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {showBackupNudge && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(30,28,20,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "14px", padding: "24px", maxWidth: "380px", width: "100%" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: COLORS.ink, marginBottom: "6px" }}>You've built up a real evidence record</div>
            <div style={{ fontSize: "13px", color: COLORS.inkMuted, marginBottom: "18px", lineHeight: 1.5 }}>
              {totalEntries} surveys logged so far. This only lives in this browser — worth taking a minute to back it up now, and again every so often as you keep going.
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => dismissNudge(false)}>Maybe later</Button>
              <Button variant="primary" onClick={() => dismissNudge(true)}>Back up now</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
