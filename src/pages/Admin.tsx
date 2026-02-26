import React, { useState, useEffect } from "react";
import { Card, Button, Input, Badge, cn, SplashScreen } from "../components/ui/Base";
import { Plus, Copy, Power, PowerOff, LayoutDashboard, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Client {
  token: string;
  nome_cliente: string;
  sheets_id: string;
  ativo: boolean;
  aba_metricas: string;
  aba_leads: string;
  tipo_funil: "whatsapp" | "leads";
  slug: string;
}

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [newClient, setNewClient] = useState({
    nome_cliente: "",
    sheets_id: "",
    aba_metricas: "Métricas",
    aba_leads: "",
    tipo_funil: "whatsapp" as "whatsapp" | "leads",
    slug: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        fetchClients();
      } else {
        setError("Senha incorreta");
      }
    } catch (err) {
      setError("Erro ao conectar ao servidor");
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/clients");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setClients(data);
      } else {
        setClients([]);
        setError(data.error || "Erro ao carregar clientes");
      }
    } catch (err) {
      console.error(err);
      setClients([]);
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      setNewClient({
        nome_cliente: "",
        sheets_id: "",
        aba_metricas: "Métricas",
        aba_leads: "",
        tipo_funil: "whatsapp",
        slug: "",
      });
      fetchClients();
      toast.success("Cliente criado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar cliente");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (token: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/clients/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !currentStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao atualizar status");
      }

      fetchClients();
      toast.success("Status atualizado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao atualizar: " + err.message);
    }
  };

  const copyLink = (client: Client) => {
    const identifier = client.slug || client.token;
    const url = `${window.location.origin}/relatorio/${identifier}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
              <LayoutDashboard className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold">Painel Admin</h1>
            <p className="text-zinc-500 text-sm">Acesso restrito</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-400 mb-1 block">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[32px] tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--ink)" }}>Gestão de Clientes</h1>
          <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 500, color: "var(--muted)" }}>Controle seus relatórios de tráfego</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsLoggedIn(false)}
          className="transition-colors duration-150"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444" }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)" }}
        >
          <LogOut size={16} className="mr-2" /> Sair
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-8" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }}>
            <h2 className="mb-6 flex items-center gap-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, color: "var(--accent)", fontSize: 16 }}>
              <Plus size={18} /> Novo Cliente
            </h2>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>Nome do Cliente</label>
                <Input
                  value={newClient.nome_cliente}
                  onChange={(e) => setNewClient({ ...newClient, nome_cliente: e.target.value })}
                  placeholder="Ex: Loja do João"
                  required
                />
              </div>
              <div>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>ID do Google Sheets</label>
                <Input
                  value={newClient.sheets_id}
                  onChange={(e) => setNewClient({ ...newClient, sheets_id: e.target.value })}
                  placeholder="ID da URL do Sheets"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>Aba Métricas</label>
                  <Input
                    value={newClient.aba_metricas}
                    onChange={(e) => setNewClient({ ...newClient, aba_metricas: e.target.value })}
                    placeholder="Métricas"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>Tipo Funil</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none transition-colors"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--ink)", borderRadius: 8, padding: "10px 14px", fontSize: 14 }}
                      value={newClient.tipo_funil}
                      onChange={(e) => setNewClient({ ...newClient, tipo_funil: e.target.value as any })}
                    >
                      <option value="whatsapp">🟢 WhatsApp</option>
                      <option value="leads">🔵 Leads</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--muted)]">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </div>
                  </div>
                </div>
              </div>
              {newClient.tipo_funil === "leads" && (
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>Aba Leads</label>
                  <Input
                    value={newClient.aba_leads}
                    onChange={(e) => setNewClient({ ...newClient, aba_leads: e.target.value })}
                    placeholder="Leads"
                    required
                  />
                </div>
              )}
              <div>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>Link Customizado (Slug)</label>
                <Input
                  value={newClient.slug}
                  onChange={(e) => setNewClient({ ...newClient, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="Ex: cliente-abc"
                />
                <p className="text-[10px] text-zinc-600 mt-1">Deixe vazio para usar o token padrão.</p>
              </div>
              <Button
                type="submit"
                className="w-full transition-transform active:translate-y-px"
                disabled={loading || !newClient.nome_cliente || !newClient.sheets_id}
                style={{
                  background: "var(--accent)", color: "#0c0f0a", fontWeight: 700, borderRadius: 8,
                  opacity: (loading || !newClient.nome_cliente || !newClient.sheets_id) ? 0.4 : 1,
                  cursor: (loading || !newClient.nome_cliente || !newClient.sheets_id) ? "not-allowed" : "pointer",
                }}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Criar Cliente"}
              </Button>
            </form>
          </Card>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 space-y-4">
          {error && !loading && (
            <Card className="p-4 border-l-4 border-red-500 bg-red-500/10">
              <p className="text-sm text-red-500">{error}</p>
            </Card>
          )}
          {loading && clients.length === 0 ? (
            <SplashScreen message="Buscando clientes..." />
          ) : (
            clients.map((client, index) => (
              <Card
                key={`${client.token}-${index}`}
                className="p-[18px_20px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-150"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(124,189,58,0.25)"; e.currentTarget.style.transform = "translateY(-1px)" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: "var(--accent-dim)",
                      border: "1px solid rgba(124,189,58,0.25)",
                      color: "var(--accent)",
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontWeight: 700,
                      fontSize: 13
                    }}
                  >
                    {client.nome_cliente.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>
                      {client.nome_cliente}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: client.ativo ? "rgba(37,211,102,0.12)" : "rgba(239,68,68,0.10)",
                          color: client.ativo ? "#25d366" : "#ef4444",
                          border: `1px solid ${client.ativo ? "rgba(37,211,102,0.25)" : "rgba(239,68,68,0.2)"}`
                        }}
                      >
                        {client.ativo ? "Ativo" : "Inativo"}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--muted)" }}>
                        {client.token.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex-none transition-colors duration-150"
                    onClick={() => copyLink(client)}
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 8 }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)" }}
                  >
                    <Copy size={14} className="mr-1.5" /> Link
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 md:flex-none transition-colors duration-150"
                    onClick={() => toggleStatus(client.token, client.ativo)}
                    style={{
                      background: client.ativo ? "rgba(239,68,68,0.1)" : "rgba(37,211,102,0.1)",
                      border: `1px solid ${client.ativo ? "rgba(239,68,68,0.2)" : "rgba(37,211,102,0.25)"}`,
                      color: client.ativo ? "#ef4444" : "#25d366",
                      borderRadius: 8
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = client.ativo ? "rgba(239,68,68,0.18)" : "rgba(37,211,102,0.2)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = client.ativo ? "rgba(239,68,68,0.1)" : "rgba(37,211,102,0.1)" }}
                  >
                    {client.ativo ? <PowerOff size={14} className="mr-1.5" /> : <Power size={14} className="mr-1.5" />}
                    {client.ativo ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </Card>
            ))
          )}
          {!loading && clients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-4 grayscale opacity-80 backdrop-blur-sm">📋</span>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, color: "var(--muted)", fontSize: 18 }}>Nenhum cliente cadastrado ainda</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", opacity: 0.6, marginTop: 4 }}>Crie seu primeiro cliente ao lado</p>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
