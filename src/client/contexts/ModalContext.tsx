/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { createContext, JSX } from "preact";
import { useState, useContext, useRef } from "preact/hooks"
import { scrollLock } from "../../shared/util/scrollLock";
import { ModalSize } from "../../shared/models/modals/ModalSize";

interface ModalContextType
{
    showModal: (content: JSX.Element, title: string, size?: ModalSize, front?: boolean, onClose?: () => void) => void;
    hideModal: () => void;
    isVisible: boolean;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: any })
{
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [modalContent, setModalContent] = useState<JSX.Element | null>(null);
    const [title, setTitle] = useState<string>("");
    const [modalSize, setModalSize] = useState<ModalSize>(ModalSize.Small);
    const [modalFront, setModalFront] = useState<boolean>(false);

    const modalOnCloseRef = useRef<(() => void) | null>(null);

    const showModal = (content: JSX.Element, title: string, size?: ModalSize, front?: boolean, onClose?: () => void) =>
    {
        scrollLock.enable();
        setModalContent(content);
        setTitle(title);
        if (size) setModalSize(size);
        if (front) setModalFront(front);
        modalOnCloseRef.current = onClose ?? null;
        setIsVisible(true);
        setIsClosing(false);
    };

    const hideModal = () =>
    {
        setIsClosing(true);

        const callback = modalOnCloseRef.current;
        setTimeout(() =>
        {
            if (callback)
            {
                try { callback(); } catch (e) { console.error('modal onClose threw', e); }
            }

            setIsVisible(false);
            setModalContent(null);
            setModalSize(null);
            modalOnCloseRef.current = null;
            setIsClosing(false);
            scrollLock.disable();
        }, 250);
    };

    const handleBackgroundClick = (e: MouseEvent) =>
    {
        if (e.target === e.currentTarget) hideModal();
    };

    return (
        <ModalContext.Provider value={{ showModal, hideModal, isVisible }}>
            {children}
            {isVisible && modalContent && (
                <div
                    id="modalContainer"
                    className={`${ isClosing ? 'fade-out' : 'fade-in' } ${ modalFront ? 'front' : '' }`}
                    onClick={handleBackgroundClick}
                >
                    <div
                        className={`modal ${ isClosing ? 'slide-out' : 'slide-in' } ${ modalSize === ModalSize.Large
                            ? 'large'
                            : modalSize === ModalSize.Medium
                                ? 'medium'
                                : 'small'
                            }`}
                    >
                        <div className="modal-title">
                            <div>{title}</div>
                            <span className="close-button" onClick={hideModal}>
                                &times;
                            </span>
                        </div>
                        <div className="modal-content">{modalContent}</div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
}


export function useModal()
{
    const context = useContext(ModalContext);
    if (!context)
    {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}