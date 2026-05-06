import React from 'react'
import { useSignIn, useSignUp, useAuth } from '@clerk/clerk-react'
import { useNavigate } from '@tanstack/react-router'

export function AuthScreen() {
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn()
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()
  
  const { isSignedIn } = useAuth()
  const navigate = useNavigate()

  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [pendingSignInCode, setPendingSignInCode] = React.useState<'totp' | 'email_code' | null>(null)
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
    if (isSignedIn) {
      navigate({ to: '/' })
    }
  }, [isSignedIn, navigate])

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
        emailAddress: email.trim(),
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

  const handleSignInCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignInLoaded || !pendingSignInCode) return
    setError('')
    setIsLoading(true)

    try {
      let result;
      if (pendingSignInCode === 'totp') {
        result = await signIn.attemptSecondFactor({ strategy: 'totp', code })
      } else if (pendingSignInCode === 'email_code') {
        result = await signIn.attemptFirstFactor({ strategy: 'email_code', code })
      }

      if (result?.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId })
      } else {
        setError('Nepodařilo se ověřit účet. Zkuste to prosím znovu.')
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Neplatný kód.')
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
        identifier: email.trim(),
        password,
      })

      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId })
      } else if (result.status === 'needs_factor_two' || result.status === 'needs_second_factor') {
        setPendingSignInCode('totp')
        setCode('')
      } else if (result.status === 'needs_factor_one' || result.status === 'needs_first_factor') {
        const emailFactor = result.supportedFirstFactors?.find((f: any) => f.strategy === 'email_code')
        if (emailFactor) {
          await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: (emailFactor as any).emailAddressId })
          setPendingSignInCode('email_code')
          setCode('')
        } else {
          setError(`Účet vyžaduje dodatečné ověření, které není podporováno.`)
        }
      } else {
        setError(`Nepodporovaný stav přihlášení: ${result.status}.`)
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Nesprávné přihlašovací údaje.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSignedIn) return null

  return (
    <>
      {isMobile ? (
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
              <button className="auth-back-btn" onClick={() => { pendingSignInCode ? setPendingSignInCode(null) : setMobileMode('choice'); setError(''); setCode(''); }}>← Zpět</button>
              {pendingSignInCode ? (
                <form onSubmit={handleSignInCodeSubmit}>
                  <h1>Ověření</h1>
                  <span>{pendingSignInCode === 'email_code' ? 'Zadej kód zaslaný na email' : 'Zadej kód z aplikace'}</span>
                  <input type="text" placeholder="Ověřovací kód" value={code} onChange={(e) => setCode(e.target.value)} required disabled={isLoading} />
                  {error && <span className="auth-error">{error}</span>}
                  <button type="submit">{isLoading ? 'Čekám...' : 'Ověřit'}</button>
                </form>
              ) : (
                <form onSubmit={handleSignInSubmit}>
                  <h1>Přihlášení</h1>
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                  <input type="password" placeholder="Heslo" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                  {error && <span className="auth-error">{error}</span>}
                  <button type="submit">{isLoading ? 'Čekám...' : 'Přihlásit se'}</button>
                </form>
              )}
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
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.trim())} required disabled={isLoading} />
                <input type="password" placeholder="Heslo" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                {error && isSignUp && <span className="auth-error">{error}</span>}
                <button type="submit">{isLoading ? 'Čekám...' : 'Zaregistrovat se'}</button>
              </form>
            )}
          </div>

          <div className="auth-form-container auth-sign-in-container">
            {pendingSignInCode ? (
              <form onSubmit={handleSignInCodeSubmit}>
                <h1>Ověření</h1>
                <span>{pendingSignInCode === 'email_code' ? 'Zadej kód zaslaný na email' : 'Zadej kód z aplikace'}</span>
                <input type="text" placeholder="Kód" value={code} onChange={(e) => setCode(e.target.value)} required disabled={isLoading} />
                {error && !isSignUp && <span className="auth-error">{error}</span>}
                <button type="submit">{isLoading ? 'Čekám...' : 'Ověřit kód'}</button>
              </form>
            ) : (
              <form onSubmit={handleSignInSubmit}>
                <h1>Přihlášení</h1>
                <span>vyplň své údaje</span>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                <input type="password" placeholder="Heslo" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                {error && !isSignUp && <span className="auth-error">{error}</span>}
                <button type="submit">{isLoading ? 'Čekám...' : 'Přihlásit se'}</button>
              </form>
            )}
          </div>

          <div className="auth-overlay-container">
            <div className="auth-overlay">
              <div className="auth-overlay-panel auth-overlay-left">
                <h1>Ahoj!</h1>
                <p>Pokud už máš účet, přihlaš se</p>
                <button className="auth-ghost" onClick={() => { setIsSignUp(false); setError(''); setPendingSignInCode(null); setPendingVerification(false); }} type="button">Přihlášení</button>
              </div>
              <div className="auth-overlay-panel auth-overlay-right">
                <h1>Vítej!</h1>
                <p>Zadej své údaje a začni s námi svou cestu</p>
                <button className="auth-ghost" onClick={() => { setIsSignUp(true); setError(''); setPendingSignInCode(null); setPendingVerification(false); }} type="button">Registrace</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css?family=Montserrat:400,800');

        * { box-sizing: border-box; }
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
          box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
          position: relative;
          overflow: hidden;
          width: 768px;
          max-width: 100%;
          min-height: 480px;
        }

        .auth-form-container { position: absolute; top: 0; height: 100%; transition: all 0.6s ease-in-out; }
        .auth-sign-in-container { left: 0; width: 50%; z-index: 2; }
        .auth-main-container.sign-up-mode .auth-sign-in-container { transform: translateX(100%); }
        .auth-sign-up-container { left: 0; width: 50%; opacity: 0; z-index: 1; }
        .auth-main-container.sign-up-mode .auth-sign-up-container { transform: translateX(100%); opacity: 1; z-index: 5; animation: show 0.6s; }

        @keyframes show { 0%, 49.99% { opacity: 0; z-index: 1; } 50%, 100% { opacity: 1; z-index: 5; } }

        .auth-overlay-container { position: absolute; top: 0; left: 50%; width: 50%; height: 100%; overflow: hidden; transition: transform 0.6s ease-in-out; z-index: 100; }
        .auth-main-container.sign-up-mode .auth-overlay-container { transform: translateX(-100%); }
        .auth-overlay { background: linear-gradient(to right, #242f49, #161e2f); color: #fffdf6; position: relative; left: -100%; height: 100%; width: 200%; transform: translateX(0); transition: transform 0.6s ease-in-out; display: flex; }
        .auth-main-container.sign-up-mode .auth-overlay { transform: translateX(50%); }

        .auth-overlay-panel { position: absolute; display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 0 40px; text-align: center; top: 0; height: 100%; width: 50%; transition: transform 0.6s ease-in-out; }
        .auth-overlay-left { transform: translateX(-20%); }
        .auth-main-container.sign-up-mode .auth-overlay-left { transform: translateX(0); }
        .auth-overlay-right { right: 0; transform: translateX(0); }
        .auth-main-container.sign-up-mode .auth-overlay-right { transform: translateX(20%); }

        .auth-overlay-panel h1 { font-weight: bold; margin: 0; font-size: 32px; }
        .auth-overlay-panel p { font-size: 14px; font-weight: 100; line-height: 20px; letter-spacing: 0.5px; margin: 20px 0 30px; }

        form { background-color: #fffdf6; display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 0 50px; height: 100%; text-align: center; width: 100%; }
        form h1 { font-weight: bold; margin: 0; font-size: 32px; color: #242f49; }
        form span { font-size: 12px; color: #6b7684; margin-bottom: 20px; }
        form input { background-color: #eee; border: none; padding: 12px 15px; margin: 8px 0; width: 100%; border-radius: 6px; font-size: 14px; }
        form button { border-radius: 20px; border: 3px solid #161e2f; background-color: #242f49; color: #fffdf6; font-size: 12px; font-weight: bold; padding: 12px 45px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; margin-top: 10px; }
        .auth-ghost { background-color: transparent; border: 1px solid #fffdf6; color: #fffdf6; padding: 12px 45px; border-radius: 20px; text-transform: uppercase; font-weight: bold; cursor: pointer; font-size: 12px; }
        .auth-error { color: #f44336; font-size: 12px; margin-top: 10px; }

        .auth-mobile-container { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to right, #242f49, #161e2f); display: flex; justify-content: center; align-items: center; }
        .auth-choice-content { text-align: center; background: white; padding: 40px 30px; border-radius: 15px; width: 100%; max-width: 320px; }
        .auth-choice-btn { width: 100%; padding: 16px; margin: 12px 0; font-weight: bold; border-radius: 10px; cursor: pointer; text-transform: uppercase; }
        .auth-choice-btn-login, .auth-choice-btn-register { background: #242f49; color: #fffdf6; }
        .auth-form-screen { width: 100%; height: 100%; display: flex; flex-direction: column; padding: 40px 20px; background: linear-gradient(to right, #242f49, #161e2f); }
        .auth-back-btn { background: none; border: none; color: #fffdf6; font-size: 16px; cursor: pointer; margin-bottom: 20px; }
        .auth-form-screen form { width: 100%; background: white; padding: 30px 20px; border-radius: 15px; }
      `}</style>
    </>
  )
}