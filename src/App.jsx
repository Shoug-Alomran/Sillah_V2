import { Routes, Route, Navigate } from "react-router-dom";
import Phase5Demo from "./Prototype/Pages/Phase5Demo.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/phase5-demo" replace />} />
      <Route path="/phase5-demo" element={<Phase5Demo />} />
    </Routes>
  );
}