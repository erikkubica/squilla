#!/bin/bash
cat << 'PATCH' > impl.patch
--- internal/coreapi/impl.go
+++ internal/coreapi/impl.go
@@ -23,6 +23,7 @@
	contentSvc    *cms.ContentService
	menuSvc       *cms.MenuService
	mediaResolver MediaProviderResolver
+	getPM         func() *cms.PluginManager
	nodeTypeSvc   *cms.NodeTypeService
	app           *fiber.App
	secrets       *secrets.Service // may be nil (encryption disabled in dev)
@@ -45,6 +46,7 @@
	contentSvc *cms.ContentService,
	menuSvc *cms.MenuService,
	mediaResolver MediaProviderResolver,
+	getPM func() *cms.PluginManager,
	nodeTypeSvc *cms.NodeTypeService,
	app *fiber.App,
	secretsSvc *secrets.Service,
@@ -54,6 +56,7 @@
		contentSvc:    contentSvc,
		menuSvc:       menuSvc,
		mediaResolver: mediaResolver,
+		getPM:         getPM,
		nodeTypeSvc:   nodeTypeSvc,
		app:           app,
		secrets:       secretsSvc,
PATCH
patch -p0 internal/coreapi/impl.go impl.patch
