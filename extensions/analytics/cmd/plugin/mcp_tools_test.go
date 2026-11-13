package main

import (
	"encoding/json"
	"os"
	"strings"
	"testing"
)

// Every tool declared under mcp_tools must point at a route the plugin
// actually serves; the kernel calls routeRequest with exactly this
// method and path.
func TestManifestMcpToolsAreRouted(t *testing.T) {
	data, err := os.ReadFile("../../extension.json")
	if err != nil {
		t.Fatal(err)
	}
	var m struct {
		McpTools []struct {
			Name, Method, Path string
		} `json:"mcp_tools"`
	}
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatal(err)
	}
	if len(m.McpTools) < 10 {
		t.Fatalf("only %d mcp_tools declared", len(m.McpTools))
	}
	p, _ := newTestPlugin(t)
	for _, tool := range m.McpTools {
		path := strings.NewReplacer("{dimension}", "page", "{id}", "1").Replace(tool.Path)
		if strings.Contains(path, "{") {
			t.Errorf("%s: unhandled placeholder in %s", tool.Name, tool.Path)
			continue
		}
		method := tool.Method
		if method == "" {
			method = "GET"
		}
		resp, body := doRequest(p, method, path, map[string]string{"path": "/", "dataset": "summary"}, "{}")
		if resp.StatusCode == 404 && body["message"] == "route not found" {
			t.Errorf("%s: %s %s is not routed", tool.Name, method, path)
		}
		if resp.StatusCode >= 500 {
			t.Errorf("%s: %s %s → %d %s", tool.Name, method, path, resp.StatusCode, resp.Body)
		}
	}
}
