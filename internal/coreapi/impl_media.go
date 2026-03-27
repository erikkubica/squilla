package coreapi

import "context"

func (c *coreImpl) UploadMedia(_ context.Context, _ MediaUploadRequest) (*MediaFile, error) {
	return nil, NewInternal("media manager not implemented yet")
}

func (c *coreImpl) GetMedia(_ context.Context, _ uint) (*MediaFile, error) {
	return nil, NewInternal("media manager not implemented yet")
}

func (c *coreImpl) QueryMedia(_ context.Context, _ MediaQuery) ([]*MediaFile, error) {
	return nil, NewInternal("media manager not implemented yet")
}

func (c *coreImpl) DeleteMedia(_ context.Context, _ uint) error {
	return NewInternal("media manager not implemented yet")
}
