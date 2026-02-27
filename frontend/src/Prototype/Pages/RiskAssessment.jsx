import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Heart, Users, Info, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

const CLOSE_RELATIONSHIPS = new Set(["father", "mother", "brother", "sister", "son", "daughter"]);
const MODERATE_RELATIONSHIPS = new Set(["grandfather", "grandmother", "uncle", "aunt", "cousin"]);

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function classifyCondition(conditionName, notes) {
  const text = `${conditionName || ""} ${notes || ""}`.toLowerCase();

  const isSickleCell = text.includes("sickle") || text.includes("scd");
  const isHereditary =
    isSickleCell ||
    text.includes("genetic") ||
    text.includes("heredit") ||
    text.includes("family history") ||
    text.includes("thalassemia") ||
    text.includes("hemophilia") ||
    text.includes("cystic fibrosis") ||
    text.includes("huntington") ||
    text.includes("muscular dystrophy") ||
    text.includes("brca") ||
    text.includes("g6pd");

  return { isSickleCell, isHereditary };
}

export default function RiskAssessment() {
  const navigate = useNavigate();
  const { currentUser, isPatient } = useAuth();

  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (!currentUser?.id) {
        if (!cancelled) {
          setError("Please log in to view risk assessment");
          setLoading(false);
        }
        return;
      }

      if (!isPatient) {
        if (!cancelled) {
          setError("Only patients can view risk assessment");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: familyMembers, error: famErr } = await supabase
          .from("family_members")
          .select("id, full_name, relationship, date_of_birth")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (famErr) throw famErr;

        const relatives = (familyMembers || []).filter(
          (m) => normalize(m.relationship) !== "self"
        );
        const relativeIds = relatives.map((m) => m.id);

        let history = [];
        if (relativeIds.length > 0) {
          const { data: med, error: medErr } = await supabase
            .from("medical_history")
            .select("id, family_member_id, condition_name, diagnosis_date, notes")
            .in("family_member_id", relativeIds)
            .order("diagnosis_date", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

          if (medErr) throw medErr;
          history = med || [];
        }

        if (!cancelled) {
          setMembers(relatives);
          setRecords(history);
        }
      } catch (err) {
        console.error("Error fetching risk assessment data:", err);
        if (!cancelled) setError(err?.message || "Unable to load family data. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, isPatient]);

  const membersById = useMemo(() => {
    const map = new Map();
    members.forEach((member) => map.set(member.id, member));
    return map;
  }, [members]);

  const analyzedRecords = useMemo(() => {
    return records.map((record) => {
      const member = membersById.get(record.family_member_id);
      const relation = normalize(member?.relationship);
      const relationWeight = CLOSE_RELATIONSHIPS.has(relation)
        ? 2
        : MODERATE_RELATIONSHIPS.has(relation)
          ? 1.5
          : 1;

      const classification = classifyCondition(record.condition_name, record.notes);

      let points = 0;
      if (classification.isSickleCell) points += 40;
      else if (classification.isHereditary) points += 25;
      else points += 10;

      points += relationWeight * 10;

      return {
        ...record,
        member,
        relation,
        relationWeight,
        ...classification,
        points
      };
    });
  }, [records, membersById]);

  const riskSummary = useMemo(() => {
    const sickle = analyzedRecords.filter((r) => r.isSickleCell);
    const hereditary = analyzedRecords.filter((r) => r.isHereditary);

    const uniqueAffectedRelatives = new Set(hereditary.map((r) => r.family_member_id)).size;
    const closeAffected = new Set(
      hereditary
        .filter((r) => CLOSE_RELATIONSHIPS.has(r.relation))
        .map((r) => r.family_member_id)
    ).size;

    const rawScore = analyzedRecords.reduce((sum, r) => sum + r.points, 0);
    const normalizedScore = Math.min(100, Math.round(rawScore / Math.max(1, members.length)));

    let level = "Low Risk";
    let color = "green";
    let severity = "low";
    let message = "No significant hereditary risk patterns were detected from current family data.";

    if (normalizedScore >= 70 || sickle.length >= 2 || closeAffected >= 2) {
      level = "High Risk";
      color = "red";
      severity = "critical";
      message = "Strong hereditary risk pattern detected. Prioritize specialist consultation and early screening.";
    } else if (normalizedScore >= 35 || sickle.length >= 1 || closeAffected >= 1) {
      level = "Moderate Risk";
      color = "amber";
      severity = "moderate";
      message = "Some hereditary risk indicators are present. Preventive follow-up is recommended.";
    } else if (analyzedRecords.length > 0) {
      level = "Low-Moderate Risk";
      color = "yellow";
      severity = "low-moderate";
      message = "Limited risk indicators found. Continue monitoring and keep records updated.";
    }

    return {
      level,
      color,
      severity,
      message,
      score: normalizedScore,
      counts: {
        totalRecords: analyzedRecords.length,
        hereditaryRecords: hereditary.length,
        sickleRecords: sickle.length,
        uniqueAffectedRelatives,
        closeAffected
      }
    };
  }, [analyzedRecords, members.length]);

  const recommendations = useMemo(() => {
    if (riskSummary.severity === "critical") {
      return [
        "Book a specialist appointment in the next 2-4 weeks.",
        "Discuss genetic counseling and targeted screening.",
        "Share family history records with all treating clinicians."
      ];
    }

    if (riskSummary.severity === "moderate") {
      return [
        "Schedule preventive checkups and discuss family risk profile.",
        "Track new family diagnoses as they happen.",
        "Review lifestyle and early-warning signs with your doctor."
      ];
    }

    return [
      "Continue routine annual health follow-up.",
      "Maintain healthy lifestyle habits.",
      "Keep family records updated for better future assessment quality."
    ];
  }, [riskSummary.severity]);

  if (loading) {
    return (
      <div className="risk-assessment-page">
        <div className="risk-assessment-container">
          <div className="risk-assessment-header">
            <h1 className="risk-assessment-title">
              <Heart className="title-icon" />
              Risk Assessment
            </h1>
            <p className="risk-assessment-subtitle">Hereditary health risk analysis</p>
          </div>
          <div className="empty-state">
            <Heart className="empty-icon" style={{ animation: "pulse 2s infinite" }} />
            <p className="empty-title">Analyzing Family Health Data...</p>
            <p className="empty-text">Please wait while we calculate your hereditary risk assessment.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="risk-assessment-page">
        <div className="risk-assessment-container">
          <div className="risk-assessment-header">
            <h1 className="risk-assessment-title">
              <Heart className="title-icon" />
              Risk Assessment
            </h1>
            <p className="risk-assessment-subtitle">Hereditary health risk analysis</p>
          </div>
          <div className="empty-state">
            <AlertTriangle className="empty-icon" style={{ color: "#ef4444" }} />
            <p className="empty-title">{error}</p>
            <p className="empty-text">Please check your connection or try again later.</p>
            <button onClick={() => window.location.reload()} className="empty-action-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="risk-assessment-page">
        <div className="risk-assessment-container">
          <div className="risk-assessment-header">
            <h1 className="risk-assessment-title">
              <Heart className="title-icon" />
              Risk Assessment
            </h1>
            <p className="risk-assessment-subtitle">Hereditary health risk analysis</p>
          </div>
          <div className="empty-state">
            <Users className="empty-icon" />
            <p className="empty-title">No Family Members Added Yet</p>
            <p className="empty-text">Add family members to generate a personalized risk assessment.</p>
            <button onClick={() => navigate("/family-tree")} className="empty-action-btn">
              <Users className="empty-action-icon" />
              Add Family Members
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="risk-assessment-page">
        <div className="risk-assessment-container">
          <div className="risk-assessment-header">
            <h1 className="risk-assessment-title">
              <Heart className="title-icon" />
              Risk Assessment
            </h1>
            <p className="risk-assessment-subtitle">Hereditary health risk analysis</p>
          </div>
          <div className="empty-state">
            <Info className="empty-icon" />
            <p className="empty-title">Not Enough Clinical Data Yet</p>
            <p className="empty-text">Add family conditions in Family Tree to generate risk scoring.</p>
            <button onClick={() => navigate("/family-tree")} className="empty-action-btn">
              Add Family Conditions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="risk-assessment-page">
      <div className="risk-assessment-container">
        <div className="risk-assessment-header">
          <h1 className="risk-assessment-title">
            <Heart className="title-icon" />
            Risk Assessment
          </h1>
          <p className="risk-assessment-subtitle">
            Based on {members.length} family member{members.length !== 1 ? "s" : ""} and {records.length} documented condition{records.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className={`risk-level-card risk-border-${riskSummary.color}`}>
          <div className="risk-level-header">
            <h2 className="risk-level-title">Overall Risk Level</h2>
            <span className={`risk-level-badge badge-${riskSummary.color}`}>{riskSummary.level}</span>
          </div>

          <div className="risk-level-body">
            <div className={`risk-message-box message-${riskSummary.color}`}>
              <p className="risk-message">
                <Info className="message-icon" />
                {riskSummary.message}
              </p>
            </div>

            <div className="risk-percentage-box">
              <div className="risk-percentage-header">
                <span className="risk-percentage-label">Risk Score</span>
                <span className="risk-percentage-value">{riskSummary.score}%</span>
              </div>
              <div className="risk-percentage-bar">
                <div className={`risk-percentage-fill bg-${riskSummary.color}`} style={{ width: `${riskSummary.score}%` }} />
              </div>
            </div>

            <div className="risk-percentage-box" style={{ marginTop: "1rem" }}>
              <div className="risk-percentage-header">
                <span className="risk-percentage-label">Affected Relatives</span>
                <span className="risk-percentage-value">{riskSummary.counts.uniqueAffectedRelatives}</span>
              </div>
              <div className="risk-percentage-header">
                <span className="risk-percentage-label">Close-Relative Cases</span>
                <span className="risk-percentage-value">{riskSummary.counts.closeAffected}</span>
              </div>
              <div className="risk-percentage-header">
                <span className="risk-percentage-label">SCD-related Records</span>
                <span className="risk-percentage-value">{riskSummary.counts.sickleRecords}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="risk-recommendations-card">
          <h3 className="recommendations-title">
            <TrendingUp className="recommendations-icon" />
            Recommendations
          </h3>
          <ul className="recommendations-list">
            {recommendations.map((item, idx) => (
              <li key={idx} className="recommendation-item">{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
