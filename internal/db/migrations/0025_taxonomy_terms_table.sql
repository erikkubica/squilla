CREATE TABLE taxonomy_terms (
    id SERIAL PRIMARY KEY,
    node_type VARCHAR(50) NOT NULL,
    taxonomy VARCHAR(50) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    parent_id INTEGER REFERENCES taxonomy_terms(id) ON DELETE SET NULL,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(node_type, taxonomy, slug)
);

-- Migrate existing terms from content_nodes to taxonomy_terms
INSERT INTO taxonomy_terms (node_type, taxonomy, name, slug)
SELECT DISTINCT 
    node_type, 
    'category' as taxonomy, 
    term as name,
    lower(regexp_replace(term, '[^a-zA-Z0-9]+', '-', 'g')) as slug
FROM (
    SELECT node_type, jsonb_array_elements_text(taxonomies->'category') as term 
    FROM content_nodes
) as t
ON CONFLICT DO NOTHING;
