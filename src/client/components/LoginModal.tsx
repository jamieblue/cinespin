/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import { GoogleLogin } from "./GoogleLogin";

type Props = {
    onClose: () => void;
}


export function LoginModal({ onClose }: Props)
{
    return (
        <div className="modal slide-in">
            <div className="modal-title">
                <div>Log in</div>
                <span className="close-button" onClick={onClose}>
                    &times;
                </span>
            </div>
            <div className="modal-content">
                <div className="google-login">
                    <GoogleLogin />
                </div>
            </div>
        </div>
    );
}