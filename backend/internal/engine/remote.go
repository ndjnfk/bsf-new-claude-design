package engine

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// RemoteEngine is a MatchingEngine backed by a dedicated out-of-process matching
// service (the Rust engine). It speaks the same JSON contract as the in-process
// MemoryEngine, so the betting module is identical regardless of which is wired.
//
// This is the payoff of the MatchingEngine boundary: scaling the hot path to a
// GC-free Rust service is a deploy/config change, not a code change for callers.
type RemoteEngine struct {
	baseURL string
	client  *http.Client
}

// NewRemoteEngine builds a client for the matching service at baseURL.
func NewRemoteEngine(baseURL string) *RemoteEngine {
	return &RemoteEngine{
		baseURL: strings.TrimRight(baseURL, "/"),
		client:  &http.Client{Timeout: 5 * time.Second},
	}
}

// Submit forwards an order to the matching service.
func (e *RemoteEngine) Submit(ctx context.Context, o Order) (*MatchResult, error) {
	body, err := json.Marshal(o)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, e.baseURL+"/submit", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := e.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("engine submit: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("engine submit: status %d", resp.StatusCode)
	}
	var out MatchResult
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("engine submit decode: %w", err)
	}
	return &out, nil
}

// Book fetches the order-book depth from the matching service.
func (e *RemoteEngine) Book(ctx context.Context, marketID string) (*BookSnapshot, error) {
	u := e.baseURL + "/book?marketId=" + url.QueryEscape(marketID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := e.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("engine book: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("engine book: status %d", resp.StatusCode)
	}
	var out BookSnapshot
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("engine book decode: %w", err)
	}
	return &out, nil
}

// Ping checks the matching service is reachable (used for readiness).
func (e *RemoteEngine) Ping(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, e.baseURL+"/health", nil)
	if err != nil {
		return err
	}
	resp, err := e.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("engine health: status %d", resp.StatusCode)
	}
	return nil
}
