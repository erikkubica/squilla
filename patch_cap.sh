#!/bin/bash
cat << 'PATCH' > cap.patch
--- internal/coreapi/capability.go
+++ internal/coreapi/capability.go
@@ -324,5 +324,8 @@

 // --- Providers ---
 func (g *capabilityGuard) CallProvider(ctx context.Context, tag string, req ProviderRequest) (*ProviderResponse, error) {
+	if err := checkCapability(ctx, "providers:call"); err != nil {
+		return nil, err
+	}
	return g.inner.CallProvider(ctx, tag, req)
 }
PATCH
patch internal/coreapi/capability.go cap.patch
