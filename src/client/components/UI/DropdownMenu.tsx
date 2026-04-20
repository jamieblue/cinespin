/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { set } from 'lodash';
import { useEffect, useRef, useState } from 'preact/hooks';

export function DropdownMenu({ items, onItemClick, show, onClose }: { items: any[], onItemClick: (item: any) => void; show: boolean; onClose: () => void })
{
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        const handleClickOutside = (event: MouseEvent) =>
        {
            if (menuRef.current && !menuRef.current.contains(event.target as Node))
            {
                onClose();
            }
        };
        if (show)
        {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div ref={menuRef} className="dropdown">
            <ul className="dropdown-menu">
                {items.map((item, index) => (
                    <li
                        key={index}
                        className="dropdown-item"
                        onClick={() =>
                        {
                            onItemClick(item);
                            onClose();
                        }}
                    >
                        {item.displayName}
                    </li>
                ))}
            </ul>
        </div>
    );
}