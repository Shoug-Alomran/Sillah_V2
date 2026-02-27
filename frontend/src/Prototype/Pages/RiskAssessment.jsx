import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Heart, Users, Info, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

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

        const memberIds = (familyMembers || []).map((m) => m.id);

        let history = [];
        if (memberIds.length > 0) {
          const { data: med, error: medErr } = await supabase
            .from("medical_history")
            .select("id, family_member_id, condition_name, diagnosis_date, notes")
            .in("family_member_id", memberIds)
            .order("diagnosis_date", { ascending: false, nullsFirst: false });

          if (medErr) throw medErr;
          history = med || [];
        }

        if (!cancelled) {
          setMembers(familyMembers || []);
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

  const sickleRecords = useMemo(() => {
    return records.filter((r) => {
      const text = `${r.condition_name || ""} ${r.notes || ""}`.toLowerCase();
      return text.includes("sickle") || text.includes("scd");
    });
  }, [records]);

  const hereditaryRecords = useMemo(() => {
    return records.filter((r) => {
      const text = `${r.condition_name || ""} ${r.notes || ""}`.toLowerCase();
      return text.includes("heredit") || text.includes("genetic") || text.includes("family history");
    });
  }, [records]);

  const diagnosedMembers = useMemo(() => {
    return new Set(sickleRecords.map((r) => r.family_member_id)).size;
  }, [sickleRecords]);

  const risk = useMemo(() => {
    if (diagnosedMembers >= 2 || sickleRecords.length >= 3) {
      return {
        level: "High Risk",
        color: "red",
        message: "Multiple SCD-related records were found in your family history. Clinical follow-up is recommended.",
        severity: "critical"
      };
    }

    if (diagnosedMembers === 1 || sickleRecords.length >= 1 || hereditaryRecords.length >= 2) {
      return {
        level: "Moderate Risk",
        color: "amber",
        message: "Some hereditary/SCD indicators were found. Regular monitoring is advised.",
        severity: "moderate"
      };
    }

    return {
      level: "Low Risk",
      color: "green",
      message: "No strong hereditary risk indicators found in current records.",
      severity: "low"
    };
  }, [diagnosedMembers, sickleRecords.length, hereditaryRecords.length]);

  const recommendations = useMemo(() => {
    if (risk.severity === "critical") {
      return [
        "Schedule specialist follow-up within the next 2-4 weeks",
        "Discuss family history and possible genetic testing with your provider",
        "Keep family medical history records updated in Sillah"
      ];
    }

    if (risk.severity === "moderate") {
      return [
        "Keep regular annual checkups",
        "Discuss family-history findings with your doctor",
        "Update medical records whenever new diagnoses occur"
      ];
    }

    return [
      "Continue routine preventive care",
      "Maintain healthy lifestyle habits",
      "Keep family records updated for future reassessments"
    ];
  }, [risk.severity]);

  const riskPercentage = useMemo(() => {
    if (members.length === 0) return 0;
    const score = Math.min(100, diagnosedMembers * 35 + sickleRecords.length * 15 + hereditaryRecords.length * 10);
    return score;
  }, [members.length, diagnosedMembers, sickleRecords.length, hereditaryRecords.length]);

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

  return (
    <div className="risk-assessment-page">
      <div className="risk-assessment-container">
        <div className="risk-assessment-header">
          <h1 className="risk-assessment-title">
            <Heart className="title-icon" />
            Risk Assessment
          </h1>
          <p className="risk-assessment-subtitle">
            Based on {members.length} family member{members.length !== 1 ? "s" : ""} and {records.length} health record{records.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className={`risk-level-card risk-border-${risk.color}`}>
          <div className="risk-level-header">
            <h2 className="risk-level-title">Overall Risk Level</h2>
            <span className={`risk-level-badge badge-${risk.color}`}>{risk.level}</span>
          </div>

          <div className="risk-level-body">
            <div className={`risk-message-box message-${risk.color}`}>
              <p className="risk-message">
                <Info className="message-icon" />
                {risk.message}
              </p>
            </div>

            <div className="risk-percentage-box">
              <div className="risk-percentage-header">
                <span className="risk-percentage-label">Risk Score</span>
                <span className="risk-percentage-value">{riskPercentage}%</span>
              </div>
              <div className="risk-percentage-bar">
                <div className={`risk-percentage-fill bg-${risk.color}`} style={{ width: `${riskPercentage}%` }} />
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
