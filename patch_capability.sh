#!/bin/bash
cat << 'PATCH' > capability.patch
--- internal/coreapi/capability.go
+++ internal/coreapi/capability.go
@@ -321,3 +321,8 @@
	}
	return g.inner.DeleteFile(ctx, path)
 }
+
+// --- Providers ---
+func (g *capabilityGuard) CallProvider(ctx context.Context, tag string, req ProviderRequest) (*ProviderResponse, error) {
+	return g.inner.CallProvider(ctx, tag, req)
+}
PATCH
patch internal/coreapi/capability.go capability.patch
