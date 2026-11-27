
import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  User,
  Save,
  Info,
  CheckCircle,
} from "lucide-react";

export default function Configuracoes() {
  const [name, setName] = useState(
    () => localStorage.getItem("radar-name") || ""
  );

  const [theme, setTheme] = useState(
    () => localStorage.getItem("radar-theme") || "light"
  );

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem("radar-theme", theme);
  }, [theme]);

  function saveSettings(event) {
    event.preventDefault();

    localStorage.setItem("radar-name", name);
    localStorage.setItem("radar-theme", theme);

    setSaved(true);
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>Configurações</h1>
          <p>Personalize sua experiência no sistema.</p>
        </div>
      </header>

      <form onSubmit={saveSettings}>
        <section className="panel settings-panel">
          <div className="settings-heading">
            <div className="stat-icon purple">
              <User size={22} />
            </div>

            <div>
              <h2>Perfil do usuário</h2>
              <p>Personalize suas informações.</p>
            </div>
          </div>

          <div className="settings-field">
            <label htmlFor="user-name">
              Nome do usuário
            </label>

            <input
              id="user-name"
              type="text"
              placeholder="Digite seu nome"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
              }}
            />
          </div>
        </section>

        <section className="panel settings-panel">
          <div className="settings-heading">
            <div className="stat-icon blue">
              <Sun size={22} />
            </div>

            <div>
              <h2>Aparência</h2>
              <p>Escolha o tema da interface.</p>
            </div>
          </div>

          <div className="theme-options">
            <button
              type="button"
              aria-pressed={theme === "light"}
              className={
                "theme-option " +
                (theme === "light" ? "selected" : "")
              }
              onClick={() => {
                setTheme("light");
                setSaved(false);
              }}
            >
              <Sun size={30} />
              <strong>Modo claro</strong>
              <span>Interface clara e minimalista</span>
            </button>

            <button
              type="button"
              aria-pressed={theme === "dark"}
              className={
                "theme-option " +
                (theme === "dark" ? "selected" : "")
              }
              onClick={() => {
                setTheme("dark");
                setSaved(false);
              }}
            >
              <Moon size={30} />
              <strong>Modo escuro</strong>
              <span>Interface com tons escuros</span>
            </button>
          </div>
        </section>

        <button
          type="submit"
          className="primary-button"
        >
          <Save size={18} />
          Salvar configurações
        </button>

        {saved && (
          <div className="settings-success" role="status">
            <CheckCircle size={20} />
            Configurações salvas com sucesso!
          </div>
        )}
      </form>

      <section className="panel settings-panel about-panel">
        <div className="settings-heading">
          <div className="stat-icon green">
            <Info size={22} />
          </div>

          <div>
            <h2>Sobre o sistema</h2>
            <p>Informações do projeto.</p>
          </div>
        </div>

        <div className="about-row">
          <span>Aplicação</span>
          <strong>Radar de Vendas</strong>
        </div>

        <div className="about-row">
          <span>Versão</span>
          <strong>1.0.0</strong>
        </div>

        <div className="about-row">
          <span>Framework</span>
          <strong>React + Vite</strong>
        </div>

        <div className="about-row">
          <span>Visualização de dados</span>
          <strong>Recharts</strong>
        </div>

        <div className="about-row">
          <span>Armazenamento</span>
          <strong>LocalStorage</strong>
        </div>

        <div className="about-row">
          <span>Finalidade</span>
          <strong>Projeto de portfólio</strong>
        </div>
      </section>
    </div>
  );
}
