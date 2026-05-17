import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/engine'

const STATUS_CONFIG = {
  bom: { label: 'No azul', emoji: '✅', cor: '#dcfce7', texto: '#16a34a' },
  atencao: { label: 'Atenção', emoji: '⚠️', cor: '#fef9c3', texto: '#ca8a04' },
  ruim: { label: 'No vermelho', emoji: '❌', cor: '#fee2e2', texto: '#dc2626' },
} as const

function nomeMes(mesReferencia: string) {
  const [ano, mes] = mesReferencia.split('-')
  const data = new Date(Number(ano), Number(mes) - 1, 1)
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: snapshots } = await supabase
    .from('snapshots_mensais')
    .select('*')
    .eq('user_id', user.id)
    .order('mes_referencia', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-fraunces text-[32px] text-[#3c4a3c] mb-6">Histórico</h1>

      {!snapshots || snapshots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#ece4db] px-6 py-10 text-center">
          <p className="text-[32px] mb-3">📅</p>
          <p className="font-fraunces text-[18px] text-[#3c4a3c] mb-1">Nenhum histórico ainda</p>
          <p className="text-[14px] text-[#9ca3af]">
            Os snapshots mensais aparecem aqui conforme você registra seus dados mês a mês.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {snapshots.map(snap => {
            const cfg = snap.status ? STATUS_CONFIG[snap.status as keyof typeof STATUS_CONFIG] : null
            return (
              <div key={snap.id} className="bg-white rounded-2xl border border-[#ece4db] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-fraunces text-[18px] text-[#3c4a3c] capitalize">
                    {nomeMes(snap.mes_referencia)}
                  </h2>
                  {cfg && (
                    <span
                      className="text-[12px] font-medium px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: cfg.cor, color: cfg.texto }}
                    >
                      {cfg.emoji} {cfg.label}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MetricBox label="Receitas" value={formatCurrency(snap.total_receitas)} />
                  <MetricBox label="Gastos" value={formatCurrency(snap.total_gastos)} />
                  <MetricBox label="Economia" value={formatCurrency(snap.economia)}
                    destaque={snap.economia > 0 ? 'positivo' : snap.economia < 0 ? 'negativo' : undefined} />
                  <MetricBox label="Investido" value={formatCurrency(snap.total_investido)} />
                </div>

                {snap.saldo_livre !== 0 && (
                  <p className="text-[12px] text-[#9ca3af] mt-3">
                    Saldo livre após investimentos: <strong className="text-[#3c4a3c]">{formatCurrency(snap.saldo_livre)}</strong>
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MetricBox({ label, value, destaque }: { label: string; value: string; destaque?: 'positivo' | 'negativo' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wide">{label}</span>
      <span className={`text-[15px] font-medium ${
        destaque === 'positivo' ? 'text-[#16a34a]' : destaque === 'negativo' ? 'text-[#dc2626]' : 'text-[#3c4a3c]'
      }`}>{value}</span>
    </div>
  )
}
