'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const slides = [
  {
    id: 1,
    bg: '#f2ede7',
    accentBg: '#dce6dc',
    accentSide: 'right' as const,
    image: '/images/onboarding1-hero.svg',
    imageFlipped: true,
    title: (
      <>
        Oi. Eu sou a{' '}
        <span style={{ color: '#8faf8f' }}>Vora.</span>
      </>
    ),
    body: 'Não sou um app de planilha. Não vou te cobrar nem te julgar. Só vou te mostrar como seu mês pode terminar, antes que ele aconteça.',
    cta: 'Próximo',
  },
  {
    id: 2,
    bg: '#dce6dc',
    accentBg: null,
    accentSide: null as null,
    image: '/images/onboarding2-hero.svg',
    imageFlipped: false,
    title: <>Simples assim.</>,
    body: 'Você me conta quanto ganha e quais são seus gastos fixos. Eu monto uma projeção dos seus próximos meses.',
    badges: [
      { icon: '/images/icon-hand-coins.svg', label: 'Sua renda entra' },
      { icon: '/images/icon-piggy-bank.svg', label: 'Seus fixos ficam registrados' },
      { icon: '/images/icon-calendar-heart.svg', label: 'Seu mês aparece, antes de acontecer' },
    ],
    cta: 'Próximo',
  },
  {
    id: 3,
    bg: '#f2ede7',
    accentBg: '#dce6dc',
    accentSide: 'left' as const,
    image: '/images/onboarding3-hero.svg',
    imageFlipped: false,
    title: (
      <>
        Sem pressão. Você vai{' '}
        <span style={{ color: '#8faf8f' }}>no seu ritmo</span>
      </>
    ),
    body: 'Pode começar com o básico agora e ir ajustando conforme a Vora te conhece melhor. Quanto mais você usar, mais precisa ela fica.',
    cta: 'Vamos começar',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const slide = slides[current]

  function handleNext() {
    if (current < slides.length - 1) {
      setCurrent(current + 1)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: slide.bg }}
    >
      {/* Accent block */}
      {slide.accentBg && slide.accentSide === 'right' && (
        <div
          className="absolute top-[-40px] right-0 w-[201px] h-[480px] rounded-bl-[60px]"
          style={{ backgroundColor: slide.accentBg }}
        />
      )}
      {slide.accentBg && slide.accentSide === 'left' && (
        <div
          className="absolute top-[-40px] left-0 w-[201px] h-[480px] rounded-br-[60px]"
          style={{ backgroundColor: slide.accentBg }}
        />
      )}

      {/* Illustration */}
      <div className="flex-1 flex items-center justify-center pt-16 pb-4 relative z-10">
        <div
          className="relative"
          style={slide.imageFlipped ? { transform: 'scaleX(-1)' } : {}}
        >
          <Image
            src={slide.image}
            alt={`Onboarding ${slide.id}`}
            width={300}
            height={300}
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-[30px] pb-[48px] flex flex-col gap-[40px] relative z-10">
        <div className="flex flex-col gap-[24px]">
          <h1 className="font-fraunces text-[32px] text-[#3c4a3c] leading-tight">
            {slide.title}
          </h1>
          <p className="text-[16px] text-[#3c4a3c] leading-normal">
            {slide.body}
          </p>

          {/* Badges (slide 2 only) */}
          {'badges' in slide && slide.badges && (
            <div className="flex flex-col gap-[8px]">
              {slide.badges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-[14px] px-[12px] py-[8px] rounded-full"
                  style={{
                    backgroundColor: '#fdfcfb',
                    border: '1px solid #ece4db',
                    alignSelf: 'flex-start',
                  }}
                >
                  <Image
                    src={badge.icon}
                    alt={badge.label}
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                  <span className="text-[14px] text-[#4e4e4e] whitespace-nowrap">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress dots + CTA */}
        <div className="flex flex-col gap-[24px]">
          <div className="flex items-center gap-[9px] w-[145px]">
            {slides.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-[6px] rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: i === current ? '#b4c9b4' : '#d7cfc7',
                }}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full font-fraunces text-[16px] py-[14px] px-[26px] text-center transition-opacity hover:opacity-90 active:opacity-80"
            style={{
              backgroundColor: '#8faf8f',
              color: '#f9f7f4',
            }}
          >
            {slide.cta}
          </button>

          {current < slides.length - 1 && (
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[14px] text-center"
              style={{ color: '#a5bfa5' }}
            >
              Pular
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
