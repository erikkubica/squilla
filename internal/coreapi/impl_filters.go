package coreapi

import (
	"context"
	"sort"
	"sync"
)

var filtersMu sync.RWMutex

func (c *coreImpl) RegisterFilter(_ context.Context, name string, priority int, handler FilterHandler) (UnsubscribeFunc, error) {
	if name == "" {
		return nil, NewValidation("filter name is required")
	}
	if handler == nil {
		return nil, NewValidation("filter handler is required")
	}

	entry := filterEntry{
		priority: priority,
		handler:  handler,
	}

	filtersMu.Lock()
	c.filters[name] = append(c.filters[name], entry)
	sort.Slice(c.filters[name], func(i, j int) bool {
		return c.filters[name][i].priority < c.filters[name][j].priority
	})
	filtersMu.Unlock()

	unsub := func() {
		filtersMu.Lock()
		defer filtersMu.Unlock()
		entries := c.filters[name]
		for i, e := range entries {
			// Compare by pointer identity of the handler function.
			if &e.handler == &entry.handler {
				c.filters[name] = append(entries[:i], entries[i+1:]...)
				break
			}
		}
	}

	return unsub, nil
}

func (c *coreImpl) ApplyFilters(_ context.Context, name string, value any) (any, error) {
	filtersMu.RLock()
	entries := make([]filterEntry, len(c.filters[name]))
	copy(entries, c.filters[name])
	filtersMu.RUnlock()

	result := value
	for _, e := range entries {
		result = e.handler(result)
	}
	return result, nil
}
