import React from 'react'
import { useSignIn, useSignUp } from '@clerk/clerk-react'

export function AuthScreen() {
const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn()
const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()

const [pendingVerification, setPendingVerification] = React.useState(false)
const [code, setCode] = React.useState('')
const [isSignUp, setIsSignUp] = React.useState(false)
const [fullName, setFullName] = React.useState('')
const [email, setEmail] = React.useState('')
const [password, setPassword] = React.useState('')
const [isLoading, setIsLoading] = React.useState(false)
const [error, setError] = React.useState('')
const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768)
const [mobileMode, setMobileMode] = React.useState<'choice' | 'login' | 'register'>('choice')

React.useEffect(() => {
    const handleResize = () => {
    setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
}, [])

const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignUpLoaded) return
    setError('')
    setIsLoading(true)

    try {
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || undefined

      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      })

      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId })
      } else {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setPendingVerification(true)
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Došlo k chybě při registraci.')
    } finally {
    setIsLoading(false)
    }
}

const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignUpLoaded) return
    setError('')
    setIsLoading(true)

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code })
      if (completeSignUp.status === 'complete') {
        await setSignUpActive({ session: completeSignUp.createdSessionId })
      } else {
        setError('Nepodařilo se ověřit účet. Zkuste to prosím znovu.')
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Neplatný ověřovací kód.')
    } finally {
      setIsLoading(false)
    }
}

const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignInLoaded) return
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId })
      } else {
        setError('Další kroky k přihlášení nejsou aktuálně podporovány.')
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Nesprávné přihlašovací údaje.')
    } finally {
    setIsLoading(false)
    }
}

return (
    <>
    {isMobile ? (
        // MOBILE VERSION
        <div className="auth-mobile-container">
        {mobileMode === 'choice' ? (
            <div className="auth-choice-screen">
            <div className="auth-choice-content">
                <h1>Vítej!</h1>
                <p>Co chceš udělat?</p>
                <button className="auth-choice-btn auth-choice-btn-login" onClick={() => setMobileMode('login')}>
                Přihlásit se
                </button>
                <button className="auth-choice-btn auth-choice-btn-register" onClick={() => setMobileMode('register')}>
                Registrace
                </button>
            </div>
            </div>
        ) : mobileMode === 'login' ? (
            <div className="auth-form-screen">
            <button className="auth-back-btn" onClick={() => { setMobileMode('choice'); setError(''); }}>← Zpět</button>
            <form onSubmit={handleSignInSubmit}>
                <h1>Přihlášení</h1>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                <input type="password" placeholder="Heslo" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                {error && <span className="auth-error">{error}</span>}
                <button type="submit">{isLoading ? 'Čekám...' : 'Přihlásit se'}</button>
            </form>
            </div>
        ) : (
            <div className="auth-form-screen">
            <button className="auth-back-btn" onClick={() => { pendingVerification ? setPendingVerification(false) : setMobileMode('choice'); setError(''); }}>← Zpět</button>
            {pendingVerification ? (
                <form onSubmit={handleVerificationSubmit}>
                    <h1>Ověření</h1>
                    <span>Zadej kód zaslaný na email</span>
                    <input type="text" placeholder="Ověřovací kód" value={code} onChange={(e) => setCode(e.target.value)} required disabled={isLoading} />
                    {error && <span className="auth-error">{error}</span>}
                    <button type="submit">{isLoading ? 'Čekám...' : 'Ověřit'}</button>
                </form>
            ) : (
                <form onSubmit={handleSignUpSubmit}>
                    <h1>Registrace</h1>
                    <input type="text" placeholder="Jméno a příjmení" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isLoading} />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                    <input type="password" placeholder="Heslo" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                    {error && <span className="auth-error">{error}</span>}
                    <button type="submit">{isLoading ? 'Čekám...' : 'Zaregistrovat se'}</button>
                </form>
            )}
            </div>
        )}
        </div>
    ) : (
        // DESKTOP VERSION
        <div className={`auth-main-container ${isSignUp ? 'sign-up-mode' : ''}`}>
        <div className="auth-form-container auth-sign-up-container">
        {pendingVerification ? (
            <form onSubmit={handleVerificationSubmit}>
                <h1>Ověření</h1>
                <span>Zadej kód zaslaný na email</span>
                <input type="text" placeholder="Ověřovací kód" value={code} onChange={(e) => setCode(e.target.value)} required disabled={isLoading} />
                {error && isSignUp && <span className="auth-error">{error}</span>}
                <button type="submit">{isLoading ? 'Čekám...' : 'Ověřit'}</button>
            </form>
        ) : (
            <form onSubmit={handleSignUpSubmit}>
                <h1>Registrace</h1>
                <input type="text" placeholder="Jméno a příjmení" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isLoading} />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                <input type="password" placeholder="Heslo" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                {error && isSignUp && <span className="auth-error">{error}</span>}
                <button type="submit">{isLoading ? 'Čekám...' : 'Zaregistrovat se'}</button>
            </form>
        )}
        </div>

        <div className="auth-form-container auth-sign-in-container">
        <form onSubmit={handleSignInSubmit}>
            <h1>Přihlášení</h1>
            <span>vyplň své údaje</span>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            <input type="password" placeholder="Heslo" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
            {error && !isSignUp && <span className="auth-error">{error}</span>}
            <button>{isLoading ? 'Čekám...' : 'Přihlásit se'}</button>
        </form>
        </div>

        <div className="auth-overlay-container">
        <div className="auth-overlay">
            <div className="auth-overlay-panel auth-overlay-left">
            <h1>Ahoj!</h1>
            <p>Pokud už máš účet, přihlaš se</p>
            <button className="auth-ghost" onClick={() => setIsSignUp(false)} type="button">Přihlášení</button>
            </div>
            <div className="auth-overlay-panel auth-overlay-right">
            <h1>Vítej!</h1>
            <p>Zadej své údaje a začni s námi svou cestu</p>
            <button className="auth-ghost" onClick={() => setIsSignUp(true)} type="button">Registrace</button>
            </div>
        </div>
        </div>
    </div>
    )}

    <style>{`
        @import url('https://fonts.googleapis.com/css?family=Montserrat:400,800');

        * {
        box-sizing: border-box;
        }

        html, body, #root {
        background: #161e2f;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        font-family: 'Montserrat', sans-serif;
        height: 100%;
        margin: 0;
        padding: 0;
        }

        .auth-main-container {
        background-color: #fffdf6;
        border-radius: 10px;
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
        position: relative;
        overflow: hidden;
        width: 768px;
        max-width: 100%;
        min-height: 480px;
        }

        .auth-form-container {
        position: absolute;
        top: 0;
        height: 100%;
        transition: all 0.6s ease-in-out;
        }

        .auth-sign-in-container {
        left: 0;
        width: 50%;
        z-index: 2;
        }

        .auth-main-container.sign-up-mode .auth-sign-in-container {
        transform: translateX(100%);
        }

        .auth-sign-up-container {
        left: 0;
        width: 50%;
        opacity: 0;
        z-index: 1;
        }

        .auth-main-container.sign-up-mode .auth-sign-up-container {
        transform: translateX(100%);
        opacity: 1;
        z-index: 5;
        animation: show 0.6s;
        }

        @keyframes show {
        0%, 49.99% {
            opacity: 0;
            z-index: 1;
        }
        50%, 100% {
            opacity: 1;
            z-index: 5;
        }
        }

        .auth-overlay-container {
        position: absolute;
        top: 0;
        left: 50%;
        width: 50%;
        height: 100%;
        overflow: hidden;
        transition: transform 0.6s ease-in-out;
        z-index: 100;
        }

        .auth-main-container.sign-up-mode .auth-overlay-container {
        transform: translateX(-100%);
        }

        .auth-overlay {
        background: #000000;
        background: -webkit-linear-gradient(to right, #242f49, #161e2f);
        background: linear-gradient(to right, #242f49, #161e2f);
        color: #fffdf6;
        position: relative;
        left: -100%;
        height: 100%;
        width: 200%;
        transform: translateX(0);
        transition: transform 0.6s ease-in-out;
        display: flex;
        }

        .auth-main-container.sign-up-mode .auth-overlay {
        transform: translateX(50%);
        }

        .auth-overlay-panel {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 0 40px;
        text-align: center;
        top: 0;
        height: 100%;
        width: 50%;
        transform: translateX(0);
        transition: transform 0.6s ease-in-out;
        }

        .auth-overlay-left {
        transform: translateX(-20%);
        }

        .auth-main-container.sign-up-mode .auth-overlay-left {
        transform: translateX(0);
        }

        .auth-overlay-right {
        right: 0;
        transform: translateX(0);
        }

        .auth-main-container.sign-up-mode .auth-overlay-right {
        transform: translateX(20%);
        }

        .auth-overlay-panel h1 {
        font-weight: bold;
        margin: 0;
        font-size: 32px;
        }

        .auth-overlay-panel p {
        font-size: 14px;
        font-weight: 100;
        line-height: 20px;
        letter-spacing: 0.5px;
        margin: 20px 0 30px;
        }

        form {
        background-color: #fffdf6;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 0 50px;
        height: 100%;
        text-align: center;
        width: 100%;
        font-family: inherit;
        }

        form h1 {
        font-weight: bold;
        margin: 0;
        font-size: 32px;
        color: #242f49;
        }

        form span {
        font-size: 12px;
        color: #6b7684;
        margin-bottom: 20px;
        }

        form input {
        background-color: #eee;
        border: none;
        padding: 12px 15px;
        margin: 8px 0;
        width: 100%;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
        box-sizing: border-box;
        transition: background 0.2s;
        }

        form input:focus {
        outline: none;
        background: #ddd;
        }

        form input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        }

        form button {
        border-radius: 20px;
        border: 3px solid #161e2f;
        background-color: #242f49;
        color: #fffdf6;
        font-size: 12px;
        font-weight: bold;
        padding: 12px 45px;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        margin-top: 10px;
        transition: transform 80ms ease-in, box-shadow 0.3s;
        font-family: inherit;
        }

        form button:active {
        transform: scale(0.95);
        }

        form button:focus {
        outline: none;
        }

        form button:hover:not(:disabled) {
        box-shadow: 0 5px 15px rgba(73, 80, 215, 0.4);
        }

        form button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        }

        .auth-ghost {
        background-color: transparent;
        border-color: #fffdf6;
        color: #fffdf6;
        padding: 12px 45px;
        border-radius: 20px;
        border: 1px solid #fffdf6;
        text-transform: uppercase;
        font-weight: bold;
        cursor: pointer;
        transition: transform 80ms ease-in;
        font-size: 12px;
        font-family: inherit;
        letter-spacing: 1px;
        }

        .auth-skip-btn {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border: 1px solid #242f49;
        color: #242f49;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        z-index: 10;
        transition: all 0.2s;
        font-family: inherit;
        }

        .auth-skip-btn:hover {
        border-color: #242f49;
        color: white;
        background: #242f49;
        box-shadow: 0 5px 15px rgba(36, 47, 73, 0.3);
        }

        .auth-skip-btn:focus {
        outline: none;
        }

        .auth-mobile-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to right, #242f49, #161e2f);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1;
        }

        .auth-choice-screen {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        padding: 20px;
        box-sizing: border-box;
        position: relative;
        }

        .auth-choice-content {
        text-align: center;
        background: white;
        padding: 40px 30px;
        border-radius: 15px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 320px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .auth-choice-content h1 {
        font-size: 28px;
        color: #333;
        margin: 0 0 10px 0;
        font-weight: bold;
        }

        .auth-choice-content p {
        font-size: 16px;
        color: #666;
        margin-bottom: 40px;
        }

        .auth-choice-btn {
        width: 100%;
        padding: 16px;
        margin: 12px 0;
        font-size: 15px;
        font-weight: bold;
        border: 2px solid;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s;
        font-family: inherit;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        }

        .auth-choice-btn-login {
        background: #242f49;
        color: #fffdf6;
        border-color: #161e2f;
        }

        .auth-choice-btn-login:active {
        transform: scale(0.98);
        box-shadow: 0 5px 15px rgba(36, 47, 73, 0.4);
        }

        .auth-choice-btn-register {
        background: #242f49;
        color: #fffdf6;
        border-color: #161e2f;
        }

        .auth-choice-btn-register:active {
        transform: scale(0.98);
        box-shadow: 0 5px 15px rgba(36, 47, 73, 0.4);
        }

        .auth-form-screen {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        flex-direction: column;
        padding: 40px 20px 20px 20px;
        box-sizing: border-box;
        background: linear-gradient(to right, #242f49, #161e2f);
        overflow-y: auto;
        position: relative;
        }

        .auth-back-btn {
        background: none;
        border: none;
        color: #fffdf6;
        font-size: 16px;
        cursor: pointer;
        padding: 10px;
        margin: -10px 0 20px -10px;
        font-weight: bold;
        font-family: inherit;
        transition: color 0.2s;
        }

        .auth-back-btn:hover {
        color: #e8eef5;
        }

        .auth-back-btn:active {
        color: #d1d9e8;
        }

        .auth-form-screen form {
        width: 100%;
        max-width: 100%;
        background: rgba(255, 255, 255, 0.95);
        padding: 30px 20px;
        border-radius: 15px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        margin: auto;
        }

        .auth-form-screen form button {
        background-color: #242f49;
        border: 3px solid #242f49;
        color: #ffffff;
        }

        @media (max-width: 768px) {
        .auth-main-container {
            flex-direction: column;
            min-height: 100vh;
            max-width: 100%;
            border-radius: 0;
            width: 100%;
            min-height: auto;
        }

        .auth-form-container {
            width: 100%;
            position: relative;
            top: auto;
            height: auto;
            min-height: auto;
            display: flex;
            align-items: center;
        }

        .auth-sign-up-container,
        .auth-sign-in-container {
            width: 100%;
            left: 0;
            opacity: 1;
            z-index: 1;
            position: relative;
            top: 0;
            height: auto;
            padding: 30px 0;
        }

        .auth-main-container.sign-up-mode .auth-sign-in-container {
            left: 0;
            opacity: 0;
            position: absolute;
            pointer-events: none;
        }

        .auth-main-container.sign-up-mode .auth-sign-up-container {
            opacity: 1;
            position: relative;
            pointer-events: auto;
        }

        .auth-overlay-container {
            display: none;
        }

        form {
            padding: 20px 20px;
            width: 100%;
        }

        form h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }

        form span {
            font-size: 13px;
            margin-bottom: 25px;
        }

        form input {
            padding: 14px 12px;
            margin: 10px 0;
            font-size: 16px;
            min-height: 44px;
        }

        form button {
            padding: 14px 45px;
            font-size: 13px;
            min-height: 44px;
            margin-top: 15px;
            width: 100%;
            border-radius: 6px;
            border: 1px solid #242f49;
        }

        .auth-ghost {
            display: none;
        }

        .auth-skip-btn {
            position: fixed;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 16px;
            font-size: 12px;
            z-index: 1000;
            background: white;
            border: 1px solid #242f49;
            color: #242f49;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            cursor: pointer;
            transition: all 0.2s;
            font-weight: bold;
        }

        .auth-skip-btn:hover {
            background: #242f49;
            color: white;
            box-shadow: 0 6px 16px rgba(36, 47, 73, 0.4);
        }

        html, body, #root {
            height: auto;
            min-height: 100vh;
        }
        }
    `}</style>
    </>
)
}
