import React, { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle, AlertTriangle, Info, ExternalLink } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function Alerts() {
  const { currentUser, isPatient } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function fetchAlerts() {
      if (!currentUser?.id) {
        if (!cancelled) {
          setError("Please log in to view alerts");
          setLoading(false);
        }
        return;
      }

      if (!isPatient) {
        if (!cancelled) {
          setError("Alerts are available for patient accounts only.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        const { data, error: fetchError } = await supabase
          .from("risk_alerts")
          .select("*")
          .eq("patient_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        if (!cancelled) {
          const normalized = (data || []).map((item) => ({
            ...item,
            title: item.title || item.alert_type || "Risk Alert",
            message: item.message || item.description || item.notes || "Health-related alert",
            priority: (item.priority || "moderate").toLowerCase(),
            is_read: typeof item.is_read === "boolean" ? item.is_read : false
          }));
          setAlerts(normalized);
        }
      } catch (err) {
        console.error("Error fetching alerts:", err);
        if (!cancelled) setError(err?.message || "Unable to load alerts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAlerts();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, isPatient]);

  const supportsReadState = useMemo(() => alerts.some((a) => Object.prototype.hasOwnProperty.call(a, "is_read")), [alerts]);

  async function handleMarkAsRead(alertId) {
    if (!supportsReadState) return;

    const { error: updateError } = await supabase
      .from("risk_alerts")
      .update({ is_read: true })
      .eq("id", alertId)
      .eq("patient_id", currentUser.id);

    if (updateError) {
      console.error("Error marking alert as read:", updateError);
      alert("This alert cannot be marked as read with current schema.");
      return;
    }

    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a)));
  }

  async function handleMarkAllAsRead() {
    if (!supportsReadState) return;

    const unreadIds = alerts.filter((a) => !a.is_read).map((a) => a.id);
    if (unreadIds.length === 0) return;

    const { error: updateError } = await supabase
      .from("risk_alerts")
      .update({ is_read: true })
      .in("id", unreadIds)
      .eq("patient_id", currentUser.id);

    if (updateError) {
      console.error("Error marking all alerts as read:", updateError);
      alert("This alert list cannot be marked as read with current schema.");
      return;
    }

    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  }

  function formatDate(dateString) {
    if (!dateString) return "Date unavailable";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return (
      date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " · " +
      date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    );
  }

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const filteredAlerts = useMemo(() => {
    if (filter === "all") return alerts;
    if (filter === "unread") return alerts.filter((a) => !a.is_read);
    if (filter === "read") return alerts.filter((a) => a.is_read);
    if (filter === "high") return alerts.filter((a) => a.priority === "high");
    if (filter === "moderate") return alerts.filter((a) => a.priority === "moderate");
    return alerts;
  }, [alerts, filter]);

  if (loading) {
    return (
      <div className="alerts-page">
        <div className="alerts-container">
          <h1 className="alerts-title">
            <Bell className="title-icon" />
            Medical Alerts
          </h1>
          <p>Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alerts-page">
        <div className="alerts-container">
          <h1 className="alerts-title">
            <Bell className="title-icon" />
            Alerts & Reminders
          </h1>
          <div className="error-state">
            <AlertTriangle className="error-icon" />
            <p className="error-title">{error}</p>
            <p className="error-text">Please check your connection or try again later.</p>
            <button onClick={() => window.location.reload()} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-page">
      <div className="alerts-container">
        <div className="alerts-header">
          <div>
            <h1 className="alerts-title">
              <Bell className="title-icon" />
              Medical Alerts
            </h1>
            <p className="alerts-subtitle">
              {supportsReadState ? `${unreadCount} unread reminder${unreadCount !== 1 ? "s" : ""}` : `${alerts.length} alert${alerts.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          {supportsReadState && unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="mark-all-btn">
              <CheckCircle className="btn-icon" />
              Mark All as Read
            </button>
          )}
        </div>

        <div className="alerts-filters">
          <button onClick={() => setFilter("all")} className={`filter-tab ${filter === "all" ? "active" : ""}`}>
            All Alerts
          </button>
          {supportsReadState && (
            <>
              <button onClick={() => setFilter("unread")} className={`filter-tab ${filter === "unread" ? "active" : ""}`}>
                Unread
              </button>
              <button onClick={() => setFilter("read")} className={`filter-tab ${filter === "read" ? "active" : ""}`}>
                Read
              </button>
            </>
          )}
          <button onClick={() => setFilter("high")} className={`filter-tab ${filter === "high" ? "active" : ""}`}>
            High Risk
          </button>
          <button onClick={() => setFilter("moderate")} className={`filter-tab ${filter === "moderate" ? "active" : ""}`}>
            Moderate
          </button>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <Bell className="empty-icon" />
            <p className="empty-title">No Alerts</p>
            <p className="empty-text">{filter === "all" ? "You're all caught up." : `No ${filter} alerts found.`}</p>
          </div>
        ) : (
          <div className="alerts-list">
            {filteredAlerts.map((alertItem) => (
              <div key={alertItem.id} className={`alert-card ${!alertItem.is_read ? "unread" : ""}`}>
                <div className="alert-card-header">
                  <div className="alert-icon-wrapper">
                    <Info className="alert-icon" />
                  </div>
                  <div className="alert-header-content">
                    <div className="alert-title-row">
                      <h3 className="alert-title">{alertItem.title}</h3>
                      {supportsReadState && !alertItem.is_read && <span className="new-badge">New</span>}
                    </div>
                    <p className="alert-date">{formatDate(alertItem.created_at)}</p>
                  </div>
                </div>

                <div className="alert-card-body">
                  <p className="alert-message">{alertItem.message}</p>

                  {alertItem.recommendation && (
                    <div className="recommendation-box">
                      <strong>Recommendation:</strong>
                      <p>{alertItem.recommendation}</p>
                    </div>
                  )}

                  <div className="alert-actions">
                    {supportsReadState && !alertItem.is_read && (
                      <button onClick={() => handleMarkAsRead(alertItem.id)} className="mark-read-btn" type="button">
                        Mark as Read
                      </button>
                    )}
                    {alertItem.link && (
                      <button onClick={() => window.open(alertItem.link, "_blank")} className="learn-more-btn" type="button">
                        <ExternalLink size={16} />
                        Learn More
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
