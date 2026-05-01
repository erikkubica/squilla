package coreapi

import "context"

// MediaProvider is the contract any extension implements when it claims
// the "media-provider" tag in its manifest. The kernel's CoreAPI media
// surface (UploadMedia / GetMedia / QueryMedia / DeleteMedia) calls
// through whichever provider is currently active so storage backends
// stay swappable: the bundled media-manager writes to local disk, but
// nothing in the kernel prevents an S3 / R2 / Cloudinary extension from
// activating with a higher priority and silently taking over.
//
// Returns NewValidation when the underlying request is malformed and
// NewInternal when the provider hits a transport / encoding fault. The
// shapes match the rest of the CoreAPI error envelope so callers get
// consistent HTTP status mapping at the admin boundary.
type MediaProvider interface {
	Upload(ctx context.Context, req MediaUploadRequest) (*MediaFile, error)
	Get(ctx context.Context, id uint) (*MediaFile, error)
	Query(ctx context.Context, query MediaQuery) ([]*MediaFile, error)
	Delete(ctx context.Context, id uint) error
}

// MediaProviderResolver returns the currently-active provider, or nil
// when no extension is registered. Resolution happens on every call so
// hot-activating a new extension takes effect without restarting any
// kernel components. Wired by cmd/squilla/main.go from the
// PluginManager's GetProvider("media-provider") helper.
type MediaProviderResolver func() MediaProvider
