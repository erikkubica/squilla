#!/bin/bash
cat << 'PATCH' > grpc_client_test2.patch
--- internal/coreapi/grpc_client_call_provider_test.go
+++ internal/coreapi/grpc_client_call_provider_test.go
@@ -3,6 +3,7 @@
 import (
	"context"
	"testing"
+	"net"
	"errors"

	"google.golang.org/grpc"
@@ -33,7 +34,7 @@
	defer server.Stop()

-	conn, err := grpc.DialContext(context.Background(), "bufnet", grpc.WithContextDialer(func(context.Context, string) (interface{ /* net.Conn is what grpc wants */ }, error) {
+	conn, err := grpc.DialContext(context.Background(), "bufnet", grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) {
		return lis.Dial()
	}), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
PATCH
patch internal/coreapi/grpc_client_call_provider_test.go grpc_client_test2.patch
