package coreapi

import (
    "context"
    "errors"
    "testing"

    "squilla/internal/cms"
)

func TestCallProvider_NoProvider_ReturnsErrNoProvider(t *testing.T) {
    c := &coreImpl{getPM: func() *cms.PluginManager { return nil }}
    _, err := c.CallProvider(context.Background(), "storage-provider", ProviderRequest{})
    if !errors.Is(err, ErrNoProvider) {
        t.Fatalf("got %v, want ErrNoProvider", err)
    }
}
