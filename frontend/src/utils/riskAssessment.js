const CLOSE_RELATIONSHIPS = new Set(["father", "mother", "brother", "sister", "son", "daughter"]);
const MODERATE_RELATIONSHIPS = new Set(["grandfather", "grandmother", "uncle", "aunt", "cousin"]);

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function isSelfRelationship(relationship) {
  return normalize(relationship) === "self";
}

export function classifyCondition(conditionName, notes = "") {
  const text = `${conditionName || ""} ${notes || ""}`.toLowerCase();

  const isSickleCell = text.includes("sickle") || /\bscd\b/.test(text);
  const isHighGenetic =
    isSickleCell ||
    text.includes("thalassemia") ||
    text.includes("hemophilia") ||
    text.includes("cystic fibrosis") ||
    text.includes("huntington") ||
    text.includes("muscular dystrophy") ||
    text.includes("brca") ||
    text.includes("g6pd") ||
    text.includes("genetic") ||
    text.includes("heredit");
  const isCommonFamilial =
    text.includes("diabetes") ||
    text.includes("hypertension") ||
    text.includes("blood pressure") ||
    text.includes("heart") ||
    text.includes("cardio") ||
    text.includes("cholesterol");

  return {
    isSickleCell,
    isHighGenetic,
    isCommonFamilial,
    isFamilyRisk: Boolean(text.trim()),
  };
}

export function analyzeRisk(familyMembers = [], medicalHistory = []) {
  const relatives = familyMembers.filter((member) => !isSelfRelationship(member.relationship));
  const membersById = new Map(familyMembers.map((member) => [member.id, member]));

  const records = medicalHistory
    .map((record) => {
      const member = membersById.get(record.family_member_id);
      const relationship = normalize(member?.relationship);
      if (!member || isSelfRelationship(relationship)) return null;
      if (!record.condition_name && !record.notes) return null;

      const relationWeight = CLOSE_RELATIONSHIPS.has(relationship)
        ? 2
        : MODERATE_RELATIONSHIPS.has(relationship)
          ? 1.5
          : 1;
      const classification = classifyCondition(record.condition_name, record.notes);

      let points = 10;
      if (classification.isSickleCell) points = 40;
      else if (classification.isHighGenetic) points = 30;
      else if (classification.isCommonFamilial) points = 18;

      points += relationWeight * 10;

      return {
        ...record,
        member,
        relationship,
        relationWeight,
        points,
        ...classification,
      };
    })
    .filter(Boolean);

  const sickleRecords = records.filter((record) => record.isSickleCell);
  const highGeneticRecords = records.filter((record) => record.isHighGenetic);
  const familyRiskRecords = records.filter((record) => record.isFamilyRisk);
  const closeAffected = new Set(
    familyRiskRecords
      .filter((record) => CLOSE_RELATIONSHIPS.has(record.relationship))
      .map((record) => record.family_member_id)
  ).size;
  const uniqueAffectedRelatives = new Set(familyRiskRecords.map((record) => record.family_member_id)).size;

  const rawScore = records.reduce((sum, record) => sum + record.points, 0);
  const normalizedScore = Math.min(100, Math.round(rawScore / Math.max(1, relatives.length)));

  let level = "Low Risk";
  let color = "green";
  let severity = "low";
  let message = "No significant hereditary risk patterns were detected from current family data.";

  if (normalizedScore >= 70 || sickleRecords.length >= 2 || highGeneticRecords.length >= 2 || closeAffected >= 2) {
    level = "High Risk";
    color = "red";
    severity = "critical";
    message = "Strong family-risk pattern detected. Prioritize specialist consultation and early screening.";
  } else if (normalizedScore >= 35 || sickleRecords.length >= 1 || highGeneticRecords.length >= 1 || closeAffected >= 1) {
    level = "Moderate Risk";
    color = "amber";
    severity = "moderate";
    message = "Family-risk indicators are present. Preventive follow-up is recommended.";
  } else if (records.length > 0) {
    level = "Low-Moderate Risk";
    color = "yellow";
    severity = "low-moderate";
    message = "Limited family-risk indicators found. Continue monitoring and keep records updated.";
  }

  return {
    relatives,
    records,
    level,
    color,
    severity,
    message,
    score: normalizedScore,
    counts: {
      totalRelatives: relatives.length,
      totalRecords: records.length,
      familyRiskRecords: familyRiskRecords.length,
      hereditaryRecords: highGeneticRecords.length,
      sickleRecords: sickleRecords.length,
      uniqueAffectedRelatives,
      closeAffected,
    },
  };
}

export function riskLevelKey(levelOrSeverity) {
  const value = normalize(levelOrSeverity);
  if (value.includes("critical") || value.includes("high")) return "high";
  if (value.includes("moderate") || value.includes("amber")) return "moderate";
  if (value.includes("low")) return "low";
  return "none";
}

export function createRiskAlerts(assessment) {
  const now = new Date().toISOString();
  const alerts = [];

  if (assessment.counts.totalRelatives === 0) {
    alerts.push({
      id: "computed:add-family-members",
      alert_type: "add_family_members",
      title: "Complete Your Family Health Tree",
      message: "Add close relatives so Sillah can calculate hereditary and family-risk patterns more accurately.",
      recommendation: "Start with parents, siblings, and grandparents if you know their health history.",
      priority: "moderate",
      is_read: false,
      link: "/family-tree",
      created_at: now,
      computed: true,
    });
    return alerts;
  }

  if (assessment.counts.totalRecords === 0) {
    alerts.push({
      id: "computed:add-family-conditions",
      alert_type: "add_family_conditions",
      title: "Add Family Health Conditions",
      message: "You have family members listed, but no family conditions yet. Add known diagnoses when available.",
      recommendation: "If a relative has no known conditions, keep them as 'No known condition.'",
      priority: "moderate",
      is_read: false,
      link: "/family-tree",
      created_at: now,
      computed: true,
    });
    return alerts;
  }

  if (assessment.severity === "critical") {
    alerts.push({
      id: "computed:high-family-risk",
      alert_type: "high_family_risk",
      title: "High Family-Risk Pattern Detected",
      message: `${assessment.counts.uniqueAffectedRelatives} relative(s) have documented family-risk conditions, including ${assessment.counts.closeAffected} close-relative case(s).`,
      recommendation: "Book a specialist appointment and discuss screening or genetic counseling with your doctor.",
      priority: "high",
      is_read: false,
      link: "/risk-assessment",
      created_at: now,
      computed: true,
    });
  } else if (assessment.severity === "moderate") {
    alerts.push({
      id: "computed:moderate-family-risk",
      alert_type: "moderate_family_risk",
      title: "Family-Risk Follow-up Recommended",
      message: `${assessment.counts.uniqueAffectedRelatives} relative(s) have documented conditions that may affect your preventive-care plan.`,
      recommendation: "Review your family history with your doctor during your next appointment.",
      priority: "moderate",
      is_read: false,
      link: "/risk-assessment",
      created_at: now,
      computed: true,
    });
  }

  if (assessment.counts.hereditaryRecords > 0) {
    alerts.push({
      id: "computed:hereditary-records",
      alert_type: "hereditary_records",
      title: "Possible Hereditary Conditions Found",
      message: `${assessment.counts.hereditaryRecords} family record(s) match known hereditary/genetic condition patterns.`,
      recommendation: "Ask your doctor whether targeted screening or genetic counseling is appropriate.",
      priority: assessment.counts.hereditaryRecords >= 2 ? "high" : "moderate",
      is_read: false,
      link: "/risk-assessment",
      created_at: now,
      computed: true,
    });
  }

  return alerts;
}
