package coreapi

import (
	"bytes"
	"context"
	"encoding/json"
	"math"

	pb "squilla/pkg/plugin/coreapipb"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// This file holds the data-store, fetch, log, node-type, and file
// RPCs of GRPCHostServer.

func (s *GRPCHostServer) Fetch(ctx context.Context, req *pb.FetchRequest) (*pb.FetchResponse, error) {
	fetchReq := FetchRequest{
		Method:  req.Method,
		URL:     req.Url,
		Headers: req.Headers,
		Body:    req.Body,
		Timeout: int(req.Timeout),
	}
	resp, err := s.api.Fetch(s.ctx(ctx), fetchReq)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.FetchResponse{
		StatusCode: int32(resp.StatusCode),
		Headers:    resp.Headers,
		Body:       resp.Body,
	}, nil
}

// --- Log RPCs ---

func (s *GRPCHostServer) Log(ctx context.Context, req *pb.LogRequest) (*pb.Empty, error) {
	var fields map[string]any
	if req.FieldsJson != "" {
		if err := json.Unmarshal([]byte(req.FieldsJson), &fields); err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid fields JSON: %v", err)
		}
	}
	if err := s.api.Log(s.ctx(ctx), req.Level, req.Message, fields); err != nil {
		return nil, grpcError(err)
	}
	return &pb.Empty{}, nil
}

// --- Data Store RPCs ---

func (s *GRPCHostServer) DataGet(ctx context.Context, req *pb.DataGetRequest) (*pb.DataRowResponse, error) {
	row, err := s.api.DataGet(s.ctx(ctx), req.Table, uint(req.Id))
	if err != nil {
		return nil, grpcError(err)
	}
	b, err := json.Marshal(row)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal row: %v", err)
	}
	return &pb.DataRowResponse{RowJson: b}, nil
}

func (s *GRPCHostServer) DataQuery(ctx context.Context, req *pb.DataQueryRequest) (*pb.DataQueryResponse, error) {
	q := DataStoreQuery{
		Search:  req.Search,
		OrderBy: req.OrderBy,
		Limit:   int(req.Limit),
		Offset:  int(req.Offset),
		Raw:     req.Raw,
	}
	if req.WhereJson != "" {
		if err := json.Unmarshal([]byte(req.WhereJson), &q.Where); err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid where JSON: %v", err)
		}
	}
	if req.ArgsJson != "" {
		if err := json.Unmarshal([]byte(req.ArgsJson), &q.Args); err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid args JSON: %v", err)
		}
	}
	result, err := s.api.DataQuery(s.ctx(ctx), req.Table, q)
	if err != nil {
		return nil, grpcError(err)
	}
	rowsJSON := make([][]byte, len(result.Rows))
	for i, row := range result.Rows {
		b, err := json.Marshal(row)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to marshal row: %v", err)
		}
		rowsJSON[i] = b
	}
	return &pb.DataQueryResponse{RowsJson: rowsJSON, Total: result.Total}, nil
}

func (s *GRPCHostServer) DataCreate(ctx context.Context, req *pb.DataCreateRequest) (*pb.DataRowResponse, error) {
	var data map[string]any
	if err := json.Unmarshal(req.DataJson, &data); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid data JSON: %v", err)
	}
	row, err := s.api.DataCreate(s.ctx(ctx), req.Table, data)
	if err != nil {
		return nil, grpcError(err)
	}
	b, err := json.Marshal(row)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal row: %v", err)
	}
	return &pb.DataRowResponse{RowJson: b}, nil
}

func (s *GRPCHostServer) DataUpdate(ctx context.Context, req *pb.DataUpdateRequest) (*pb.Empty, error) {
	var data map[string]any
	if err := json.Unmarshal(req.DataJson, &data); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid data JSON: %v", err)
	}
	if err := s.api.DataUpdate(s.ctx(ctx), req.Table, uint(req.Id), data); err != nil {
		return nil, grpcError(err)
	}
	return &pb.Empty{}, nil
}

func (s *GRPCHostServer) DataDelete(ctx context.Context, req *pb.DataDeleteRequest) (*pb.Empty, error) {
	if err := s.api.DataDelete(s.ctx(ctx), req.Table, uint(req.Id)); err != nil {
		return nil, grpcError(err)
	}
	return &pb.Empty{}, nil
}

func (s *GRPCHostServer) DataExec(ctx context.Context, req *pb.DataExecRequest) (*pb.DataExecResponse, error) {
	var args []any
	if req.ArgsJson != "" {
		if err := json.Unmarshal([]byte(req.ArgsJson), &args); err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid args JSON: %v", err)
		}
	}
	affected, err := s.api.DataExec(s.ctx(ctx), req.Sql, args...)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.DataExecResponse{RowsAffected: affected}, nil
}

// --- Node Type RPCs ---

func (s *GRPCHostServer) RegisterNodeType(ctx context.Context, req *pb.NodeTypeInputMessage) (*pb.NodeTypeResponse, error) {
	input := nodeTypeInputFromProto(req)
	nt, err := s.api.RegisterNodeType(s.ctx(ctx), input)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.NodeTypeResponse{NodeType: nodeTypeToProto(nt)}, nil
}

func (s *GRPCHostServer) GetNodeType(ctx context.Context, req *pb.GetNodeTypeRequest) (*pb.NodeTypeResponse, error) {
	nt, err := s.api.GetNodeType(s.ctx(ctx), req.Slug)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.NodeTypeResponse{NodeType: nodeTypeToProto(nt)}, nil
}

func (s *GRPCHostServer) ListNodeTypes(ctx context.Context, _ *pb.Empty) (*pb.NodeTypeListResponse, error) {
	list, err := s.api.ListNodeTypes(s.ctx(ctx))
	if err != nil {
		return nil, grpcError(err)
	}
	pbTypes := make([]*pb.NodeTypeMessage, len(list))
	for i, nt := range list {
		pbTypes[i] = nodeTypeToProto(nt)
	}
	return &pb.NodeTypeListResponse{NodeTypes: pbTypes}, nil
}

func (s *GRPCHostServer) UpdateNodeType(ctx context.Context, req *pb.UpdateNodeTypeRequest) (*pb.NodeTypeResponse, error) {
	input := nodeTypeInputFromProto(req.Input)
	nt, err := s.api.UpdateNodeType(s.ctx(ctx), req.Slug, input)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.NodeTypeResponse{NodeType: nodeTypeToProto(nt)}, nil
}

func (s *GRPCHostServer) DeleteNodeType(ctx context.Context, req *pb.DeleteNodeTypeRequest) (*pb.Empty, error) {
	if err := s.api.DeleteNodeType(s.ctx(ctx), req.Slug); err != nil {
		return nil, grpcError(err)
	}
	return &pb.Empty{}, nil
}

// --- File Storage RPCs ---

func (s *GRPCHostServer) StoreFile(ctx context.Context, req *pb.StoreFileRequest) (*pb.StoreFileResponse, error) {
	url, err := s.api.StoreFile(s.ctx(ctx), req.Path, req.Data)
	if err != nil {
		return nil, grpcError(err)
	}
	return &pb.StoreFileResponse{Url: url}, nil
}

func (s *GRPCHostServer) DeleteFile(ctx context.Context, req *pb.DeleteFileRequest) (*pb.Empty, error) {
	if err := s.api.DeleteFile(s.ctx(ctx), req.Path); err != nil {
		return nil, grpcError(err)
	}
	return &pb.Empty{}, nil
}

// --- Helper functions ---

// --- DataCall RPC ---

func (s *GRPCHostServer) DataCall(ctx context.Context, req *pb.DataCallRequest) (*pb.DataCallResponse, error) {
	var args []any
	if len(req.ArgsJson) > 0 {
		// UseNumber: decoding into float64 would silently corrupt
		// integers above 2^53 (ids, byte counts, nanosecond times).
		dec := json.NewDecoder(bytes.NewReader(req.ArgsJson))
		dec.UseNumber()
		if err := dec.Decode(&args); err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid args JSON: %v", err)
		}
	}
	rows, err := s.api.DataCall(s.ctx(ctx), req.Function, normalizeCallArgs(args)...)
	if err != nil {
		return nil, grpcError(err)
	}
	b, err := json.Marshal(rows)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to marshal rows: %v", err)
	}
	return &pb.DataCallResponse{RowsJson: b}, nil
}

// normalizeCallArgs turns top-level JSON numbers into bindable Go
// values: integers (json.Number that parses as int64, or a whole float64
// within int64 range) become int64 — Postgres refuses to bind a float to
// integer/bigint parameters — and everything else numeric becomes
// float64. Nested maps/slices are left alone: they bind as jsonb, and a
// nested json.Number re-marshals verbatim.
func normalizeCallArgs(args []any) []any {
	for i, a := range args {
		switch v := a.(type) {
		case json.Number:
			if n, err := v.Int64(); err == nil {
				args[i] = n
			} else if f, err := v.Float64(); err == nil {
				args[i] = normalizeFloat(f)
			}
		case float64:
			args[i] = normalizeFloat(v)
		}
	}
	return args
}

func normalizeFloat(f float64) any {
	if f == math.Trunc(f) && f >= math.MinInt64 && f < math.MaxInt64 {
		return int64(f)
	}
	return f
}
