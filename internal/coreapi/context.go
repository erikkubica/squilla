package coreapi

import "context"

type ctxKey int

const callerKey ctxKey = iota

type CallerInfo struct {
	Slug         string
	Type         string // "tengo", "grpc", "internal"
	Capabilities map[string]bool
}

func InternalCaller() CallerInfo {
	return CallerInfo{Slug: "", Type: "internal", Capabilities: nil}
}

func WithCaller(ctx context.Context, caller CallerInfo) context.Context {
	return context.WithValue(ctx, callerKey, caller)
}

func CallerFromContext(ctx context.Context) CallerInfo {
	if c, ok := ctx.Value(callerKey).(CallerInfo); ok {
		return c
	}
	return InternalCaller()
}
