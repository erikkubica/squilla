package coreapi

import (
	"context"

	pb "squilla/pkg/plugin/proto"
)

func (c *coreImpl) CallProvider(ctx context.Context, tag string, req ProviderRequest) (*ProviderResponse, error) {
	if tag == "" {
		return nil, NewValidation("tag is required")
	}
	pm := c.getPM()
	if pm == nil || !pm.HasProvider(tag) {
		return nil, ErrNoProvider
	}
	client := pm.GetProvider(tag)
	if client == nil {
		return nil, ErrNoProvider
	}
	pbReq := &pb.PluginHTTPRequest{
		Method:      req.Method,
		Path:        req.Path,
		Headers:     req.Headers,
		Body:        req.Body,
		QueryParams: req.QueryParams,
	}
	resp, err := client.HandleHTTPRequest(pbReq)
	if err != nil {
		return nil, NewInternal("call provider " + tag + ": " + err.Error())
	}
	return &ProviderResponse{
		StatusCode: int(resp.StatusCode),
		Headers:    resp.Headers,
		Body:       resp.Body,
	}, nil
}
