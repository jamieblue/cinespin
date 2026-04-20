import { useRef, useState, useCallback } from 'preact/hooks';

interface Options
{
    delay?: number;        // ms to trigger
    moveTolerance?: number;// px movement allowed
    onCancel?: () => void;
}

export function useLongPress(onLongPress: () => void, options: Options = {})
{
    const { delay = 450, moveTolerance = 8, onCancel } = options;
    const timer = useRef<number | null>(null);
    const startPoint = useRef<{ x: number; y: number } | null>(null);
    const [active, setActive] = useState(false);

    const clear = useCallback((invokeCancel = true) =>
    {
        if (timer.current)
        {
            clearTimeout(timer.current);
            timer.current = null;
            if (invokeCancel && active) onCancel?.();
        }
        setActive(false);
    }, [active, onCancel]);

    const onPointerDown = useCallback((e: PointerEvent) =>
    {
        if (e.button !== 0) return;
        startPoint.current = { x: e.clientX, y: e.clientY };
        timer.current = window.setTimeout(() =>
        {
            onLongPress();
            setActive(true);
            timer.current = null;
        }, delay);
    }, [delay, onLongPress]);

    const onPointerMove = useCallback((e: PointerEvent) =>
    {
        if (!startPoint.current || timer.current === null) return;
        const dx = Math.abs(e.clientX - startPoint.current.x);
        const dy = Math.abs(e.clientY - startPoint.current.y);
        if (dx > moveTolerance || dy > moveTolerance)
        {
            clear(); // movement cancels
        }
    }, [moveTolerance, clear]);

    const onPointerUp = useCallback(() => clear(false), [clear]);
    const onPointerLeave = useCallback(() => clear(), [clear]);

    const onContextMenu = useCallback((e: Event) =>
    {
        if (active) e.preventDefault(); // suppress system menu after long press
    }, [active]);

    return {
        active,
        handlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerLeave,
            onContextMenu
        }
    };
}