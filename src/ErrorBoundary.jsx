import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  componentDidCatch(err, info) {
    console.error("ErrorBoundary:", err, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 24, fontFamily: "system-ui" }}>
          <h2 style={{ marginTop: 0 }}>Frontend crashed</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String(this.state.err?.message || this.state.err)}
          </pre>
          <p>Open DevTools → Console to see the full stack.</p>
        </div>
      );
    }
    return this.props.children;
  }
}