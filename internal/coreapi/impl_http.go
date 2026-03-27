package coreapi

import (
	"context"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	defaultTimeout  = 30 * time.Second
	maxTimeout      = 120 * time.Second
	maxResponseBody = 10 * 1024 * 1024 // 10 MB
)

func (c *coreImpl) Fetch(ctx context.Context, req FetchRequest) (*FetchResponse, error) {
	if req.URL == "" {
		return nil, NewValidation("URL is required")
	}

	method := strings.ToUpper(strings.TrimSpace(req.Method))
	if method == "" {
		method = http.MethodGet
	}

	timeout := defaultTimeout
	if req.Timeout > 0 {
		timeout = time.Duration(req.Timeout) * time.Second
		if timeout > maxTimeout {
			timeout = maxTimeout
		}
	}

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	var bodyReader io.Reader
	if req.Body != "" {
		bodyReader = strings.NewReader(req.Body)
	}

	httpReq, err := http.NewRequestWithContext(ctx, method, req.URL, bodyReader)
	if err != nil {
		return nil, NewInternal("failed to create request: " + err.Error())
	}

	for k, v := range req.Headers {
		httpReq.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, NewInternal("fetch failed: " + err.Error())
	}
	defer resp.Body.Close()

	limited := io.LimitReader(resp.Body, maxResponseBody)
	body, err := io.ReadAll(limited)
	if err != nil {
		return nil, NewInternal("failed to read response body: " + err.Error())
	}

	headers := make(map[string]string, len(resp.Header))
	for k := range resp.Header {
		headers[k] = resp.Header.Get(k)
	}

	return &FetchResponse{
		StatusCode: resp.StatusCode,
		Headers:    headers,
		Body:       string(body),
	}, nil
}
