import React from 'react'
import { useSignIn, useSignUp } from '@clerk/clerk-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { signUpSchema, signInSchema, verificationCodeSchema, type SignUpFormData, type SignInFormData, type VerificationCodeFormData } from '../../app/schemas'

interface ClerkAPIError {
  errors?: {
    longMessage?: string
    message?: string
  }[]
}


export function AuthScreen() {
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn()
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()

  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [pendingSignInCode, setPendingSignInCode] = React.useState<'totp' | 'email_code' | null>(null)
  const [globalError, setGlobalError] = React.useState('')

  // Sign up form
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
    },
  })

  // Sign in form
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Verification form
  const verificationForm = useForm<VerificationCodeFormData>({
    resolver: zodResolver(verificationCodeSchema),
    defaultValues: {
      code: '',
    },
  })

  const handleSignUpSubmit = async (data: SignUpFormData) => {
    if (!isSignUpLoaded) return
    setGlobalError('')

    try {
      const nameParts = data.fullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || undefined

      const result = await signUp.create({
        emailAddress: data.email.trim(),
        password: data.password,
        firstName,
        lastName,
      })

      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId })
      } else {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setPendingVerification(true)
      }
    } catch (err) {
      const clerkErr = err as ClerkAPIError
      setGlobalError(clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message || 'Došlo k chybě při registraci.')
    }
  }

  const handleVerificationSubmit = async (data: VerificationCodeFormData) => {
    if (!isSignUpLoaded) return
    setGlobalError('')

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code: data.code })
      if (completeSignUp.status === 'complete') {
        await setSignUpActive({ session: completeSignUp.createdSessionId })
      } else {
        setGlobalError('Nepodařilo se ověřit účet. Zkuste to prosím znovu.')
      }
    } catch (err) {
      const clerkErr = err as ClerkAPIError
      setGlobalError(clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message || 'Neplatný ověřovací kód.')
    }
  }

  const handleSignInCodeSubmit = async (data: VerificationCodeFormData) => {
    if (!isSignInLoaded || !pendingSignInCode) return
    setGlobalError('')

    try {
      let result
      if (pendingSignInCode === 'totp') {
        result = await signIn.attemptSecondFactor({ strategy: 'totp', code: data.code })
      } else if (pendingSignInCode === 'email_code') {
        result = await signIn.attemptFirstFactor({ strategy: 'email_code', code: data.code })
      }

      if (result?.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId })
      } else {
        setGlobalError('Nepodařilo se ověřit účet. Zkuste to prosím znovu.')
      }
    } catch (err) {
      const clerkErr = err as ClerkAPIError
      setGlobalError(clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message || 'Neplatný kód.')
    }
  }

  const handleSignInSubmit = async (data: SignInFormData) => {
    if (!isSignInLoaded) return
    setGlobalError('')

    try {
      const result = await signIn.create({
        identifier: data.email.trim(),
        password: data.password,
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
        const emailFactor = result.supportedFirstFactors?.find(
          (f): f is Extract<NonNullable<typeof result.supportedFirstFactors>[number], { strategy: 'email_code' }> =>
            f.strategy === 'email_code'
        )
        if (emailFactor?.emailAddressId) {
          await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: emailFactor.emailAddressId })
          setPendingSignInCode('email_code')
          verificationForm.reset()
        } else {
          setGlobalError(`Účet vyžaduje dodatečné ověření, které není podporováno.`)
        }
      }
    } catch (err) {
      const clerkErr = err as ClerkAPIError
      setGlobalError(clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message || 'Nesprávné přihlašovací údaje.')
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
              <form onSubmit={verificationForm.handleSubmit(pendingVerification ? handleVerificationSubmit : handleSignInCodeSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="code">Ověřovací kód</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Zadej kód..."
                    {...verificationForm.register('code')}
                    disabled={verificationForm.formState.isSubmitting}
                    className="h-12 text-lg text-center tracking-widest"
                  />
                  {verificationForm.formState.errors.code && (
                    <p className="text-sm font-medium text-destructive">{verificationForm.formState.errors.code.message}</p>
                  )}
                </div>
                {globalError && <div className="text-sm font-medium text-destructive text-center">{globalError}</div>}
                <div className="space-y-3 pt-2">
                  <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={verificationForm.formState.isSubmitting}>
                    {verificationForm.formState.isSubmitting ? 'Čekám...' : 'Ověřit'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setPendingVerification(false)
                      setPendingSignInCode(null)
                      setGlobalError('')
                      verificationForm.reset()
                    }}
                  >
                    Zpět
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="login" className="w-full flex-col flex" onValueChange={() => setGlobalError('')}>
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
                  <form onSubmit={signInForm.handleSubmit(handleSignInSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-mail</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tvuj.email@seznam.cz"
                        {...signInForm.register('email')}
                        disabled={signInForm.formState.isSubmitting}
                        className="h-11"
                      />
                      {signInForm.formState.errors.email && (
                        <p className="text-sm font-medium text-destructive">{signInForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Heslo</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        {...signInForm.register('password')}
                        disabled={signInForm.formState.isSubmitting}
                        className="h-11"
                      />
                      {signInForm.formState.errors.password && (
                        <p className="text-sm font-medium text-destructive">{signInForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    {globalError && <div className="text-sm font-medium text-destructive">{globalError}</div>}
                    <Button type="submit" className="w-full h-11 text-base font-bold mt-4 bg-[#242f49] text-white hover:bg-[#161e2f] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_20px_rgba(36,47,73,0.3)] rounded-xl" disabled={signInForm.formState.isSubmitting}>
                      {signInForm.formState.isSubmitting ? 'Čekám...' : 'Přihlásit se'}
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
                  <form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Jméno a příjmení</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Křestní jméno a příjmení"
                        {...signUpForm.register('fullName')}
                        disabled={signUpForm.formState.isSubmitting}
                        className="h-11"
                      />
                      {signUpForm.formState.errors.fullName && (
                        <p className="text-sm font-medium text-destructive">{signUpForm.formState.errors.fullName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">E-mail</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="tvuj.email@seznam.cz"
                        {...signUpForm.register('email')}
                        disabled={signUpForm.formState.isSubmitting}
                        className="h-11"
                      />
                      {signUpForm.formState.errors.email && (
                        <p className="text-sm font-medium text-destructive">{signUpForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Heslo</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Zvol si silné heslo"
                        {...signUpForm.register('password')}
                        disabled={signUpForm.formState.isSubmitting}
                        className="h-11"
                      />
                      {signUpForm.formState.errors.password && (
                        <p className="text-sm font-medium text-destructive">{signUpForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    {globalError && <div className="text-sm font-medium text-destructive">{globalError}</div>}
                    <Button type="submit" className="w-full h-11 text-base font-bold mt-4 bg-[#242f49] text-white hover:bg-[#161e2f] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_20px_rgba(36,47,73,0.3)] rounded-xl" disabled={signUpForm.formState.isSubmitting}>
                      {signUpForm.formState.isSubmitting ? 'Čekám...' : 'Zaregistrovat se'}
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
