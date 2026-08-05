-- =============================================================================
-- AppAlter: MODULE 1 — SEED DATA
-- Migration: 0005_seed_data.sql
-- Description: Bootstrap data: platforms, pricing models, categories,
--              feature flags, and import sources. Production-ready references.
-- =============================================================================

-- =============================================================================
-- PLATFORMS
-- =============================================================================
INSERT INTO public.platforms (slug, name, icon_url, sort_order) VALUES
  ('web',      'Web',     '/icons/platforms/web.svg',     1),
  ('windows',  'Windows', '/icons/platforms/windows.svg', 2),
  ('macos',    'macOS',   '/icons/platforms/macos.svg',   3),
  ('linux',    'Linux',   '/icons/platforms/linux.svg',   4),
  ('ios',      'iOS',     '/icons/platforms/ios.svg',     5),
  ('android',  'Android', '/icons/platforms/android.svg', 6),
  ('chrome',   'Chrome Extension', '/icons/platforms/chrome.svg', 7),
  ('firefox',  'Firefox Extension', '/icons/platforms/firefox.svg', 8),
  ('vscode',   'VS Code Extension', '/icons/platforms/vscode.svg', 9),
  ('cli',      'CLI / Terminal', '/icons/platforms/cli.svg', 10),
  ('api',      'API / REST', '/icons/platforms/api.svg',  11),
  ('docker',   'Docker',  '/icons/platforms/docker.svg',  12)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- PRICING MODELS
-- =============================================================================
INSERT INTO public.pricing_models (slug, name, description, sort_order) VALUES
  ('free',          'Free',           'Completely free forever, no limitations.',                  1),
  ('open-source',   'Open Source',    'Source code available under an open-source license.',       2),
  ('freemium',      'Freemium',       'Free tier available; paid plans unlock premium features.',  3),
  ('free-trial',    'Free Trial',     'Time-limited trial; credit card may be required.',          4),
  ('subscription',  'Subscription',   'Monthly or annual subscription pricing.',                   5),
  ('one-time',      'One-Time',       'Pay once, use forever (perpetual license).',                6),
  ('usage-based',   'Usage-Based',    'Pay only for what you use (API calls, seats, storage).',    7),
  ('enterprise',    'Enterprise',     'Custom pricing for large organizations; contact sales.',    8),
  ('paid',          'Paid',           'Paid product, no free tier available.',                     9)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- CATEGORIES (hierarchical)
-- Top-level categories covering all major software verticals
-- =============================================================================

-- Top-level categories
INSERT INTO public.categories (slug, name, description, sort_order, is_featured) VALUES
  ('project-management',      'Project Management',       'Plan, track, and manage projects and tasks.',                  1,  TRUE),
  ('design',                  'Design',                   'UI/UX design, graphic design, and prototyping tools.',         2,  TRUE),
  ('development',             'Development',              'Code editors, IDEs, and developer productivity tools.',        3,  TRUE),
  ('communication',           'Communication',            'Team messaging, video conferencing, and collaboration.',       4,  TRUE),
  ('marketing',               'Marketing',                'Email marketing, SEO, social media, and analytics.',           5,  TRUE),
  ('analytics',               'Analytics',                'Business intelligence, data visualization, and reporting.',    6,  TRUE),
  ('crm',                     'CRM',                      'Customer relationship management and sales tools.',            7,  TRUE),
  ('finance',                 'Finance & Accounting',     'Invoicing, accounting, payroll, and expense management.',      8,  TRUE),
  ('hr',                      'HR & Recruitment',         'Human resources, recruiting, and employee management.',        9,  FALSE),
  ('security',                'Security',                 'Cybersecurity, password managers, and VPN tools.',            10, TRUE),
  ('productivity',            'Productivity',             'Note-taking, task management, and personal productivity.',    11, TRUE),
  ('storage',                 'Storage & File Sharing',   'Cloud storage, file sync, and document management.',          12, FALSE),
  ('ai',                      'AI & Machine Learning',    'AI tools, LLMs, image generation, and automation.',           13, TRUE),
  ('e-commerce',              'E-Commerce',               'Online store builders and e-commerce platforms.',             14, FALSE),
  ('cms',                     'CMS',                      'Content management systems and website builders.',            15, FALSE),
  ('database',                'Databases',                'SQL, NoSQL, NewSQL, and cloud database services.',            16, FALSE),
  ('devops',                  'DevOps & CI/CD',           'Deployment, monitoring, container management, and CI/CD.',    17, FALSE),
  ('testing',                 'Testing & QA',             'Automated testing, bug tracking, and quality assurance.',     18, FALSE),
  ('customer-support',        'Customer Support',         'Help desk, live chat, and customer success platforms.',       19, FALSE),
  ('video',                   'Video',                    'Video editing, conferencing, streaming, and hosting.',        20, FALSE),
  ('audio',                   'Audio & Podcasting',       'Audio editing, recording, and podcast tools.',                21, FALSE),
  ('email',                   'Email',                    'Email clients, marketing automation, and newsletter tools.',  22, FALSE),
  ('documentation',           'Documentation',            'Technical writing, wikis, and knowledge bases.',              23, FALSE),
  ('automation',              'Automation & Workflow',    'No-code/low-code automation and integration platforms.',      24, FALSE),
  ('data-engineering',        'Data Engineering',         'ETL, data pipelines, and data warehousing.',                 25, FALSE),
  ('cloud',                   'Cloud Platforms',          'IaaS, PaaS, and cloud computing services.',                  26, FALSE),
  ('monitoring',              'Monitoring & Observability','Application performance monitoring and logging.',            27, FALSE),
  ('version-control',         'Version Control',          'Git hosting, code review, and repository management.',       28, FALSE),
  ('api-tools',               'API Tools',                'API design, testing, documentation, and management.',        29, FALSE),
  ('low-code',                'Low-Code / No-Code',       'Visual development platforms for non-developers.',           30, FALSE)
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories (project-management)
INSERT INTO public.categories (slug, name, description, sort_order, parent_id)
SELECT
  'kanban',
  'Kanban Boards',
  'Visual kanban-style project management tools.',
  1,
  id
FROM public.categories WHERE slug = 'project-management'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name, description, sort_order, parent_id)
SELECT
  'agile',
  'Agile & Scrum',
  'Sprint planning, backlog management, and agile methodology tools.',
  2,
  id
FROM public.categories WHERE slug = 'project-management'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name, description, sort_order, parent_id)
SELECT
  'gantt-charts',
  'Gantt Charts',
  'Timeline and Gantt chart project management tools.',
  3,
  id
FROM public.categories WHERE slug = 'project-management'
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories (design)
INSERT INTO public.categories (slug, name, description, sort_order, parent_id)
SELECT
  'ui-ux-design',
  'UI/UX Design',
  'Wireframing, prototyping, and user interface design.',
  1,
  id
FROM public.categories WHERE slug = 'design'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name, description, sort_order, parent_id)
SELECT
  'graphic-design',
  'Graphic Design',
  'Vector graphics, image editing, and brand design tools.',
  2,
  id
FROM public.categories WHERE slug = 'design'
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories (development)
INSERT INTO public.categories (slug, name, description, sort_order, parent_id)
SELECT
  'code-editors',
  'Code Editors & IDEs',
  'Source code editors and integrated development environments.',
  1,
  id
FROM public.categories WHERE slug = 'development'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name, description, sort_order, parent_id)
SELECT
  'api-development',
  'API Development',
  'REST/GraphQL API design, testing, and documentation tools.',
  2,
  id
FROM public.categories WHERE slug = 'development'
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- FEATURE FLAGS
-- =============================================================================
INSERT INTO public.feature_flags (key, value, description, rollout_pct) VALUES
  ('hybrid_search_enabled',       'true',  'Enable hybrid FTS+vector search', 100),
  ('ai_descriptions_enabled',     'true',  'Show AI-generated descriptions on software pages', 100),
  ('geo_endpoints_enabled',       'true',  'Enable /api/ai/[slug] GEO endpoints', 100),
  ('affiliate_tracking_enabled',  'true',  'Enable affiliate click tracking', 100),
  ('review_submissions_enabled',  'true',  'Allow users to submit reviews', 100),
  ('ppr_enabled',                 'true',  'Enable Next.js Partial Prerendering', 100),
  ('sitemap_comprisons_enabled',  'true',  'Include comparison pages in sitemap', 100),
  ('editorial_workflow_enabled',  'true',  'Require editorial approval before publishing', 100),
  ('auto_embed_on_publish',       'true',  'Auto-generate embeddings when software is published', 100),
  ('maintenance_mode',            'false', 'Put the site into maintenance mode', 0)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- IMPORT SOURCES (demo sources — populate with real endpoints)
-- =============================================================================
INSERT INTO public.import_sources (name, slug, source_type, fetch_interval, is_active, config) VALUES
  (
    'ProductHunt RSS',
    'producthunt-rss',
    'rss',
    3600,
    FALSE,
    '{"category_mapping": {"productivity": "productivity", "developer-tools": "development"}}'::jsonb
  ),
  (
    'Hacker News Show HN',
    'hackernews-show-hn',
    'api',
    7200,
    FALSE,
    '{"endpoint": "https://hn.algolia.com/api/v1/search?tags=show_hn", "per_page": 20}'::jsonb
  ),
  (
    'Alternativeto.net Scraper',
    'alternativeto-scraper',
    'scraper',
    86400,
    FALSE,
    '{"rate_limit_rpm": 10, "user_agent": "AppAlterBot/1.0"}'::jsonb
  ),
  (
    'GitHub Trending',
    'github-trending',
    'api',
    21600,
    FALSE,
    '{"languages": ["javascript","typescript","python","go","rust"], "since": "weekly"}'::jsonb
  ),
  (
    'Manual Editorial Input',
    'manual-editorial',
    'manual',
    0,
    TRUE,
    '{}'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;
