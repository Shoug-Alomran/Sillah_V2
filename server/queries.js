export const QUERIES = {

    /* =========================================================
     * BASIC QUERIES (q01–q20)
     * ========================================================= */

    // q01: count users
    q01: `SELECT COUNT(*) AS total_users FROM User;`,

    // q02: list latest users
    q02: `SELECT user_id, first_name, last_name, email, phone_number, created_at
        FROM User
        ORDER BY created_at DESC
        LIMIT 10;`,

    // q03: search users by email
    q03: `SELECT user_id, first_name, last_name, email
        FROM User
        WHERE email LIKE CONCAT('%', :term, '%')
        ORDER BY user_id DESC;`,

    // q04: count family members
    q04: `SELECT COUNT(*) AS total_family_members FROM FamilyMember;`,

    // q05: list family members (simple)
    q05: `SELECT member_id, user_id, first_name, last_name, relationship, date_of_birth
        FROM FamilyMember
        ORDER BY member_id DESC
        LIMIT 15;`,

    // q06: family members for a given user
    q06: `SELECT member_id, first_name, last_name, relationship
        FROM FamilyMember
        WHERE user_id = :user_id
        ORDER BY member_id DESC;`,

    // q07: count health events
    q07: `SELECT COUNT(*) AS total_health_events FROM HealthEvent;`,

    // q08: list events
    q08: `SELECT event_id, member_id, condition_id, severity, event_date
        FROM HealthEvent
        ORDER BY event_date DESC
        LIMIT 15;`,

    // q09: events by severity
    q09: `SELECT event_id, member_id, condition_id, severity, event_date
        FROM HealthEvent
        WHERE severity = :severity
        ORDER BY event_date DESC;`,

    // q10: list conditions
    q10: `SELECT condition_id, condition_name
        FROM HealthCondition
        ORDER BY condition_name;`,

    // q11: list medical history
    q11: `SELECT event_id, member_id, condition_id, diagnosis_date
        FROM MedicalHistory
        ORDER BY diagnosis_date DESC
        LIMIT 15;`,

    // q12: history for one member
    q12: `SELECT event_id, member_id, condition_id, diagnosis_date, notes
        FROM MedicalHistory
        WHERE member_id = :member_id
        ORDER BY diagnosis_date DESC;`,

    // q13: list risk alerts
    q13: `SELECT alert_id, member_id, risk_level, status, created_date
        FROM RiskAlert
        ORDER BY created_date DESC
        LIMIT 15;`,

    // q14: alerts for member
    q14: `SELECT alert_id, member_id, risk_level, status, created_date
        FROM RiskAlert
        WHERE member_id = :member_id
        ORDER BY created_date DESC;`,

    // q15: count alerts by status (simple group)
    q15: `SELECT status, COUNT(*) AS total
        FROM RiskAlert
        GROUP BY status
        ORDER BY total DESC;`,

    // q16: list events for a member (simple filter)
    q16: `SELECT event_id, condition_id, severity, event_date
        FROM HealthEvent
        WHERE member_id = :member_id
        ORDER BY event_date DESC;`,

    // q17: list “High” severity events (simple)
    q17: `SELECT event_id, member_id, condition_id, event_date
        FROM HealthEvent
        WHERE severity = 'High'
        ORDER BY event_date DESC;`,

    // q18: list “High” risk alerts (simple)
    q18: `SELECT alert_id, member_id, status, created_date
        FROM RiskAlert
        WHERE risk_level = 'High'
        ORDER BY created_date DESC;`,

    // q19: list users alphabetically
    q19: `SELECT user_id, first_name, last_name, email
        FROM User
        ORDER BY last_name, first_name
        LIMIT 20;`,

    // q20: list family members alphabetically
    q20: `SELECT member_id, first_name, last_name, relationship
        FROM FamilyMember
        ORDER BY last_name, first_name
        LIMIT 20;`,

    /* =========================================================
     * ADVANCED QUERIES (q21–q40)
     * ========================================================= */

    // q21: join User + FamilyMember
    q21: `SELECT u.user_id, u.email,
               fm.member_id, CONCAT(fm.first_name,' ',fm.last_name) AS member_name,
               fm.relationship
        FROM User u
        JOIN FamilyMember fm ON fm.user_id = u.user_id
        ORDER BY u.user_id DESC, fm.member_id DESC;`,

    // q22: users with no family members (LEFT JOIN + NULL)
    q22: `SELECT u.user_id, u.email
        FROM User u
        LEFT JOIN FamilyMember fm ON fm.user_id = u.user_id
        WHERE fm.member_id IS NULL;`,

    // q23: family size per user (GROUP BY)
    q23: `SELECT u.user_id, u.email, COUNT(fm.member_id) AS family_count
        FROM User u
        LEFT JOIN FamilyMember fm ON fm.user_id = u.user_id
        GROUP BY u.user_id, u.email
        ORDER BY family_count DESC;`,

    // q24: event report (HealthEvent + FamilyMember + HealthCondition) — your proven JOIN
    q24: `SELECT he.event_id,
               CONCAT(fm.first_name,' ',fm.last_name) AS family_member,
               hc.condition_name,
               he.severity,
               he.event_date
        FROM HealthEvent he
        JOIN FamilyMember fm ON he.member_id = fm.member_id
        JOIN HealthCondition hc ON he.condition_id = hc.condition_id
        ORDER BY he.event_date DESC
        LIMIT 20;`,

    // q25: events per condition (GROUP BY + ORDER)
    q25: `SELECT hc.condition_name, COUNT(*) AS total_events
        FROM HealthEvent he
        JOIN HealthCondition hc ON he.condition_id = hc.condition_id
        GROUP BY hc.condition_name
        ORDER BY total_events DESC;`,

    // q26: conditions with zero events (LEFT JOIN)
    q26: `SELECT hc.condition_id, hc.condition_name
        FROM HealthCondition hc
        LEFT JOIN HealthEvent he ON he.condition_id = hc.condition_id
        WHERE he.event_id IS NULL;`,

    // q27: members with more than 1 event (HAVING)
    q27: `SELECT he.member_id, COUNT(*) AS event_count
        FROM HealthEvent he
        GROUP BY he.member_id
        HAVING COUNT(*) > 1
        ORDER BY event_count DESC;`,

    // q28: latest event per member (MAX + JOIN)
    q28: `SELECT he.*
        FROM HealthEvent he
        JOIN (
          SELECT member_id, MAX(event_date) AS max_date
          FROM HealthEvent
          GROUP BY member_id
        ) m ON m.member_id = he.member_id AND m.max_date = he.event_date
        ORDER BY he.event_date DESC;`,

    // q29: history + member + condition (multi-join)
    q29: `SELECT mh.event_id,
               CONCAT(fm.first_name,' ',fm.last_name) AS member_name,
               hc.condition_name,
               mh.diagnosis_date,
               mh.notes
        FROM MedicalHistory mh
        JOIN FamilyMember fm ON mh.member_id = fm.member_id
        JOIN HealthCondition hc ON mh.condition_id = hc.condition_id
        ORDER BY mh.diagnosis_date DESC;`,

    // q30: diagnoses per condition (GROUP BY)
    q30: `SELECT hc.condition_name, COUNT(*) AS diagnoses
        FROM MedicalHistory mh
        JOIN HealthCondition hc ON mh.condition_id = hc.condition_id
        GROUP BY hc.condition_name
        ORDER BY diagnoses DESC;`,

    // q31: members with history but no events (NOT EXISTS)
    q31: `SELECT DISTINCT mh.member_id
        FROM MedicalHistory mh
        WHERE NOT EXISTS (
          SELECT 1 FROM HealthEvent he
          WHERE he.member_id = mh.member_id
        );`,

    // q32: members with events but no history (NOT EXISTS)
    q32: `SELECT DISTINCT he.member_id
        FROM HealthEvent he
        WHERE NOT EXISTS (
          SELECT 1 FROM MedicalHistory mh
          WHERE mh.member_id = he.member_id
        );`,

    // q33: unresolved alerts per member (GROUP BY HAVING)
    q33: `SELECT member_id, COUNT(*) AS unresolved
        FROM RiskAlert
        WHERE status <> 'Resolved'
        GROUP BY member_id
        HAVING COUNT(*) >= 1
        ORDER BY unresolved DESC;`,

    // q34: alert “work queue” join alerts + members, order by risk priority
    q34: `SELECT ra.alert_id,
               CONCAT(fm.first_name,' ',fm.last_name) AS member_name,
               ra.risk_level,
               ra.status,
               ra.created_date
        FROM RiskAlert ra
        JOIN FamilyMember fm ON ra.member_id = fm.member_id
        WHERE ra.status <> 'Resolved'
        ORDER BY FIELD(ra.risk_level,'High','Medium','Low'), ra.created_date DESC;`,

    // q35: members with no alerts (NOT EXISTS)
    q35: `SELECT fm.member_id, fm.first_name, fm.last_name
        FROM FamilyMember fm
        WHERE NOT EXISTS (
          SELECT 1 FROM RiskAlert ra
          WHERE ra.member_id = fm.member_id
        );`,

    // q36: conditions with above-average events (subquery + HAVING)
    q36: `SELECT hc.condition_name, COUNT(*) AS total_events
        FROM HealthEvent he
        JOIN HealthCondition hc ON hc.condition_id = he.condition_id
        GROUP BY hc.condition_name
        HAVING COUNT(*) >
          (SELECT AVG(cnt)
           FROM (SELECT COUNT(*) AS cnt FROM HealthEvent GROUP BY condition_id) t)
        ORDER BY total_events DESC;`,

    // q37: “high severity” events with member + condition (join + filter)
    q37: `SELECT he.event_id,
               CONCAT(fm.first_name,' ',fm.last_name) AS member_name,
               hc.condition_name,
               he.event_date
        FROM HealthEvent he
        JOIN FamilyMember fm ON fm.member_id = he.member_id
        JOIN HealthCondition hc ON hc.condition_id = he.condition_id
        WHERE he.severity = 'High'
        ORDER BY he.event_date DESC;`,

    // q38: average onset age per condition (AVG + NULL filter)
    q38: `SELECT hc.condition_name, AVG(he.onset_age) AS avg_onset_age
        FROM HealthEvent he
        JOIN HealthCondition hc ON hc.condition_id = he.condition_id
        WHERE he.onset_age IS NOT NULL
        GROUP BY hc.condition_name
        ORDER BY avg_onset_age DESC;`,

    // q39: members with at least one HIGH risk alert (EXISTS)
    q39: `SELECT fm.member_id, fm.first_name, fm.last_name
        FROM FamilyMember fm
        WHERE EXISTS (
          SELECT 1 FROM RiskAlert ra
          WHERE ra.member_id = fm.member_id AND ra.risk_level = 'High'
        );`,

    // q40: members with both (events AND alerts) (EXISTS + EXISTS)
    q40: `SELECT fm.member_id, fm.first_name, fm.last_name
        FROM FamilyMember fm
        WHERE EXISTS (SELECT 1 FROM HealthEvent he WHERE he.member_id = fm.member_id)
          AND EXISTS (SELECT 1 FROM RiskAlert ra WHERE ra.member_id = fm.member_id);`,
};