import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });
const difficulties = [
  { name: "Easy", label: "A quiet puzzle", suspects: 3, clues: 5, hints: 2 },
  { name: "Medium", label: "A tangled affair", suspects: 4, clues: 7, hints: 3 },
  { name: "Hard", label: "For the observant", suspects: 5, clues: 9, hints: 3 },
];

function Brand({ light = false }) {
  return <Link className={`brand ${light ? "brand-light" : ""}`} to="/" aria-label="Obscura home"><span className="brand-mark">O</span><span>OBSCURA<small>THE MYSTERY ROOM</small></span></Link>;
}

function Header({ back }) {
  return <header className="topbar"><Brand />{back ? <Link className="back-link" to={back}>← Back</Link> : <span className="top-note"><span className="live-dot" /> A CASE IS WAITING</span>}</header>;
}

function Home() {
  return <main className="home-page">
    <Header />
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> AN INTERACTIVE DETECTIVE EXPERIENCE</div>
        <h1>Every secret<br />leaves a <em>trace.</em></h1>
        <p className="hero-description">Step into a world of hidden motives and careful lies. Search the evidence, question every alibi, and decide who did it.</p>
        <Link className="button button-gold" to="/create">Enter the mystery <span>↗</span></Link>
        <div className="hero-meta"><span>✦ AI-crafted cases</span><span>·</span><span>5–10 min to solve</span></div>
      </div>
      <div className="hero-art" aria-label="An atmospheric, candlelit detective's room">
        <div className="art-glow" />
        <div className="frame frame-one"><span className="frame-portrait">♙</span><i>NO. 04</i></div>
        <div className="frame frame-two"><span className="frame-portrait">♟</span><i>ARCHIVE</i></div>
        <div className="art-lamp"><span /></div>
        <div className="art-table"><div className="paper paper-a">CASE<br />FILE <small>№ 017</small></div><div className="paper paper-b">EVIDENCE<br /><small>DO NOT REMOVE</small></div><div className="magnifier" /></div>
        <div className="art-caption"><span>THE STUDY, 11:47 PM</span><span>01 / 03</span></div>
      </div>
    </section>
    <section className="home-bottom">
      <div><span className="step-number">01</span><span><b>Read between the lines</b><small>Every detail may matter.</small></span></div>
      <div><span className="step-number">02</span><span><b>Follow the evidence</b><small>Uncover clues at your pace.</small></span></div>
      <div><span className="step-number">03</span><span><b>Name your suspect</b><small>Trust your instincts. Prove it.</small></span></div>
    </section>
  </main>;
}

function CreateMystery() {
  const navigate = useNavigate();
  const [premise, setPremise] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function createCase(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/cases", { premise, difficulty });
      navigate(`/case/${data.id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "We couldn't create your case. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="subpage create-page">
    <Header back="/" />
    <section className="create-wrap">
      <div className="eyebrow"><span className="eyebrow-line" /> OPEN A NEW CASE</div>
      <h1>Set the scene.</h1>
      <p className="section-lead">Give us the seed of a mystery. We'll build a world of suspects, secrets, and evidence around it.</p>
      <form className="create-form" onSubmit={createCase}>
        <label htmlFor="premise">YOUR MYSTERY BEGINS WITH</label>
        <textarea id="premise" maxLength={500} minLength={10} required value={premise} onChange={(event) => setPremise(event.target.value)} placeholder="A priceless painting vanishes during a storm at a remote coastal manor..." />
        <div className="field-note"><span>Be as specific—or as mysterious—as you like.</span><span>{premise.length} / 500</span></div>
        <div className="difficulty-heading"><label>CHOOSE YOUR DIFFICULTY</label><span>YOU CAN ALWAYS ASK FOR A HINT</span></div>
        <div className="difficulty-options">
          {difficulties.map((level) => <button type="button" className={`difficulty-card ${difficulty === level.name ? "selected" : ""}`} onClick={() => setDifficulty(level.name)} key={level.name} aria-pressed={difficulty === level.name}>
            <span className="radio-dot" /><strong>{level.name}</strong><small>{level.label}</small><span className="difficulty-count">{level.suspects} suspects · {level.clues} clues</span>
          </button>)}
        </div>
        {error && <div role="alert" className="error-banner">{error}</div>}
        <button className="button button-gold create-submit" type="submit" disabled={loading || premise.trim().length < 10}>{loading ? <><span className="spinner" /> Building your case…</> : <>Build my mystery <span>↗</span></>}</button>
        <p className="privacy-note"><span>✦</span> The solution stays hidden until you make your accusation.</p>
      </form>
    </section>
  </main>;
}

function useCase(caseId) {
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get(`/cases/${caseId}`).then(({ data }) => {
      if (active) setCaseData(data);
    }).catch((requestError) => {
      if (active) setError(requestError.response?.data?.error || "Unable to load this case.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [caseId]);

  return { caseData, setCaseData, error, loading, setError };
}

function LoadingView({ message = "Preparing the case…" }) {
  return <div className="loading-view"><span className="spinner" />{message}</div>;
}

function ErrorView({ message }) {
  return <main className="subpage"><Header back="/" /><section className="empty-state"><span className="empty-icon">!</span><h1>Case unavailable</h1><p>{message}</p><Link className="button button-gold" to="/create">Start a new case <span>↗</span></Link></section></main>;
}

function Investigation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { caseData, setCaseData, error, loading, setError } = useCase(id);
  const [revealedHints, setRevealedHints] = useState([]);
  const [busy, setBusy] = useState("");
  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} />;

  async function discover(clueId) {
    setBusy(clueId);
    setError("");
    try {
      await api.post(`/cases/${id}/clues/${clueId}/discover`);
      setCaseData((current) => ({ ...current, clues: current.clues.map((clue) => clue.id === clueId ? { ...clue, discovered: true } : clue), progress: { ...current.progress, discoveredClueIds: [...current.progress.discoveredClueIds, clueId] } }));
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Couldn't reveal that clue.");
    } finally {
      setBusy("");
    }
  }

  async function requestHint() {
    setBusy("hint");
    setError("");
    try {
      const { data } = await api.post(`/cases/${id}/hints`);
      setRevealedHints((current) => [...current, data.hint]);
      setCaseData((current) => ({ ...current, progress: { ...current.progress, hintsUsed: data.hintsUsed, hintsRemaining: data.hintsRemaining } }));
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Couldn't retrieve a hint.");
    } finally {
      setBusy("");
    }
  }

  const discoveredCount = caseData.progress.discoveredClueIds.length;
  return <main className="subpage investigation-page">
    <Header back="/" />
    <div className="case-heading">
      <div><div className="eyebrow"><span className="eyebrow-line" /> ACTIVE INVESTIGATION · {caseData.difficulty.toUpperCase()}</div><h1>{caseData.title}</h1></div>
      <div className="progress-card"><span>CASE PROGRESS</span><strong>{discoveredCount}<small> / {caseData.clues.length}</small></strong><div className="progress-track"><i style={{ width: `${(discoveredCount / caseData.clues.length) * 100}%` }} /></div><small>clues uncovered</small></div>
    </div>
    {error && <div role="alert" className="error-banner">{error}</div>}
    <section className="story-card"><div className="card-kicker">THE CASE FILE <span>✦</span></div><p>{caseData.story}</p></section>
    <div className="investigation-grid">
      <section className="panel suspects-panel">
        <div className="panel-heading"><div><span className="panel-index">01</span><h2>Persons of interest</h2></div><span>{caseData.suspects.length} SUSPECTS</span></div>
        <div className="suspect-list">{caseData.suspects.map((suspect, index) => <article className="suspect-card" key={suspect.id}>
          <div className="suspect-avatar">{suspect.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
          <div className="suspect-info"><div className="suspect-name">{suspect.name}<span>FILE 0{index + 1}</span></div><p>{suspect.description}</p><div className="alibi"><span>ALIBI</span>{suspect.alibi}</div></div>
        </article>)}</div>
      </section>
      <section className="panel evidence-panel">
        <div className="panel-heading"><div><span className="panel-index">02</span><h2>Evidence board</h2></div><span>{discoveredCount} FOUND</span></div>
        <div className="clue-list">{caseData.clues.map((clue, index) => <article className={`clue-card ${clue.discovered ? "clue-found" : ""}`} key={clue.id}>
          <span className="clue-index">{String(index + 1).padStart(2, "0")}</span><div className="clue-body"><h3>{clue.title}</h3>{clue.discovered ? <p>{clue.description}</p> : <p className="hidden-copy">Something here may be worth a closer look.</p>}</div>
          {clue.discovered ? <span className="found-mark">✓</span> : <button className="text-button" onClick={() => discover(clue.id)} disabled={busy !== ""}>{busy === clue.id ? "..." : "Examine ↗"}</button>}
        </article>)}</div>
      </section>
    </div>
    <section className="bottom-actions">
      <div className="hint-area"><button className="button button-outline" onClick={requestHint} disabled={busy !== "" || caseData.progress.hintsRemaining === 0}>{busy === "hint" ? "Finding a hint…" : `Request a hint · ${caseData.progress.hintsRemaining} left`}</button><span>Each hint costs 10 points.</span>
        {revealedHints.map((hint, index) => <div className="hint-card" key={`${index}-${hint}`}><span>HINT 0{index + 1}</span>{hint}</div>)}
      </div>
      <Link className="button button-gold" to={`/case/${id}/accuse`}>Make an accusation <span>↗</span></Link>
    </section>
  </main>;
}

function Accusation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { caseData, error, loading } = useCase(id);
  const [selected, setSelected] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);
  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} />;

  async function submitAccusation() {
    if (!selected) return;
    setBusy(true);
    setSubmitError("");
    try {
      await api.post(`/cases/${id}/accuse`, { suspectId: selected });
      navigate(`/case/${id}/result`);
    } catch (requestError) {
      setSubmitError(requestError.response?.data?.error || "Your accusation couldn't be submitted.");
      setBusy(false);
    }
  }

  return <main className="subpage accusation-page">
    <Header back={`/case/${id}`} />
    <section className="accuse-wrap">
      <div className="eyebrow"><span className="eyebrow-line" /> THE MOMENT OF TRUTH</div>
      <h1>Who did it?</h1>
      <p className="section-lead">You've weighed the evidence. Name the person you believe is responsible.</p>
      <div className="accuse-grid">{caseData.suspects.map((suspect, index) => <button type="button" key={suspect.id} onClick={() => setSelected(suspect.id)} className={`accuse-card ${selected === suspect.id ? "selected" : ""}`} aria-pressed={selected === suspect.id}>
        <span className="suspect-avatar">{suspect.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><strong>{suspect.name}</strong><small>PERSON OF INTEREST 0{index + 1}</small><span className="selection-indicator">{selected === suspect.id ? "✓" : ""}</span>
      </button>)}</div>
      <div className="accuse-warning"><span>✦</span> Your accusation will close the case and reveal the truth.</div>
      {submitError && <div role="alert" className="error-banner">{submitError}</div>}
      <button className="button button-gold accuse-submit" onClick={submitAccusation} disabled={!selected || busy}>{busy ? <><span className="spinner" /> Delivering verdict…</> : <>Submit accusation <span>↗</span></>}</button>
    </section>
  </main>;
}

function Results() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api.get(`/cases/${id}/result`).then(({ data }) => {
      if (active) setResult(data);
    }).catch((requestError) => {
      if (active) setError(requestError.response?.data?.error || "Unable to retrieve the verdict.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  if (loading) return <LoadingView message="Unsealing the verdict…" />;
  if (error) return <ErrorView message={error} />;
  return <main className="subpage result-page">
    <Header back="/" />
    <section className="result-wrap">
      <div className={`verdict-icon ${result.correct ? "verdict-correct" : ""}`}>{result.correct ? "✓" : "×"}</div>
      <div className="eyebrow"><span className="eyebrow-line" /> CASE CLOSED</div>
      <h1>{result.correct ? "Well observed." : "A clever deception."}</h1>
      <p className="section-lead">{result.correct ? "Your instincts led you to the truth." : `You accused ${result.accusedName}, but the evidence points elsewhere.`}</p>
      <div className="verdict-card"><span>THE CULPRIT</span><strong>{result.culpritName}</strong><p>{result.explanation}</p></div>
      <div className="score-card"><div><span>YOUR SCORE</span><strong>{result.score}<small> PTS</small></strong></div><div className="score-breakdown"><span>Evidence collected <b>+{result.cluesFound * 5}</b></span><span>Hints used <b>−{result.hintsUsed * 10}</b></span><span>Correct accusation <b>+{result.correct ? ({ Easy: 100, Medium: 150, Hard: 200 })[result.difficulty] : 0}</b></span></div></div>
      <Link className="button button-gold" to="/create">Solve another mystery <span>↗</span></Link>
    </section>
  </main>;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/create" element={<CreateMystery />} />
    <Route path="/case/:id" element={<Investigation />} />
    <Route path="/case/:id/accuse" element={<Accusation />} />
    <Route path="/case/:id/result" element={<Results />} />
    <Route path="*" element={<ErrorView message="The page you're looking for doesn't exist." />} />
  </Routes>;
}
