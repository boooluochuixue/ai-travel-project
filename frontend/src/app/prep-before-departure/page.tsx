'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CheckedState {
  [key: string]: boolean
}

export default function PrepBeforeDeparture() {
  const router = useRouter()
  const [animIn, setAnimIn] = useState(false)
  const [checkedItems, setCheckedItems] = useState<CheckedState>({
    umbrella: true,
    clothes: true,
    idCard: false,
    bottle: false,
    pocket4: false,
    hat: false,
    sunglasses: false,
    sunclothes: false,
  })

  useEffect(() => {
    requestAnimationFrame(() => setAnimIn(true))
  }, [])

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const products = [
    {
      id: 1,
      title: '折叠晴雨伞',
      desc: '适合旅途中随身携带',
      price: '69',
      image: 'https://l-api.jd.com/relay-aigc/design/image/prompt/A%20dark%20blue%20folding%20umbrella%20half%20opened%20clean%20white%20background%20product%20photography?width=512&height=512',
    },
    {
      id: 2,
      title: 'DJI Pocket 4',
      desc: '明日达，出发前可收到',
      price: '2999',
      image: 'https://l-api.jd.com/relay-aigc/design/image/prompt/A%20small%20black%20handheld%20gimbal%20camera%20with%20a%20screen%20clean%20white%20background%20product%20photography?width=512&height=512',
    },
    {
      id: 3,
      title: '便携水杯',
      desc: '保温保冷，轻巧便携',
      price: '89',
      image: 'https://l-api.jd.com/relay-aigc/design/image/prompt/A%20minimalist%20white%20thermos%20bottle%20clean%20white%20background%20product%20photography?width=512&height=512',
    },
    {
      id: 4,
      title: '防晒衣',
      desc: '轻薄透气，防晒UPF50+',
      price: '159',
      image: 'https://l-api.jd.com/relay-aigc/design/image/prompt/A%20light%20blue%20sun%20protection%20jacket%20clean%20white%20background%20product%20photography?width=512&height=512',
    },
  ]

  const checkedCount = Object.values(checkedItems).filter(Boolean).length
  const progressPercent = Math.round((checkedCount / 8) * 100)

  return (
    <div
      className={`w-full min-h-screen bg-[#F5F6F8] pb-[100px] transition-all duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${
        animIn ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{
        boxShadow: animIn ? 'none' : '-8px 0 28px rgba(0,0,0,0.1)',
        transitionProperty: 'transform, box-shadow',
      }}
    >
      {/* 导航栏 */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md px-[16px] pt-[20px] pb-[12px] flex items-center justify-center">
        <div
          className="absolute left-[16px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer"
          onClick={() => router.back()}
        >
          <i className="fas fa-chevron-left text-[#333333] text-[18px]"></i>
        </div>
        <div className="text-center">
          <h1 className="text-[18px] font-bold text-[#333333]">出发前准备</h1>
          <p className="text-[12px] text-[#999999] mt-[2px]">已根据你的行程和天气整理好</p>
        </div>
      </div>

      <div className="px-[16px] py-[12px] space-y-[12px]">
        {/* 进度卡片 */}
        <div className="bg-white rounded-[16px] p-[20px] shadow-sm">
          <div className="flex justify-between items-baseline mb-[12px]">
            <div className="text-[16px] text-[#333333]">
              已准备{' '}
              <span className="text-[#3B72F6] text-[24px] font-bold">{checkedCount}</span>
              <span className="text-[#999999] text-[18px]">/8</span> 项
            </div>
            <div className="text-[14px] text-[#666666]">
              还差 <span className="text-[#3B72F6] font-bold">{8 - checkedCount}</span> 项
            </div>
          </div>
          {/* 进度条 */}
          <div className="w-full h-[6px] bg-[#EEF2F5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3B72F6] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* 清单卡片 */}
        <div className="bg-white rounded-[16px] p-[20px] shadow-sm">
          {/* 必带项 */}
          <div className="mb-[24px]">
            <div className="flex items-center gap-[8px] mb-[16px]">
              <i className="fas fa-suitcase text-[#3B72F6] text-[16px]"></i>
              <span className="text-[16px] font-bold text-[#333333]">必带</span>
            </div>
            <div className="space-y-[16px]">
              {[
                { key: 'umbrella', label: '雨伞' },
                { key: 'clothes', label: '衣服' },
                { key: 'idCard', label: '证件' },
                { key: 'bottle', label: '水杯' },
              ].map(item => (
                <div
                  key={item.key}
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCheck(item.key)}
                >
                  <div className="flex items-center gap-[12px]">
                    <div
                      className={`w-[20px] h-[20px] rounded flex items-center justify-center border ${
                        checkedItems[item.key]
                          ? 'bg-[#3B72F6] border-[#3B72F6]'
                          : 'border-[#D9D9D9]'
                      }`}
                    >
                      {checkedItems[item.key] && (
                        <i className="fas fa-check text-white text-[12px]"></i>
                      )}
                    </div>
                    <span
                      className={`text-[15px] ${
                        checkedItems[item.key] ? 'text-[#999999] line-through' : 'text-[#333333]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {!checkedItems[item.key] && (
                    <div className="px-[12px] py-[4px] rounded-full border border-dashed border-[#A1BFFB] text-[#3B72F6] text-[13px]">
                      去补齐
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 建议带 */}
          <div>
            <div className="flex items-center gap-[8px] mb-[16px]">
              <i className="fas fa-gift text-[#3B72F6] text-[16px]"></i>
              <span className="text-[16px] font-bold text-[#333333]">建议带</span>
            </div>
            <div className="space-y-[16px]">
              {[
                { key: 'pocket4', label: '大疆 Pocket 4' },
                { key: 'hat', label: '遮阳帽' },
                { key: 'sunglasses', label: '墨镜' },
                { key: 'sunclothes', label: '防晒衣' },
              ].map(item => (
                <div
                  key={item.key}
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCheck(item.key)}
                >
                  <div className="flex items-center gap-[12px]">
                    <div
                      className={`w-[20px] h-[20px] rounded flex items-center justify-center border ${
                        checkedItems[item.key]
                          ? 'bg-[#3B72F6] border-[#3B72F6]'
                          : 'border-[#D9D9D9]'
                      }`}
                    >
                      {checkedItems[item.key] && (
                        <i className="fas fa-check text-white text-[12px]"></i>
                      )}
                    </div>
                    <span
                      className={`text-[15px] ${
                        checkedItems[item.key] ? 'text-[#999999] line-through' : 'text-[#333333]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {!checkedItems[item.key] && (
                    <div className="px-[12px] py-[4px] rounded-full border border-dashed border-[#A1BFFB] text-[#3B72F6] text-[13px]">
                      去补齐
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 提示文案 */}
        <div className="flex items-center justify-center gap-[6px] py-[4px]">
          <div className="w-[16px] h-[16px] rounded-full bg-[#E8F0FF] flex items-center justify-center">
            <i className="fas fa-arrow-down text-[#3B72F6] text-[10px]"></i>
          </div>
          <span className="text-[12px] text-[#999999]">下滑查看推荐，上滑后清单收起</span>
        </div>

        {/* 悬浮占位折叠栏 */}
        <div className="bg-white rounded-[16px] p-[16px] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <div className="w-[24px] h-[24px] bg-[#E8F0FF] rounded flex items-center justify-center">
              <i className="fas fa-list text-[#3B72F6] text-[12px]"></i>
            </div>
            <span className="text-[15px] text-[#333333]">出发前准备</span>
            <span className="text-[13px] text-[#999999]">
              {checkedCount}/8 已完成
            </span>
          </div>
          <div className="flex items-center gap-[4px] text-[13px] text-[#666666]">
            展开 <i className="fas fa-chevron-down text-[10px]"></i>
          </div>
        </div>

        {/* 推荐商品区标题 */}
        <div className="pt-[8px] pb-[4px]">
          <div className="text-[18px] font-bold text-[#333333]">还没准备好的物品</div>
          <div className="text-[12px] text-[#999999] mt-[2px]">点一下即可补齐，不用自己找</div>
        </div>

        {/* 推荐商品列表 */}
        <div className="flex flex-wrap justify-between">
          {products.map(item => (
            <div
              key={item.id}
              className="w-[48.5%] bg-white rounded-[12px] overflow-hidden shadow-sm mb-[12px]"
            >
              <div className="w-full aspect-square bg-[#F9F9F9]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover mix-blend-multiply p-[16px]"
                />
              </div>
              <div className="p-[12px]">
                <div className="text-[14px] font-bold text-[#333333] mb-[4px] truncate">
                  {item.title}
                </div>
                <div className="text-[12px] text-[#999999] mb-[8px] line-clamp-2">{item.desc}</div>
                <div className="flex items-center justify-between">
                  <div className="text-[16px] font-bold text-[#333333]">
                    <span className="text-[12px]">¥</span>
                    {item.price}
                  </div>
                  <div className="px-[10px] py-[4px] bg-[#E8F0FF] text-[#3B72F6] text-[12px] font-medium rounded-full cursor-pointer">
                    加入清单
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部悬浮操作栏 */}
      <div className="fixed bottom-0 left-0 w-full bg-white px-[20px] py-[12px] pb-[max(12px,env(safe-area-inset-bottom))] flex items-center justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
        <div className="flex items-center gap-[12px]">
          <div className="text-[15px] text-[#333333]">
            已选 <span className="font-bold">{checkedCount}</span> 件
          </div>
          <div className="w-[1px] h-[12px] bg-[#E5E5E5]"></div>
          <div className="text-[13px] text-[#3B72F6]">明日达</div>
        </div>
        <div className="bg-[#3B72F6] text-white px-[32px] py-[12px] rounded-full text-[16px] font-bold shadow-[0_4px_12px_rgba(59,114,246,0.3)] cursor-pointer">
          一键补齐
        </div>
      </div>
    </div>
  )
}
