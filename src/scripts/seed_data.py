"""
Seed script: populate cities and POIs.
Run: python -m src.scripts.seed_data
"""
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import async_session_factory
from src.models.enums import POICategory
from src.models.tables import City, POI


# ─── City Data ───
CITIES = [
    {
        "name": "北京",
        "name_en": "Beijing",
        "province": "北京",
        "latitude": 39.9042,
        "longitude": 116.4074,
        "description": "中国首都，拥有三千多年历史的文化古都，汇集了故宫、长城等世界文化遗产，同时也是现代国际大都市。",
    },
    {
        "name": "上海",
        "name_en": "Shanghai",
        "province": "上海",
        "latitude": 31.2304,
        "longitude": 121.4737,
        "description": '中国最大的经济中心，被誉为"东方巴黎"，融合了现代摩天大楼与百年外滩建筑群，商业与文化繁荣。',
    },
    {
        "name": "成都",
        "name_en": "Chengdu",
        "province": "四川",
        "latitude": 30.5728,
        "longitude": 104.0668,
        "description": "天府之国，以美食、大熊猫和悠闲生活节奏闻名，拥有都江堰、青城山等世界遗产。",
    },
    {
        "name": "西安",
        "name_en": "Xi'an",
        "province": "陕西",
        "latitude": 34.3416,
        "longitude": 108.9398,
        "description": "十三朝古都，丝绸之路起点，以兵马俑、古城墙闻名，历史文化底蕴深厚。",
    },
    {
        "name": "大理",
        "name_en": "Dali",
        "province": "云南",
        "latitude": 25.5916,
        "longitude": 100.2299,
        "description": "云南西部古城，以洱海、苍山、白族文化和风花雪月美景著称，是热门休闲度假目的地。",
    },
]

# ─── POI Data ───
POIS = {
    "北京": [
        {"name": "故宫博物院", "category": "attraction", "sub_category": "历史建筑", "address": "北京市东城区景山前街4号", "latitude": 39.9163, "longitude": 116.3972, "rating": 4.8, "price_level": 2, "opening_hours": "08:30-17:00(周一闭馆)", "visit_duration": 240, "description": "明清两代的皇家宫殿，世界上最大的宫殿建筑群之一"},
        {"name": "长城（八达岭）", "category": "attraction", "sub_category": "历史建筑", "address": "北京市延庆区G6京藏高速58号出口", "latitude": 40.3543, "longitude": 116.0066, "rating": 4.7, "price_level": 2, "opening_hours": "07:30-16:00", "visit_duration": 240, "description": "世界文化遗产，雄伟壮观的古代军事防御工程"},
        {"name": "颐和园", "category": "attraction", "sub_category": "园林", "address": "北京市海淀区新建宫门路19号", "latitude": 39.9999, "longitude": 116.2755, "rating": 4.7, "price_level": 2, "opening_hours": "06:30-18:00", "visit_duration": 180, "description": "中国现存最大的皇家园林，以昆明湖和万寿山为核心"},
        {"name": "天坛公园", "category": "attraction", "sub_category": "历史建筑", "address": "北京市东城区天坛内东里7号", "latitude": 39.8822, "longitude": 116.4066, "rating": 4.6, "price_level": 1, "opening_hours": "06:00-21:00", "visit_duration": 120, "description": "明清皇帝祭天祈谷的场所，以祈年殿最为著名"},
        {"name": "天安门广场", "category": "attraction", "sub_category": "广场", "address": "北京市东城区长安街", "latitude": 39.9054, "longitude": 116.3976, "rating": 4.6, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 60, "description": "世界上最大的城市广场，国庆阅兵地"},
        {"name": "国家博物馆", "category": "attraction", "sub_category": "博物馆", "address": "北京市东城区东长安街16号", "latitude": 39.9055, "longitude": 116.3979, "rating": 4.6, "price_level": 1, "opening_hours": "09:00-17:00(周一闭馆)", "visit_duration": 180, "description": "中华文化的祠堂和祖庙，收藏了140余万件藏品"},
        {"name": "什刹海", "category": "attraction", "sub_category": "历史街区", "address": "北京市西城区什刹海", "latitude": 39.9377, "longitude": 116.3848, "rating": 4.5, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 120, "description": "北京历史文化保护区，拥有恭王府、烟袋斜街等景点"},
        {"name": "798艺术区", "category": "attraction", "sub_category": "艺术区", "address": "北京市朝阳区酒仙桥路4号", "latitude": 39.9850, "longitude": 116.4956, "rating": 4.4, "price_level": 1, "opening_hours": "全天开放(各画廊开放时间不一)", "visit_duration": 120, "description": "由旧工厂改造的当代艺术区，汇集画廊、设计店和咖啡馆"},
        {"name": "鸟巢（国家体育场）", "category": "attraction", "sub_category": "体育场馆", "address": "北京市朝阳区国家体育场南路1号", "latitude": 39.9906, "longitude": 116.3907, "rating": 4.5, "price_level": 2, "opening_hours": "09:00-17:30", "visit_duration": 90, "description": "2008年奥运会主体育场，标志性建筑之一"},
        {"name": "全聚德（前门烤鸭店）", "category": "restaurant", "sub_category": "北京烤鸭", "address": "北京市东城区前门大街32号", "latitude": 39.8961, "longitude": 116.3977, "rating": 4.4, "price_level": 3, "opening_hours": "11:00-20:30", "visit_duration": 90, "description": "中华老字号，北京烤鸭的代表"},
        {"name": "东来顺饭庄", "category": "restaurant", "sub_category": "涮羊肉", "address": "北京市东城区王府井大街138号", "latitude": 39.9133, "longitude": 116.4102, "rating": 4.3, "price_level": 3, "opening_hours": "11:00-21:00", "visit_duration": 90, "description": "百年老字号，北京涮羊肉的代表"},
        {"name": "南锣鼓巷", "category": "shopping", "sub_category": "特色街区", "address": "北京市东城区南锣鼓巷", "latitude": 39.9372, "longitude": 116.4040, "rating": 4.3, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 90, "description": "北京最古老的街区之一，汇集创意小店和特色小吃"},
        {"name": "王府井步行街", "category": "shopping", "sub_category": "商业街", "address": "北京市东城区王府井大街", "latitude": 39.9135, "longitude": 116.4099, "rating": 4.2, "price_level": 2, "opening_hours": "全天开放", "visit_duration": 120, "description": "北京最著名的商业步行街，汇聚各大品牌和老字号"},
        {"name": "老舍茶馆", "category": "entertainment", "sub_category": "茶馆", "address": "北京市西城区前门西大街正阳市场3号楼", "latitude": 39.8968, "longitude": 116.3953, "rating": 4.3, "price_level": 3, "opening_hours": "09:00-22:00", "visit_duration": 120, "description": "体验北京传统文化和曲艺表演的著名茶馆"},
        {"name": "北京环球影城", "category": "entertainment", "sub_category": "主题公园", "address": "北京市通州区北京环球度假区", "latitude": 39.8458, "longitude": 116.6853, "rating": 4.6, "price_level": 3, "opening_hours": "10:00-19:00", "visit_duration": 480, "description": "世界级主题公园，拥有七大主题景区"},
    ],
    "上海": [
        {"name": "外滩", "category": "attraction", "sub_category": "历史建筑群", "address": "上海市黄浦区中山东一路", "latitude": 31.2400, "longitude": 121.4900, "rating": 4.7, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 90, "description": "上海最具标志性的景观带，汇集万国建筑博览群"},
        {"name": "东方明珠塔", "category": "attraction", "sub_category": "观景台", "address": "上海市浦东新区世纪大道1号", "latitude": 31.2397, "longitude": 121.4998, "rating": 4.5, "price_level": 3, "opening_hours": "09:00-21:00", "visit_duration": 120, "description": "上海地标建筑，高468米，可俯瞰浦江两岸"},
        {"name": "上海迪士尼乐园", "category": "attraction", "sub_category": "主题公园", "address": "上海市浦东新区上海迪士尼度假区", "latitude": 31.1440, "longitude": 121.6570, "rating": 4.7, "price_level": 3, "opening_hours": "08:30-20:30", "visit_duration": 480, "description": "中国大陆首座迪士尼主题乐园"},
        {"name": "豫园", "category": "attraction", "sub_category": "园林", "address": "上海市黄浦区安仁街218号", "latitude": 31.2277, "longitude": 121.4926, "rating": 4.4, "price_level": 2, "opening_hours": "09:00-16:30", "visit_duration": 120, "description": "明代江南古典园林，毗邻城隍庙商圈"},
        {"name": "上海博物馆", "category": "attraction", "sub_category": "博物馆", "address": "上海市黄浦区人民大道201号", "latitude": 31.2304, "longitude": 121.4748, "rating": 4.7, "price_level": 1, "opening_hours": "09:00-17:00(周一闭馆)", "visit_duration": 180, "description": "中国古代艺术博物馆，收藏了百万余件珍贵文物"},
        {"name": "南京路步行街", "category": "shopping", "sub_category": "商业街", "address": "上海市黄浦区南京东路", "latitude": 31.2363, "longitude": 121.4777, "rating": 4.4, "price_level": 2, "opening_hours": "全天开放", "visit_duration": 120, "description": "中华第一商业街，百年老店与现代化商场林立"},
        {"name": "田子坊", "category": "attraction", "sub_category": "创意街区", "address": "上海市黄浦区泰康路210弄", "latitude": 31.2135, "longitude": 121.4743, "rating": 4.2, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 90, "description": "上海弄堂改造的创意艺术区，充满文艺气息"},
        {"name": "陆家嘴金融中心", "category": "attraction", "sub_category": "现代建筑", "address": "上海市浦东新区陆家嘴", "latitude": 31.2390, "longitude": 121.5008, "rating": 4.5, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 60, "description": "中国最具影响力的金融中心之一，摩天大楼林立"},
        {"name": "新天地", "category": "shopping", "sub_category": "商业区", "address": "上海市黄浦区太仓路181弄", "latitude": 31.2198, "longitude": 121.4765, "rating": 4.3, "price_level": 3, "opening_hours": "10:00-22:00", "visit_duration": 120, "description": "石库门老建筑改造的高端商业区，汇集时尚餐饮和品牌"},
        {"name": "南翔馒头店(豫园店)", "category": "restaurant", "sub_category": "上海小吃", "address": "上海市黄浦区豫园路85号", "latitude": 31.2283, "longitude": 121.4920, "rating": 4.3, "price_level": 2, "opening_hours": "07:00-20:00", "visit_duration": 45, "description": "百年老店，正宗南翔小笼包的发源地"},
        {"name": "老吉士酒家", "category": "restaurant", "sub_category": "本帮菜", "address": "上海市徐汇区天平路41号", "latitude": 31.2021, "longitude": 121.4397, "rating": 4.3, "price_level": 2, "opening_hours": "11:00-21:30", "visit_duration": 90, "description": "上海本帮菜名店，红烧肉和蟹粉豆腐是招牌"},
        {"name": "上海中心大厦", "category": "attraction", "sub_category": "观景台", "address": "上海市浦东新区银城中路501号", "latitude": 31.2355, "longitude": 121.5015, "rating": 4.6, "price_level": 3, "opening_hours": "09:00-22:00", "visit_duration": 90, "description": "中国第一高楼，632米，118层观光厅可360度俯瞰上海"},
        {"name": "武康路", "category": "attraction", "sub_category": "历史文化街区", "address": "上海市徐汇区武康路", "latitude": 31.2086, "longitude": 121.4400, "rating": 4.5, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 90, "description": "上海最有情调的历史文化名街，保留了许多老洋房"},
        {"name": "上海海洋水族馆", "category": "attraction", "sub_category": "水族馆", "address": "上海市浦东新区陆家嘴环路1388号", "latitude": 31.2402, "longitude": 121.4965, "rating": 4.4, "price_level": 3, "opening_hours": "09:00-18:00", "visit_duration": 120, "description": "亚洲最大的水族馆之一，拥有世界最长的海底隧道"},
        {"name": "M50创意园", "category": "entertainment", "sub_category": "艺术区", "address": "上海市普陀区莫干山路50号", "latitude": 31.2552, "longitude": 121.4392, "rating": 4.2, "price_level": 1, "opening_hours": "09:00-17:00", "visit_duration": 90, "description": "上海最具影响力的当代艺术园区之一"},
    ],
    "成都": [
        {"name": "成都大熊猫繁育研究基地", "category": "attraction", "sub_category": "动物园", "address": "成都市成华区熊猫大道1375号", "latitude": 30.7351, "longitude": 104.1438, "rating": 4.7, "price_level": 2, "opening_hours": "07:30-17:00", "visit_duration": 210, "description": "世界著名的大熊猫保护研究中心，可近距离观察熊猫"},
        {"name": "都江堰", "category": "attraction", "sub_category": "水利工程", "address": "成都市都江堰市公园路", "latitude": 31.0087, "longitude": 103.6201, "rating": 4.7, "price_level": 2, "opening_hours": "08:00-17:30", "visit_duration": 180, "description": "两千多年前修建的世界级水利工程，至今仍在发挥灌溉作用"},
        {"name": "青城山", "category": "attraction", "sub_category": "自然风景区", "address": "成都市都江堰市青城山镇", "latitude": 30.8976, "longitude": 103.5663, "rating": 4.6, "price_level": 2, "opening_hours": "08:00-17:00", "visit_duration": 300, "description": "道教名山，青城天下幽，是道教发源地之一"},
        {"name": "武侯祠", "category": "attraction", "sub_category": "历史纪念", "address": "成都市武侯区武侯祠大街231号", "latitude": 30.6455, "longitude": 104.0470, "rating": 4.5, "price_level": 2, "opening_hours": "09:00-18:00", "visit_duration": 120, "description": "纪念诸葛亮的祠庙，中国唯一的君臣合祀祠庙"},
        {"name": "锦里古街", "category": "shopping", "sub_category": "特色街区", "address": "成都市武侯区武侯祠大街231号", "latitude": 30.6437, "longitude": 104.0480, "rating": 4.3, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 90, "description": "以三国文化为主题的仿古商业街，集美食、手工艺品于一体"},
        {"name": "宽窄巷子", "category": "attraction", "sub_category": "历史街区", "address": "成都市青羊区宽窄巷子", "latitude": 30.6710, "longitude": 104.0551, "rating": 4.4, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 120, "description": "成都保存最完好的清朝古街巷，代表成都市井文化"},
        {"name": "杜甫草堂", "category": "attraction", "sub_category": "历史纪念", "address": "成都市青羊区青华路37号", "latitude": 30.6626, "longitude": 104.0305, "rating": 4.4, "price_level": 2, "opening_hours": "09:00-18:00", "visit_duration": 90, "description": "诗圣杜甫在成都的故居，中国文学圣地"},
        {"name": "金沙遗址博物馆", "category": "attraction", "sub_category": "博物馆", "address": "成都市青羊区金沙遗址路2号", "latitude": 30.6836, "longitude": 104.0086, "rating": 4.6, "price_level": 2, "opening_hours": "09:00-18:00(周一闭馆)", "visit_duration": 120, "description": "古蜀文明的重要遗址，太阳神鸟金饰的出土地"},
        {"name": "小龙坎老火锅（春熙店）", "category": "restaurant", "sub_category": "火锅", "address": "成都市锦江区东大街188号", "latitude": 30.6540, "longitude": 104.0827, "rating": 4.4, "price_level": 2, "opening_hours": "11:00-04:00", "visit_duration": 90, "description": "成都火锅的代表品牌，麻辣鲜香"},
        {"name": "陈麻婆豆腐（总店）", "category": "restaurant", "sub_category": "川菜", "address": "成都市青羊区西玉龙街197号", "latitude": 30.6718, "longitude": 104.0700, "rating": 4.3, "price_level": 2, "opening_hours": "11:00-21:00", "visit_duration": 60, "description": "中华老字号，麻婆豆腐的发源地"},
        {"name": "人民公园鹤鸣茶社", "category": "entertainment", "sub_category": "茶馆", "address": "成都市青羊区少城路12号人民公园内", "latitude": 30.6622, "longitude": 104.0583, "rating": 4.5, "price_level": 1, "opening_hours": "08:00-18:00", "visit_duration": 120, "description": "成都最具代表性的老茶馆，体验成都慢生活"},
        {"name": "春熙路", "category": "shopping", "sub_category": "商业街", "address": "成都市锦江区春熙路", "latitude": 30.6582, "longitude": 104.0808, "rating": 4.3, "price_level": 2, "opening_hours": "全天开放", "visit_duration": 90, "description": "成都最繁华的商业步行街，时尚购物中心聚集"},
        {"name": "九眼桥酒吧街", "category": "entertainment", "sub_category": "酒吧街", "address": "成都市武侯区九眼桥", "latitude": 30.6419, "longitude": 104.0825, "rating": 4.2, "price_level": 2, "opening_hours": "19:00-02:00", "visit_duration": 120, "description": "成都夜生活的标志性地点，沿河酒吧林立"},
        {"name": "文殊院", "category": "attraction", "sub_category": "寺庙", "address": "成都市青羊区文殊院街66号", "latitude": 30.6811, "longitude": 104.0792, "rating": 4.5, "price_level": 1, "opening_hours": "08:00-17:00", "visit_duration": 60, "description": "川西著名的佛教寺院，始建于隋朝"},
        {"name": "西岭雪山", "category": "attraction", "sub_category": "自然风景区", "address": "成都市大邑县西岭镇", "latitude": 30.6119, "longitude": 103.2485, "rating": 4.4, "price_level": 3, "opening_hours": "09:00-17:00", "visit_duration": 360, "description": "成都第一高峰，冬季滑雪胜地，夏季避暑天堂"},
    ],
    "西安": [
        {"name": "秦始皇兵马俑博物馆", "category": "attraction", "sub_category": "博物馆", "address": "西安市临潼区秦陵北路", "latitude": 34.3838, "longitude": 109.2757, "rating": 4.7, "price_level": 3, "opening_hours": "08:30-17:00", "visit_duration": 180, "description": "世界第八大奇迹，秦始皇陵的陪葬坑，规模宏大震撼人心"},
        {"name": "西安城墙", "category": "attraction", "sub_category": "历史建筑", "address": "西安市碑林区南大街2号", "latitude": 34.2591, "longitude": 108.9436, "rating": 4.6, "price_level": 2, "opening_hours": "08:00-22:00", "visit_duration": 120, "description": "中国现存规模最大、保存最完整的古代城垣，可骑行游览"},
        {"name": "大雁塔", "category": "attraction", "sub_category": "古塔", "address": "西安市雁塔区慈恩路1号", "latitude": 34.2198, "longitude": 108.9614, "rating": 4.5, "price_level": 2, "opening_hours": "08:00-18:00", "visit_duration": 90, "description": "唐代高僧玄奘为藏经而建，西安的标志性建筑"},
        {"name": "陕西历史博物馆", "category": "attraction", "sub_category": "博物馆", "address": "西安市雁塔区小寨东路91号", "latitude": 34.2086, "longitude": 108.9539, "rating": 4.7, "price_level": 1, "opening_hours": "09:00-17:30(周一闭馆)", "visit_duration": 180, "description": "华夏珍宝库，周秦汉唐的文物精华尽在于此"},
        {"name": "回民街", "category": "restaurant", "sub_category": "美食街", "address": "西安市莲湖区北院门街道", "latitude": 34.2640, "longitude": 108.9398, "rating": 4.2, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 90, "description": "西安最著名的小吃街，汇集西北美食和回民特色小吃"},
        {"name": "华清宫", "category": "attraction", "sub_category": "历史建筑", "address": "西安市临潼区华清路38号", "latitude": 34.3650, "longitude": 109.2089, "rating": 4.4, "price_level": 3, "opening_hours": "07:30-18:00", "visit_duration": 120, "description": "唐代皇家温泉行宫，唐明皇与杨贵妃的爱情故事发生地"},
        {"name": "钟楼", "category": "attraction", "sub_category": "古建筑", "address": "西安市碑林区东大街和西大街交叉口", "latitude": 34.2610, "longitude": 108.9432, "rating": 4.5, "price_level": 2, "opening_hours": "08:30-21:00", "visit_duration": 60, "description": "西安市中心标志性建筑，中国现存规模最大的钟楼"},
        {"name": "大唐不夜城", "category": "entertainment", "sub_category": "步行街", "address": "西安市雁塔区慈恩路", "latitude": 34.2186, "longitude": 108.9622, "rating": 4.5, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 120, "description": "以盛唐文化为主题的大型步行街，夜景尤为精彩"},
        {"name": "华山", "category": "attraction", "sub_category": "自然风景区", "address": "渭南市华阴市华山路", "latitude": 34.4800, "longitude": 110.0850, "rating": 4.7, "price_level": 3, "opening_hours": "全天开放", "visit_duration": 480, "description": "五岳之一，以险著称，长空栈道是极限挑战者的最爱"},
        {"name": "西安碑林博物馆", "category": "attraction", "sub_category": "博物馆", "address": "西安市碑林区三学街15号", "latitude": 34.2558, "longitude": 108.9466, "rating": 4.6, "price_level": 2, "opening_hours": "08:00-18:00", "visit_duration": 120, "description": "中国收藏古代碑石时间最早、名碑最多的艺术宝库"},
        {"name": "长安大牌档", "category": "restaurant", "sub_category": "陕西菜", "address": "西安市雁塔区小寨赛格国际购物中心6楼", "latitude": 34.2123, "longitude": 108.9534, "rating": 4.3, "price_level": 2, "opening_hours": "11:00-21:30", "visit_duration": 90, "description": "体验陕西风味美食的网红餐厅，装修充满唐风古韵"},
        {"name": "赛格国际购物中心", "category": "shopping", "sub_category": "购物中心", "address": "西安市雁塔区长安中路123号", "latitude": 34.2128, "longitude": 108.9538, "rating": 4.3, "price_level": 2, "opening_hours": "10:00-22:00", "visit_duration": 120, "description": "西安最大的购物中心之一"},
        {"name": "大明宫国家遗址公园", "category": "attraction", "sub_category": "遗址公园", "address": "西安市新城区自强东路", "latitude": 34.2926, "longitude": 108.9580, "rating": 4.3, "price_level": 2, "opening_hours": "08:30-18:00", "visit_duration": 180, "description": "唐代皇宫遗址，规模是北京故宫的4.5倍"},
        {"name": "高家大院", "category": "attraction", "sub_category": "古民居", "address": "西安市莲湖区北院门144号", "latitude": 34.2645, "longitude": 108.9395, "rating": 4.2, "price_level": 1, "opening_hours": "09:00-22:00", "visit_duration": 60, "description": "建于明代的古建筑群，可欣赏皮影戏和秦腔表演"},
        {"name": "永兴坊", "category": "shopping", "sub_category": "特色街区", "address": "西安市新城区东新街", "latitude": 34.2622, "longitude": 108.9580, "rating": 4.3, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 90, "description": "陕西非遗美食文化街区，摔碗酒的发源地"},
    ],
    "大理": [
        {"name": "洱海", "category": "attraction", "sub_category": "自然风光", "address": "大理白族自治州大理市洱海", "latitude": 25.6916, "longitude": 100.1582, "rating": 4.7, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 180, "description": "云南第二大淡水湖，风花雪月四景之'洱海月'所在地"},
        {"name": "大理古城", "category": "attraction", "sub_category": "古城", "address": "大理白族自治州大理市古城区", "latitude": 25.6779, "longitude": 100.1580, "rating": 4.4, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 180, "description": "南诏国和大理国的都城，保留了大量白族传统建筑"},
        {"name": "苍山", "category": "attraction", "sub_category": "自然风景区", "address": "大理白族自治州大理市苍山", "latitude": 25.6570, "longitude": 100.0980, "rating": 4.6, "price_level": 3, "opening_hours": "08:30-16:00", "visit_duration": 240, "description": '大理"风花雪月"四景之"苍山雪"，乘坐索道可俯瞰洱海'},
        {"name": "崇圣寺三塔", "category": "attraction", "sub_category": "古建筑", "address": "大理白族自治州大理市苍山路", "latitude": 25.7063, "longitude": 100.1413, "rating": 4.5, "price_level": 2, "opening_hours": "08:00-18:00", "visit_duration": 90, "description": "大理的标志性建筑，始建于南诏国时期的佛塔"},
        {"name": "双廊古镇", "category": "attraction", "sub_category": "古镇", "address": "大理白族自治州大理市双廊镇", "latitude": 25.9508, "longitude": 100.1188, "rating": 4.4, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 120, "description": "洱海东岸的美丽古镇，杨丽萍的太阳宫所在地"},
        {"name": "喜洲古镇", "category": "attraction", "sub_category": "古镇", "address": "大理白族自治州大理市喜洲镇", "latitude": 25.8555, "longitude": 100.1198, "rating": 4.4, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 120, "description": "白族民居建筑的活化石，以严家大院和喜洲粑粑闻名"},
        {"name": "大理天龙八部影视城", "category": "attraction", "sub_category": "影视基地", "address": "大理白族自治州大理市苍山脚下", "latitude": 25.6632, "longitude": 100.1218, "rating": 4.0, "price_level": 2, "opening_hours": "08:30-17:00", "visit_duration": 120, "description": "以金庸小说《天龙八部》为主题的影视拍摄基地"},
        {"name": "才村码头", "category": "attraction", "sub_category": "码头", "address": "大理白族自治州大理市才村", "latitude": 25.6588, "longitude": 100.2095, "rating": 4.3, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 60, "description": "洱海西岸的码头，观洱海日出的绝佳地点"},
        {"name": "小普陀", "category": "attraction", "sub_category": "岛屿", "address": "大理白族自治州大理市挖色镇", "latitude": 25.8300, "longitude": 100.1650, "rating": 4.3, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 60, "description": "洱海中的小岛，岛上有明代修建的观音阁"},
        {"name": "大理宏福园", "category": "restaurant", "sub_category": "白族菜", "address": "大理白族自治州大理市人民路", "latitude": 25.6785, "longitude": 100.1630, "rating": 4.2, "price_level": 2, "opening_hours": "11:00-21:00", "visit_duration": 60, "description": "正宗白族菜餐厅，酸辣鱼和乳扇是必点"},
        {"name": "人民路夜市", "category": "shopping", "sub_category": "夜市", "address": "大理白族自治州大理市人民路", "latitude": 25.6775, "longitude": 100.1575, "rating": 4.2, "price_level": 1, "opening_hours": "18:00-23:00", "visit_duration": 90, "description": "大理古城最热闹的夜市，汇集各种小吃和手工艺品"},
        {"name": "大理床单厂艺术区", "category": "entertainment", "sub_category": "艺术区", "address": "大理白族自治州大理市苍坪街56号", "latitude": 25.6772, "longitude": 100.1630, "rating": 4.1, "price_level": 1, "opening_hours": "10:00-18:00", "visit_duration": 60, "description": "由旧床单厂改造的文创艺术区，充满文艺气息"},
        {"name": "龙龛古渡", "category": "attraction", "sub_category": "古渡口", "address": "大理白族自治州大理市龙龛村", "latitude": 25.6400, "longitude": 100.2100, "rating": 4.4, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 60, "description": "洱海西岸的古渡口，网红拍照打卡地"},
        {"name": "寂照庵", "category": "attraction", "sub_category": "寺庙", "address": "大理白族自治州大理市苍山感通山", "latitude": 25.6518, "longitude": 100.1170, "rating": 4.5, "price_level": 1, "opening_hours": "08:00-17:00", "visit_duration": 60, "description": "中国最美的尼姑庵，以多肉植物花园闻名"},
        {"name": "沙溪古镇", "category": "attraction", "sub_category": "古镇", "address": "大理白族自治州剑川县沙溪镇", "latitude": 26.3195, "longitude": 99.8565, "rating": 4.5, "price_level": 1, "opening_hours": "全天开放", "visit_duration": 180, "description": "茶马古道上唯一幸存的古集市，世界建筑遗产"},
    ],
}


async def seed() -> None:
    async with async_session_factory() as session:
        # Check if data already exists
        result = await session.execute(select(City).limit(1))
        if result.scalar_one_or_none():
            print("Database already seeded, skipping.")
            return

        # Insert cities
        city_map = {}
        for city_data in CITIES:
            city = City(**city_data)
            session.add(city)
            await session.flush()
            city_map[city.name] = city.id
            print(f"  + City: {city.name} (id={city.id})")

        # Insert POIs
        count = 0
        for city_name, poi_list in POIS.items():
            city_id = city_map.get(city_name)
            if not city_id:
                continue
            for poi_data in poi_list:
                poi = POI(city_id=city_id, **poi_data)
                session.add(poi)
                count += 1
        await session.flush()
        print(f"  + POIs: {count} total")

        await session.commit()
        print(f"Seed completed: {len(CITIES)} cities, {count} POIs")


if __name__ == "__main__":
    asyncio.run(seed())
