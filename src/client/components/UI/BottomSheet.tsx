/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks';

interface BottomSheetProps
{
    open: boolean;
    onClose: () => void;
    children: preact.ComponentChildren;
    height?: string;
}

export function BottomSheet({ open, onClose, children, height = '55%' }: BottomSheetProps)
{
    const panelRef = useRef<HTMLDivElement | null>(null);

    // Escape key
    useEffect(() =>
    {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // Reset inline styles each time it (re)opens
    useEffect(() =>
    {
        if (open && panelRef.current)
        {
            const el = panelRef.current;
            el.classList.remove('dragging');
            el.style.removeProperty('--sheet-y');
            el.style.removeProperty('transform');
            el.style.removeProperty('opacity');
        }
    }, [open]);

    // Drag-to-close using --sheet-y
    useEffect(() =>
    {
        if (!open || !panelRef.current) return;
        const el = panelRef.current;

        let startY = 0;
        let moved = 0;
        let dragging = false;
        const THRESHOLD = 120;

        // Helper: only allow drag if starting on grabber OR panel is scrolled to top
        const canStartDrag = (ev: PointerEvent) =>
        {
            const target = ev.target as HTMLElement;
            if (target.closest('.bottom-sheet-grabber')) return true;
            // Prevent drag if user is scrolling content (allow natural scroll)
            const body = el.querySelector('.bottom-sheet-body') as HTMLElement | null;
            if (body && body.scrollTop === 0 && ev.clientY > (window.innerHeight - el.offsetHeight - 40))
            {
                return true;
            }
            return false;
        };

        const start = (e: PointerEvent) =>
        {
            if (e.button !== 0) return;
            if (!canStartDrag(e)) return;
            dragging = true;
            startY = e.clientY;
            moved = 0;
            el.classList.add('dragging');
            // Ensure any previous inline transform (from old code) is gone
            el.style.removeProperty('transform');
            el.style.removeProperty('opacity');
        };

        const move = (e: PointerEvent) =>
        {
            if (!dragging) return;
            moved = Math.max(0, e.clientY - startY);
            // Update CSS var with pixel distance
            el.style.setProperty('--sheet-y', moved + 'px');
        };

        const end = () =>
        {
            if (!dragging) return;
            el.classList.remove('dragging');
            if (moved > THRESHOLD)
            {
                // Close; after closing allow CSS to reset var (remove pixel value)
                onClose();
                // Remove inline var after animation (delay ~frame or use timeout)
                setTimeout(() =>
                {
                    if (el) el.style.removeProperty('--sheet-y');
                }, 300);
            } else
            {
                // Snap back: animate to zero
                el.style.setProperty('--sheet-y', '0px');
                // After a frame, remove inline so class-open rule controls it
                requestAnimationFrame(() =>
                {
                    requestAnimationFrame(() =>
                    {
                        el.style.removeProperty('--sheet-y');
                    });
                });
            }
            dragging = false;
        };

        el.addEventListener('pointerdown', start);
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', end);
        window.addEventListener('pointercancel', end);

        return () =>
        {
            el.removeEventListener('pointerdown', start);
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', end);
            window.removeEventListener('pointercancel', end);
        };
    }, [open, onClose]);

    return (
        <div class={`bottom-sheet-root ${ open ? 'open' : '' }`}>
            <div class="bottom-sheet-backdrop" onClick={onClose} />
            <div
                ref={panelRef}
                class="bottom-sheet-panel"
                style={{ '--sheet-height': height } as any}
            >
                <div class="bottom-sheet-grabber" />
                <div class="bottom-sheet-body">
                    {children}
                </div>
            </div>
        </div>
    );
}