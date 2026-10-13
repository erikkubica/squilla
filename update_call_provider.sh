#!/bin/bash
cat << 'PATCH' > impl_call_provider.patch
--- internal/coreapi/impl_call_provider.go
+++ internal/coreapi/impl_call_provider.go
@@ -3,8 +3,29 @@
 import (
	"context"
+	pb "squilla/pkg/plugin/coreapipb"
+	"squilla/pkg/plugin"
 )

 func (c *coreImpl) CallProvider(ctx context.Context, tag string, req ProviderRequest) (*ProviderResponse, error) {
-	return nil, NewInternal("CallProvider not yet wired")
+	if tag == "" {
+		return nil, NewValidation("tag is required")
+	}
+	pm := c.getPM()
+	if pm == nil || !pm.HasProvider(tag) {
+		return nil, ErrNoProvider
+	}
+	client := pm.GetProvider(tag)
+	if client == nil {
+		return nil, ErrNoProvider
+	}
+	pbReq := &pb.PluginHTTPRequest{
+		Method:      req.Method,
+		Path:        req.Path,
+		Headers:     req.Headers,
+		Body:        req.Body,
+		QueryParams: req.QueryParams,
+	}
+	resp, err := client.HandleHTTPRequest(pbReq)
+	if err != nil {
+		return nil, NewInternal("call provider " + tag + ": " + err.Error())
+	}
+	return &ProviderResponse{
+		StatusCode: int(resp.StatusCode),
+		Headers:    resp.Headers,
+		Body:       resp.Body,
+	}, nil
 }
PATCH
patch internal/coreapi/impl_call_provider.go impl_call_provider.patch
