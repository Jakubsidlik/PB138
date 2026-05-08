import React from 'react'
import { useSignIn, useSignUp } from '@clerk/clerk-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

export function AuthScreen() {
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn()
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()

  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [pendingSignInCode, setPendingSignInCode] = React.useState<'totp' | 'email_code' | null>(null)
  const [code, setCode] = React.useState('')
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

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
      } else {
        const status = signIn.status as string
        if (status === 'needs_second_factor') {
          throw new Error('Dvoufázové ověření není v této aplikaci podporováno.')
        }
        if (status === 'needs_first_factor') {
          throw new Error('Neplatné přihlašovací údaje.')
        }
        const emailFactor = result.supportedFirstFactors?.find((f: any) => f.strategy === 'email_code')
        if (emailFactor) {
          await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: (emailFactor as any).emailAddressId })
          setPendingSignInCode('email_code')
          setCode('')
        } else {
          setError(`Účet vyžaduje dodatečné ověření, které není podporováno.`)
        }
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Nesprávné přihlašovací údaje.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {(pendingVerification || pendingSignInCode) ? (
          <Card className="border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Ověření</CardTitle>
              <CardDescription>
                {pendingVerification
                  ? 'Zadej kód zaslaný na e-mail'
                  : pendingSignInCode === 'email_code'
                  ? 'Zadej kód zaslaný na e-mail'
                  : 'Zadej ověřovací kód z aplikace'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={pendingVerification ? handleVerificationSubmit : handleSignInCodeSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="code">Ověřovací kód</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Zadej kód..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 text-lg text-center tracking-widest"
                  />
                </div>
                {error && <div className="text-sm font-medium text-destructive text-center">{error}</div>}
                <div className="space-y-3 pt-2">
                  <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                    {isLoading ? 'Čekám...' : 'Ověřit'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setPendingVerification(false);
                      setPendingSignInCode(null);
                      setError('');
                    }}
                  >
                    Zpět
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="login" className="w-full flex-col flex" onValueChange={() => setError('')}>
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1.5 bg-slate-800/40 rounded-2xl">
              <TabsTrigger value="login" className="text-sm rounded-xl transition-all duration-300 data-active:bg-[#242f49] data-active:text-white data-active:shadow-lg hover:bg-slate-700/50 py-2">Přihlášení</TabsTrigger>
              <TabsTrigger value="register" className="text-sm rounded-xl transition-all duration-300 data-active:bg-[#242f49] data-active:text-white data-active:shadow-lg hover:bg-slate-700/50 py-2">Registrace</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-border/50 shadow-xl bg-card/95 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold">Vítej zpět</CardTitle>
                  <CardDescription>Přihlas se ke svému účtu.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignInSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-mail</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tomas.novak@email.cz"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Heslo</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}
                    <Button type="submit" className="w-full h-11 text-base font-bold mt-4 bg-[#242f49] text-white hover:bg-[#161e2f] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_20px_rgba(36,47,73,0.3)] rounded-xl" disabled={isLoading}>
                      {isLoading ? 'Čekám...' : 'Přihlásit se'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-border/50 shadow-xl bg-card/95 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold">Nová registrace</CardTitle>
                  <CardDescription>Vytvoř si účet a začni plánovat.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUpSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Jméno a příjmení</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Jan Novák"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">E-mail</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="jan.novak@email.cz"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Heslo</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Zvol si silné heslo"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}
                    <Button type="submit" className="w-full h-11 text-base font-bold mt-4 bg-[#242f49] text-white hover:bg-[#161e2f] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_20px_rgba(36,47,73,0.3)] rounded-xl" disabled={isLoading}>
                      {isLoading ? 'Čekám...' : 'Zaregistrovat se'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
