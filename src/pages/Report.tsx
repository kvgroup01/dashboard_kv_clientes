import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, Button, Badge, Skeleton, cn, Input, SplashScreen } from "../components/ui/Base";
import { AspectRatio } from "../components/ui/aspect-ratio";
import {
  TrendingUp,
  Users,
  MousePointer2,
  DollarSign,
  MessageSquare,
  ArrowRight,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  Mail,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { format, subDays, startOfMonth, isWithinInterval, parseISO, endOfDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarRange } from "../components/CalendarRange";
import { DateRange } from "react-day-picker";
import { FunnelChart } from "../components/FunnelChart";
import { KpiCard } from "../components/KpiCard";

interface Metric {
  data: string;
  campanha: string;
  conjunto: string;
  anuncio: string;
  thumbnail?: string;
  link: string;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  cliques_saida: number;
  leads_clique_saida: number;
  ctr: number;
  cpc: number;
  conversas: number;
  custo_conversa: number;
  cpm: number;
}

interface Lead {
  data: string;
  nome: string;
  email: string;
  telefone: string;
  curso_interesse: string;
  escolaridade: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
}

interface ReportData {
  client: { nome_cliente: string; tipo_funil: "whatsapp" | "leads" };
  metrics: Metric[];
  leads: Lead[];
}

function AreaChartInteractive({
  data,
  isWA,
  accentColor,
}: {
  data: { data: string; conversas: number; leads: number; alcance: number; investimento: number }[];
  isWA: boolean;
  accentColor: string;
}) {
  const [timeRange, setTimeRange] = React.useState("all");

  const metricKey = isWA ? "conversas" : "leads";
  const metricLabel = isWA ? "Conversas" : "Leads";

  const filteredData = React.useMemo(() => {
    if (timeRange === "all") return data;
    const sorted = [...data].sort((a, b) => {
      const da = a.data.split("/").reverse().join("");
      const db = b.data.split("/").reverse().join("");
      return da.localeCompare(db);
    });
    const days = timeRange === "30d" ? 30 : 7;
    return sorted.slice(-days);
  }, [data, timeRange]);

  const chartConfig: ChartConfig = {
    [metricKey]: {
      label: metricLabel,
      color: accentColor,
    },
    investimento: {
      label: "Investimento (R$)",
      color: "#f59e0b",
    },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const inv = payload.find((p: any) => p.dataKey === "investimento");
    const conv = payload.find((p: any) => p.dataKey === metricKey);
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "12px 16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
        className="flex flex-col gap-2 min-w-[140px]"
      >
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--muted)", margin: 0, textTransform: "uppercase" }}>
          {label}
        </p>
        {inv && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "var(--orange)" }} />
              <span className="text-xs" style={{ color: "var(--muted)" }}>Investimento</span>
            </div>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, color: "#f59e0b" }}>
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(inv.value)}
            </span>
          </div>
        )}
        {conv && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentColor }} />
              <span className="text-xs" style={{ color: "var(--muted)" }}>{metricLabel}</span>
            </div>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, color: accentColor }}>
              {conv.value}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="pt-0 h-full flex flex-col">
      <div className="flex items-center gap-2 border-b border-zinc-800 py-5 px-6 flex-wrap">
        <div className="flex-1">
          <h2 className="text-base font-bold">Evolução Diária</h2>
          <p className="text-xs text-zinc-500">
            Investimento × {metricLabel} por dia
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px] rounded-lg text-xs h-8">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7d" className="rounded-lg">Últimos 7 dias</SelectItem>
            <SelectItem value="30d" className="rounded-lg">Últimos 30 dias</SelectItem>
            <SelectItem value="all" className="rounded-lg">Tudo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="px-2 pt-4 sm:px-6 sm:pt-6 pb-4 flex-1">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity={0.55} />
                <stop offset="75%" stopColor={accentColor} stopOpacity={0.08} />
                <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientOrange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.45} />
                <stop offset="75%" stopColor="#f59e0b" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowOrange" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid vertical={false} stroke="#232b1e" strokeDasharray="4 4" />
            <XAxis
              dataKey="data"
              tickLine={false}
              axisLine={{ stroke: '#232b1e' }}
              tickMargin={8}
              minTickGap={28}
              tick={{ fill: "#607058", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              tickFormatter={(v) => String(v).substring(0, 5)}
            />
            <YAxis
              yAxisId="conversas"
              orientation="left"
              tickLine={false}
              axisLine={{ stroke: '#232b1e' }}
              tickFormatter={(v) => v}
              tick={{ fill: "#607058", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              width={40}
            />
            <YAxis
              yAxisId="investimento"
              orientation="right"
              tickLine={false}
              axisLine={{ stroke: '#232b1e' }}
              tickFormatter={(v) => `R$ ${v}`}
              tick={{ fill: "#607058", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#607058", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area
              yAxisId="investimento"
              dataKey="investimento"
              type="monotone"
              fill="url(#gradientOrange)"
              fillOpacity={1}
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#f59e0b", stroke: "#0c0f0a", strokeWidth: 2 }}
              style={{ filter: "url(#glowOrange)" }}
            />
            <Area
              yAxisId="conversas"
              dataKey={metricKey}
              type="monotone"
              fill="url(#gradientGreen)"
              fillOpacity={1}
              stroke={accentColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: accentColor, stroke: "#0c0f0a", strokeWidth: 2 }}
              style={{ filter: "url(#glowGreen)" }}
            />
            <Legend
              formatter={(value) =>
                value === metricKey ? metricLabel : "Investimento (R$)"
              }
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", paddingTop: 16, color: "#e4ede0" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── Hierarchical Table ───────────────────────────────────────────────────────
function HierarchicalTable({ metrics, isWA }: { metrics: Metric[]; isWA: boolean }) {
  const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  const resultKey = isWA ? "conversas" : "leads_clique_saida";
  const resultLabel = isWA ? "Conversas" : "Leads";

  const campaigns = useMemo(() => {
    const map = new Map<string, Map<string, Metric[]>>();
    for (const m of metrics) {
      if (!map.has(m.campanha)) map.set(m.campanha, new Map());
      const conjs = map.get(m.campanha)!;
      if (!conjs.has(m.conjunto)) conjs.set(m.conjunto, []);
      conjs.get(m.conjunto)!.push(m);
    }
    return map;
  }, [metrics]);

  const [openCamps, setOpenCamps] = useState<Set<string>>(new Set());
  const [openConjs, setOpenConjs] = useState<Set<string>>(new Set());

  const toggleCamp = (key: string) => setOpenCamps(p => { const s = new Set(p); s.has(key) ? s.delete(key) : s.add(key); return s; });
  const toggleConj = (key: string) => setOpenConjs(p => { const s = new Set(p); s.has(key) ? s.delete(key) : s.add(key); return s; });

  const sumM = (rows: Metric[]) => ({
    investimento: rows.reduce((a, r) => a + r.investimento, 0),
    resultado: rows.reduce((a, r) => a + (r as any)[resultKey], 0),
    cliques: rows.reduce((a, r) => a + r.cliques, 0),
    alcance: rows.reduce((a, r) => a + r.alcance, 0),
  });

  const thS: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "var(--muted)", padding: "12px 16px",
    background: "var(--surface-2)", whiteSpace: "nowrap",
  };

  return (
    <Card className="overflow-hidden animate-fade-up border-0" style={{ animationDelay: "360ms" }}>
      <div className="p-6 ds-eyebrow mb-0"><h2>DESEMPENHO POR CAMPANHA</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th style={{ ...thS, textAlign: "left", width: "40%" }}>Campanha / Conjunto / Anúncio</th>
              <th style={{ ...thS, textAlign: "right" }}>Investimento</th>
              <th style={{ ...thS, textAlign: "right" }}>{resultLabel}</th>
              <th style={{ ...thS, textAlign: "right" }}>Custo/{isWA ? "Conv" : "Lead"}</th>
              <th style={{ ...thS, textAlign: "right" }}>Cliques</th>
              <th style={{ ...thS, textAlign: "right" }}>Alcance</th>
              <th style={{ ...thS, textAlign: "center" }}>Link</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(campaigns.entries()).map(([camp, conjMap]) => {
              const allM = Array.from(conjMap.values()).flat();
              const cTot = sumM(allM);
              const isOC = openCamps.has(camp);
              return (
                <React.Fragment key={camp}>
                  <tr onClick={() => toggleCamp(camp)} className="cursor-pointer select-none"
                    style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,189,58,0.07)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--surface-2)")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span style={{ color: "var(--accent)", fontSize: 11, display: "inline-block", transition: "transform 150ms", transform: isOC ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--ink)", maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{camp}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--ink)", fontWeight: 600 }}>{fmt(cTot.investimento)}</td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, color: "var(--accent)", fontSize: 14 }}>{cTot.resultado}</td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#f59e0b" }}>{fmt(cTot.resultado > 0 ? cTot.investimento / cTot.resultado : 0)}</td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--muted)" }}>{cTot.cliques.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--muted)" }}>{cTot.alcance.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      {(() => { const firstLink = allM.find(m => m.link)?.link; return firstLink ? <a href={firstLink} target="_blank" rel="noreferrer" style={{ color: "var(--muted)" }} className="hover:text-white inline-block transition-colors"><ExternalLink size={13} /></a> : null; })()}
                    </td>
                  </tr>

                  {isOC && Array.from(conjMap.entries()).map(([conj, ads]) => {
                    const conjTot = sumM(ads);
                    const ck = `${camp}|${conj}`;
                    const isOJ = openConjs.has(ck);
                    return (
                      <React.Fragment key={ck}>
                        <tr onClick={() => toggleConj(ck)} className="cursor-pointer select-none"
                          style={{ borderBottom: "1px solid var(--border)" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,189,58,0.03)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td className="py-2.5" style={{ paddingLeft: 40 }}>
                            <div className="flex items-center gap-2">
                              <span style={{ color: "var(--muted)", fontSize: 10, display: "inline-block", transition: "transform 150ms", transform: isOJ ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 12, color: "var(--muted)", maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{conj || "(sem conjunto)"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--muted)" }}>{fmt(conjTot.investimento)}</td>
                          <td className="px-4 py-2.5 text-right" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, color: "var(--accent)", fontSize: 13 }}>{conjTot.resultado}</td>
                          <td className="px-4 py-2.5 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#f59e0b" }}>{fmt(conjTot.resultado > 0 ? conjTot.investimento / conjTot.resultado : 0)}</td>
                          <td className="px-4 py-2.5 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--muted)" }}>{conjTot.cliques.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--muted)" }}>{conjTot.alcance.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-center">
                            {(() => { const firstLink = ads.find(m => m.link)?.link; return firstLink ? <a href={firstLink} target="_blank" rel="noreferrer" style={{ color: "var(--muted)" }} className="hover:text-white inline-block transition-colors"><ExternalLink size={13} /></a> : null; })()}
                          </td>
                        </tr>

                        {isOJ && ads.map((ad, i) => {
                          const res = (ad as any)[resultKey];
                          return (
                            <tr key={`${ck}|${i}`} className="ds-table-row" style={{ borderBottom: "1px solid var(--border)" }}>
                              <td className="py-2" style={{ paddingLeft: 72 }}>
                                <div className="flex items-center gap-2">
                                  {ad.thumbnail ? (
                                    <img src={ad.thumbnail} alt="" className="w-8 h-8 rounded object-cover shrink-0" style={{ border: "1px solid var(--border)" }} onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }} />
                                  ) : (
                                    <div className="w-8 h-8 rounded shrink-0" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }} />
                                  )}
                                  <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 12, color: "var(--ink)", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{ad.anuncio}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--muted)" }}>{fmt(ad.investimento)}</td>
                              <td className="px-4 py-2 text-right" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, color: "var(--accent)", fontSize: 13 }}>{res}</td>
                              <td className="px-4 py-2 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#f59e0b" }}>{fmt(res > 0 ? ad.investimento / res : 0)}</td>
                              <td className="px-4 py-2 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--muted)" }}>{ad.cliques.toLocaleString()}</td>
                              <td className="px-4 py-2 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--muted)" }}>{ad.alcance.toLocaleString()}</td>
                              <td className="px-4 py-2 text-center">
                                {ad.link && <a href={ad.link} target="_blank" rel="noreferrer" style={{ color: "var(--muted)" }} className="hover:text-white inline-block transition-colors"><ExternalLink size={13} /></a>}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            {(() => {
              const tot = sumM(metrics);
              const avgCusto = tot.resultado > 0 ? tot.investimento / tot.resultado : 0;
              const tfS: React.CSSProperties = {
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "var(--ink)",
                fontWeight: 700,
                padding: "14px 16px",
                whiteSpace: "nowrap",
              };
              return (
                <tr style={{ borderTop: "2px solid var(--accent-border)", background: "rgba(124,189,58,0.06)" }}>
                  <td style={{ ...tfS, paddingLeft: 16 }}>
                    <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      TOTAL GERAL
                    </span>
                  </td>
                  <td style={{ ...tfS, textAlign: "right", color: "var(--ink)" }}>{fmt(tot.investimento)}</td>
                  <td style={{ ...tfS, textAlign: "right", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16, color: "var(--accent)", letterSpacing: "-0.02em" }}>
                    {tot.resultado.toLocaleString("pt-BR")}
                  </td>
                  <td style={{ ...tfS, textAlign: "right", color: "#f59e0b" }} title="Custo médio ponderado">{fmt(avgCusto)}</td>
                  <td style={{ ...tfS, textAlign: "right", color: "var(--muted)" }}>{tot.cliques.toLocaleString("pt-BR")}</td>
                  <td style={{ ...tfS, textAlign: "right", color: "var(--muted)" }}>{tot.alcance.toLocaleString("pt-BR")}</td>
                  <td />
                </tr>
              );
            })()}
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

// ─── Ad Gallery ─────────────────────────────────────────────────────────────
function AdGallery({ metrics, isWA }: { metrics: Metric[]; isWA: boolean }) {
  const resultKey = isWA ? "conversas" : "leads_clique_saida";

  const ads = useMemo(() => {
    const map = new Map<string, { anuncio: string; thumbnail: string; cliques: number; resultado: number }>();
    for (const m of metrics) {
      if (!m.anuncio || m.anuncio.trim() === "") continue;
      const key = m.anuncio.trim();
      if (!map.has(key)) map.set(key, { anuncio: key, thumbnail: m.thumbnail || "", cliques: 0, resultado: 0 });
      const e = map.get(key)!;
      e.cliques += m.cliques;
      e.resultado += (m as any)[resultKey];
      // Keep first non-empty thumbnail found
      if (!e.thumbnail && m.thumbnail) e.thumbnail = m.thumbnail;
    }
    return Array.from(map.values()).sort((a, b) => b.resultado - a.resultado);
  }, [metrics, resultKey]);

  if (ads.length === 0) return null;

  return (
    <div className="animate-fade-up" style={{ animationDelay: "420ms" }}>
      <div className="ds-eyebrow mb-6"><h2>GALERIA DE ANÚNCIOS</h2></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {ads.map((ad, i) => (
          <div
            key={i}
            className="ds-card-hover flex flex-col rounded-[14px] overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Square thumbnail — native FB thumbnail format */}
            <div className="relative overflow-hidden" style={{ paddingBottom: "100%", background: "var(--surface-2)" }}>
              {ad.thumbnail ? (
                <img
                  src={ad.thumbnail}
                  alt={ad.anuncio}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={e => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                    const parent = el.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--muted)"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>`;
                    }
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" style={{ color: "var(--muted)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
              )}
            </div>
            {/* Info */}
            <div className="p-3 flex flex-col gap-2 flex-1">
              <p
                title={ad.anuncio}
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                  color: "var(--ink)",
                  lineHeight: 1.4,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  minHeight: "2.8em"
                }}
              >
                {ad.anuncio}
              </p>
              <div className="flex justify-between items-end mt-auto pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex flex-col">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cliques</span>
                  <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
                    {ad.cliques.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {isWA ? "Conv." : "Leads"}
                  </span>
                  <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, color: "var(--accent)", letterSpacing: "-0.025em", lineHeight: 1 }}>
                    {ad.resultado.toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Report() {

  const { token } = useParams();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState<"today" | "7d" | "30d" | "custom">("7d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [isFiltering, setIsFiltering] = useState(false);
  const [customFunnelValue, setCustomFunnelValue] = useState(0);
  const [customFunnelLabel, setCustomFunnelLabel] = useState("Vendas / Contratos");

  const handleDateFilter = (filter: "today" | "7d" | "30d" | "custom") => {
    setIsFiltering(true);
    setDateFilter(filter);
    setTimeout(() => setIsFiltering(false), 200);
  };

  // Leads pagination
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsFilterSource, setLeadsFilterSource] = useState("");
  const [leadsFilterCourse, setLeadsFilterCourse] = useState("");

  useEffect(() => {
    fetchReport();
  }, [token]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/report/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao carregar relatório");
      }
      const result = await res.json();
      setData(result);
      document.title = `Dashboard | ${result.client.nome_cliente}`;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!data) return null;

    let start: Date | null = null;
    let end: Date = endOfDay(new Date());

    if (dateFilter === "today") {
      start = startOfDay(new Date());
      end = endOfDay(new Date());
    } else if (dateFilter === "7d") start = startOfDay(subDays(new Date(), 7));
    else if (dateFilter === "30d") start = startOfDay(subDays(new Date(), 30));
    else if (dateFilter === "custom" && dateRange?.from) {
      start = startOfDay(dateRange.from);
      if (dateRange.to) end = endOfDay(dateRange.to);
      else end = endOfDay(dateRange.from);
    }

    const filterFn = (item: { data: string }) => {
      if (!start) return true;
      try {
        const itemDate = parseISO(item.data.split("/").reverse().join("-")); // DD/MM/YYYY to YYYY-MM-DD
        return isWithinInterval(itemDate, { start, end });
      } catch {
        return true;
      }
    };

    const metrics = data.metrics.filter(filterFn);
    const leads = data.leads.filter(filterFn);

    return { ...data, metrics, leads };
  }, [data, dateFilter, dateRange]);

  const kpis = useMemo(() => {
    if (!filteredData) return null;
    const m = filteredData.metrics;
    const totalInvestimento = m.reduce((acc, curr) => acc + curr.investimento, 0);
    const totalConversas = m.reduce((acc, curr) => acc + curr.conversas, 0);
    const totalLeads = m.reduce((acc, curr) => acc + curr.leads_clique_saida, 0);
    const totalImpressoes = m.reduce((acc, curr) => acc + curr.impressoes, 0);
    const totalCliques = m.reduce((acc, curr) => acc + curr.cliques, 0);
    const totalAlcance = m.reduce((acc, curr) => acc + curr.alcance, 0);
    const avgCtr = totalImpressoes > 0 ? (totalCliques / totalImpressoes) * 100 : 0;
    const avgCpm = totalImpressoes > 0 ? (totalInvestimento / totalImpressoes) * 1000 : 0;
    const custoPorResultado = filteredData.client.tipo_funil === "whatsapp"
      ? (totalConversas > 0 ? totalInvestimento / totalConversas : 0)
      : (totalLeads > 0 ? totalInvestimento / totalLeads : 0);

    return {
      investimento: totalInvestimento,
      conversas: totalConversas,
      leads: totalLeads,
      impressoes: totalImpressoes,
      cliques: totalCliques,
      alcance: totalAlcance,
      ctr: avgCtr,
      cpm: avgCpm,
      custoPorResultado
    };
  }, [filteredData]);

  const chartData = useMemo(() => {
    if (!filteredData) return [];
    // Group by date
    const grouped: Record<string, any> = {};
    filteredData.metrics.forEach(m => {
      if (!grouped[m.data]) {
        grouped[m.data] = { data: m.data, conversas: 0, leads: 0, alcance: 0, investimento: 0 };
      }
      grouped[m.data].conversas += m.conversas;
      grouped[m.data].leads += m.leads_clique_saida;
      grouped[m.data].alcance += m.alcance;
      grouped[m.data].investimento += m.investimento;
    });
    return Object.values(grouped).sort((a, b) => {
      const da = String(a.data).split("/").reverse().join("");
      const db = String(b.data).split("/").reverse().join("");
      return da.localeCompare(db);
    });
  }, [filteredData]);

  const filteredLeads = useMemo(() => {
    if (!filteredData) return [];
    return filteredData.leads.filter(l => {
      const sourceMatch = !leadsFilterSource || l.utm_source.toLowerCase().includes(leadsFilterSource.toLowerCase());
      const courseMatch = !leadsFilterCourse || l.curso_interesse.toLowerCase().includes(leadsFilterCourse.toLowerCase());
      return sourceMatch && courseMatch;
    });
  }, [filteredData, leadsFilterSource, leadsFilterCourse]);

  const paginatedLeads = useMemo(() => {
    const start = (leadsPage - 1) * 20;
    return filteredLeads.slice(start, start + 20);
  }, [filteredLeads, leadsPage]);

  if (loading) return <SplashScreen message="Gerando seu relatório..." />;

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <Filter className="text-red-500" size={40} />
      </div>
      <h1 className="text-3xl font-bold mb-2">Relatório não disponível</h1>
      <p className="text-zinc-500 max-w-md">{error}</p>
      <Button className="mt-8" variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button>
    </div>
  );

  if (!filteredData || !kpis) return null;

  const isWA = filteredData.client.tipo_funil === "whatsapp";
  const accentColor = isWA ? "#25d366" : "#4f8ef7";
  const accentGradient = isWA ? "from-[#25d366] to-[#128c7e]" : "from-[#4f8ef7] to-[#1e40af]";

  // Taxa de conversão: Conv./Leads → Input do cliente
  const convBase = isWA ? kpis.conversas : kpis.leads;
  const convRate = convBase > 0 && customFunnelValue > 0
    ? Math.min(100, (customFunnelValue / convBase) * 100)
    : 0;

  return (
    <div className="min-h-screen pb-20 transition-colors duration-300" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b px-4 py-4 transition-colors duration-300" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 rounded-full" style={{ background: accentColor }} />
              <div>
                <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--ink)", letterSpacing: "-0.025em", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {filteredData.client.nome_cliente}
                </h1>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: "var(--muted)", textTransform: "uppercase", fontWeight: 400 }}>
                  Relatório de Performance
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {(["today", "7d", "30d"] as const).map((f) => (
              <button
                key={f}
                onClick={() => handleDateFilter(f)}
                className="transition-all duration-200 flex-shrink-0 btn-period"
                style={{
                  border: dateFilter === f ? "none" : "1px solid var(--border)",
                  background: dateFilter === f ? accentColor : "var(--surface-2)",
                  color: dateFilter === f ? "#0c0f0a" : "var(--muted)",
                  fontWeight: dateFilter === f ? 700 : 500,
                }}
              >
                {f === "today" ? "Hoje" : f === "7d" ? "7 Dias" : "30 Dias"}
              </button>
            ))}
            <CalendarRange
              date={dateRange}
              onDateChange={(range) => {
                setIsFiltering(true);
                setDateRange(range);
                if (range?.from) setDateFilter("custom");
                setTimeout(() => setIsFiltering(false), 200);
              }}
            />

          </div>
        </div>
      </header>

      <div className="w-full h-px" style={{ background: "var(--border)", marginBottom: 32 }} />

      <main className={cn("max-w-7xl mx-auto px-4 md:px-10 space-y-8 kpi-fade", isFiltering && "loading")}>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KpiCard label="Investimento" numericValue={kpis.investimento} accentColor="var(--red)" delay={0} formatAs="currency" />
          <KpiCard label={isWA ? "Conversas" : "Leads"} numericValue={isWA ? kpis.conversas : kpis.leads} accentColor={accentColor} delay={60} formatAs="number" />
          <KpiCard label={`Custo/${isWA ? "Conv." : "Lead"}`} numericValue={kpis.custoPorResultado} accentColor="var(--orange)" delay={120} formatAs="currency" />
          <KpiCard label="CTR Médio" numericValue={kpis.ctr} accentColor="var(--purple)" delay={180} formatAs="percent" />
          <KpiCard label="CPM Médio" numericValue={kpis.cpm} accentColor="var(--gray)" delay={240} formatAs="currency" colSpan2 />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Funnel Section */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-full flex flex-col">
              <div className="ds-eyebrow mb-6">
                <h2>FUNIL DE TRÁFEGO</h2>
              </div>

              <FunnelChart
                isWA={isWA}
                steps={[
                  { label: "Impressões", value: kpis.impressoes },
                  { label: "Alcance", value: kpis.alcance },
                  { label: "Cliques", value: kpis.cliques },
                  { label: isWA ? "Conversas Iniciadas" : "Leads Captados", value: isWA ? kpis.conversas : kpis.leads },
                ]}
                customStep={{
                  label: customFunnelLabel,
                  value: customFunnelValue,
                  onChange: setCustomFunnelValue,
                }}
              />

              <div className="mt-8 pt-6 border-t border-zinc-800">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-500">{isWA ? "Conv." : "Leads"} → {customFunnelLabel}</span>
                  <span className="font-bold" style={{ color: convRate > 0 ? "var(--accent)" : "var(--muted)" }}>
                    {convRate.toFixed(2)}%
                  </span>
                </div>
                <div style={{
                  position: "relative",
                  height: "8px",
                  width: "100%",
                  borderRadius: "4px",
                  backgroundColor: "#232b1e",
                  marginTop: "8px",
                  overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "8px",
                    width: `${convRate}%`,
                    backgroundColor: "#7cbd3a",
                    borderRadius: "4px",
                    transition: "width 600ms cubic-bezier(0.16,1,0.3,1)",
                  }} />
                </div>
              </div>
            </Card>
          </div>

          {/* Main Chart Section */}
          <div className="lg:col-span-3">
            <Card className="p-6 h-full">
              <div className="ds-eyebrow mb-6">
                <h2>EVOLUÇÃO DIÁRIA</h2>
              </div>
              <AreaChartInteractive
                data={chartData}
                isWA={isWA}
                accentColor={accentColor}
              />
            </Card>
          </div>
        </div>

        {/* Hierarchical Metrics Table */}
        <HierarchicalTable metrics={filteredData.metrics} isWA={isWA} />

        {/* Ad Gallery */}
        <AdGallery metrics={filteredData.metrics} isWA={isWA} />

        {/* Leads Section (Only for Leads funnel) */}
        {!isWA && (
          <div className="space-y-6 animate-fade-up" style={{ animationDelay: "420ms" }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="ds-eyebrow">
                <h2>LEADS CAPTADOS</h2>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Filtrar por UTM Source"
                  className="w-48 h-9 text-xs"
                  value={leadsFilterSource}
                  onChange={e => setLeadsFilterSource(e.target.value)}
                />
                <Input
                  placeholder="Filtrar por Curso"
                  className="w-48 h-9 text-xs"
                  value={leadsFilterCourse}
                  onChange={e => setLeadsFilterCourse(e.target.value)}
                />
              </div>
            </div>

            <Card className="overflow-hidden border-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead style={{ background: "var(--surface-2)", color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    <tr>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4">Nome</th>
                      <th className="px-6 py-4">Contato</th>
                      <th className="px-6 py-4">Curso</th>
                      <th className="px-6 py-4 text-right">Origem (UTM)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginatedLeads.map((l, i) => (
                      <tr key={`lead-row-${i}`} className="ds-table-row border-b" style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", height: 48 }}>
                        <td className="px-6 py-4" style={{ color: "var(--muted)" }}>{l.data}</td>
                        <td className="px-6 py-4 font-bold" style={{ color: "var(--ink)" }}>{l.nome}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <a href={`mailto:${l.email}`} className="flex items-center gap-1 text-blue-400 hover:underline text-xs">
                              <Mail size={10} /> {l.email}
                            </a>
                            <a href={`tel:${l.telefone}`} className="flex items-center gap-1 text-green-400 hover:underline text-xs">
                              <Phone size={10} /> {l.telefone}
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="default">{l.curso_interesse}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{l.utm_source}</span>
                            <span className="text-[10px] text-zinc-600">{l.utm_campaign}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/20">
                <p className="text-xs text-zinc-500">
                  Mostrando {paginatedLeads.length} de {filteredLeads.length} leads
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={leadsPage === 1}
                    onClick={() => setLeadsPage(p => p - 1)}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="text-xs font-bold px-2">{leadsPage}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={leadsPage * 20 >= filteredLeads.length}
                    onClick={() => setLeadsPage(p => p + 1)}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
