import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import { reset as resetStudent } from "../features/student/studentSlice";
import {
  getAllTasks,
  markTaskComplete,
  unmarkTaskComplete,
  verifyObjectForTask,
} from "../features/task/taskSlice";
import GestureDetector  from "../components/gesture/GestureDetector";
import ObjectDetector   from "../components/object/ObjectDetector";
import PictogramBoard   from "../components/PictogramBoard";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { scorePronunciation, speakText } from "../utils/speechUtils";
import toast from "react-hot-toast";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const BG     = ["#F0F9FF","#FFF7ED","#F0FDF4","#FDF4FF","#FFF1F2","#FFFBEB"];
const ACCENT = ["#0284C7","#EA580C","#16A34A","#9333EA","#E11D48","#D97706"];

const getEid = (token) => {
  try { return JSON.parse(atob(token.split(".")[1])).enrollmentId || null; }
  catch { return null; }
};

// ── Speech sheet ──────────────────────────────────────────────────────────
const SpeechSheet = ({ stepText, stepIndex, taskId, eid, onPts, onClose }) => {
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const { transcript, isListening, isSupported,
          startListening, stopListening, resetTranscript } = useSpeechRecognition();

  useEffect(() => { setResult(null); resetTranscript(); }, [stepText]);

  useEffect(() => {
    if (!transcript || isListening || !stepText) return;
    const r = scorePronunciation(transcript, stepText);
    setResult(r);
    if (eid && taskId) {
      setSaving(true);
      axios.post(`${BASE_URL}/api/speech/log`, {
        enrollmentId: eid, taskId, stepIndex, stepText,
        spokenText: transcript, score: r.score,
        matchedWords: r.matchedWords, missedWords: r.missedWords,
      }).then((res) => { if (res.data.pointsAwarded > 0) onPts(res.data.pointsAwarded); })
        .catch(() => {}).finally(() => setSaving(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

  if (!isSupported) { onClose(); return null; }

  const sc = result?.score ?? 0;
  const scoreColor = sc >= 80 ? "#16A34A" : sc >= 50 ? "#D97706" : "#E11D48";

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:60, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width:"100%", background:"#fff", borderRadius:"24px 24px 0 0", padding:"20px 20px 44px", display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ width:40, height:4, borderRadius:2, background:"#E5E7EB", margin:"0 auto" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:20, fontWeight:900 }}>🎤 Say this step</span>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, background:"#F3F4F6", border:"none", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ background:"#EFF6FF", borderRadius:16, padding:"14px 16px", textAlign:"center" }}>
          <p style={{ fontSize:20, fontWeight:900, color:"#111", margin:0 }}>{stepText}</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <button onClick={() => speakText(stepText, { rate:0.7 })} style={{ background:"#BAE6FD", border:"none", borderRadius:16, padding:"16px 0", fontSize:18, fontWeight:900, cursor:"pointer", color:"#0369A1" }}>🔊 Hear It</button>
          <button
            onClick={() => { if (isListening) stopListening(); else { resetTranscript(); setResult(null); startListening(); } }}
            style={{ border:"none", borderRadius:16, padding:"16px 0", fontSize:18, fontWeight:900, cursor:"pointer", background: isListening ? "#FEE2E2" : "#DCFCE7", color: isListening ? "#DC2626" : "#16A34A" }}
          >{isListening ? "⏹️ Stop" : "🎤 Speak"}</button>
        </div>
        {isListening && <p style={{ textAlign:"center", color:"#EF4444", fontWeight:700, fontSize:16, margin:0 }}>🔴 Listening…</p>}
        {result && (
          <div style={{ background: scoreColor + "15", borderRadius:16, padding:16, display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background: scoreColor + "22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color: scoreColor, flexShrink:0 }}>{sc}</div>
            <div>
              <p style={{ fontSize:16, fontWeight:800, margin:0 }}>{result.feedback}</p>
              {result.missedWords.length > 0 && <p style={{ fontSize:13, color:"#6B7280", margin:"3px 0 0" }}>Try: <strong style={{ color:"#DC2626" }}>{result.missedWords.slice(0,3).join(", ")}</strong></p>}
            </div>
          </div>
        )}
        {result && <button onClick={() => { resetTranscript(); setResult(null); }} style={{ background:"#F3F4F6", border:"none", borderRadius:14, padding:12, fontSize:15, fontWeight:700, color:"#6B7280", cursor:"pointer" }}>🔄 Try Again</button>}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════════════════
export default function StudentDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector((s) => s.auth.user);
  const { tasks = [], loading, error, verifiedTasks } = useSelector((s) => s.task);

  const [taskIdx,    setTaskIdx]    = useState(0);
  const [stepIdx,    setStepIdx]    = useState(0);
  const [screen,     setScreen]     = useState("step"); // "step"|"confirm"|"reward"
  const [pts,        setPts]        = useState(0);
  const [ptsRef,     setPtsRef]     = useState(0);
  const [showSpeech, setShowSpeech] = useState(false);

  const token = localStorage.getItem("studentToken") || user?.token;
  const eid   = useMemo(() => {
    const st = localStorage.getItem("studentToken");
    return getEid(st) || user?.enrollmentId || null;
  }, [user]);

  useEffect(() => {
    if (token) dispatch(getAllTasks(token));
    else navigate("/student-login");
  }, [dispatch, token, navigate]);

  useEffect(() => {
    if (!eid) return;
    axios.get(`${BASE_URL}/api/gamification/student/${eid}`)
      .then((r) => { if (r.data.success) setPts(r.data.total); }).catch(() => {});
  }, [eid, ptsRef]);

  const doLogout = () => {
    localStorage.removeItem("studentToken");
    dispatch(logout()); dispatch(resetStudent());
    navigate("/", { replace:true });
  };

  const activeTasks = tasks.filter((t) => !t.isCompletedByMe);

  const handleObjVerified = useCallback((labels) => {
    const tid = activeTasks[taskIdx]?._id;
    if (!tid || !eid) return;
    const sc = {}; labels.forEach((l) => (sc[l] = 1.0));
    dispatch(verifyObjectForTask({ taskId: tid, enrollmentId: eid, detectedObjects: labels, confidenceScores: sc }));
    toast.success("📷 Objects verified!");
    axios.post(`${BASE_URL}/api/gamification/award`, { enrollmentId: eid, event:"object_verified", taskId: tid })
      .then(() => setPtsRef((n) => n+1)).catch(() => {});
  }, [activeTasks, taskIdx, eid, dispatch]);

  // ── Guards ───────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...s.page, background:"#F0F9FF", justifyContent:"center", alignItems:"center", gap:20 }}>
      <div style={{ fontSize:80 }}>⏳</div>
      <div style={{ ...s.text, color:"#0284C7" }}>Getting your tasks…</div>
    </div>
  );

  if (error) return (
    <div style={{ ...s.page, background:"#FFF1F2", justifyContent:"center", alignItems:"center", gap:20, padding:"0 24px", textAlign:"center" }}>
      <div style={{ fontSize:80 }}>😟</div>
      <div style={{ ...s.text, color:"#E11D48" }}>Something went wrong.</div>
      <button onClick={() => { if (token) dispatch(getAllTasks(token)); }} style={{ ...s.btn, background:"#0284C7", width:"auto", padding:"18px 40px" }}>Try Again</button>
    </div>
  );

  if (!tasks.length) return (
    <div style={{ ...s.page, background:"#FFFBEB", justifyContent:"center", alignItems:"center", gap:20, padding:"0 24px", textAlign:"center" }}>
      <div style={{ fontSize:80 }}>🌟</div>
      <div style={{ ...s.text, color:"#D97706" }}>No tasks yet!</div>
      <div style={{ fontSize:18, color:"#92400E" }}>Your teacher will add some soon 😊</div>
      <button onClick={doLogout} style={{ ...s.btn, background:"#D97706", width:"auto", padding:"16px 36px", fontSize:18 }}>🚪 Log Out</button>
    </div>
  );

  if (screen === "reward") return (
    <div style={{ ...s.page, background:"#F0FDF4" }}>
      <div style={{ textAlign:"center" }}>
        <span style={{ fontSize:16, fontWeight:700, color:"#16A34A" }}>🌟 {pts} points</span>
      </div>
      <div style={s.centre}>
        <div style={{ fontSize:100, lineHeight:1 }}>🎉</div>
        <div style={{ display:"flex", gap:6 }}>{[...Array(5)].map((_, i) => <span key={i} style={{ fontSize:36 }}>⭐</span>)}</div>
        <div style={{ ...s.text, color:"#16A34A", fontSize:36 }}>Great Job!</div>
        <div style={{ fontSize:20, color:"#15803D", fontWeight:600, textAlign:"center" }}>You finished the task!<br/>Amazing work! 🙌</div>
      </div>
      <div style={{ textAlign:"center" }}>
        {activeTasks.length > 0 ? (
          <button style={{ ...s.btn, background:"#16A34A" }} onClick={() => { setScreen("step"); setStepIdx(0); setTaskIdx(0); }}>Next Task ➡️</button>
        ) : (
          <>
            <div style={{ fontSize:20, fontWeight:700, color:"#16A34A", marginBottom:16 }}>All done for today! 🏆</div>
            <button onClick={doLogout} style={{ ...s.btn, background:"#6B7280" }}>🚪 Log Out</button>
          </>
        )}
      </div>
    </div>
  );

  if (!activeTasks.length) return (
    <div style={{ ...s.page, background:"#F0FDF4", justifyContent:"center", alignItems:"center", gap:20, padding:"0 24px", textAlign:"center" }}>
      <div style={{ fontSize:80 }}>🏆</div>
      <div style={{ ...s.text, color:"#16A34A" }}>All tasks done!</div>
      <div style={{ fontSize:18, color:"#15803D" }}>Amazing work today! 🙌</div>
      <button onClick={doLogout} style={{ ...s.btn, background:"#16A34A", width:"auto", padding:"16px 36px", fontSize:18 }}>🚪 Log Out</button>
    </div>
  );

  // ── Safe task data ───────────────────────────────────────────────────
  const safeTaskIdx = Math.min(taskIdx, activeTasks.length - 1);
  const task        = activeTasks[safeTaskIdx];
  const taskId      = task._id;
  const steps       = task.simplifiedSteps || [];
  const safeStepIdx = Math.min(stepIdx, Math.max(steps.length - 1, 0));
  const step        = steps[safeStepIdx] || "";
  const objV        = task.objectVerification;
  const objOn       = objV?.enabled && objV?.requiredObjects?.length > 0;
  const objOk       = verifiedTasks?.[taskId] || false;
  const isLastStep  = safeStepIdx === steps.length - 1;
  const accent      = ACCENT[safeTaskIdx % ACCENT.length];
  const bg          = BG[safeTaskIdx % BG.length];

  const handleNextPress  = () => setScreen("confirm");
  const handleConfirmNo  = () => setScreen("step");
  const handleConfirmYes = () => {
    if (isLastStep) {
      if (token && taskId) {
        dispatch(markTaskComplete({ id: taskId, token }));
        if (eid) {
          axios.post(`${BASE_URL}/api/gamification/award`, { enrollmentId: eid, event:"task_complete", taskId })
            .then((r) => { if (r.data.pointsAwarded > 0) setPtsRef((n) => n+1); }).catch(() => {});
        }
      }
      setScreen("reward");
    } else {
      setStepIdx(safeStepIdx + 1);
      setScreen("step");
    }
  };

  // ════════════════════════════════════════════════════════════════════
  //  CONFIRM SCREEN
  // ════════════════════════════════════════════════════════════════════
  if (screen === "confirm") return (
    <div style={{ ...s.page, background: bg }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#6B7280", marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>Did you do this step?</div>
        <div style={{ background:"rgba(255,255,255,0.9)", borderRadius:20, padding:"16px 20px", fontSize:20, fontWeight:900, color:"#111", lineHeight:1.3 }}>{step}</div>
      </div>
      <div style={s.centre}>
        <div style={{ fontSize:90, lineHeight:1 }}>🤔</div>
        <div style={{ fontSize:30, fontWeight:900, color:"#111", textAlign:"center", lineHeight:1.3 }}>Did you really<br/>do it?</div>
        <div style={{ fontSize:18, color:"#6B7280", textAlign:"center" }}>Be honest — it's okay to say no 😊</div>
      </div>
      <div>
        <button onClick={handleConfirmYes} style={{ ...s.btn, background:"#16A34A", marginBottom:14, fontSize:28, display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
          <span>✅</span><span>Yes, I did it!</span>
        </button>
        <button onClick={handleConfirmNo} style={{ ...s.btn, background:"#fff", color:"#374151", border:"3px solid #E5E7EB", fontSize:22, boxShadow:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
          <span>❌</span><span>No, let me try again</span>
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════
  //  STEP SCREEN — with real-image pictogram board
  // ════════════════════════════════════════════════════════════════════
  return (
    <div style={{ ...s.page, background: bg, overflowY:"auto" }}>

      {/* TOP BAR */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:40, height:40, borderRadius:12, background: accent, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900 }}>
            {(user?.name || "S")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color: accent, textTransform:"uppercase", letterSpacing:1 }}>Hello 👋</div>
            <div style={{ fontSize:16, fontWeight:900, color:"#111", lineHeight:1 }}>{user?.name || "Student"}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ background:"rgba(255,255,255,0.9)", borderRadius:12, padding:"6px 14px", fontSize:15, fontWeight:800, color: accent }}>🌟 {pts} pts</div>
          <button onClick={doLogout} style={{ background:"rgba(255,255,255,0.9)", border:"none", borderRadius:12, padding:"8px 12px", fontSize:14, fontWeight:700, color:"#EF4444", cursor:"pointer" }}>🚪</button>
        </div>
      </div>

      {/* PROGRESS */}
      <div style={{ textAlign:"center", flexShrink:0 }}>
        <div style={{ fontSize:18, fontWeight:700, color:"#374151", marginBottom:8 }}>
          {task.title} — Step {safeStepIdx + 1} of {steps.length}
        </div>
        <div style={{ height:10, background:"rgba(0,0,0,0.1)", borderRadius:5, overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:5, background: accent, width:`${(safeStepIdx / Math.max(steps.length - 1, 1)) * 100}%`, transition:"width 0.4s ease" }} />
        </div>
      </div>

      {/* CAMERA BANNER */}
      {objOn && (
        <div style={{ background: objOk ? "#DCFCE7" : "rgba(255,255,255,0.8)", border:`2px solid ${objOk ? "#86EFAC" : "rgba(0,0,0,0.1)"}`, borderRadius:16, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, fontSize:16, fontWeight:700, color: objOk ? "#15803D" : "#374151", flexShrink:0 }}>
          <span style={{ fontSize:28 }}>{objOk ? "✅" : "📷"}</span>
          <span>{objOk ? "Camera check done!" : objV.verificationInstruction || `Show: ${objV.requiredObjects.join(", ")}`}</span>
        </div>
      )}

      {/* STEP TEXT — large, centred */}
      <div style={{ textAlign:"center", flexShrink:0 }}>
        <div style={{ ...s.text, fontSize:26 }}>{step}</div>
        <button onClick={() => speakText(step, { rate:0.7 })} style={{ ...s.voiceBtn, marginTop:10 }}>
          🔊 Listen
        </button>
      </div>

      {/* ══ PICTOGRAM BOARD — REAL IMAGES ════════════════════════════ */}
      <div style={{ flexShrink:0 }}>
        <PictogramBoard
          stepText={step}
          onAllTicked={() => {
            // Optional: auto-open confirm when all pictures tapped
          }}
        />
      </div>

      {/* BOTTOM ACTIONS */}
      <div style={{ textAlign:"center", flexShrink:0, paddingTop:8 }}>
        <button onClick={() => setShowSpeech(true)} style={{ width:"100%", padding:"14px 0", marginBottom:12, fontSize:18, fontWeight:800, borderRadius:16, border:"none", background:"rgba(255,255,255,0.85)", color: accent, cursor:"pointer" }}>
          🎤 Practice Speaking
        </button>

        <button onClick={handleNextPress} style={{ ...s.btn, background: accent }}>
          {isLastStep ? "I DID IT! 🎉" : "NEXT ➡️"}
        </button>

        {activeTasks.length > 1 && (
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:14 }}>
            {activeTasks.map((_, i) => (
              <button key={i} onClick={() => { setTaskIdx(i); setStepIdx(0); setScreen("step"); }}
                style={{ width: i === safeTaskIdx ? 22 : 8, height:8, borderRadius:4, border:"none", cursor:"pointer", padding:0, background: i === safeTaskIdx ? accent : "rgba(0,0,0,0.2)", transition:"all 0.3s" }} />
            ))}
          </div>
        )}
      </div>

      {/* SPEECH SHEET */}
      {showSpeech && (
        <SpeechSheet stepText={step} stepIndex={safeStepIdx} taskId={taskId} eid={eid}
          onPts={(p) => { toast.success(`🎤 +${p} pts!`); setPtsRef((n) => n+1); }}
          onClose={() => setShowSpeech(false)} />
      )}

      {/* Background detectors */}
      <GestureDetector enrollmentId={eid} taskId={taskId||null} isEnabled={true} onGestureDetected={(g) => console.log("Gesture:",g)} />
      <ObjectDetector requiredObjects={objV?.requiredObjects||[]} taskId={taskId||null} isEnabled={true} onVerified={handleObjVerified} />
    </div>
  );
}

const s = {
  page:     { height:"100dvh", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"20px", fontFamily:"sans-serif", overflow:"hidden" },
  centre:   { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, gap:"20px" },
  text:     { fontSize:"32px", fontWeight:"900", textAlign:"center", color:"#111827", lineHeight:1.3, maxWidth:"320px" },
  voiceBtn: { padding:"12px 24px", fontSize:"18px", fontWeight:"700", borderRadius:"14px", border:"none", background:"rgba(255,255,255,0.85)", cursor:"pointer" },
  btn:      { width:"100%", padding:"22px", fontSize:"26px", fontWeight:"900", borderRadius:"20px", border:"none", color:"white", cursor:"pointer", boxShadow:"0 4px 20px rgba(0,0,0,0.15)", display:"block" },
};