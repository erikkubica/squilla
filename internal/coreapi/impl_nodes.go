package coreapi

import (
	"context"
	"encoding/json"
	"fmt"

	"vibecms/internal/models"
)

// nodeFromModel converts a GORM ContentNode model to a CoreAPI Node.
func nodeFromModel(m *models.ContentNode) *Node {
	n := &Node{
		ID:           uint(m.ID),
		UUID:         m.UUID,
		NodeType:     m.NodeType,
		Status:       m.Status,
		LanguageCode: m.LanguageCode,
		Slug:         m.Slug,
		FullURL:      m.FullURL,
		Title:        m.Title,
		PublishedAt:  m.PublishedAt,
		CreatedAt:    m.CreatedAt,
		UpdatedAt:    m.UpdatedAt,
	}

	if m.ParentID != nil {
		pid := uint(*m.ParentID)
		n.ParentID = &pid
	}

	// Unmarshal JSONB fields into their CoreAPI representations.
	if len(m.BlocksData) > 0 {
		var bd any
		if err := json.Unmarshal([]byte(m.BlocksData), &bd); err == nil {
			n.BlocksData = bd
		}
	}
	if len(m.FieldsData) > 0 {
		var fd map[string]any
		if err := json.Unmarshal([]byte(m.FieldsData), &fd); err == nil {
			n.FieldsData = fd
		}
	}
	if len(m.SeoSettings) > 0 {
		var ss map[string]string
		if err := json.Unmarshal([]byte(m.SeoSettings), &ss); err == nil {
			n.SeoSettings = ss
		}
	}

	return n
}

// GetNode retrieves a single content node by ID.
func (c *coreImpl) GetNode(_ context.Context, id uint) (*Node, error) {
	m, err := c.contentSvc.GetByID(int(id))
	if err != nil {
		return nil, fmt.Errorf("coreapi GetNode: %w", err)
	}
	return nodeFromModel(m), nil
}

// QueryNodes searches content nodes with optional filters and pagination.
func (c *coreImpl) QueryNodes(_ context.Context, q NodeQuery) (*NodeList, error) {
	query := c.db.Model(&models.ContentNode{})

	if q.NodeType != "" {
		query = query.Where("node_type = ?", q.NodeType)
	}
	if q.Status != "" {
		query = query.Where("status = ?", q.Status)
	}
	if q.ParentID != nil {
		query = query.Where("parent_id = ?", *q.ParentID)
	}
	if q.LanguageCode != "" {
		query = query.Where("language_code = ?", q.LanguageCode)
	}
	if q.Slug != "" {
		query = query.Where("slug = ?", q.Slug)
	}
	if q.Search != "" {
		query = query.Where("title ILIKE ?", "%"+q.Search+"%")
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("coreapi QueryNodes count: %w", err)
	}

	orderBy := "created_at DESC"
	if q.OrderBy != "" {
		orderBy = q.OrderBy
	}
	query = query.Order(orderBy)

	if q.Limit > 0 {
		query = query.Limit(q.Limit)
	}
	if q.Offset > 0 {
		query = query.Offset(q.Offset)
	}

	var rows []models.ContentNode
	if err := query.Find(&rows).Error; err != nil {
		return nil, fmt.Errorf("coreapi QueryNodes: %w", err)
	}

	nodes := make([]*Node, len(rows))
	for i := range rows {
		nodes[i] = nodeFromModel(&rows[i])
	}

	return &NodeList{Nodes: nodes, Total: total}, nil
}

// CreateNode creates a new content node, defaulting type to "page" and status to "draft".
func (c *coreImpl) CreateNode(_ context.Context, input NodeInput) (*Node, error) {
	m := &models.ContentNode{
		Title:        input.Title,
		Slug:         input.Slug,
		NodeType:     input.NodeType,
		Status:       input.Status,
		LanguageCode: input.LanguageCode,
	}

	if m.NodeType == "" {
		m.NodeType = "page"
	}
	if m.Status == "" {
		m.Status = "draft"
	}
	if m.LanguageCode == "" {
		m.LanguageCode = "en"
	}

	if input.ParentID != nil {
		pid := int(*input.ParentID)
		m.ParentID = &pid
	}

	if input.BlocksData != nil {
		b, err := json.Marshal(input.BlocksData)
		if err != nil {
			return nil, fmt.Errorf("coreapi CreateNode marshal blocks: %w", err)
		}
		m.BlocksData = models.JSONB(b)
	}
	if input.FieldsData != nil {
		b, err := json.Marshal(input.FieldsData)
		if err != nil {
			return nil, fmt.Errorf("coreapi CreateNode marshal fields: %w", err)
		}
		m.FieldsData = models.JSONB(b)
	}
	if input.SeoSettings != nil {
		b, err := json.Marshal(input.SeoSettings)
		if err != nil {
			return nil, fmt.Errorf("coreapi CreateNode marshal seo: %w", err)
		}
		m.SeoSettings = models.JSONB(b)
	}

	// Use ContentService.Create (userID 0 = system/extension).
	if err := c.contentSvc.Create(m, 0); err != nil {
		return nil, fmt.Errorf("coreapi CreateNode: %w", err)
	}

	return nodeFromModel(m), nil
}

// UpdateNode updates an existing node, applying only non-zero fields from input.
func (c *coreImpl) UpdateNode(_ context.Context, id uint, input NodeInput) (*Node, error) {
	updates := make(map[string]interface{})

	if input.Title != "" {
		updates["title"] = input.Title
	}
	if input.Slug != "" {
		updates["slug"] = input.Slug
	}
	if input.NodeType != "" {
		updates["node_type"] = input.NodeType
	}
	if input.Status != "" {
		updates["status"] = input.Status
	}
	if input.LanguageCode != "" {
		updates["language_code"] = input.LanguageCode
	}
	if input.ParentID != nil {
		updates["parent_id"] = int(*input.ParentID)
	}
	if input.BlocksData != nil {
		updates["blocks_data"] = input.BlocksData
	}
	if input.FieldsData != nil {
		updates["fields_data"] = input.FieldsData
	}
	if input.SeoSettings != nil {
		updates["seo_settings"] = input.SeoSettings
	}

	// Use ContentService.Update (userID 0 = system/extension).
	m, err := c.contentSvc.Update(int(id), updates, 0)
	if err != nil {
		return nil, fmt.Errorf("coreapi UpdateNode: %w", err)
	}

	return nodeFromModel(m), nil
}

// DeleteNode soft-deletes a content node by ID.
func (c *coreImpl) DeleteNode(_ context.Context, id uint) error {
	if err := c.contentSvc.Delete(int(id)); err != nil {
		return fmt.Errorf("coreapi DeleteNode: %w", err)
	}
	return nil
}
