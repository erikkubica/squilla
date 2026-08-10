#!/bin/bash
cat << 'PATCH' > grpc_client_test.patch
--- internal/coreapi/grpc_client_call_provider_test.go
+++ internal/coreapi/grpc_client_call_provider_test.go
@@ -32,9 +32,9 @@
	}()
	defer server.Stop()

-	conn, err := grpc.DialContext(context.Background(), "bufnet", grpc.WithContextDialer(func(context.Context, string) (interface{}, error) {
-		return lis.Dial()
-	}(), nil), grpc.WithTransportCredentials(insecure.NewCredentials()))
+	conn, err := grpc.DialContext(context.Background(), "bufnet", grpc.WithContextDialer(func(context.Context, string) (interface{ /* net.Conn is what grpc wants */ }, error) {
+		return lis.Dial()
+	}), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatalf("failed to dial bufnet: %v", err)
	}
PATCH
patch internal/coreapi/grpc_client_call_provider_test.go grpc_client_test.patch
