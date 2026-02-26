import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
    const { toggleTheme, isDark } = useTheme();

    return (
        <div
            onClick={toggleTheme}
            className="flex items-center cursor-pointer relative"
            style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "24px",
                padding: "3px",
                width: "fit-content",
            }}
        >
            {/* Active Indicator Background */}
            <div
                className="absolute transition-all duration-150 ease-out"
                style={{
                    top: "3px",
                    bottom: "3px",
                    width: "calc(50% - 3px)",
                    left: isDark ? "3px" : "50%",
                    background: isDark ? "#232b1e" : "#dde8d0",
                    borderRadius: "20px",
                    zIndex: 0,
                }}
            />

            {/* Dark Option */}
            <div
                className="flex items-center gap-1.5 z-10 transition-colors duration-150"
                style={{
                    padding: "6px 14px",
                    color: isDark ? "var(--ink)" : "var(--muted)",
                }}
            >
                <Moon size={14} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Dark</span>
            </div>

            {/* Light Option */}
            <div
                className="flex items-center gap-1.5 z-10 transition-colors duration-150"
                style={{
                    padding: "6px 14px",
                    color: !isDark ? "#1e2a18" : "var(--muted)",
                }}
            >
                <Sun size={14} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Light</span>
            </div>
        </div>
    );
}
