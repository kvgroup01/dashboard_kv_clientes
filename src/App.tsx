import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Admin from "./pages/Admin";
import Report from "./pages/Report";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/relatorio/:token" element={<Report />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<div className="min-h-screen flex items-center justify-center text-zinc-500">Página não encontrada</div>} />
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}
