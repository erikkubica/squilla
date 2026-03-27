package coreapi

// Stub implementations for CoreAPI methods not yet implemented.
// These will be replaced by real implementations in subsequent tasks.

import (
	"context"
	"fmt"
)

func (c *coreImpl) Emit(_ context.Context, action string, payload map[string]any) error {
	return fmt.Errorf("coreapi: Emit not yet implemented")
}

func (c *coreImpl) Subscribe(_ context.Context, action string, handler EventHandler) (UnsubscribeFunc, error) {
	return nil, fmt.Errorf("coreapi: Subscribe not yet implemented")
}

func (c *coreImpl) SendEmail(_ context.Context, req EmailRequest) error {
	return fmt.Errorf("coreapi: SendEmail not yet implemented")
}

func (c *coreImpl) GetMenu(_ context.Context, slug string) (*Menu, error) {
	return nil, fmt.Errorf("coreapi: GetMenu not yet implemented")
}

func (c *coreImpl) GetMenus(_ context.Context) ([]*Menu, error) {
	return nil, fmt.Errorf("coreapi: GetMenus not yet implemented")
}

func (c *coreImpl) CreateMenu(_ context.Context, input MenuInput) (*Menu, error) {
	return nil, fmt.Errorf("coreapi: CreateMenu not yet implemented")
}

func (c *coreImpl) UpdateMenu(_ context.Context, slug string, input MenuInput) (*Menu, error) {
	return nil, fmt.Errorf("coreapi: UpdateMenu not yet implemented")
}

func (c *coreImpl) DeleteMenu(_ context.Context, slug string) error {
	return fmt.Errorf("coreapi: DeleteMenu not yet implemented")
}

func (c *coreImpl) RegisterRoute(_ context.Context, method, path string, meta RouteMeta) error {
	return fmt.Errorf("coreapi: RegisterRoute not yet implemented")
}

func (c *coreImpl) RemoveRoute(_ context.Context, method, path string) error {
	return fmt.Errorf("coreapi: RemoveRoute not yet implemented")
}

func (c *coreImpl) RegisterFilter(_ context.Context, name string, priority int, handler FilterHandler) (UnsubscribeFunc, error) {
	return nil, fmt.Errorf("coreapi: RegisterFilter not yet implemented")
}

func (c *coreImpl) ApplyFilters(_ context.Context, name string, value any) (any, error) {
	return nil, fmt.Errorf("coreapi: ApplyFilters not yet implemented")
}

func (c *coreImpl) UploadMedia(_ context.Context, req MediaUploadRequest) (*MediaFile, error) {
	return nil, fmt.Errorf("coreapi: UploadMedia not yet implemented")
}

func (c *coreImpl) GetMedia(_ context.Context, id uint) (*MediaFile, error) {
	return nil, fmt.Errorf("coreapi: GetMedia not yet implemented")
}

func (c *coreImpl) QueryMedia(_ context.Context, query MediaQuery) ([]*MediaFile, error) {
	return nil, fmt.Errorf("coreapi: QueryMedia not yet implemented")
}

func (c *coreImpl) DeleteMedia(_ context.Context, id uint) error {
	return fmt.Errorf("coreapi: DeleteMedia not yet implemented")
}

func (c *coreImpl) GetUser(_ context.Context, id uint) (*User, error) {
	return nil, fmt.Errorf("coreapi: GetUser not yet implemented")
}

func (c *coreImpl) QueryUsers(_ context.Context, query UserQuery) ([]*User, error) {
	return nil, fmt.Errorf("coreapi: QueryUsers not yet implemented")
}

func (c *coreImpl) Fetch(_ context.Context, req FetchRequest) (*FetchResponse, error) {
	return nil, fmt.Errorf("coreapi: Fetch not yet implemented")
}

func (c *coreImpl) Log(_ context.Context, level, message string, fields map[string]any) error {
	return fmt.Errorf("coreapi: Log not yet implemented")
}
