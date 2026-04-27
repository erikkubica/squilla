package coreapi

import (
	"context"
	"encoding/json"

	pb "vibecms/pkg/plugin/coreapipb"
)

// Compile-time check that GRPCHostClient implements CoreAPI.
var _ CoreAPI = (*GRPCHostClient)(nil)

// GRPCHostClient implements CoreAPI by calling VibeCMSHost over gRPC.
type GRPCHostClient struct {
	client pb.VibeCMSHostClient
}

// NewGRPCHostClient creates a new CoreAPI client that delegates to a gRPC connection.
func NewGRPCHostClient(client pb.VibeCMSHostClient) *GRPCHostClient {
	return &GRPCHostClient{client: client}
}

// --- Nodes ---

func (c *GRPCHostClient) GetNode(ctx context.Context, id uint) (*Node, error) {
	resp, err := c.client.GetNode(ctx, &pb.GetNodeRequest{Id: uint32(id)})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	return nodeFromProto(resp.Node), nil
}

func (c *GRPCHostClient) QueryNodes(ctx context.Context, query NodeQuery) (*NodeList, error) {
	req := &pb.QueryNodesRequest{
		NodeType:     query.NodeType,
		Status:       query.Status,
		LanguageCode: query.LanguageCode,
		Slug:         query.Slug,
		Search:       query.Search,
		Limit:        int32(query.Limit),
		Offset:       int32(query.Offset),
		OrderBy:      query.OrderBy,
		Category:     query.Category,
	}
	if len(query.TaxQuery) > 0 {
		if b, err := json.Marshal(query.TaxQuery); err == nil {
			req.TaxQueryJson = string(b)
		}
	}
	if query.ParentID != nil {
		req.HasParentId = true
		req.ParentId = uint32(*query.ParentID)
	}
	resp, err := c.client.QueryNodes(ctx, req)
	if err != nil {
		return nil, fromGRPCError(err)
	}
	nodes := make([]*Node, len(resp.Nodes))
	for i, n := range resp.Nodes {
		nodes[i] = nodeFromProto(n)
	}
	return &NodeList{Nodes: nodes, Total: resp.Total}, nil
}

func (c *GRPCHostClient) ListTaxonomyTerms(ctx context.Context, nodeType string, taxonomy string) ([]string, error) {
	resp, err := c.client.ListTaxonomyTerms(ctx, &pb.ListTaxonomyTermsRequest{
		NodeType: nodeType,
		Taxonomy: taxonomy,
	})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	return resp.Terms, nil
}

func (c *GRPCHostClient) CreateNode(ctx context.Context, input NodeInput) (*Node, error) {
	pbInput, err := nodeInputToProto(input)
	if err != nil {
		return nil, err
	}
	resp, err := c.client.CreateNode(ctx, &pb.CreateNodeRequest{Input: pbInput})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	return nodeFromProto(resp.Node), nil
}

func (c *GRPCHostClient) UpdateNode(ctx context.Context, id uint, input NodeInput) (*Node, error) {
	pbInput, err := nodeInputToProto(input)
	if err != nil {
		return nil, err
	}
	resp, err := c.client.UpdateNode(ctx, &pb.UpdateNodeRequest{Id: uint32(id), Input: pbInput})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	return nodeFromProto(resp.Node), nil
}

func (c *GRPCHostClient) DeleteNode(ctx context.Context, id uint) error {
	_, err := c.client.DeleteNode(ctx, &pb.DeleteNodeRequest{Id: uint32(id)})
	if err != nil {
		return fromGRPCError(err)
	}
	return nil
}

// --- Taxonomies ---

func (c *GRPCHostClient) ListTerms(ctx context.Context, nodeType string, taxonomy string) ([]*TaxonomyTerm, error) {
	resp, err := c.client.ListTerms(ctx, &pb.ListTermsRequest{
		NodeType: nodeType,
		Taxonomy: taxonomy,
	})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	terms := make([]*TaxonomyTerm, len(resp.Terms))
	for i, t := range resp.Terms {
		term := taxonomyTermFromProto(t)
		terms[i] = &term
	}
	return terms, nil
}

func (c *GRPCHostClient) GetTerm(ctx context.Context, id uint) (*TaxonomyTerm, error) {
	resp, err := c.client.GetTerm(ctx, &pb.GetTermRequest{Id: uint32(id)})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	term := taxonomyTermFromProto(resp.Term)
	return &term, nil
}

func (c *GRPCHostClient) CreateTerm(ctx context.Context, term *TaxonomyTerm) (*TaxonomyTerm, error) {
	msg := taxonomyTermToProto(term)
	resp, err := c.client.CreateTerm(ctx, &pb.CreateTermRequest{Term: msg})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	created := taxonomyTermFromProto(resp.Term)
	return &created, nil
}

func (c *GRPCHostClient) UpdateTerm(ctx context.Context, id uint, updates map[string]interface{}) (*TaxonomyTerm, error) {
	b, err := json.Marshal(updates)
	if err != nil {
		return nil, NewInternal("failed to marshal updates: " + err.Error())
	}
	resp, err := c.client.UpdateTerm(ctx, &pb.UpdateTermRequest{
		Id:          uint32(id),
		UpdatesJson: string(b),
	})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	updated := taxonomyTermFromProto(resp.Term)
	return &updated, nil
}

func (c *GRPCHostClient) DeleteTerm(ctx context.Context, id uint) error {
	_, err := c.client.DeleteTerm(ctx, &pb.DeleteTermRequest{Id: uint32(id)})
	if err != nil {
		return fromGRPCError(err)
	}
	return nil
}

// --- Taxonomy Definitions ---

