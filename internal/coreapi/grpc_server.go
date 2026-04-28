package coreapi

import (
	"context"
	"encoding/json"

	pb "squilla/pkg/plugin/coreapipb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// GRPCHostServer implements SquillaHostServer by wrapping a CoreAPI instance.
type GRPCHostServer struct {
	pb.UnimplementedSquillaHostServer
	api    CoreAPI
	caller CallerInfo
}

// NewGRPCHostServer creates a new gRPC host server that delegates to the given CoreAPI.
func NewGRPCHostServer(api CoreAPI, caller CallerInfo) *GRPCHostServer {
	return &GRPCHostServer{api: api, caller: caller}
}

func (s *GRPCHostServer) ctx(ctx context.Context) context.Context {
	return WithCaller(ctx, s.caller)
}

// --- Node RPCs ---

func (s *GRPCHostServer) GetNode(ctx context.Context, req *pb.GetNodeRequest) (*pb.NodeResponse, error) {
	node, err := s.api.GetNode(s.ctx(ctx), uint(req.Id))
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.NodeResponse{Node: nodeToProto(node)}, nil
}

func (s *GRPCHostServer) QueryNodes(ctx context.Context, req *pb.QueryNodesRequest) (*pb.QueryNodesResponse, error) {
	q := NodeQuery{
		NodeType:     req.NodeType,
		Status:       req.Status,
		LanguageCode: req.LanguageCode,
		Slug:         req.Slug,
		Search:       req.Search,
		Limit:        int(req.Limit),
		Offset:       int(req.Offset),
		OrderBy:      req.OrderBy,
		Category:     req.Category,
	}
	if req.TaxQueryJson != "" {
		var tq map[string][]string
		if err := json.Unmarshal([]byte(req.TaxQueryJson), &tq); err == nil {
			q.TaxQuery = tq
		}
	}
	if req.HasParentId {
		pid := uint(req.ParentId)
		q.ParentID = &pid
	}
	list, err := s.api.QueryNodes(s.ctx(ctx), q)
	if err != nil {
		return nil, grpcError(err)
	}
	nodes := make([]*pb.NodeMessage, len(list.Nodes))
	for i, n := range list.Nodes {
		nodes[i] = nodeToProto(n)
	}
	return &pb.QueryNodesResponse{Nodes: nodes, Total: list.Total}, nil
}

func (s *GRPCHostServer) ListTaxonomyTerms(ctx context.Context, req *pb.ListTaxonomyTermsRequest) (*pb.ListTaxonomyTermsResponse, error) {
	terms, err := s.api.ListTaxonomyTerms(s.ctx(ctx), req.NodeType, req.Taxonomy)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.ListTaxonomyTermsResponse{Terms: terms}, nil
}

func (s *GRPCHostServer) CreateNode(ctx context.Context, req *pb.CreateNodeRequest) (*pb.NodeResponse, error) {
	input, err := nodeInputFromProto(req.Input)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid input: %v", err)
	}
	node, err := s.api.CreateNode(s.ctx(ctx), input)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.NodeResponse{Node: nodeToProto(node)}, nil
}

func (s *GRPCHostServer) UpdateNode(ctx context.Context, req *pb.UpdateNodeRequest) (*pb.NodeResponse, error) {
	input, err := nodeInputFromProto(req.Input)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid input: %v", err)
	}
	node, err := s.api.UpdateNode(s.ctx(ctx), uint(req.Id), input)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.NodeResponse{Node: nodeToProto(node)}, nil
}

func (s *GRPCHostServer) DeleteNode(ctx context.Context, req *pb.DeleteNodeRequest) (*pb.Empty, error) {
	if err := s.api.DeleteNode(s.ctx(ctx), uint(req.Id)); err != nil {
		return nil, grpcError(err)
	}
	return &pb.Empty{}, nil
}

// --- Taxonomies ---

func (s *GRPCHostServer) ListTerms(ctx context.Context, req *pb.ListTermsRequest) (*pb.ListTermsResponse, error) {
	list, err := s.api.ListTerms(s.ctx(ctx), req.NodeType, req.Taxonomy)
	if err != nil {
		return nil, grpcError(err)
	}
	terms := make([]*pb.TermMessage, len(list))
	for i, t := range list {
		terms[i] = termToProto(t)
	}
	return &pb.ListTermsResponse{Terms: terms}, nil
}

func (s *GRPCHostServer) GetTerm(ctx context.Context, req *pb.GetTermRequest) (*pb.TermResponse, error) {
	t, err := s.api.GetTerm(s.ctx(ctx), uint(req.Id))
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.TermResponse{Term: termToProto(t)}, nil
}

func (s *GRPCHostServer) CreateTerm(ctx context.Context, req *pb.CreateTermRequest) (*pb.TermResponse, error) {
	t := termFromProto(req.Term)
	created, err := s.api.CreateTerm(s.ctx(ctx), &t)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.TermResponse{Term: termToProto(created)}, nil
}

func (s *GRPCHostServer) UpdateTerm(ctx context.Context, req *pb.UpdateTermRequest) (*pb.TermResponse, error) {
	var updates map[string]interface{}
	if err := json.Unmarshal([]byte(req.UpdatesJson), &updates); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid updates JSON: %v", err)
	}
	updated, err := s.api.UpdateTerm(s.ctx(ctx), uint(req.Id), updates)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.TermResponse{Term: termToProto(updated)}, nil
}

func (s *GRPCHostServer) DeleteTerm(ctx context.Context, req *pb.DeleteTermRequest) (*pb.Empty, error) {
	if err := s.api.DeleteTerm(s.ctx(ctx), uint(req.Id)); err != nil {
		return nil, grpcError(err)
	}
	return &pb.Empty{}, nil
}

// --- Taxonomy Definitions ---

