'use client';

import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';

export default function RiskAssessmentPage() {
  // Placeholder data — later we connect to SQLite
  const [riskScore] = useState(null);
  const [factors] = useState([]);

  return (
    <div className="risk-page">
      <div className="risk-container">

        {/* Header */}
        <div className="risk-header">
          <div className="header-content">
            <h1 className="risk-title">
              <Activity className="title-icon" />
              Risk Assessment
            </h1>
            <p className="risk-subtitle">
              View your hereditary and lifestyle-based risk evaluation
            </p>
          </div>
        </div>

        {/* Risk Score */}
        <div className="risk-score-card">
          {riskScore === null ? (
            <div className="empty-state small">
              <Activity className="empty-icon" />
              <h3 className="empty-title">No Risk Score Yet</h3>
              <p className="empty-text">
                Your risk score will appear here once your family tree and health records are added.
              </p>
            </div>
          ) : (
            <div className="risk-score-value">
              <h2>{riskScore}</h2>
              <p>Your current risk score</p>
            </div>
          )}
        </div>

        {/* Risk Factors */}
        <div className="risk-factors-section">
          <h2 className="section-title">Risk Factors</h2>

          {factors.length === 0 ? (
            <div className="empty-state">
              <Info className="empty-icon" />
              <h3 className="empty-title">No Risk Factors Found</h3>
              <p className="empty-text">
                Once your data is added, risk factors will be listed here.
              </p>
            </div>
          ) : (
            <div className="factors-grid">
              {factors.map((factor) => (
                <div key={factor.id} className="factor-card">
                  <h3 className="factor-title">{factor.title}</h3>
                  <p className="factor-description">{factor.description}</p>

                  {factor.severity === 'high' && (
                    <div className="factor-badge high">
                      <AlertTriangle className="badge-icon" />
                      High Risk
                    </div>
                  )}

                  {factor.severity === 'medium' && (
                    <div className="factor-badge medium">
                      <Info className="badge-icon" />
                      Medium Risk
                    </div>
                  )}

                  {factor.severity === 'low' && (
                    <div className="factor-badge low">
                      <CheckCircle className="badge-icon" />
                      Low Risk
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
