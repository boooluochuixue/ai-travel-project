'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GiftSelectPage() {
  const router = useRouter()
  const [animIn, setAnimIn] = useState(false)
  const [totalCount, setTotalCount] = useState(2)
  const [totalPrice, setTotalPrice] = useState(114.3)

  useEffect(() => {
    requestAnimationFrame(() => setAnimIn(true))
  }, [])

  const handleAdd = (price: number) => {
    setTotalCount(prev => prev + 1)
    setTotalPrice(prev => +(prev + price).toFixed(1))
  }

  const productsLeft = [
    {
      name: '沈大成糕点礼盒',
      sub: '百年老字号，上海味道',
      desc: '传统点心，软糯香甜',
      price: 55.8,
      tags: ['上海特色', '礼盒装'],
      image:
        'https://l-api.jd.com/relay-aigc/design/image/prompt/A%20red%20traditional%20Chinese%20pastry%20gift%20box?width=512&height=512',
    },
    {
      name: '上海梨膏糖礼盒',
      sub: '传统润喉佳品',
      desc: '润甜不粘牙，老少皆宜',
      price: 36.8,
      tags: ['上海特色', '适合分享'],
      image:
        'https://l-api.jd.com/relay-aigc/design/image/prompt/A%20yellow%20box%20of%20traditional%20pear%20syrup%20candy?width=512&height=512',
    },
    {
      name: '外滩文创礼盒',
      sub: '外滩地标文创组合',
      desc: '记录上海城市记忆',
      price: 45.0,
      tags: ['上海特色', '文创纪念'],
      image:
        'https://l-api.jd.com/relay-aigc/design/image/prompt/Shanghai%20Bund%20creative%20cultural%20gift%20set%20blue?width=512&height=512',
    },
  ]

  const productsRight = [
    {
      name: '国际饭店蝴蝶酥礼盒',
      sub: '源自上海国际饭店',
      desc: '酥香可口，奶香浓郁',
      price: 128.0,
      tags: ['上海特色', '礼盒装'],
      image:
        'https://l-api.jd.com/relay-aigc/design/image/prompt/A%20blue%20tin%20box%20of%20palmier%20pastries?width=512&height=512',
    },
    {
      name: '上海丝巾小礼盒',
      sub: '海派优雅，经典图案',
      desc: '送礼自用都合适',
      price: 98.0,
      tags: ['上海特色', '轻便便携'],
      image:
        'https://l-api.jd.com/relay-aigc/design/image/prompt/A%20elegant%20silk%20scarf%20in%20a%20pink%20gift%20box?width=512&height=512',
    },
    {
      name: '大白兔伴手礼礼盒',
      sub: '经典国民奶糖',
      desc: '浓浓奶香，童年回忆',
      price: 68.0,
      tags: ['上海特色', '礼盒装'],
      image:
        'https://l-api.jd.com/relay-aigc/design/image/prompt/White%20rabbit%20milk%20candy%20gift%20box?width=512&height=512',
    },
  ]

  return (
    <div
      className={`w-full h-full bg-[#F5F6F8] flex flex-col relative overflow-hidden transition-all duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${
        animIn ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{
        boxShadow: animIn ? 'none' : '-8px 0 28px rgba(0,0,0,0.1)',
        transitionProperty: 'transform, box-shadow',
      }}
    >
      {/* 顶部背景区 */}
      <div className="absolute top-0 left-0 right-0 h-[280px] bg-gradient-to-b from-[#EBF3FF] to-[#F5F6F8] pointer-events-none">
        <img
          src="https://l-api.jd.com/relay-aigc/design/image/prompt/Shanghai%20city%20skyline%20illustration%20in%20soft%20blue%20and%20white%20colors%20with%20a%20big%20white%20gift%20box%20wrapped%20with%20blue%20ribbon%20on%20the%20right%20side?width=1024&height=1024"
          className="w-full h-full object-cover opacity-80"
          alt="上海风景礼物插画"
        />
      </div>

      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden relative z-10 pb-[100px]">
        {/* 顶部导航 */}
        <div className="px-[16px] pt-[44px] pb-[16px] flex items-center">
          <div
            className="w-[32px] h-[32px] bg-white rounded-full flex items-center justify-center shadow-sm cursor-pointer"
            onClick={() => router.back()}
          >
            <i className="fas fa-angle-left text-[#333] text-[18px]"></i>
          </div>
        </div>

        {/* 标题区 */}
        <div className="px-[24px] pt-[10px] pb-[30px]">
          <div className="text-[28px] font-bold text-[#111] mb-[8px]">
            别忘了给亲友带份心意
          </div>
          <div className="flex items-center text-[14px] text-[#666]">
            <span>上海特色伴手礼，旅途中下单，直接寄回家</span>
            <i className="fas fa-truck text-[#126DFF] ml-[6px] text-[12px]"></i>
          </div>
        </div>

        {/* 分类模块 */}
        <div className="px-[16px] mb-[16px]">
          {/* 送亲友区 */}
          <div className="bg-white rounded-[24px] p-[16px] shadow-sm mb-[16px]">
            <div className="flex justify-between items-center overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {[
                { label: '送父母', img: 'avatar of an old couple' },
                { label: '送朋友', img: 'avatar of a young couple', active: true },
                { label: '送同事', img: 'avatar of a young businessman' },
                { label: '送孩子', img: 'avatar of a happy child' },
                { label: '自己留念', icon: 'fa-shopping-bag' },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center shrink-0 min-w-[64px] ${
                    item.active ? 'bg-[#F4F8FF] rounded-[16px] py-[6px] border border-[#126DFF]/20' : ''
                  }`}
                >
                  <div
                    className={`w-[40px] h-[40px] ${item.active ? 'bg-white' : 'bg-[#F7F7F7]'} rounded-full mb-[6px] overflow-hidden flex items-center justify-center`}
                  >
                    {item.img ? (
                      <img
                        src={`https://l-api.jd.com/relay-aigc/design/image/prompt/${item.img}?width=512&height=512`}
                        className="w-full h-full object-cover"
                        alt={item.label}
                      />
                    ) : (
                      <i className={`fas ${item.icon} text-[#126DFF] text-[20px]`}></i>
                    )}
                  </div>
                  <span
                    className={`text-[12px] ${item.active ? 'text-[#126DFF] font-medium' : 'text-[#333]'}`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 标签区 */}
          <div className="flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden space-x-[8px]">
            <div className="shrink-0 h-[36px] bg-white rounded-full px-[16px] flex items-center border border-[#126DFF] text-[#126DFF] font-medium text-[13px] shadow-sm">
              <i className="fas fa-monument mr-[6px]"></i>
              上海特色
            </div>
            {[
              { icon: 'fa-gift', label: '精选礼盒' },
              { icon: 'fa-truck', label: '明日可达' },
              { icon: 'fa-users', label: '适合分享' },
            ].map((tag, i) => (
              <div
                key={i}
                className="shrink-0 h-[36px] bg-white rounded-full px-[16px] flex items-center text-[#333] text-[13px] shadow-sm"
              >
                <i className={`fas ${tag.icon} mr-[6px] text-[#666]`}></i>
                {tag.label}
              </div>
            ))}
          </div>
        </div>

        {/* 推荐管家卡片 */}
        <div className="px-[16px] mb-[16px]">
          <div className="bg-white rounded-[20px] p-[16px] flex items-center shadow-sm">
            <div className="w-[48px] h-[48px] bg-[#F0F5FF] rounded-[12px] flex items-center justify-center mr-[12px] shrink-0">
              <i className="fas fa-shopping-bag text-[#126DFF] text-[24px]"></i>
            </div>
            <div className="flex-1">
              <div className="text-[16px] font-bold text-[#111] mb-[4px]">管家帮你挑好了</div>
              <div className="text-[12px] text-[#666]">
                适合送亲友的上海特色点心与茶礼，体面又省心
              </div>
            </div>
            <div className="text-[13px] text-[#126DFF] font-medium shrink-0 ml-[10px] flex items-center">
              查看礼单 <i className="fas fa-angle-right ml-[2px]"></i>
            </div>
          </div>
        </div>

        {/* 商品双列列表 */}
        <div className="px-[16px] flex justify-between">
          {/* 左列 */}
          <div className="w-[calc(50%-6px)] flex flex-col space-y-[12px]">
            {productsLeft.map((product, i) => (
              <ProductCard key={i} product={product} onAdd={handleAdd} />
            ))}
          </div>

          {/* 右列 */}
          <div className="w-[calc(50%-6px)] flex flex-col space-y-[12px]">
            {productsRight.map((product, i) => (
              <ProductCard key={i} product={product} onAdd={handleAdd} />
            ))}
          </div>
        </div>
      </div>

      {/* 底部悬浮操作栏 */}
      <div className="absolute bottom-0 left-0 right-0 h-[88px] bg-white rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-[20px] flex items-center justify-between z-20">
        <div className="flex items-center">
          <div className="relative w-[48px] h-[48px] mr-[16px]">
            <div className="w-full h-full rounded-full bg-[#FFEAEB] flex items-center justify-center">
              <i className="fas fa-check text-[#F54040] text-[20px]"></i>
            </div>
            {totalCount > 0 && (
              <div className="absolute -top-[4px] -right-[4px] bg-[#F54040] text-white text-[10px] font-bold w-[20px] h-[20px] rounded-full flex items-center justify-center border-[2px] border-white">
                {totalCount}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[14px] text-[#333] mb-[2px]">
              已选 <span className="font-bold">{totalCount}</span> 件
            </div>
            <div className="text-[14px] text-[#333] flex items-baseline">
              合计{' '}
              <span className="text-[#F54040] font-bold ml-[4px] text-[12px]">¥</span>
              <span className="text-[#F54040] font-bold text-[18px]">
                {totalPrice.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
        <div className="h-[52px] bg-[#126DFF] rounded-full px-[24px] flex flex-col items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(18,109,255,0.3)]">
          <div className="text-white font-bold text-[16px] mb-[2px] flex items-center">
            <i className="fas fa-paper-plane mr-[6px]"></i>
            寄回家
          </div>
          <div className="text-white/80 text-[10px]">旅途中下单 直接寄回家</div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({
  product,
  onAdd,
}: {
  product: {
    name: string
    sub: string
    desc: string
    price: number
    tags: string[]
    image: string
  }
  onAdd: (price: number) => void
}) {
  return (
    <div className="bg-white rounded-[16px] overflow-hidden shadow-sm flex flex-col">
      <div className="w-full aspect-square bg-[#f7f7f7]">
        <img
          src={product.image}
          className="w-full h-full object-cover"
          alt={product.name}
        />
      </div>
      <div className="p-[12px]">
        <div className="text-[14px] font-bold text-[#111] mb-[6px] line-clamp-1">
          {product.name}
        </div>
        <div className="text-[11px] text-[#666] mb-[2px]">{product.sub}</div>
        <div className="text-[11px] text-[#666] mb-[8px]">{product.desc}</div>
        <div className="flex items-center space-x-[6px] mb-[12px]">
          {product.tags.map((tag, i) => (
            <span
              key={i}
              className="px-[6px] py-[2px] bg-[#F4F8FF] text-[#126DFF] text-[10px] rounded-[4px]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-end justify-between">
          <div className="text-[#F54040] font-bold flex items-baseline">
            <span className="text-[12px]">¥</span>
            <span className="text-[18px]">{product.price}</span>
          </div>
          <div
            className="text-[12px] text-[#F54040] font-medium border border-[#F54040] rounded-full px-[8px] py-[2px] cursor-pointer"
            onClick={() => onAdd(product.price)}
          >
            加入礼单
          </div>
        </div>
      </div>
    </div>
  )
}
