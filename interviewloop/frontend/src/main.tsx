import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/index.css";
import ProblemSelectPage from "./pages/ProblemSelectPage";
import InterviewPage from "./pages/InterviewPage";
import HistoryPage from "./pages/HistoryPage";
import EvaluationPage from "./pages/EvaluationPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProblemSelectPage />} />
        <Route path="/interview/:sessionId" element={<InterviewPage />} />
        <Route path="/evaluation/:sessionId" element={<EvaluationPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
