import React, { useEffect, useState } from "react";

export interface FunnelStep {
    label: string;
    value: number;
}

export interface FunnelCustomStep {
    label: string;         // nome da métrica (ex: "Vendas", "Contratos")
    value: number;
    onChange: (v: number) => void;
}

interface FunnelChartProps {
    steps: FunnelStep[];
    isWA?: boolean;
    customStep?: FunnelCustomStep; // 6ª etapa editável pelo cliente
}

function formatValue(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)} mil`;
    return n.toLocaleString("pt-BR");
}

const WA_COLORS = ["#1a7a3a", "#1e8c41", "#22a04b", "#25b554", "#25d366", "#1ab35a"];
const LEAD_COLORS = ["#1a3a7a", "#1e418c", "#224ba0", "#2554b5", "#256dd3", "#1a58b8"];

const WIDTHS = ["100%", "88%", "74%", "60%", "46%", "34%"];

export function FunnelChart({ steps, isWA = true, customStep }: FunnelChartProps) {
    const allSteps = customStep
        ? [...steps, { label: customStep.label, value: customStep.value }]
        : steps;

    const [visible, setVisible] = useState<boolean[]>(allSteps.map(() => false));
    const colors = isWA ? WA_COLORS : LEAD_COLORS;

    useEffect(() => {
        allSteps.forEach((_, i) => {
            setTimeout(() => {
                setVisible((prev) => {
                    const next = [...prev];
                    next[i] = true;
                    return next;
                });
            }, i * 80);
        });
    }, [allSteps.length]);

    return (
        <div className="w-full flex flex-col items-center gap-1.5">
            <p className="self-start text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Funil
            </p>

            {allSteps.map((step, i) => {
                const isCustom = customStep && i === allSteps.length - 1;
                return (
                    <div
                        key={step.label}
                        className="mx-auto transition-all duration-150 cursor-default"
                        style={{
                            width: WIDTHS[Math.min(i, WIDTHS.length - 1)],
                            opacity: visible[i] ? 1 : 0,
                            transform: visible[i] ? "translateY(0)" : "translateY(10px)",
                            transition: `opacity 300ms ease ${i * 80}ms, transform 300ms ease ${i * 80}ms`,
                        }}
                        onMouseEnter={(e) => {
                            if (!isCustom) (e.currentTarget as HTMLDivElement).style.transform = "scaleX(1.02)";
                        }}
                        onMouseLeave={(e) => {
                            if (!isCustom) (e.currentTarget as HTMLDivElement).style.transform = "scaleX(1)";
                        }}
                    >
                        <div
                            className="w-full rounded-lg px-4 py-3 flex flex-col items-center gap-0.5 shadow-lg text-center"
                            style={{ backgroundColor: colors[Math.min(i, colors.length - 1)] }}
                        >
                            <span className="text-[10px] font-semibold text-[var(--background)] opacity-70 uppercase tracking-wide">
                                {`0${i + 1} · ${step.label}`}
                            </span>

                            {isCustom ? (
                                /* Input editável pelo cliente */
                                <div className="flex items-center justify-center gap-1 mt-0.5">
                                    <input
                                        type="number"
                                        min={0}
                                        value={customStep!.value || ""}
                                        onChange={e => customStep!.onChange(Number(e.target.value))}
                                        placeholder="0"
                                        onClick={e => e.stopPropagation()}
                                        className="w-20 text-lg font-bold bg-transparent border-0 border-b-2 focus:outline-none"
                                        style={{
                                            color: "var(--background)",
                                            borderColor: "rgba(255,255,255,0.5)",
                                            caretColor: "white",
                                            textAlign: "center",
                                            appearance: "none",
                                            MozAppearance: "textfield",
                                            WebkitAppearance: "none",
                                        }}
                                    />
                                    <span className="relative flex h-2 w-2 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--background)] opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--background)]" />
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-lg font-bold text-[var(--background)]">
                                        {formatValue(step.value)}
                                    </span>
                                    {i === allSteps.length - 1 && !customStep && (
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--background)] opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--background)]" />
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
