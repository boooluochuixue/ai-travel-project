'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const DEST_SPOTS: Record<string, { recommend: Spot[]; backup: Spot[] }> = {
  default: {
    recommend: [
      { id: 1, name: '上海影视乐园', score: '4.8', tags: ['影视基地', '复古建筑'], desc: '上海首选的民国主题拍摄地，集中国了大多貌旧址之一，以还原30年代老上海的风貌而名。', img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Shanghai%20film%20park%20retro%20street,%20old%20Shanghai%20style,%20sunny%20day?width=512&height=512' },
      { id: 2, name: '武康路历史文化名街', score: '3.9', tags: ['历史文化', '名街', '文艺街区'], desc: '上海市徐汇区重要的历史文化名街，被誉为上海最具建筑风格的街区之一。', img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Wukang%20Road%20Shanghai,%20green%20trees,%20historic%20building,%20sunny%20day?width=512&height=512' },
      { id: 3, name: '思南公馆', score: '4.4', tags: ['历史建筑', '小众', '文艺'], desc: '保留老装饰性花园，环境安静优雅，适合文艺打卡和休憩。', img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Sinan%20Mansions%20Shanghai,%20historic%20villas,%20quiet%20garden,%20sunny%20day?width=512&height=512' },
      { id: 4, name: '田子坊', score: '4.2', tags: ['文艺街区', '小巷', '购物'], desc: '老弄堂改造的创意街区，布满老小店和咖啡馆，适合慢逛和拍照。', img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Tianzifang%20Shanghai,%20narrow%20alley,%20creative%20shops,%20red%20lanterns?width=512&height=512' },
    ],
    backup: [
      { id: 5, name: '衡山路', tags: ['梧桐街道', '历史名街', '文艺街区'], desc: '梧桐树成列的景致选，适合散行漫步和拍照。', img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Hengshan%20Road%20Shanghai,%20plane%20trees,%20quiet%20street,%20autumn?width=512&height=512' },
      { id: 6, name: '多伦路文化街', tags: ['淘书文化', '文艺小店', '小众街区'], desc: '原工部局简欢化名人故居，保留历史建筑和特色书店，氛围文艺气息。', img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Duolun%20Road%20Shanghai,%20historic%20cultural%20street,%20sunny%20day?width=512&height=512' },
      { id: 7, name: '巴金故居', tags: ['人文景点', '名人故居', '历史建筑'], desc: '文学大师巴金的旧居，环境清幽，适合了解名人故事。', img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Ba%20Jin%20Former%20Residence%20Shanghai,%20quiet%20courtyard,%20historic%20building?width=512&height=512' },
    ],
  },
  成都: {
    recommend: [
      { id: 11, name: '大熊猫繁育研究基地', score: '4.9', tags: ['国宝熊猫', '自然生态'], desc: '世界著名的大熊猫保护研究机构，可以近距离观察可爱的大熊猫。', img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Giant%20panda%20eating%20bamboo,%20cute,%20high%20quality?width=512&height=512' },
      { id: 12, name: '锦里古街', score: '4.5', tags: ['古街', '美食', '文化'], desc: '成都最具代表性的仿古商业街，集美食、手工艺品、民俗文化于一体。', img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Jinli%20Ancient%20Street%20Chengdu,%20red%20lanterns,%20traditional%20architecture?width=512&height=512' },
      { id: 13, name: '杜甫草堂', score: '4.3', tags: ['历史人文', '名人故居'], desc: '唐代诗人杜甫流寓成都时的故居，环境清幽雅致，充满文化气息。', img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Du%20Fu%20Thatched%20Cottage%20Chengdu,%20ancient%20garden,%20quiet?width=512&height=512' },
      { id: 14, name: '宽窄巷子', score: '4.6', tags: ['历史文化', '街区漫步'], desc: '成都遗留下来的较成规模的清朝古街道，是老成都的缩影。', img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Kuan%20Zhai%20Alley%20Chengdu,%20old%20street,%20tea%20house?width=512&height=512' },
    ],
    backup: [
      { id: 15, name: '青城山', tags: ['自然风光', '道教文化'], desc: '道教名山之一，山林幽静，有\"青城天下幽\"之美誉。', img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Qingcheng%20Mountain,%20green%20forest,%20taoist%20temple?width=512&height=512' },
      { id: 16, name: '都江堰', tags: ['历史工程', '水利文化'], desc: '古代水利工程奇迹，至今仍在运行的千年水利系统。', img: 'https://l-api.jd.com/relay-aigc/design/image/prompt/Dujiangyan%20irrigation%20system,%20ancient%20engineering?width=512&height=512' },
    ],
  },
}

interface Spot {
  id: number
  name: string
  score?: string
  tags: string[]
  desc: string
  img: string
}

const FILTER_TABS = ['全部', '文艺复古', '拍照出片', '历史人文', '小众安静', '街区漫步']

function ConfirmRoutePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState('全部')
  const [addedSpotIds, setAddedSpotIds] = useState<number[]>([])

  // Parse URL params
  const departureCity = searchParams.get('departureCity') || '北京'
  const departureId = Number(searchParams.get('departureId')) || 1
  const destCity = searchParams.get('destCity') || '成都'
  const destId = Number(searchParams.get('destId')) || 3
  const days = Number(searchParams.get('days')) || 3
  const adults = Number(searchParams.get('adults')) || 2
  const children = Number(searchParams.get('children')) || 0
  const elders = Number(searchParams.get('elders')) || 0
  const pace = searchParams.get('pace') || '适中'
  const budget = searchParams.get('budget') || '舒适适中'
  const notes = searchParams.get('notes') || ''
  const startDate = searchParams.get('startDate') || ''
  const interestsParam = searchParams.get('interests') || ''
  const selectedNeeds = interestsParam ? interestsParam.split(',') : []

  const spots = DEST_SPOTS[destCity] || DEST_SPOTS['default']
  const allRecommendIds = spots.recommend.map(s => s.id)

  useEffect(() => {
    // Auto-select all recommended spots
    setAddedSpotIds(allRecommendIds)
  }, [destCity])

  function toggleSpot(id: number) {
    setAddedSpotIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id],
    )
  }

  function getFilteredBackupSpots(): Spot[] {
    if (activeTab === '全部') return spots.backup
    return spots.backup.filter(s =>
      s.tags.some(t => t.includes(activeTab) || activeTab.includes(t)),
    )
  }

  function handleNext() {
    const params = new URLSearchParams({
      departureCity,
      departureId: String(departureId),
      destCity,
      destId: String(destId),
      days: String(days),
      adults: String(adults),
      children: String(children),
      elders: String(elders),
      pace,
      budget,
      notes,
      selected_poi_ids: addedSpotIds.join(','),
    })
    if (startDate) params.set('startDate', startDate)
    if (selectedNeeds.length) params.set('interests', selectedNeeds.join(','))

    router.push(`/plan/hotel-select?${params.toString()}`)
  }

  const recommendCount = spots.recommend.filter(s => addedSpotIds.includes(s.id)).length

  return (
    <div className="w-full min-h-full bg-[#F6F8FB] flex flex-col pb-[80px]">
      <div className="max-w-3xl mx-auto w-full">
        {/* Top nav */}
        <div className="flex items-center justify-between pt-[44px] pb-[16px] px-[16px] shrink-0">
          <button onClick={() => router.back()} className="w-[32px] h-[32px] flex items-center cursor-pointer">
            <i className="fas fa-chevron-left text-[#333] text-[20px]"></i>
          </button>
          <div className="text-[18px] font-bold text-[#333]">确认推荐路线</div>
          <div className="flex items-center text-[12px] text-[#666] border border-[#E5E5E5] px-[8px] py-[4px] rounded-full bg-white">
            <i className="fas fa-info-circle mr-[4px] text-[#999]"></i> 路线说明
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Recommended spots */}
          <div className="px-[16px] pb-[20px]">
            <div className="flex items-center mb-[12px]">
              <div className="w-[16px] h-[16px] relative mr-[6px] flex items-center justify-center">
                <i className="fas fa-star text-[#1B5CFF] text-[12px]"></i>
                <div className="absolute inset-0 border-[1.5px] border-[#1B5CFF] rounded-lg rotate-45 opacity-20"></div>
              </div>
              <span className="text-[14px] font-bold text-[#333]">推荐景点 <span className="text-[13px] text-[#666] font-normal">(已选 {recommendCount} 个)</span></span>
            </div>

            <div className="space-y-[12px]">
              {spots.recommend.map((spot) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  isAdded={addedSpotIds.includes(spot.id)}
                  showScore
                  onToggle={() => toggleSpot(spot.id)}
                />
              ))}
            </div>
          </div>

          {/* Backup spots */}
          <div className="px-[16px] pb-[30px]">
            <div className="flex items-center mb-[12px]">
              <div className="w-[16px] h-[16px] relative mr-[6px] flex items-center justify-center">
                <i className="far fa-star text-[#1B5CFF] text-[12px]"></i>
                <div className="absolute inset-0 border-[1.5px] border-[#1B5CFF] rounded-lg rotate-45 opacity-20"></div>
              </div>
              <span className="text-[14px] font-bold text-[#333]">备选景点 <span className="text-[13px] text-[#666] font-normal">(可加入以下景点补充路线)</span></span>
            </div>

            {/* Filter tabs */}
            <div className="flex overflow-x-auto space-x-[8px] mb-[16px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {FILTER_TABS.map((tab) => (
                <div
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-[16px] py-[6px] rounded-full text-[13px] cursor-pointer transition-colors ${
                    activeTab === tab ? 'bg-[#1B5CFF] text-white' : 'bg-white text-[#666] border border-[#E5E5E5]'
                  }`}
                >
                  {tab}
                </div>
              ))}
            </div>

            <div className="space-y-[12px]">
              {getFilteredBackupSpots().map((spot) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  isAdded={addedSpotIds.includes(spot.id)}
                  onToggle={() => toggleSpot(spot.id)}
                />
              ))}
              {getFilteredBackupSpots().length === 0 && (
                <div className="text-center text-[#999] text-[13px] py-[20px]">该标签下暂无推荐景点</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white px-[16px] py-[12px] pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-between z-50">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-[22px] h-[22px] border-[1.5px] border-[#1B5CFF] rounded-[4px] flex items-center justify-center mr-[10px]">
              <i className="fas fa-check text-[#1B5CFF] text-[12px]"></i>
            </div>
            <div className="flex flex-col">
              <div className="text-[14px] font-bold text-[#333]">已确认 <span className="text-[#1B5CFF] text-[16px]">{addedSpotIds.length}</span> 个景点</div>
              <div className="text-[11px] text-[#999]">路线排序将由系统自动优化</div>
            </div>
          </div>
          <button
            onClick={handleNext}
            className="w-[140px] h-[44px] bg-[#1B5CFF] rounded-full flex items-center justify-center text-white text-[16px] font-bold cursor-pointer shadow-[0_4px_12px_rgba(27,92,255,0.3)]"
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <ConfirmRoutePage />
    </Suspense>
  )
}

function SpotCard({
  spot,
  isAdded,
  showScore,
  onToggle,
}: {
  spot: Spot
  isAdded: boolean
  showScore?: boolean
  onToggle: () => void
}) {
  return (
    <div className="bg-white rounded-[16px] p-[12px] flex relative shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      {/* Number badge */}
      <div className="absolute top-[12px] left-[12px] bg-[#1B5CFF] text-white text-[10px] font-bold px-[6px] py-[2px] rounded-tl-[8px] rounded-br-[8px] z-10">
        {spot.id}
      </div>
      <img src={spot.img} alt={spot.name} className="w-[96px] h-[96px] rounded-[10px] object-cover shrink-0 mr-[12px]" />
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="text-[16px] font-bold text-[#333] mb-[6px] line-clamp-1">{spot.name}</div>
          <div className="flex items-center mb-[6px] overflow-hidden whitespace-nowrap">
            {showScore && spot.score && (
              <>
                <i className="fas fa-star text-[#F5A623] text-[8px] mr-[3px] shrink-0"></i>
                <span className="text-[8px] text-[#333] font-bold mr-[6px] shrink-0">{spot.score}</span>
              </>
            )}
            <div className="flex space-x-[4px] min-w-0 overflow-hidden">
              {spot.tags.map((tag, i) => (
                <span key={i} className="bg-[#F5F6F8] text-[#666] text-[8px] px-[4px] py-[2px] rounded-[3px] shrink-0">{tag}</span>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-[#666] line-clamp-2 leading-snug">{spot.desc}</div>
        </div>
      </div>
      {/* Action buttons */}
      <div className="flex flex-col items-center justify-center ml-[8px] space-y-[10px] shrink-0">
        <button
          onClick={onToggle}
          className={`w-[80px] h-[28px] rounded-full flex items-center justify-center text-[12px] cursor-pointer ${
            isAdded
              ? 'bg-[#1B5CFF] text-white'
              : 'bg-[#F4F7FF] text-[#1B5CFF] font-medium'
          }`}
        >
          {isAdded ? (
            <><i className="fas fa-check-circle mr-[4px]"></i> 已加入</>
          ) : (
            <><i className="fas fa-plus-circle mr-[4px]"></i> 加入路线</>
          )}
        </button>
        <div className="w-[80px] h-[28px] bg-white border border-[#E5E5E5] text-[#333] text-[12px] rounded-full flex items-center justify-center cursor-pointer">
          查看详情 <i className="fas fa-angle-right ml-[2px] text-[10px] text-[#999]"></i>
        </div>
      </div>
    </div>
  )
}
