#!/bin/bash
cat << 'PATCH' > grpc_client.patch
--- internal/coreapi/grpc_client_meta.go
+++ internal/coreapi/grpc_client_meta.go
@@ -219,5 +219,17 @@

 // --- Providers ---
 func (c *GRPCHostClient) CallProvider(ctx context.Context, tag string, req ProviderRequest) (*ProviderResponse, error) {
-	return nil, NewInternal("not supported via gRPC")
+	resp, err := c.client.CallProvider(ctx, &pb.CallProviderRequest{
+		Tag: tag, Method: req.Method, Path: req.Path,
+		Headers: req.Headers, Body: req.Body, QueryParams: req.QueryParams,
+	})
+	if err != nil { return nil, fromGRPCError(err) }
+	if resp.ErrorNoProvider { return nil, ErrNoProvider }
+	if resp.Error != "" { return nil, NewInternal(resp.Error) }
+
+	return &ProviderResponse{
+		StatusCode: int(resp.StatusCode),
+		Headers:    resp.Headers,
+		Body:       resp.Body,
+	}, nil
 }
PATCH
patch internal/coreapi/grpc_client_meta.go grpc_client.patch
