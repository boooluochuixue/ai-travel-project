'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TodayReminder() {
  const router = useRouter()
  const [animIn, setAnimIn] = useState(false)

  useEffect(() => {
    // Trigger entrance animation on next frame for smooth slide-in
    requestAnimationFrame(() => setAnimIn(true))
  }, [])

  return (
    <div
      className={`w-full h-full overflow-y-auto bg-[#F6F7F9] flex flex-col relative pb-[100px] transition-all duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
        animIn ? 'translate-x-0 scale-100 opacity-100' : 'translate-x-full scale-[0.96] opacity-0'
      }`}
      style={{
        boxShadow: animIn ? 'none' : '-6px 0 20px rgba(0,0,0,0.06)',
        transitionProperty: 'transform, opacity, box-shadow',
      }}
    >
      {/* 顶部背景图与导航 */}
      <div className="relative w-full h-[240px] shrink-0">
        <img
          src="https://l-api.jd.com/relay-aigc/design/image/prompt/A%20beautiful%20sunny%20morning%20sky%20with%20soft%20clouds%20and%20warm%20sunlight%20streaming%20down%20gentle%20and%20fresh%20atmosphere%20light%20blue%20and%20pale%20yellow%20tones?width=1024&height=1024"
          alt="早晨天空背景"
          className="w-full h-full object-cover"
        />
        {/* 顶部渐变遮罩以保证文字可读性 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F6F7F9] via-transparent to-transparent" />

        {/* 顶部导航 */}
        <div className="absolute top-0 left-0 w-full flex items-center justify-center p-[16px] pt-[20px] z-10">
          <div
            className="absolute left-[16px] w-[32px] h-[32px] bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer"
            onClick={() => router.back()}
          >
            <i className="fas fa-chevron-left text-white text-[16px]"></i>
          </div>
        </div>

        {/* 标题区域 */}
        <div className="absolute bottom-[40px] left-[20px] z-10">
          <div className="flex items-end gap-[8px]">
            <h1 className="text-[32px] font-bold text-[#333333] leading-none mb-[-4px]">15</h1>
            <span className="text-[14px] text-[#666666] font-medium">星期三 / 距出发还剩 5日</span>
          </div>
          <div className="flex items-center gap-[6px] mt-[10px]">
            <div className="flex items-center text-[13px] text-[#666666] font-medium bg-white/60 backdrop-blur-md px-[8px] py-[2px] rounded-full">
              <i className="fas fa-cloud-sun text-[#F5A623] mr-[4px]"></i>
              <span>上海 24~30°C</span>
            </div>
            <div className="text-[13px] text-[#666666] font-medium bg-white/60 backdrop-blur-md px-[8px] py-[2px] rounded-full">
              多云转晴
            </div>
          </div>
        </div>
      </div>

      {/* 核心卡片区 */}
      <div className="px-[16px] mt-[-20px] relative z-20 flex flex-col gap-[12px]">
        {/* 出发前准备 & 伴手礼 卡片行 */}
        <div className="flex w-full gap-[12px]">
          {/* 出发前准备 */}
          <div
            className="flex-1 bg-white rounded-[16px] p-[16px] pb-[44px] flex flex-col items-center shadow-sm relative overflow-hidden cursor-pointer"
            style={{ minWidth: '150px' }}
            onClick={() => router.push('/prep-before-departure')}
          >
            {/* 背景装饰 */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img
                src="https://l-api.jd.com/relay-aigc/design/image/prompt/A%20minimalist%203D%20illustration%20of%20a%20travel%20suitcase%20and%20a%20camera%20on%20a%20clean%20background%20soft%20lighting%20blue%20tones?width=512&height=512"
                alt="出行装备背景"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="w-[40px] h-[40px] bg-[#E8F0FF] rounded-full flex items-center justify-center mb-[8px] z-10">
              <i className="fas fa-suitcase-rolling text-[#3B6EF4] text-[20px]"></i>
            </div>
            <div className="text-[15px] font-bold text-[#333333] z-10 text-center">出发前准备</div>
            <div className="text-[12px] text-[#666666] mt-[4px] z-10 text-center">还差 6 项待确认</div>
            <div className="w-[28px] h-[28px] bg-[#3B6EF4] rounded-full flex items-center justify-center absolute bottom-[12px] right-[12px] shadow-[0_2px_8px_rgba(59,110,244,0.3)] z-10">
              <i className="fas fa-arrow-right text-white text-[12px]"></i>
            </div>
          </div>

          {/* 伴手礼挑选 */}
          <div
            className="flex-1 bg-white rounded-[16px] p-[16px] pb-[44px] flex flex-col items-center shadow-sm relative overflow-hidden cursor-pointer"
            style={{ minWidth: '150px' }}
            onClick={() => router.push('/gift-select')}
          >
            {/* 背景装饰 */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img
                src="https://l-api.jd.com/relay-aigc/design/image/prompt/A%20minimalist%203D%20illustration%20of%20a%20gift%20box%20with%20ribbon%20on%20a%20clean%20background%20soft%20lighting%20pink%20and%20red%20tones?width=512&height=512"
                alt="礼物背景"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="w-[40px] h-[40px] bg-[#FFF2F0] rounded-full flex items-center justify-center mb-[8px] z-10">
              <i className="fas fa-gift text-[#FF5A5F] text-[20px]"></i>
            </div>
            <div className="text-[15px] font-bold text-[#333333] z-10 text-center">伴手礼挑选</div>
            <div className="text-[12px] text-[#666666] mt-[4px] z-10 text-center">寄回家，不用提</div>
            <div className="w-[28px] h-[28px] bg-[#FF5A5F] rounded-full flex items-center justify-center absolute bottom-[12px] right-[12px] shadow-[0_2px_8px_rgba(255,90,95,0.3)] z-10">
              <i className="fas fa-arrow-right text-white text-[12px]"></i>
            </div>
          </div>
        </div>

        {/* 特殊提醒卡片 */}
        <div className="bg-white rounded-[16px] p-[16px] shadow-sm relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] w-[100px] h-[100px] opacity-10 pointer-events-none">
            <img
              src="https://l-api.jd.com/relay-aigc/design/image/prompt/A%20minimalist%20illustration%20of%20a%20warning%20alert%20icon%20soft%20orange%20and%20red%20tones?width=512&height=512"
              alt="预警背景"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-[16px] font-bold text-[#333333] mb-[12px] flex items-center relative z-10">
            <div className="w-[4px] h-[14px] bg-[#FF5A5F] rounded-full mr-[8px]"></div>
            特殊提醒
          </div>
          <div className="relative z-10 bg-[#FFF2F0] rounded-[8px] p-[12px] flex items-center justify-between gap-[12px]">
            <div className="flex items-start gap-[12px]">
              <div className="w-[36px] h-[36px] bg-white rounded-full flex items-center justify-center text-[#FF5A5F] shrink-0">
                <i className="fas fa-exclamation-triangle text-[16px]"></i>
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#333333]">沙尘暴预警</div>
                <div className="text-[12px] text-[#666666] mt-[4px] leading-relaxed">
                  北京沙尘暴天气能见度较低，建议更改出行方式
                </div>
              </div>
            </div>
            <div className="px-[12px] py-[6px] bg-[#FF5A5F] text-white rounded-full text-[12px] font-medium shrink-0 cursor-pointer">
              更改行程
            </div>
          </div>
        </div>

        {/* 今日行程卡片 */}
        <div className="bg-white rounded-[16px] p-[16px] shadow-sm relative overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute right-[-20px] bottom-[-20px] w-[120px] h-[120px] opacity-10 pointer-events-none">
            <img
              src="https://l-api.jd.com/relay-aigc/design/image/prompt/A%20minimalist%20map%20illustration%20with%20a%20location%20pin%20soft%20blue%20tones?width=512&height=512"
              alt="地图背景"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex justify-between items-center mb-[16px] relative z-10">
            <div className="text-[16px] font-bold text-[#333333] flex items-center">
              <div className="w-[4px] h-[14px] bg-[#3B6EF4] rounded-full mr-[8px]"></div>
              今日行程
            </div>
            <div className="text-[13px] text-[#3B6EF4] flex items-center font-medium cursor-pointer">
              全部行程 <i className="fas fa-chevron-right ml-[4px] text-[10px]"></i>
            </div>
          </div>
          <div className="flex flex-col gap-[12px] relative z-10">
            {/* 行程项 1 */}
            <div className="flex items-start gap-[12px]">
              <div className="flex flex-col items-center mt-[4px]">
                <div className="w-[8px] h-[8px] rounded-full bg-[#3B6EF4]"></div>
                <div className="w-[1px] h-[40px] bg-[#E5E5E5] my-[4px]"></div>
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-[#333333] mb-[4px]">出发去火车站</div>
                <div className="text-[12px] text-[#999999]">09:00 · 预计需要 45分钟</div>
              </div>
            </div>
            {/* 行程项 2 */}
            <div className="flex items-start gap-[12px]">
              <div className="flex flex-col items-center mt-[4px]">
                <div className="w-[8px] h-[8px] rounded-full bg-[#E5E5E5]"></div>
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-[#333333] mb-[4px]">乘坐 G123 次列车</div>
                <div className="text-[12px] text-[#999999]">10:30 · 北京南站 - 上海虹桥</div>
              </div>
            </div>
          </div>
        </div>

        {/* 门票/证件提醒卡片 */}
        <div className="bg-white rounded-[16px] p-[16px] shadow-sm relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] w-[100px] h-[100px] opacity-10 pointer-events-none">
            <img
              src="https://l-api.jd.com/relay-aigc/design/image/prompt/A%20minimalist%20illustration%20of%20tickets%20and%20passport%20soft%20orange%20tones?width=512&height=512"
              alt="门票背景"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-[16px] font-bold text-[#333333] mb-[12px] flex items-center relative z-10">
            <div className="w-[4px] h-[14px] bg-[#F5A623] rounded-full mr-[8px]"></div>
            门票信息
          </div>

          <div className="flex flex-col gap-[12px] relative z-10">
            <div className="flex items-center justify-between bg-[#FFF9F0] rounded-[8px] p-[12px]">
              <div className="flex items-center gap-[12px]">
                <div className="w-[36px] h-[36px] bg-white rounded-full flex items-center justify-center text-[#F5A623]">
                  <i className="fas fa-ticket-alt text-[16px]"></i>
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[#333333]">上海迪士尼乐园</div>
                  <div className="text-[12px] text-[#666666] mt-[2px]">已购 2 张成人票</div>
                </div>
              </div>
              <div className="px-[12px] py-[6px] bg-white border border-[#F5A623] text-[#F5A623] rounded-full text-[12px] font-medium cursor-pointer">
                查看凭证
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#FFF9F0] rounded-[8px] p-[12px]">
              <div className="flex items-center gap-[12px]">
                <div className="w-[36px] h-[36px] bg-white rounded-full flex items-center justify-center text-[#F5A623]">
                  <i className="fas fa-ticket-alt text-[16px]"></i>
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[#333333]">上海博物馆</div>
                  <div className="text-[12px] text-[#666666] mt-[2px]">14:00博物馆参观门票待预订</div>
                </div>
              </div>
              <div className="px-[12px] py-[6px] bg-[#F5A623] border border-[#F5A623] text-white rounded-full text-[12px] font-medium cursor-pointer">
                立即预订
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
