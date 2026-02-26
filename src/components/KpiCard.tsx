import React from "react";
import { AspectRatio } from "./ui/aspect-ratio";
import { useCountUp } from "../hooks/useCountUp";

interface KpiCardProps {
    label: string;
    /** Valor numérico puro (sem formatação) */
    numericValue: number;
    /** Texto formatado completo (ex: "R$ 1.234,56" ou "40,79%") */
    displayValue?: string;
    accentColor: string;
    delay?: number;
    /** Se true, aplica count-up no número inteiro; se false, usa displayValue diretamente */
    isInteger?: boolean;
    /** Props extras de formatação quando isInteger=false */
    formatAs?: "currency" | "percent" | "number";
    colSpan2?: boolean;
}

function useBRFormat(n: number, formatAs: "currency" | "percent" | "number"): string {
    if (formatAs === "currency")
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
    if (formatAs === "percent") return `${n.toFixed(2)}%`;
    return Math.round(n).toLocaleString("pt-BR");
}

export function KpiCard({
    label,
    numericValue,
    accentColor,
    delay = 0,
    formatAs = "number",
    colSpan2 = false,
}: KpiCardProps) {
    const animated = useCountUp(numericValue, 800);
    const displayed = useBRFormat(animated, formatAs);

    return (
        <AspectRatio
            ratio={16 / 9}
            className={colSpan2 ? "rounded-xl col-span-2 md:col-span-1" : "rounded-xl"}
        >
            <div
                className="absolute inset-0 rounded-[14px] p-4 flex flex-col justify-between overflow-hidden ds-card-hover animate-fade-up"
                style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderTop: `2px solid ${accentColor}`,
                    animationDelay: `${delay}ms`,
                }}
            >
                {/* Label JetBrains Mono */}
                <p
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        letterSpacing: "0.12em",
                        color: "var(--ink)",
                        opacity: 0.7,
                        textTransform: "uppercase",
                        fontWeight: 400,
                    }}
                >
                    {label}
                </p>

                {/* Valor com count-up */}
                <h3
                    className="font-bold tabular-nums"
                    style={{
                        fontSize: 18,
                        letterSpacing: "-0.025em",
                        color: "var(--ink)",
                    }}
                >
                    {displayed}
                </h3>

                {/* Barra de acento */}
                <div
                    className="h-0.5 w-full rounded-full overflow-hidden"
                    style={{ background: `${accentColor}20` }}
                >
                    <div
                        className="h-full w-2/3 rounded-full"
                        style={{ background: accentColor }}
                    />
                </div>
            </div>
        </AspectRatio>
    );
}
