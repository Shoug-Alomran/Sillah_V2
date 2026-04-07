import React from "react";
import { HeartPulse } from "lucide-react";

export default function AppLoadingScreen({ message = "Loading your secure session..." }) {
  return (
    <div className="app-loading-screen" role="status" aria-live="polite">
      <div className="app-loading-card">
        <div className="app-loading-icon">
          <HeartPulse />
        </div>
        <h1>Sillah</h1>
        <p>{message}</p>
      </div>
    </div>
  );
}
