import { z } from 'zod'

export const analiseMensalSchema = z.object({
  status_geral: z.enum(['bom', 'atencao', 'critico']),
  resumo: z.string().min(1),
  insights: z.array(
    z.object({
      titulo: z.string().min(1),
      descricao: z.string().min(1),
    })
  ),
  recomendacoes: z.array(
    z.object({
      acao: z.string().min(1),
      impacto_estimado: z.string().nullable(),
    })
  ),
})

export type AnaliseMensal = z.infer<typeof analiseMensalSchema>
