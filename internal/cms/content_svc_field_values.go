package cms

import (
	"encoding/json"
	"errors"
	"fmt"

	"squilla/internal/cms/field_types"
	"squilla/internal/models"
)

// errInvalidFieldValue prefixes field-value validation failures so the
// node handler can map them to a 422 instead of a 500.
var errInvalidFieldValue = errors.New("invalid field value")

func isFieldValueError(err error) bool { return errors.Is(err, errInvalidFieldValue) }

// validateNodeFieldValues checks emoji/icon values in a node's custom
// fields (against its node type schema) and in its blocks (against each
// block type schema). Values for other field types are not inspected.
// fieldsData / blocksData may be raw JSON (models.JSONB / []byte) or the
// decoded map/slice from a PATCH body; nil skips that part.
func (s *ContentService) validateNodeFieldValues(nodeType string, fieldsData, blocksData any) error {
	if s.db == nil {
		return nil
	}
	if fieldsData != nil && nodeType != "" {
		var nt models.NodeType
		if err := s.db.Select("slug, field_schema").Where("slug = ?", nodeType).Limit(1).Find(&nt).Error; err == nil &&
			field_types.SchemaHasStrictFields(json.RawMessage(nt.Fields)) {
			var values map[string]any
			if decodeInto(fieldsData, &values) == nil {
				if err := field_types.ValidateFieldValues(json.RawMessage(nt.Fields), values); err != nil {
					return fmt.Errorf("%w: fields.%s", errInvalidFieldValue, err.Error())
				}
			}
		}
	}
	if blocksData == nil {
		return nil
	}
	var blocks []map[string]any
	if decodeInto(blocksData, &blocks) != nil || len(blocks) == 0 {
		return nil
	}
	slugs := make([]string, 0, len(blocks))
	seen := map[string]bool{}
	for _, b := range blocks {
		if t, _ := b["type"].(string); t != "" && !seen[t] {
			seen[t] = true
			slugs = append(slugs, t)
		}
	}
	if len(slugs) == 0 {
		return nil
	}
	var bts []models.BlockType
	if err := s.db.Select("slug, field_schema").Where("slug IN ?", slugs).Find(&bts).Error; err != nil {
		return nil
	}
	schemas := map[string]json.RawMessage{}
	for _, bt := range bts {
		if field_types.SchemaHasStrictFields(json.RawMessage(bt.Fields)) {
			schemas[bt.Slug] = json.RawMessage(bt.Fields)
		}
	}
	if len(schemas) == 0 {
		return nil
	}
	for i, b := range blocks {
		t, _ := b["type"].(string)
		schema, ok := schemas[t]
		if !ok {
			continue
		}
		fields, _ := b["fields"].(map[string]any)
		if err := field_types.ValidateFieldValues(schema, fields); err != nil {
			return fmt.Errorf("%w: blocks[%d] (%s).%s", errInvalidFieldValue, i, t, err.Error())
		}
	}
	return nil
}

// decodeInto normalises raw JSON or an already-decoded value into dst.
func decodeInto(v any, dst any) error {
	var raw []byte
	switch t := v.(type) {
	case models.JSONB:
		raw = t
	case []byte:
		raw = t
	case json.RawMessage:
		raw = t
	case string:
		raw = []byte(t)
	default:
		b, err := json.Marshal(t)
		if err != nil {
			return err
		}
		raw = b
	}
	if len(raw) == 0 {
		return errors.New("empty")
	}
	return json.Unmarshal(raw, dst)
}
