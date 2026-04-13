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
    <div className="space-y-3">
      {TEMPLATE_OPTIONS.map((template) => {
        const isActive = selectedTemplate === template.id

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={`w-full rounded-[22px] border p-4 text-left transition ${
              isActive
                ? 'border-[#7170ff]/40 bg-[#7170ff]/10 shadow-[0_20px_40px_rgba(113,112,255,0.12)]'
                : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-[10px] uppercase tracking-[0.28em] ${isActive ? 'text-[#c7c8ff]' : 'text-slate-500'}`}>
                  Template
                </p>
                <h3 className="mt-2 text-lg font-medium text-white">{template.name}</h3>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${
                  isActive
                    ? 'border-[#7170ff]/40 bg-[#7170ff]/12 text-[#e2e4ff]'
                    : 'border-white/[0.08] text-slate-400'
                }`}
              >
                {isActive ? '已选中' : '可选择'}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-400">{template.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500">{template.ratio}</span>
              <span className="text-xs text-slate-500">{template.bulletPoints.join(' / ')}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
