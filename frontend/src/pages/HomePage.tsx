import { useNavigate } from 'react-router-dom'

const placeholders = [
  { id: 1, image: '/images/perfume-v2.jpg', bg: 'bg-[#0a0a0c]', prompt: '极简风格的高级香水瓶，水波纹倒影，冷色调光影', ratio: 'aspect-square', icon: '✨ 香水瓶 / 极简' },
  { id: 2, image: '/images/headphone.jpg', bg: 'bg-[#0a0a0c]', prompt: '降噪蓝牙耳机，悬浮在深空灰背景中，赛博朋克霓虹光晕', ratio: 'aspect-[4/3]', icon: '🎧 蓝牙耳机 / 赛博朋克' },
  { id: 3, image: '/images/sneaker.jpg', bg: 'bg-[#0a0a0c]', prompt: '红色运动潮鞋，白色大理石台面，侧逆光展现网面材质', ratio: 'aspect-[3/4]', icon: '👟 潮鞋 / 侧逆光' },
  { id: 4, image: '/images/skincare.jpg', bg: 'bg-[#0a0a0c]', prompt: '高端护肤面霜，置于自然绿植叶片之上，清新自然光', ratio: 'aspect-square', icon: '🌿 面霜 / 自然光' },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 selection:bg-[#7170ff]/30 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-[#7170ff]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-[#3b82f6]/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_10%,transparent_100%)] pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-black text-black">T</div>
          <span className="font-semibold text-white tracking-wide">图鲸 AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-white transition">产品优势</a>
          <a href="#" className="hover:text-white transition">画廊</a>
          <a href="#" className="hover:text-white transition">API 定价</a>
        </div>
        <button onClick={() => navigate('/generate')} className="text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-2.5 rounded-full transition-all backdrop-blur-md">
          进入工作台
        </button>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8">
            <span className="flex h-2 w-2 rounded-full bg-[#7170ff] shadow-[0_0_8px_#7170ff] animate-pulse" />
            <span className="text-xs font-medium text-slate-300">图鲸 V2 架构现已发布</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
            电商视觉产出，<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c7c8ff] via-[#fff] to-[#7170ff]">像打字一样简单。</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mb-12 leading-relaxed">
            专为电商团队打造的 AI 图像生成工作流。无需昂贵的影棚与复杂的后期，一句提示词，高品质主图、详情与海报即刻呈现。
          </p>
          <div className="w-full max-w-2xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#7170ff] to-[#3b82f6] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex items-center bg-[#0f1011] border border-white/10 rounded-2xl p-2 pl-6 shadow-2xl">
              <span className="text-slate-500 mr-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </span>
              <input type="text" readOnly value="一款高端无线蓝牙耳机，悬浮在深空灰背景中，赛博朋克光晕..." className="flex-1 bg-transparent text-slate-300 outline-none text-sm md:text-base w-full truncate" />
              <button onClick={() => navigate('/generate')} className="ml-4 bg-white text-black px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors whitespace-nowrap">立即生成</button>
            </div>
          </div>
        </div>

        <div className="mt-32">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-white">看看图鲸能做什么</h2>
            <p className="text-sm text-slate-500 mt-2">由真实的电商提示词直接生成，未经过滤与后期</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className={`md:col-span-2 relative group rounded-3xl overflow-hidden border border-white/10 ${placeholders[1].bg} aspect-[16/10] flex flex-col justify-end p-8`}>
              <img src={placeholders[1].image} alt="Showcase" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />
              <div className="relative z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase tracking-wider bg-white/10 border border-white/10 text-white px-3 py-1 rounded-full backdrop-blur-md">横版海报</span>
                </div>
                <p className="text-white font-medium drop-shadow-md line-clamp-2">"{placeholders[1].prompt}"</p>
              </div>
            </div>
            <div className={`relative group rounded-3xl overflow-hidden border border-white/10 ${placeholders[2].bg} aspect-[3/4] md:aspect-auto flex flex-col justify-end p-6`}>
              <img src={placeholders[2].image} alt="Showcase" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />
              <div className="relative z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <span className="text-[10px] uppercase tracking-wider bg-white/10 border border-white/10 text-white px-3 py-1 rounded-full backdrop-blur-md mb-3 inline-block">详情长图</span>
                <p className="text-sm text-white font-medium drop-shadow-md line-clamp-2">"{placeholders[2].prompt}"</p>
              </div>
            </div>
            <div className={`relative group rounded-3xl overflow-hidden border border-white/10 ${placeholders[0].bg} aspect-square flex flex-col justify-end p-6`}>
              <img src={placeholders[0].image} alt="Showcase" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />
              <div className="relative z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <span className="text-[10px] uppercase tracking-wider bg-white/10 border border-white/10 text-white px-3 py-1 rounded-full backdrop-blur-md mb-3 inline-block">主图</span>
                <p className="text-sm text-white font-medium drop-shadow-md line-clamp-2">"{placeholders[0].prompt}"</p>
              </div>
            </div>
            <div className="md:col-span-2 relative group rounded-3xl overflow-hidden border border-white/10 bg-white/5 bg-gradient-to-br from-[#121318] to-[#0a0a0c] p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#7170ff]/20 flex items-center justify-center text-[#7170ff] mb-6 shadow-[0_0_20px_rgba(113,112,255,0.2)]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">预设了电商专用的构图与光影</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">底层提示词已经为你优化了打光、材质表现和景深。你只需要告诉我们是什么商品，其余的交给图鲸。</p>
              </div>
              <div className="flex gap-3 mt-8">
                {['白底图', '影棚光', '微距细节', '3D渲染'].map(tag => (
                  <span key={tag} className="text-xs text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
