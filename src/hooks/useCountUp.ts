import { useEffect, useRef, useState } from "react";

/**
 * useCountUp — anima um número de 0 até `target` em `duration`ms.
 * Retorna o valor atual formatado via `format` (opcional).
 */
export function useCountUp(
    target: number,
    duration = 800,
    deps: any[] = []
): number {
    const [value, setValue] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        setValue(0);
        const start = performance.now();

        const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out quart
            const eased = 1 - Math.pow(1 - progress, 4);
            setValue(target * eased);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                setValue(target);
            }
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, duration, ...deps]);

    return value;
}
