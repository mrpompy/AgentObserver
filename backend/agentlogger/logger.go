package agentlogger

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Logger struct {
	BaseURL string
	Client  *http.Client
}

type LogMessageReq struct {
	ConversationID string          `json:"conversation_id"`
	TeamID         string          `json:"team_id"`
	AgentID        *string         `json:"agent_id,omitempty"`
	Role           string          `json:"role"`
	Content        string          `json:"content"`
	RawThoughts    json.RawMessage `json:"raw_thoughts,omitempty"`
}

type LogTraceReq struct {
	TeamID         string          `json:"team_id"`
	AgentID        string          `json:"agent_id"`
	ConversationID string          `json:"conversation_id"`
	ParentSpanID   *string         `json:"parent_span_id,omitempty"`
	SpanName       string          `json:"span_name"`
	Attributes     json.RawMessage `json:"attributes,omitempty"`
	StartTime      *time.Time      `json:"start_time,omitempty"`
	EndTime        *time.Time      `json:"end_time,omitempty"`
}

type traceResponse struct {
	ID string `json:"id"`
}

func NewLogger(baseURL string) *Logger {
	return &Logger{
		BaseURL: baseURL,
		Client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (l *Logger) LogMessage(req LogMessageReq) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal message request: %w", err)
	}

	resp, err := l.Client.Post(
		l.BaseURL+"/internal/log_message",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return fmt.Errorf("failed to send log message request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}

func (l *Logger) LogTrace(req LogTraceReq) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal trace request: %w", err)
	}

	resp, err := l.Client.Post(
		l.BaseURL+"/internal/log_trace",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return fmt.Errorf("failed to send log trace request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}

func (l *Logger) StartSpan(teamID, agentID, conversationID, spanName string, attributes map[string]interface{}) (string, error) {
	var attrsJSON json.RawMessage
	if attributes != nil {
		var err error
		attrsJSON, err = json.Marshal(attributes)
		if err != nil {
			return "", fmt.Errorf("failed to marshal attributes: %w", err)
		}
	}

	now := time.Now()
	req := LogTraceReq{
		TeamID:         teamID,
		AgentID:        agentID,
		ConversationID: conversationID,
		SpanName:       spanName,
		Attributes:     attrsJSON,
		StartTime:      &now,
	}

	body, err := json.Marshal(req)
	if err != nil {
		return "", fmt.Errorf("failed to marshal start span request: %w", err)
	}

	resp, err := l.Client.Post(
		l.BaseURL+"/internal/log_trace",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return "", fmt.Errorf("failed to send start span request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var traceResp traceResponse
	if err := json.NewDecoder(resp.Body).Decode(&traceResp); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	return traceResp.ID, nil
}

func (l *Logger) EndSpan(spanID string) error {
	now := time.Now()
	payload := map[string]interface{}{
		"end_time": now,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal end span request: %w", err)
	}

	req, err := http.NewRequest(
		http.MethodPatch,
		l.BaseURL+"/internal/traces/"+spanID+"/end",
		bytes.NewReader(body),
	)
	if err != nil {
		return fmt.Errorf("failed to create end span request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := l.Client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send end span request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}
