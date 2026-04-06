'use client'

import { TEMPLATE_OPTIONS } from './template-options'

type TemplateSelectorProps = {
  selectedTemplate: string
  onSelect: (templateId: string) => void
}

export default function TemplateSelector({
  selectedTemplate,
  onSelect,
}: TemplateSelectorProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {TEMPLATE_OPTIONS.map((template) => {
        const isActive = selectedTemplate === template.id

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={`group relative overflow-hidden rounded-[28px] border p-5 text-left transition ${
              isActive
                ? 'border-[#7170ff]/40 bg-[linear-gradient(180deg,rgba(113,112,255,0.10),rgba(255,255,255,0.03))] shadow-panel'
                : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
            }`}
          >
            <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(113,112,255,0.18),transparent_70%)] opacity-80" />
            <div className="relative">
              <div
                className={`rounded-[22px] border border-white/10 bg-gradient-to-br ${template.colorClass} p-5`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-xs uppercase tracking-[0.26em] ${template.accentClass}`}>Template</p>
                    <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-white">
                      {template.name}
                    </h3>
                  </div>
                  <div
                    className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] ${
                      isActive
                        ? 'border-[#8f96ff]/40 bg-[#7170ff]/15 text-[#d9dcff]'
                        : 'border-white/10 text-slate-300'
                    }`}
                  >
                    {isActive ? 'Selected' : 'Pick'}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-200">{template.description}</p>
                <p className="mt-5 text-xs uppercase tracking-[0.24em] text-slate-300">{template.ratio}</p>
              </div>

              <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                {template.bulletPoints.map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <span className="text-[#8f96ff]">{'•'}</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </button>
        )
      })}
    </div>
  )
}
