package coreapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	pb "squilla/pkg/plugin/coreapipb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// This file owns the proto<->Go converters used by the gRPC host
// server. They mirror grpc_client_proto.go on the server side and
// stay separate so the call-site RPCs are easier to read.

func nodeToProto(n *Node) *pb.NodeMessage {
	if n == nil {
		return nil
	}
	msg := &pb.NodeMessage{
		Id:           uint32(n.ID),
		Uuid:         n.UUID,
		NodeType:     n.NodeType,
		Status:       n.Status,
		LanguageCode: n.LanguageCode,
		Slug:         n.Slug,
		FullUrl:      n.FullURL,
		Title:        n.Title,
		Excerpt:      n.Excerpt,
		SeoSettings:  n.SeoSettings,
		CreatedAt:    n.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    n.UpdatedAt.Format(time.RFC3339),
	}
	if n.Taxonomies != nil {
		if b, err := json.Marshal(n.Taxonomies); err == nil {
			msg.TaxonomiesJson = string(b)
		}
	}
	if n.FeaturedImage != nil {
		if b, err := json.Marshal(n.FeaturedImage); err == nil {
			msg.FeaturedImageJson = string(b)
		}
	}
	if n.ParentID != nil {
		msg.HasParentId = true
		msg.ParentId = uint32(*n.ParentID)
	}
	if n.PublishedAt != nil {
		msg.PublishedAt = n.PublishedAt.Format(time.RFC3339)
	}
	if n.BlocksData != nil {
		if b, err := json.Marshal(n.BlocksData); err == nil {
			msg.BlocksDataJson = string(b)
		}
	}
	if n.FieldsData != nil {
		if b, err := json.Marshal(n.FieldsData); err == nil {
			msg.FieldsDataJson = string(b)
		}
	}
	return msg
}

func nodeInputFromProto(inp *pb.NodeInput) (NodeInput, error) {
	if inp == nil {
		return NodeInput{}, fmt.Errorf("nil input")
	}
	ni := NodeInput{
		NodeType:     inp.NodeType,
		Status:       inp.Status,
		LanguageCode: inp.LanguageCode,
		Slug:         inp.Slug,
		Title:        inp.Title,
		Excerpt:      inp.Excerpt,
		SeoSettings:  inp.SeoSettings,
	}
	if inp.TaxonomiesJson != "" {
		var tx map[string][]string
		if err := json.Unmarshal([]byte(inp.TaxonomiesJson), &tx); err == nil {
			ni.Taxonomies = tx
		}
	}
	if inp.FeaturedImageJson != "" {
		var img any
		if err := json.Unmarshal([]byte(inp.FeaturedImageJson), &img); err != nil {
			return NodeInput{}, fmt.Errorf("invalid featured_image JSON: %w", err)
		}
		ni.FeaturedImage = img
	}
	if inp.HasParentId {
		pid := uint(inp.ParentId)
		ni.ParentID = &pid
	}
	if inp.BlocksDataJson != "" {
		var blocks any
		if err := json.Unmarshal([]byte(inp.BlocksDataJson), &blocks); err != nil {
			return NodeInput{}, fmt.Errorf("invalid blocks_data JSON: %w", err)
		}
		ni.BlocksData = blocks
	}
	if inp.FieldsDataJson != "" {
		var fields map[string]any
		if err := json.Unmarshal([]byte(inp.FieldsDataJson), &fields); err != nil {
			return NodeInput{}, fmt.Errorf("invalid fields_data JSON: %w", err)
		}
		ni.FieldsData = fields
	}
	return ni, nil
}

func menuToProto(m *Menu) *pb.MenuMessage {
	if m == nil {
		return nil
	}
	items := make([]*pb.MenuItemMessage, len(m.Items))
	for i, item := range m.Items {
		items[i] = menuItemToProto(item)
	}
	return &pb.MenuMessage{
		Id:        uint32(m.ID),
		Name:      m.Name,
		Slug:      m.Slug,
		Items:     items,
		CreatedAt: m.CreatedAt.Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.Format(time.RFC3339),
	}
}

func menuItemToProto(item MenuItem) *pb.MenuItemMessage {
	msg := &pb.MenuItemMessage{
		Id:       uint32(item.ID),
		Label:    item.Label,
		Url:      item.URL,
		Target:   item.Target,
		Position: int32(item.Position),
	}
	if item.ParentID != nil {
		msg.HasParentId = true
		msg.ParentId = uint32(*item.ParentID)
	}
	if len(item.Children) > 0 {
		msg.Children = make([]*pb.MenuItemMessage, len(item.Children))
		for i, child := range item.Children {
			msg.Children[i] = menuItemToProto(child)
		}
	}
	return msg
}

func userToProto(u *User) *pb.UserMessage {
	if u == nil {
		return nil
	}
	msg := &pb.UserMessage{
		Id:       uint32(u.ID),
		Email:    u.Email,
		Name:     u.Name,
		RoleSlug: u.RoleSlug,
	}
	if u.RoleID != nil {
		msg.HasRoleId = true
		msg.RoleId = uint32(*u.RoleID)
	}
	if u.LanguageID != nil {
		msg.HasLanguageId = true
		msg.LanguageId = int32(*u.LanguageID)
	}
	return msg
}

func nodeTypeToProto(nt *NodeType) *pb.NodeTypeMessage {
	if nt == nil {
		return nil
	}
	fields := make([]*pb.NodeTypeFieldMessage, len(nt.FieldSchema))
	for i, f := range nt.FieldSchema {
		fields[i] = &pb.NodeTypeFieldMessage{
			Name:     f.Name,
			Label:    f.Label,
			Type:     f.Type,
			Required: f.Required,
			Options:  f.OptionsToStrings(),
		}
	}
	msg := &pb.NodeTypeMessage{
		Id:          int32(nt.ID),
		Slug:        nt.Slug,
		Label:       nt.Label,
		Icon:        nt.Icon,
		Description: nt.Description,
		FieldSchema: fields,
		UrlPrefixes: nt.URLPrefixes,
		CreatedAt:   nt.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   nt.UpdatedAt.Format(time.RFC3339),
	}
	if nt.Taxonomies != nil {
		if b, err := json.Marshal(nt.Taxonomies); err == nil {
			msg.TaxonomiesJson = string(b)
		}
	}
	return msg
}

func nodeTypeInputFromProto(inp *pb.NodeTypeInputMessage) NodeTypeInput {
	if inp == nil {
		return NodeTypeInput{}
	}
	var fields []NodeTypeField
	for _, f := range inp.FieldSchema {
		fields = append(fields, NodeTypeField{
			Name:     f.Name,
			Label:    f.Label,
			Type:     f.Type,
			Required: f.Required,
			Options:  OptionsFromStrings(f.Options),
		})
	}
	ni := NodeTypeInput{
		Slug:        inp.Slug,
		Label:       inp.Label,
		Icon:        inp.Icon,
		Description: inp.Description,
		FieldSchema: fields,
		URLPrefixes: inp.UrlPrefixes,
	}
	if inp.TaxonomiesJson != "" {
		var taxes []TaxonomyDefinition
		if err := json.Unmarshal([]byte(inp.TaxonomiesJson), &taxes); err == nil {
			ni.Taxonomies = taxes
		}
	}
	return ni
}

func termToProto(t *TaxonomyTerm) *pb.TermMessage {
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
	if t.FieldsData != nil {
		if b, err := json.Marshal(t.FieldsData); err == nil {
			msg.FieldsDataJson = string(b)
		}
	}
	return msg
}

func termFromProto(msg *pb.TermMessage) TaxonomyTerm {
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
	if msg.HasParentId {
		pid := uint(msg.ParentId)
		t.ParentID = &pid
	}
	if msg.FieldsDataJson != "" {
		var fields map[string]any
		if err := json.Unmarshal([]byte(msg.FieldsDataJson), &fields); err == nil {
			t.FieldsData = fields
		}
	}
	return t
}

func taxonomyToProto(t *Taxonomy) *pb.TaxonomyMessage {
	if t == nil {
		return nil
	}
	fields := make([]*pb.NodeTypeFieldMessage, len(t.FieldSchema))
	for i, f := range t.FieldSchema {
		fields[i] = &pb.NodeTypeFieldMessage{
			Name:     f.Name,
			Label:    f.Label,
			Type:     f.Type,
			Required: f.Required,
			Options:  f.OptionsToStrings(),
		}
	}
	return &pb.TaxonomyMessage{
		Id:          uint32(t.ID),
		Slug:        t.Slug,
		Label:       t.Label,
		Description: t.Description,
		NodeTypes:   t.NodeTypes,
		FieldSchema: fields,
		CreatedAt:   t.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   t.UpdatedAt.Format(time.RFC3339),
	}
}

func taxonomyInputFromProto(inp *pb.TaxonomyInputMessage) TaxonomyInput {
	if inp == nil {
		return TaxonomyInput{}
	}
	var fields []NodeTypeField
	for _, f := range inp.FieldSchema {
		fields = append(fields, NodeTypeField{
			Name:     f.Name,
			Label:    f.Label,
			Type:     f.Type,
			Required: f.Required,
			Options:  OptionsFromStrings(f.Options),
		})
	}
	return TaxonomyInput{
		Slug:        inp.Slug,
		Label:       inp.Label,
		Description: inp.Description,
		NodeTypes:   inp.NodeTypes,
		FieldSchema: fields,
	}
}

func grpcError(err error) error {
	if err == nil {
		return nil
	}
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		switch {
		case errors.Is(apiErr.Code, ErrNotFound):
			return status.Error(codes.NotFound, apiErr.Message)
		case errors.Is(apiErr.Code, ErrCapabilityDenied):
			return status.Error(codes.PermissionDenied, apiErr.Message)
		case errors.Is(apiErr.Code, ErrValidation):
			return status.Error(codes.InvalidArgument, apiErr.Message)
		case errors.Is(apiErr.Code, ErrInternal):
			return status.Error(codes.Internal, apiErr.Message)
		}
	}
	return status.Error(codes.Internal, err.Error())
}
