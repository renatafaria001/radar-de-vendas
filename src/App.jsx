
import { useEffect } from "react";

import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  DollarSign,
  Target,
  Settings,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Vendas from "./pages/Vendas";
import Metas from "./pages/Metas";
import Configuracoes from "./pages/Configuracoes";

import logo from "./assets/logo-technoverso.png";

import "./App.css";

function App() {
  useEffect(() => {
    const theme =
      localStorage.getItem("radar-theme") || "dark";

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );
  }, []);

  return (
    <HashRouter>
      <div className="dashboard">
        <aside className="sidebar">

          <div className="brand-technoverso">
            <img
              src={logo}
              alt="Technoverso"
              className="brand-logo"
            />

            <div className="brand-product">
              <h2>RADAR DE VENDAS</h2>
              <span>SALES INTELLIGENCE</span>
            </div>
          </div>

          <div className="menu-label">
            GERENCIAMENTO
          </div>

          <nav className="menu">

            <NavLink to="/" end className="menu-item">
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>

            <NavLink to="/leads" className="menu-item">
              <Users size={20} />
              Leads
            </NavLink>

            <NavLink to="/vendas" className="menu-item">
              <DollarSign size={20} />
              Vendas
            </NavLink>

            <NavLink to="/metas" className="menu-item">
              <Target size={20} />
              Metas
            </NavLink>

            <NavLink
              to="/configuracoes"
              className="menu-item"
            >
              <Settings size={20} />
              Configurações
            </NavLink>

          </nav>

          <div className="sidebar-footer">
            <div className="system-status">
              <span className="status-online" />
              Sistema operacional
            </div>

            <p>TECHNOVERSO © 2026</p>
            <p>Versão 1.0.0</p>
          </div>

        </aside>

        <main className="main">
          <Routes>

            <Route path="/" element={<Dashboard />} />

            <Route path="/leads" element={<Leads />} />

            <Route path="/vendas" element={<Vendas />} />

            <Route path="/metas" element={<Metas />} />

            <Route
              path="/configuracoes"
              element={<Configuracoes />}
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>

          <footer className="technoverso-footer">
            Desenvolvido por TECHNOVERSO |
            Radar de Vendas |
            Projeto demonstrativo
          </footer>

        </main>
      </div>
    </HashRouter>
  );
}

export default App;
