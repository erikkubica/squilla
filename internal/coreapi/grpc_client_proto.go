package coreapi

import (
	"encoding/json"
	"time"

	pb "squilla/pkg/plugin/coreapipb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// This file owns the proto<->Go conversion helpers used by the
// gRPC client. They are pure data transformations (no RPC calls)
// kept separate so the call-site methods stay readable.

func nodeFromProto(msg *pb.NodeMessage) *Node {
	if msg == nil {
		return nil
	}
	n := &Node{
		ID:           uint(msg.Id),
		UUID:         msg.Uuid,
		NodeType:     msg.NodeType,
		Status:       msg.Status,
		LanguageCode: msg.LanguageCode,
		Slug:         msg.Slug,
		FullURL:      msg.FullUrl,
		Title:        msg.Title,
		Excerpt:      msg.Excerpt,
		SeoSettings:  msg.SeoSettings,
	}
	if msg.TaxonomiesJson != "" {
		var tx map[string][]string
		if err := json.Unmarshal([]byte(msg.TaxonomiesJson), &tx); err == nil {
			n.Taxonomies = tx
		}
	}
	if msg.FeaturedImageJson != "" {
		var img any
		if err := json.Unmarshal([]byte(msg.FeaturedImageJson), &img); err == nil {
			n.FeaturedImage = img
		}
	}
	if msg.HasParentId {
		pid := uint(msg.ParentId)
		n.ParentID = &pid
	}
	if msg.PublishedAt != "" {
		if t, err := time.Parse(time.RFC3339, msg.PublishedAt); err == nil {
			n.PublishedAt = &t
		}
	}
	if msg.CreatedAt != "" {
		if t, err := time.Parse(time.RFC3339, msg.CreatedAt); err == nil {
			n.CreatedAt = t
		}
	}
	if msg.UpdatedAt != "" {
		if t, err := time.Parse(time.RFC3339, msg.UpdatedAt); err == nil {
			n.UpdatedAt = t
		}
	}
	if msg.BlocksDataJson != "" {
		var blocks any
		if err := json.Unmarshal([]byte(msg.BlocksDataJson), &blocks); err == nil {
			n.BlocksData = blocks
		}
	}
	if msg.FieldsDataJson != "" {
		var fields map[string]any
		if err := json.Unmarshal([]byte(msg.FieldsDataJson), &fields); err == nil {
			n.FieldsData = fields
		}
	}
	return n
}

func nodeInputToProto(input NodeInput) (*pb.NodeInput, error) {
	pi := &pb.NodeInput{
		NodeType:     input.NodeType,
		Status:       input.Status,
		LanguageCode: input.LanguageCode,
		Slug:         input.Slug,
		Title:        input.Title,
		Excerpt:      input.Excerpt,
		SeoSettings:  input.SeoSettings,
	}
	if input.Taxonomies != nil {
		if b, err := json.Marshal(input.Taxonomies); err == nil {
			pi.TaxonomiesJson = string(b)
		}
	}
	if input.ParentID != nil {
		pi.HasParentId = true
		pi.ParentId = uint32(*input.ParentID)
	}
	if input.FeaturedImage != nil {
		b, err := json.Marshal(input.FeaturedImage)
		if err != nil {
			return nil, NewInternal("failed to marshal featured_image: " + err.Error())
		}
		pi.FeaturedImageJson = string(b)
	}
	if input.BlocksData != nil {
		b, err := json.Marshal(input.BlocksData)
		if err != nil {
			return nil, NewInternal("failed to marshal blocks_data: " + err.Error())
		}
		pi.BlocksDataJson = string(b)
	}
	if input.FieldsData != nil {
		b, err := json.Marshal(input.FieldsData)
		if err != nil {
			return nil, NewInternal("failed to marshal fields_data: " + err.Error())
		}
		pi.FieldsDataJson = string(b)
	}
	return pi, nil
}

func menuFromProto(msg *pb.MenuMessage) *Menu {
	if msg == nil {
		return nil
	}
	m := &Menu{
		ID:   uint(msg.Id),
		Name: msg.Name,
		Slug: msg.Slug,
	}
	if msg.CreatedAt != "" {
		if t, err := time.Parse(time.RFC3339, msg.CreatedAt); err == nil {
			m.CreatedAt = t
		}
	}
	if msg.UpdatedAt != "" {
		if t, err := time.Parse(time.RFC3339, msg.UpdatedAt); err == nil {
			m.UpdatedAt = t
		}
	}
	m.Items = make([]MenuItem, len(msg.Items))
	for i, item := range msg.Items {
		m.Items[i] = menuItemFromProto(item)
	}
	return m
}

func menuItemFromProto(msg *pb.MenuItemMessage) MenuItem {
	if msg == nil {
		return MenuItem{}
	}
	item := MenuItem{
		ID:       uint(msg.Id),
		Label:    msg.Label,
		URL:      msg.Url,
		Target:   msg.Target,
		Position: int(msg.Position),
	}
	if msg.HasParentId {
		pid := uint(msg.ParentId)
		item.ParentID = &pid
	}
	if len(msg.Children) > 0 {
		item.Children = make([]MenuItem, len(msg.Children))
		for i, child := range msg.Children {
			item.Children[i] = menuItemFromProto(child)
		}
	}
	return item
}

func userFromProto(msg *pb.UserMessage) *User {
	if msg == nil {
		return nil
	}
	u := &User{
		ID:       uint(msg.Id),
		Email:    msg.Email,
		Name:     msg.Name,
		RoleSlug: msg.RoleSlug,
	}
	if msg.HasRoleId {
		rid := uint(msg.RoleId)
		u.RoleID = &rid
	}
	if msg.HasLanguageId {
		lid := int(msg.LanguageId)
		u.LanguageID = &lid
	}
	return u
}

func nodeTypeFromProto(msg *pb.NodeTypeMessage) *NodeType {
	if msg == nil {
		return nil
	}
	nt := &NodeType{
		ID:          int(msg.Id),
		Slug:        msg.Slug,
		Label:       msg.Label,
		Icon:        msg.Icon,
		Description: msg.Description,
		URLPrefixes: msg.UrlPrefixes,
	}
	if msg.CreatedAt != "" {
		if t, err := time.Parse(time.RFC3339, msg.CreatedAt); err == nil {
			nt.CreatedAt = t
		}
	}
	if msg.UpdatedAt != "" {
		if t, err := time.Parse(time.RFC3339, msg.UpdatedAt); err == nil {
			nt.UpdatedAt = t
		}
	}
	if msg.TaxonomiesJson != "" {
		var taxes []TaxonomyDefinition
		if err := json.Unmarshal([]byte(msg.TaxonomiesJson), &taxes); err == nil {
			nt.Taxonomies = taxes
		}
	}
	nt.FieldSchema = make([]NodeTypeField, len(msg.FieldSchema))
	for i, f := range msg.FieldSchema {
		nt.FieldSchema[i] = NodeTypeField{
			Name:     f.Name,
			Label:    f.Label,
			Type:     f.Type,
			Required: f.Required,
			Options:  OptionsFromStrings(f.Options),
		}
	}
	if nt.URLPrefixes == nil {
		nt.URLPrefixes = map[string]string{}
	}
	return nt
}

func nodeTypeInputToProto(input NodeTypeInput) *pb.NodeTypeInputMessage {
	msg := &pb.NodeTypeInputMessage{
		Slug:        input.Slug,
		Label:       input.Label,
		Icon:        input.Icon,
		Description: input.Description,
		UrlPrefixes: input.URLPrefixes,
	}
	if input.Taxonomies != nil {
		if b, err := json.Marshal(input.Taxonomies); err == nil {
			msg.TaxonomiesJson = string(b)
		}
	}
	for _, f := range input.FieldSchema {
		msg.FieldSchema = append(msg.FieldSchema, &pb.NodeTypeFieldMessage{
			Name:     f.Name,
			Label:    f.Label,
			Type:     f.Type,
			Required: f.Required,
			Options:  f.OptionsToStrings(),
		})
	}
	return msg
}

func taxonomyTermFromProto(msg *pb.TermMessage) TaxonomyTerm {
	if msg == nil {
		return TaxonomyTerm{}
	}
	t := TaxonomyTerm{
		ID:          uint(msg.Id),
		NodeType:    msg.NodeType,
		Taxonomy:    msg.Taxonomy,
		Slug:        msg.Slug,
		Name:        msg.Name,
		Description: msg.Description,
		Count:       int(msg.Count),
	}
	if msg.CreatedAt != "" {
		if pt, err := time.Parse(time.RFC3339, msg.CreatedAt); err == nil {
			t.CreatedAt = pt
		}
	}
	if msg.UpdatedAt != "" {
		if pt, err := time.Parse(time.RFC3339, msg.UpdatedAt); err == nil {
			t.UpdatedAt = pt
		}
	}
	if msg.HasParentId {
		pid := uint(msg.ParentId)
		t.ParentID = &pid
	}
	return t
}

func taxonomyTermToProto(t *TaxonomyTerm) *pb.TermMessage {
	if t == nil {
		return nil
	}
	msg := &pb.TermMessage{
		Id:          uint32(t.ID),
		NodeType:    t.NodeType,
		Taxonomy:    t.Taxonomy,
		Slug:        t.Slug,
		Name:        t.Name,
		Description: t.Description,
		Count:       int32(t.Count),
		CreatedAt:   t.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   t.UpdatedAt.Format(time.RFC3339),
	}
	if t.ParentID != nil {
		msg.HasParentId = true
		msg.ParentId = uint32(*t.ParentID)
	}
	return msg
}

func taxonomyFromProto(msg *pb.TaxonomyMessage) Taxonomy {
	if msg == nil {
		return Taxonomy{}
	}
	t := Taxonomy{
		ID:          uint(msg.Id),
		Slug:        msg.Slug,
		Label:       msg.Label,
		Description: msg.Description,
		NodeTypes:   msg.NodeTypes,
	}
	if msg.CreatedAt != "" {
		if pt, err := time.Parse(time.RFC3339, msg.CreatedAt); err == nil {
			t.CreatedAt = pt
		}
	}
	if msg.UpdatedAt != "" {
		if pt, err := time.Parse(time.RFC3339, msg.UpdatedAt); err == nil {
			t.UpdatedAt = pt
		}
	}
	t.FieldSchema = make([]NodeTypeField, len(msg.FieldSchema))
	for i, f := range msg.FieldSchema {
		t.FieldSchema[i] = NodeTypeField{
			Name:     f.Name,
			Label:    f.Label,
			Type:     f.Type,
			Required: f.Required,
			Options:  OptionsFromStrings(f.Options),
		}
	}
	return t
}

func taxonomyInputToProto(input TaxonomyInput) *pb.TaxonomyInputMessage {
	msg := &pb.TaxonomyInputMessage{
		Slug:        input.Slug,
		Label:       input.Label,
		Description: input.Description,
		NodeTypes:   input.NodeTypes,
	}
	for _, f := range input.FieldSchema {
		msg.FieldSchema = append(msg.FieldSchema, &pb.NodeTypeFieldMessage{
			Name:     f.Name,
			Label:    f.Label,
			Type:     f.Type,
			Required: f.Required,
			Options:  f.OptionsToStrings(),
		})
	}
	return msg
}

func fromGRPCError(err error) error {
	if err == nil {
		return nil
	}
	st, ok := status.FromError(err)
	if !ok {
		return NewInternal(err.Error())
	}
	switch st.Code() {
	case codes.NotFound:
		return &APIError{Code: ErrNotFound, Message: st.Message()}
	case codes.PermissionDenied:
		return &APIError{Code: ErrCapabilityDenied, Message: st.Message()}
	case codes.InvalidArgument:
		return &APIError{Code: ErrValidation, Message: st.Message()}
	default:
		return &APIError{Code: ErrInternal, Message: st.Message()}
	}
}
