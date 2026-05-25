import { z } from 'zod'

// Auth schemas
export const signUpSchema = z.object({
  email: z.string().email('Neplatná e-mailová adresa'),
  password: z.string().min(8, 'Heslo musí obsahovat alespoň 8 znaků'),
  fullName: z.string().min(2, 'Jméno musí obsahovat alespoň 2 znaky'),
})

export type SignUpFormData = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
  email: z.string().email('Neplatná e-mailová adresa'),
  password: z.string().min(1, 'Heslo je povinné'),
})

export type SignInFormData = z.infer<typeof signInSchema>

export const verificationCodeSchema = z.object({
  code: z.string().min(1, 'Ověřovací kód je povinný').regex(/^\d+$/, 'Kód musí obsahovat jen číslice'),
})

export type VerificationCodeFormData = z.infer<typeof verificationCodeSchema>

// Study Plan schemas
export const createStudyPlanSchema = z.object({
  name: z.string().min(1, 'Název plánu je povinný').max(255, 'Název je příliš dlouhý'),
  description: z.string().max(500, 'Popis je příliš dlouhý').optional(),
})

export type CreateStudyPlanFormData = z.infer<typeof createStudyPlanSchema>

export const editStudyPlanSchema = createStudyPlanSchema

export type EditStudyPlanFormData = z.infer<typeof editStudyPlanSchema>

export const shareStudyPlanSchema = z.object({
  email: z.string().email('Neplatná e-mailová adresa'),
})

export type ShareStudyPlanFormData = z.infer<typeof shareStudyPlanSchema>

// Subject schemas
export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Název předmětu je povinný').max(255, 'Název je příliš dlouhý'),
  teacher: z.string().min(1, 'Jméno vyučujícího je povinné').max(255, 'Jméno je příliš dlouhé'),
  code: z.string().min(1, 'Kód předmětu je povinný').max(20, 'Kód je příliš dlouhý'),
  tagIds: z.array(z.number()).optional(),
  studyPlanId: z.number().nullable().optional(),
})

export type CreateSubjectFormData = z.infer<typeof createSubjectSchema>

export const editSubjectSchema = createSubjectSchema

export type EditSubjectFormData = z.infer<typeof editSubjectSchema>

export const shareSubjectSchema = z.object({
  email: z.string().email('Neplatná e-mailová adresa'),
})

export type ShareSubjectFormData = z.infer<typeof shareSubjectSchema>

// Profile schemas
export const profileStudyInfoSchema = z.object({
  school: z.string().max(255, 'Název školy je příliš dlouhý').optional(),
  studyType: z.string().optional(),
  studyMajor: z.string().max(255, 'Studijní zaměření je příliš dlouhé').optional(),
  studyYear: z.string().optional(),
})

export type ProfileStudyInfoFormData = z.infer<typeof profileStudyInfoSchema>

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().min(1, 'Název štítku je povinný').max(30, 'Název je příliš dlouhý'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Neplatná barva'),
})

export type CreateTagFormData = z.infer<typeof createTagSchema>

// Note schemas
export const createNoteSchema = z.object({
  text: z.string().min(1, 'Poznámka nemůže být prázdná').max(5000, 'Poznámka je příliš dlouhá'),
})

export type CreateNoteFormData = z.infer<typeof createNoteSchema>
