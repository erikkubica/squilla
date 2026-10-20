-- 0045_node_types_public.sql
--
-- Node types can be non-public: their nodes are editable content used by
-- other pages (reviews, FAQs, team members) but have no page of their own.
-- The public router returns 404 for them and the sitemap leaves them out.

ALTER TABLE node_types ADD COLUMN IF NOT EXISTS public BOOLEAN NOT NULL DEFAULT TRUE;
