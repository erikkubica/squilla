package coreapi

import (
	"context"
	"encoding/json"

	pb "vibecms/pkg/plugin/coreapipb"
)

// This file holds the data-store, fetch, log, node-type, and file
// methods of GRPCHostClient. Each method is a thin wrapper that
// converts Go inputs into proto messages and delegates to the host.

func (c *GRPCHostClient) Fetch(ctx context.Context, req FetchRequest) (*FetchResponse, error) {
	resp, err := c.client.Fetch(ctx, &pb.FetchRequest{
		Method:  req.Method,
		Url:     req.URL,
		Headers: req.Headers,
		Body:    req.Body,
		Timeout: int32(req.Timeout),
	})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	return &FetchResponse{
		StatusCode: int(resp.StatusCode),
		Headers:    resp.Headers,
		Body:       resp.Body,
	}, nil
}

// --- Log ---

func (c *GRPCHostClient) Log(ctx context.Context, level, message string, fields map[string]any) error {
	var fieldsJSON string
	if fields != nil {
		b, err := json.Marshal(fields)
		if err != nil {
			return NewInternal("failed to marshal fields: " + err.Error())
		}
		fieldsJSON = string(b)
	}
	_, err := c.client.Log(ctx, &pb.LogRequest{
		Level:      level,
		Message:    message,
		FieldsJson: fieldsJSON,
	})
	if err != nil {
		return fromGRPCError(err)
	}
	return nil
}

// --- Data Store ---

func (c *GRPCHostClient) DataGet(ctx context.Context, table string, id uint) (map[string]any, error) {
	resp, err := c.client.DataGet(ctx, &pb.DataGetRequest{Table: table, Id: uint32(id)})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	var row map[string]any
	if err := json.Unmarshal(resp.RowJson, &row); err != nil {
		return nil, NewInternal("failed to unmarshal row: " + err.Error())
	}
	return row, nil
}

func (c *GRPCHostClient) DataQuery(ctx context.Context, table string, query DataStoreQuery) (*DataStoreResult, error) {
	req := &pb.DataQueryRequest{
		Table:   table,
		Search:  query.Search,
		OrderBy: query.OrderBy,
		Limit:   int32(query.Limit),
		Offset:  int32(query.Offset),
		Raw:     query.Raw,
	}
	if query.Where != nil {
		b, err := json.Marshal(query.Where)
		if err != nil {
			return nil, NewInternal("failed to marshal where: " + err.Error())
		}
		req.WhereJson = string(b)
	}
	if query.Args != nil {
		b, err := json.Marshal(query.Args)
		if err != nil {
			return nil, NewInternal("failed to marshal args: " + err.Error())
		}
		req.ArgsJson = string(b)
	}
	resp, err := c.client.DataQuery(ctx, req)
	if err != nil {
		return nil, fromGRPCError(err)
	}
	rows := make([]map[string]any, len(resp.RowsJson))
	for i, b := range resp.RowsJson {
		var row map[string]any
		if err := json.Unmarshal(b, &row); err != nil {
			return nil, NewInternal("failed to unmarshal row: " + err.Error())
		}
		rows[i] = row
	}
	return &DataStoreResult{Rows: rows, Total: resp.Total}, nil
}

func (c *GRPCHostClient) DataCreate(ctx context.Context, table string, data map[string]any) (map[string]any, error) {
	b, err := json.Marshal(data)
	if err != nil {
		return nil, NewInternal("failed to marshal data: " + err.Error())
	}
	resp, err := c.client.DataCreate(ctx, &pb.DataCreateRequest{Table: table, DataJson: b})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	var row map[string]any
	if err := json.Unmarshal(resp.RowJson, &row); err != nil {
		return nil, NewInternal("failed to unmarshal row: " + err.Error())
	}
	return row, nil
}

func (c *GRPCHostClient) DataUpdate(ctx context.Context, table string, id uint, data map[string]any) error {
	b, err := json.Marshal(data)
	if err != nil {
		return NewInternal("failed to marshal data: " + err.Error())
	}
	_, err = c.client.DataUpdate(ctx, &pb.DataUpdateRequest{Table: table, Id: uint32(id), DataJson: b})
	if err != nil {
		return fromGRPCError(err)
	}
	return nil
}

func (c *GRPCHostClient) DataDelete(ctx context.Context, table string, id uint) error {
	_, err := c.client.DataDelete(ctx, &pb.DataDeleteRequest{Table: table, Id: uint32(id)})
	if err != nil {
		return fromGRPCError(err)
	}
	return nil
}

func (c *GRPCHostClient) DataExec(ctx context.Context, sqlStr string, args ...any) (int64, error) {
	var argsJSON string
	if len(args) > 0 {
		b, err := json.Marshal(args)
		if err != nil {
			return 0, NewInternal("failed to marshal args: " + err.Error())
		}
		argsJSON = string(b)
	}
	resp, err := c.client.DataExec(ctx, &pb.DataExecRequest{Sql: sqlStr, ArgsJson: argsJSON})
	if err != nil {
		return 0, fromGRPCError(err)
	}
	return resp.RowsAffected, nil
}

// --- Node Types ---

func (c *GRPCHostClient) RegisterNodeType(ctx context.Context, input NodeTypeInput) (*NodeType, error) {
	resp, err := c.client.RegisterNodeType(ctx, nodeTypeInputToProto(input))
	if err != nil {
		return nil, fromGRPCError(err)
	}
	return nodeTypeFromProto(resp.NodeType), nil
}

func (c *GRPCHostClient) GetNodeType(ctx context.Context, slug string) (*NodeType, error) {
	resp, err := c.client.GetNodeType(ctx, &pb.GetNodeTypeRequest{Slug: slug})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	return nodeTypeFromProto(resp.NodeType), nil
}

func (c *GRPCHostClient) ListNodeTypes(ctx context.Context) ([]*NodeType, error) {
	resp, err := c.client.ListNodeTypes(ctx, &pb.Empty{})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	out := make([]*NodeType, len(resp.NodeTypes))
	for i, nt := range resp.NodeTypes {
		out[i] = nodeTypeFromProto(nt)
	}
	return out, nil
}

func (c *GRPCHostClient) UpdateNodeType(ctx context.Context, slug string, input NodeTypeInput) (*NodeType, error) {
	resp, err := c.client.UpdateNodeType(ctx, &pb.UpdateNodeTypeRequest{
		Slug:  slug,
		Input: nodeTypeInputToProto(input),
	})
	if err != nil {
		return nil, fromGRPCError(err)
	}
	return nodeTypeFromProto(resp.NodeType), nil
}

func (c *GRPCHostClient) DeleteNodeType(ctx context.Context, slug string) error {
	_, err := c.client.DeleteNodeType(ctx, &pb.DeleteNodeTypeRequest{Slug: slug})
	if err != nil {
		return fromGRPCError(err)
	}
	return nil
}

// --- File Storage ---

func (c *GRPCHostClient) StoreFile(ctx context.Context, path string, data []byte) (string, error) {
	resp, err := c.client.StoreFile(ctx, &pb.StoreFileRequest{Path: path, Data: data})
	if err != nil {
		return "", fromGRPCError(err)
	}
	return resp.Url, nil
}

func (c *GRPCHostClient) DeleteFile(ctx context.Context, path string) error {
	_, err := c.client.DeleteFile(ctx, &pb.DeleteFileRequest{Path: path})
	if err != nil {
		return fromGRPCError(err)
	}
	return nil
}

// --- Helper functions ---

