package coreapi

import "context"

// SendEmail's twin for media: route every operation through the
// MediaProviderResolver. The kernel deliberately ships no fallback —
// per the kernel/extensions hard rule, the bytes-on-disk path lives in
// the media-manager extension (or whichever extension takes over the
// "media-provider" tag) and disabling all such extensions disables
// media. Errors from the resolver are wrapped as NewValidation so the
// admin UI surfaces a recognisable "install / activate the extension"
// message rather than a 500.

func (c *coreImpl) UploadMedia(ctx context.Context, req MediaUploadRequest) (*MediaFile, error) {
	if c.mediaResolver == nil {
		return nil, NewValidation(noMediaProviderMessage())
	}
	provider := c.mediaResolver()
	if provider == nil {
		return nil, NewValidation(noMediaProviderMessage())
	}
	return provider.Upload(ctx, req)
}

func (c *coreImpl) GetMedia(ctx context.Context, id uint) (*MediaFile, error) {
	if c.mediaResolver == nil {
		return nil, NewValidation(noMediaProviderMessage())
	}
	provider := c.mediaResolver()
	if provider == nil {
		return nil, NewValidation(noMediaProviderMessage())
	}
	return provider.Get(ctx, id)
}

func (c *coreImpl) QueryMedia(ctx context.Context, query MediaQuery) ([]*MediaFile, error) {
	if c.mediaResolver == nil {
		return nil, NewValidation(noMediaProviderMessage())
	}
	provider := c.mediaResolver()
	if provider == nil {
		return nil, NewValidation(noMediaProviderMessage())
	}
	return provider.Query(ctx, query)
}

func (c *coreImpl) DeleteMedia(ctx context.Context, id uint) error {
	if c.mediaResolver == nil {
		return NewValidation(noMediaProviderMessage())
	}
	provider := c.mediaResolver()
	if provider == nil {
		return NewValidation(noMediaProviderMessage())
	}
	return provider.Delete(ctx, id)
}

func noMediaProviderMessage() string {
	return "no media provider configured — install and activate an extension that declares provides:[\"media-provider\"] (the bundled media-manager covers most cases)"
}
