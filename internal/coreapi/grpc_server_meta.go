package coreapi

import (
	"context"
	"encoding/json"

	pb "squilla/pkg/plugin/coreapipb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// This file holds the taxonomy, settings, event, email, menu,
// and user RPCs of GRPCHostServer.

func (s *GRPCHostServer) RegisterTaxonomy(ctx context.Context, req *pb.TaxonomyInputMessage) (*pb.TaxonomyResponse, error) {
	input := taxonomyInputFromProto(req)
	t, err := s.api.RegisterTaxonomy(s.ctx(ctx), input)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.TaxonomyResponse{Taxonomy: taxonomyToProto(t)}, nil
}

func (s *GRPCHostServer) GetTaxonomy(ctx context.Context, req *pb.GetTaxonomyRequest) (*pb.TaxonomyResponse, error) {
	t, err := s.api.GetTaxonomy(s.ctx(ctx), req.Slug)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.TaxonomyResponse{Taxonomy: taxonomyToProto(t)}, nil
}

func (s *GRPCHostServer) ListTaxonomies(ctx context.Context, _ *pb.Empty) (*pb.TaxonomyListResponse, error) {
	list, err := s.api.ListTaxonomies(s.ctx(ctx))
	if err != nil {
		return nil, grpcError(err)
	}
	pbList := make([]*pb.TaxonomyMessage, len(list))
	for i, t := range list {
		pbList[i] = taxonomyToProto(t)
	}
	return &pb.TaxonomyListResponse{Taxonomies: pbList}, nil
}

func (s *GRPCHostServer) UpdateTaxonomy(ctx context.Context, req *pb.UpdateTaxonomyRequest) (*pb.TaxonomyResponse, error) {
	input := taxonomyInputFromProto(req.Input)
	t, err := s.api.UpdateTaxonomy(s.ctx(ctx), req.Slug, input)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.TaxonomyResponse{Taxonomy: taxonomyToProto(t)}, nil
}

func (s *GRPCHostServer) DeleteTaxonomy(ctx context.Context, req *pb.DeleteTaxonomyRequest) (*pb.Empty, error) {
	if err := s.api.DeleteTaxonomy(s.ctx(ctx), req.Slug); err != nil {
		return nil, grpcError(err)
	}
	return &pb.Empty{}, nil
}

// --- Settings ---

func (s *GRPCHostServer) GetSetting(ctx context.Context, req *pb.GetSettingRequest) (*pb.SettingResponse, error) {
	val, err := s.api.GetSetting(s.ctx(ctx), req.Key)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.SettingResponse{Value: val}, nil
}

func (s *GRPCHostServer) SetSetting(ctx context.Context, req *pb.SetSettingRequest) (*pb.Empty, error) {
	if err := s.api.SetSetting(s.ctx(ctx), req.Key, req.Value); err != nil {
		return nil, grpcError(err)
	}
	return &pb.Empty{}, nil
}

func (s *GRPCHostServer) GetSettings(ctx context.Context, req *pb.GetSettingsRequest) (*pb.SettingsResponse, error) {
	settings, err := s.api.GetSettings(s.ctx(ctx), req.Prefix)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.SettingsResponse{Settings: settings}, nil
}

// --- Event RPCs ---

func (s *GRPCHostServer) EmitEvent(ctx context.Context, req *pb.EmitEventRequest) (*pb.Empty, error) {
	var payload map[string]any
	if req.PayloadJson != "" {
		if err := json.Unmarshal([]byte(req.PayloadJson), &payload); err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid payload JSON: %v", err)
		}
	}
	if err := s.api.Emit(s.ctx(ctx), req.Action, payload); err != nil {
		return nil, grpcError(err)
	}
	return &pb.Empty{}, nil
}

// --- Email RPCs ---

func (s *GRPCHostServer) SendEmail(ctx context.Context, req *pb.SendEmailRequest) (*pb.Empty, error) {
	emailReq := EmailRequest{
		To:      req.To,
		Subject: req.Subject,
		HTML:    req.Html,
	}
	if err := s.api.SendEmail(s.ctx(ctx), emailReq); err != nil {
		return nil, grpcError(err)
	}
	return &pb.Empty{}, nil
}

// --- Menu RPCs ---

func (s *GRPCHostServer) GetMenu(ctx context.Context, req *pb.GetMenuRequest) (*pb.MenuResponse, error) {
	menu, err := s.api.GetMenu(s.ctx(ctx), req.Slug)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.MenuResponse{Menu: menuToProto(menu)}, nil
}

func (s *GRPCHostServer) GetMenus(ctx context.Context, _ *pb.Empty) (*pb.MenuListResponse, error) {
	menus, err := s.api.GetMenus(s.ctx(ctx))
	if err != nil {
		return nil, grpcError(err)
	}
	pbMenus := make([]*pb.MenuMessage, len(menus))
	for i, m := range menus {
		pbMenus[i] = menuToProto(m)
	}
	return &pb.MenuListResponse{Menus: pbMenus}, nil
}

// --- User RPCs ---

func (s *GRPCHostServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.UserResponse, error) {
	user, err := s.api.GetUser(s.ctx(ctx), uint(req.Id))
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.UserResponse{User: userToProto(user)}, nil
}

func (s *GRPCHostServer) QueryUsers(ctx context.Context, req *pb.QueryUsersRequest) (*pb.UserListResponse, error) {
	q := UserQuery{
		RoleSlug: req.RoleSlug,
		Search:   req.Search,
		Limit:    int(req.Limit),
		Offset:   int(req.Offset),
	}
	users, err := s.api.QueryUsers(s.ctx(ctx), q)
	if err != nil {
		return nil, grpcError(err)
	}
	pbUsers := make([]*pb.UserMessage, len(users))
	for i, u := range users {
		pbUsers[i] = userToProto(u)
	}
	return &pb.UserListResponse{Users: pbUsers}, nil
}

// --- Fetch RPCs ---

