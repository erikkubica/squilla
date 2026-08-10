package coreapi

import (
	"context"
	"testing"
	"net"
	"errors"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/test/bufconn"

	pb "squilla/pkg/plugin/coreapipb"
)

func TestGRPCHostClient_CallProvider(t *testing.T) {
	const bufSize = 1024 * 1024
	lis := bufconn.Listen(bufSize)

	api := &fakeCallProviderAPI{
		resp: &ProviderResponse{
			StatusCode: 200,
			Body:       []byte("ok"),
		},
	}
	server := grpc.NewServer()
	pb.RegisterSquillaHostServer(server, NewGRPCHostServer(api, CallerInfo{}))
	go func() {
		if err := server.Serve(lis); err != nil {
			panic(err)
		}
	}()
	defer server.Stop()

	conn, err := grpc.DialContext(context.Background(), "bufnet", grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) {
		return lis.Dial()
	}), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatalf("failed to dial bufnet: %v", err)
	}
	defer conn.Close()

	client := NewGRPCHostClient(pb.NewSquillaHostClient(conn))

	t.Run("Success", func(t *testing.T) {
		api.err = nil
		api.resp = &ProviderResponse{
			StatusCode: 200,
			Body:       []byte("ok"),
		}

		resp, err := client.CallProvider(context.Background(), "test", ProviderRequest{})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if resp.StatusCode != 200 {
			t.Errorf("expected status code 200, got %d", resp.StatusCode)
		}
		if string(resp.Body) != "ok" {
			t.Errorf("expected body 'ok', got %q", string(resp.Body))
		}
	})

	t.Run("ErrNoProvider", func(t *testing.T) {
		api.resp = nil
		api.err = ErrNoProvider

		_, err := client.CallProvider(context.Background(), "test", ProviderRequest{})
		if err == nil {
			t.Fatalf("expected error, got nil")
		}
		if !errors.Is(err, ErrNoProvider) {
			t.Errorf("expected ErrNoProvider, got %v", err)
		}
	})

	t.Run("OtherError", func(t *testing.T) {
		api.resp = nil
		api.err = errors.New("boom")

		_, err := client.CallProvider(context.Background(), "test", ProviderRequest{})
		if err == nil {
			t.Fatalf("expected error, got nil")
		}
		var apiErr *APIError
		if !errors.As(err, &apiErr) || apiErr.Code != ErrInternal {
			t.Errorf("expected internal error, got %v", err)
		}
	})
}
