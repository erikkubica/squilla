#!/bin/bash
cat << 'PATCH' > grpc_server.patch
--- internal/coreapi/grpc_server_meta.go
+++ internal/coreapi/grpc_server_meta.go
@@ -3,6 +3,7 @@
 import (
	"context"
	"encoding/json"
+	"errors"

	pb "squilla/pkg/plugin/coreapipb"
PATCH
patch internal/coreapi/grpc_server_meta.go grpc_server.patch
