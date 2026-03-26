-- Add html_template and source columns to block_types
ALTER TABLE block_types ADD COLUMN IF NOT EXISTS html_template TEXT NOT NULL DEFAULT '';
ALTER TABLE block_types ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'custom';

-- Update seeded block types with default HTML templates
UPDATE block_types SET html_template = '<section class="hero-section bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-12 text-white mb-8">
  <h1 class="text-4xl font-bold mb-3">{{.title}}</h1>
  {{if .subtitle}}<p class="text-xl text-indigo-100">{{.subtitle}}</p>{{end}}
  {{if .cta_text}}<a href="{{.cta_url}}" class="inline-block mt-6 px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors">{{.cta_text}}</a>{{end}}
</section>' WHERE slug = 'hero' AND html_template = '';

UPDATE block_types SET html_template = '<div class="prose prose-slate prose-lg max-w-none mb-8">{{.content}}</div>' WHERE slug = 'text' AND html_template = '';

UPDATE block_types SET html_template = '<figure class="mb-8">
  <img src="{{.url}}" alt="{{.alt}}" class="w-full rounded-xl shadow-sm" />
  {{if .caption}}<figcaption class="mt-2 text-center text-sm text-slate-500">{{.caption}}</figcaption>{{end}}
</figure>' WHERE slug = 'image' AND html_template = '';

UPDATE block_types SET html_template = '<section class="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center mb-8">
  <h2 class="text-2xl font-bold text-slate-900 mb-3">{{.heading}}</h2>
  {{if .description}}<p class="text-slate-600 mb-6">{{.description}}</p>{{end}}
  <a href="{{.button_url}}" class="inline-block px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">{{.button_text}}</a>
</section>' WHERE slug = 'cta' AND html_template = '';

UPDATE block_types SET html_template = '<div class="mb-8">
  {{if .title}}<h3 class="text-xl font-bold text-slate-900 mb-4">{{.title}}</h3>{{end}}
  <div class="aspect-video rounded-xl overflow-hidden bg-black">
    <iframe src="{{.url}}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
  </div>
</div>' WHERE slug = 'video' AND html_template = '';

UPDATE block_types SET html_template = '<div class="grid grid-cols-{{if .columns}}{{.columns}}{{else}}3{{end}} gap-4 mb-8">
  {{.images}}
</div>' WHERE slug = 'gallery' AND html_template = '';
