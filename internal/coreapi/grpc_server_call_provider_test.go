package coreapi

import (
	"context"
	"testing"
	"errors"

	pb "squilla/pkg/plugin/coreapipb"
)

type fakeCallProviderAPI struct {
	stubCoreAPI
	resp *ProviderResponse
	err  error
}

func (f *fakeCallProviderAPI) CallProvider(ctx context.Context, tag string, req ProviderRequest) (*ProviderResponse, error) {
	return f.resp, f.err
}

func TestGRPCHostServer_CallProvider(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		api := &fakeCallProviderAPI{
			resp: &ProviderResponse{
				StatusCode: 200,
				Body:       []byte("ok"),
			},
		}
		s := NewGRPCHostServer(api, CallerInfo{})
		resp, err := s.CallProvider(context.Background(), &pb.CallProviderRequest{Tag: "test"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if resp.ErrorNoProvider {
			t.Errorf("expected ErrorNoProvider to be false")
		}
		if string(resp.Body) != "ok" {
			t.Errorf("expected body 'ok', got %q", string(resp.Body))
		}
	})

	t.Run("ErrNoProvider", func(t *testing.T) {
		api := &fakeCallProviderAPI{
			err: ErrNoProvider,
		}
		s := NewGRPCHostServer(api, CallerInfo{})
		resp, err := s.CallProvider(context.Background(), &pb.CallProviderRequest{Tag: "test"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !resp.ErrorNoProvider {
			t.Errorf("expected ErrorNoProvider to be true")
		}
	})

	t.Run("OtherError", func(t *testing.T) {
		api := &fakeCallProviderAPI{
			err: errors.New("boom"),
		}
		s := NewGRPCHostServer(api, CallerInfo{})
		resp, err := s.CallProvider(context.Background(), &pb.CallProviderRequest{Tag: "test"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if resp.Error != "boom" {
			t.Errorf("expected error 'boom', got %q", resp.Error)
		}
	})
}
