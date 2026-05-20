'use client'

import { useEffect, useState } from 'react'

const GENERATION_STEPS = [
  { title: '确认住宿与景点位置', desc: '以你选择的酒店作为每日出发点' },
  { title: '优化景点游览顺序', desc: '减少绕路，让路线更顺' },
  { title: '安排每日游玩节奏', desc: '根据你的节奏控制行程密度' },
  { title: '生成完整行程方案', desc: '整理路线、提醒与备选方案' },
]

export default function PlanGenerating({
  onComplete,
  onBack,
  onLater,
  externalProgress,
  externalStep,
}: {
  onComplete: () => void
  onBack: () => void
  onLater: () => void
  externalProgress?: number
  externalStep?: number
}) {
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState(0)

  const isControlled = externalProgress !== undefined && externalStep !== undefined
  const displayProgress = isControlled ? externalProgress! : progress
  const displayStep = isControlled ? externalStep! : step

  useEffect(() => {
    if (isControlled) return

    setProgress(100)

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const percent = Math.min(100, (elapsed / 4000) * 100)
      const currentStep = Math.min(4, Math.floor(percent / 25))
      setStep(currentStep)

      if (elapsed >= 4000) {
        clearInterval(interval)
        onComplete()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [onComplete, isControlled])

  const activeTitle = displayStep < 4 ? GENERATION_STEPS[displayStep].title : '正在生成方案'

  return (
    <div className="min-h-screen bg-[#F4F8FF] flex flex-col items-center relative overflow-y-auto pb-[180px]">
      {/* 顶部标题区 */}
      <div className="w-full flex items-center justify-between px-[16px] pt-[44px] pb-[16px] relative z-10 shrink-0">
        <i
          className="w-[24px] h-[24px] flex items-center justify-center text-[#1A1A1A] text-[20px] cursor-pointer"
          onClick={onBack}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </i>
      </div>

      <div className="mt-[4px] text-center z-10 shrink-0">
        <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[32px]">正在生成你的旅行方案</h1>
        <p className="text-[14px] text-[#666666] mt-[8px]">管家正在整合酒店、景点和路线，请稍等片刻</p>
      </div>

      {/* 顶部插画区 */}
      <div className="w-full h-[260px] relative mt-[16px] z-10 shrink-0">
        <img
          src="/generating-illustration.png"
          alt="生成方案插画"
          className="w-full h-full object-cover"
        />
      </div>

      {/* 进度卡片区 */}
      <div className="w-full px-[16px] relative z-20 shrink-0">
        {/* 进度条卡片 */}
        <div className="w-full bg-white rounded-[16px] py-[12px] px-[16px] mb-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="text-center mb-[8px]">
            <span className="text-[14px] font-medium text-[#0055FF]">{activeTitle}</span>
          </div>
          <div className="w-full h-[10px] bg-[#EAF0FF] rounded-full overflow-hidden relative">
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#2B70FF] to-[#0055FF] rounded-full transition-all duration-[4000ms] ease-linear"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
          <div className="text-center mt-[8px]">
            <span className="text-[12px] text-[#999999]">已完成 {displayStep}/4 步</span>
          </div>
        </div>

        {/* 步骤列表卡片 */}
        <div className="w-full bg-white rounded-[16px] p-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-[12px] relative">
            {/* 连线背景 */}
            <div className="absolute left-[11px] top-[24px] bottom-[24px] w-[2px] z-0 flex flex-col">
              <div className="absolute inset-0 border-l-[2px] border-dashed border-[#CCCCCC] -ml-[2px]" />
              <div
                className="absolute top-0 left-0 w-full bg-[#2B70FF] transition-all duration-[4000ms] ease-linear"
                style={{ height: `${displayProgress}%` }}
              />
            </div>

            {GENERATION_STEPS.map((item, index) => {
              const isCompleted = displayStep > index
              const isCurrent = displayStep === index
              const isPending = displayStep < index

              return (
                <div
                  key={index}
                  className={`flex items-start gap-[10px] relative z-10 ${index > 0 ? 'mt-[2px]' : ''}`}
                >
                  {isCompleted && (
                    <div className="w-[24px] h-[24px] rounded-full bg-[#2B70FF] flex items-center justify-center shrink-0 mt-[2px] animate-pop-in">
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="w-[24px] h-[24px] rounded-full border-[1px] border-[#2B70FF] bg-white flex items-center justify-center shrink-0 mt-[2px]">
                      <div className="flex gap-[2px]">
                        <div className="w-[3px] h-[3px] rounded-full bg-[#2B70FF] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-[3px] h-[3px] rounded-full bg-[#2B70FF] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-[3px] h-[3px] rounded-full bg-[#2B70FF] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}

                  {isPending && (
                    <div className="w-[24px] h-[24px] rounded-full border-[1px] border-[#CCCCCC] bg-white flex items-center justify-center shrink-0 mt-[2px]" />
                  )}

                  <div className={`flex-1 ${index < GENERATION_STEPS.length - 1 ? 'pb-[12px] border-b border-[#F5F5F5]' : ''}`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-[13px] font-medium transition-colors duration-300 ${isCurrent ? 'text-[#2B70FF]' : 'text-[#1A1A1A]'}`}>
                        {item.title}
                      </h3>
                      {index < 2 && (
                        <i className="text-[#CCCCCC] w-[16px] h-[16px] flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </i>
                      )}
                    </div>
                    <p className={`text-[10px] mt-[2px] transition-colors duration-300 ${isCurrent ? 'text-[#666666]' : 'text-[#999999]'}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 底部浮层 */}
      <div className="fixed bottom-0 left-[50%] translate-x-[-50%] w-full max-w-[375px] px-[16px] pb-[16px] pt-[24px] bg-gradient-to-t from-[#F4F8FF] via-[#F4F8FF] to-transparent z-30">
        <div className="flex items-center justify-center gap-[8px] bg-[#EAF0FF] rounded-full py-[12px] mb-[12px]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
            <path d="M8 1V4M8 12V15M15 8H12M4 8H1M12.9497 3.05025L10.8284 5.17157M5.17157 10.8284L3.05025 12.9497M12.9497 12.9497L10.8284 10.8284M5.17157 5.17157L3.05025 3.05025" stroke="#0055FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[14px] text-[#0055FF]">正在根据酒店位置优化每日出发路线</span>
        </div>
        <button
          className="block w-[180px] mx-auto py-[10px] rounded-full border border-[#0055FF] text-[#0055FF] text-[14px] font-medium"
          onClick={onLater}
        >
          稍后查看
        </button>
      </div>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop-in {
          animation: popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  )
}
