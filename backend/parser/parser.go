package parser

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// ClaudeDataDir is the default directory where Claude Code stores session data.
const ClaudeDataDir = "/Users/huwei/.claude/projects/-Users-huwei"

// ParsedSession represents a fully parsed Claude Code session.
type ParsedSession struct {
	SessionID    string
	Slug         string // display name from session (e.g. "purring-orbiting-fountain")
	TeamName     string // Claude Code team name (e.g. "agents-reverse-eng")
	AgentName    string // Claude Code agent name (e.g. "devops-agent")
	MainMessages []ParsedMessage
	SubAgents    []ParsedAgent
	StartedAt    time.Time
	EndedAt      time.Time
}

// ParsedAgent represents a sub-agent within a session.
type ParsedAgent struct {
	AgentID  string
	Slug     string
	Messages []ParsedMessage
}

// ParsedMessage represents a single parsed message from a JSONL line.
type ParsedMessage struct {
	UUID        string
	ParentUUID  string
	Type        string // "user", "assistant"
	Role        string // "user", "assistant"
	Content     string // visible text content
	Thinking    string // chain-of-thought (from thinking blocks)
	ToolCalls   []ParsedToolCall
	ToolResults map[string]string // tool_use_id -> result string
	TokenUsage  *TokenUsage
	Timestamp   time.Time
	AgentID     string // empty for main session
	IsSidechain bool
	Slug        string
	TeamName    string // Claude Code team name
	AgentName   string // Claude Code agent name
}

// ParsedToolCall represents a tool invocation found in assistant content blocks.
type ParsedToolCall struct {
	ID     string
	Name   string // Bash, Write, Read, Grep, etc.
	Input  map[string]interface{}
	Result string
}

// TokenUsage represents token consumption for an assistant message.
type TokenUsage struct {
	InputTokens   int
	OutputTokens  int
	CacheCreation int
	CacheRead     int
}

// ScanSessions scans the Claude data directory and returns all session IDs.
// It looks for *.jsonl files at the top level (not inside subagent directories).
func ScanSessions() ([]string, error) {
	return ScanSessionsInDir(ClaudeDataDir)
}

// ScanSessionsInDir scans a specific directory for session JSONL files.
func ScanSessionsInDir(dir string) ([]string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("failed to read data directory %s: %w", dir, err)
	}

	var sessions []string
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if !strings.HasSuffix(name, ".jsonl") {
			continue
		}
		sessionID := strings.TrimSuffix(name, ".jsonl")
		sessions = append(sessions, sessionID)
	}
	return sessions, nil
}

// ParseSession parses a single session's JSONL files including subagents.
func ParseSession(sessionID string) (*ParsedSession, error) {
	return ParseSessionInDir(ClaudeDataDir, sessionID)
}

// ParseSessionInDir parses a session from a specific data directory.
func ParseSessionInDir(dir, sessionID string) (*ParsedSession, error) {
	mainFile := filepath.Join(dir, sessionID+".jsonl")
	mainMessages, err := ParseJSONLFile(mainFile)
	if err != nil {
		return nil, fmt.Errorf("failed to parse main session file %s: %w", mainFile, err)
	}

	session := &ParsedSession{
		SessionID:    sessionID,
		MainMessages: mainMessages,
	}

	// Extract slug, teamName, agentName, and time range from main messages
	for _, msg := range mainMessages {
		if msg.Slug != "" && session.Slug == "" {
			session.Slug = msg.Slug
		}
		if msg.TeamName != "" && session.TeamName == "" {
			session.TeamName = msg.TeamName
		}
		if msg.AgentName != "" && session.AgentName == "" {
			session.AgentName = msg.AgentName
		}
		if !msg.Timestamp.IsZero() {
			if session.StartedAt.IsZero() || msg.Timestamp.Before(session.StartedAt) {
				session.StartedAt = msg.Timestamp
			}
			if session.EndedAt.IsZero() || msg.Timestamp.After(session.EndedAt) {
				session.EndedAt = msg.Timestamp
			}
		}
	}

	// Check for subagents directory
	subagentsDir := filepath.Join(dir, sessionID, "subagents")
	if entries, err := os.ReadDir(subagentsDir); err == nil {
		for _, entry := range entries {
			if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".jsonl") {
				continue
			}
			agentFile := filepath.Join(subagentsDir, entry.Name())
			agentMessages, err := ParseJSONLFile(agentFile)
			if err != nil {
				log.Printf("Warning: failed to parse subagent file %s: %v", agentFile, err)
				continue
			}

			// Extract agentID from filename (e.g. "agent-aa482f75504208258.jsonl")
			agentFileName := strings.TrimSuffix(entry.Name(), ".jsonl")
			agentID := agentFileName // e.g. "agent-aa482f75504208258"

			// Also try to get agentID from message content
			var agentSlug string
			for _, msg := range agentMessages {
				if msg.AgentID != "" {
					agentID = msg.AgentID
				}
				if msg.Slug != "" && agentSlug == "" {
					agentSlug = msg.Slug
				}
				// Update session time range with subagent messages
				if !msg.Timestamp.IsZero() {
					if session.StartedAt.IsZero() || msg.Timestamp.Before(session.StartedAt) {
						session.StartedAt = msg.Timestamp
					}
					if session.EndedAt.IsZero() || msg.Timestamp.After(session.EndedAt) {
						session.EndedAt = msg.Timestamp
					}
				}
			}

			session.SubAgents = append(session.SubAgents, ParsedAgent{
				AgentID:  agentID,
				Slug:     agentSlug,
				Messages: agentMessages,
			})
		}
	}

	// If no slug found, use session ID prefix as fallback
	if session.Slug == "" {
		if len(sessionID) > 8 {
			session.Slug = "session-" + sessionID[:8]
		} else {
			session.Slug = "session-" + sessionID
		}
	}

	return session, nil
}

// rawLine represents the JSON structure of a single JSONL line.
type rawLine struct {
	Type        string          `json:"type"`
	SessionID   string          `json:"sessionId"`
	AgentID     string          `json:"agentId"`
	IsSidechain bool            `json:"isSidechain"`
	Slug        string          `json:"slug"`
	UUID        string          `json:"uuid"`
	ParentUUID  *string         `json:"parentUuid"`
	Timestamp   string          `json:"timestamp"`
	Message     json.RawMessage `json:"message"`
	TeamName    string          `json:"teamName"`
	AgentName   string          `json:"agentName"`
}

// rawMessage represents the nested message object.
type rawMessage struct {
	Role    string          `json:"role"`
	Content json.RawMessage `json:"content"`
	Usage   *rawUsage       `json:"usage,omitempty"`
}

// rawUsage represents the usage field in assistant messages.
type rawUsage struct {
	InputTokens              int `json:"input_tokens"`
	OutputTokens             int `json:"output_tokens"`
	CacheCreationInputTokens int `json:"cache_creation_input_tokens"`
	CacheReadInputTokens     int `json:"cache_read_input_tokens"`
}

// contentBlock represents a single content block in an assistant message.
type contentBlock struct {
	Type      string                 `json:"type"`
	Text      string                 `json:"text,omitempty"`
	Thinking  string                 `json:"thinking,omitempty"`
	ID        string                 `json:"id,omitempty"`
	Name      string                 `json:"name,omitempty"`
	Input     map[string]interface{} `json:"input,omitempty"`
	ToolUseID string                 `json:"tool_use_id,omitempty"`
	Content   json.RawMessage        `json:"content,omitempty"`
}

// ParseJSONLFile parses a single JSONL file into messages.
// It reads line by line to handle large files efficiently.
func ParseJSONLFile(filepath string) ([]ParsedMessage, error) {
	f, err := os.Open(filepath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file %s: %w", filepath, err)
	}
	defer f.Close()

	var messages []ParsedMessage
	// Collect tool results so we can associate them with tool calls later
	toolResults := make(map[string]string) // tool_use_id -> result

	scanner := bufio.NewScanner(f)
	// Increase scanner buffer for large lines
	buf := make([]byte, 0, 1024*1024) // 1MB initial
	scanner.Buffer(buf, 64*1024*1024)  // 64MB max

	lineNum := 0
	for scanner.Scan() {
		lineNum++
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}

		var raw rawLine
		if err := json.Unmarshal(line, &raw); err != nil {
			log.Printf("Warning: malformed JSON at line %d in %s: %v", lineNum, filepath, err)
			continue
		}

		// Skip non-conversation types
		switch raw.Type {
		case "progress", "file-history-snapshot", "queue-operation":
			continue
		case "user", "assistant":
			// Process these
		default:
			continue
		}

		if len(raw.Message) == 0 {
			continue
		}

		var msg rawMessage
		if err := json.Unmarshal(raw.Message, &msg); err != nil {
			log.Printf("Warning: failed to parse message at line %d in %s: %v", lineNum, filepath, err)
			continue
		}

		parsed := ParsedMessage{
			UUID:        raw.UUID,
			Type:        raw.Type,
			Role:        msg.Role,
			Timestamp:   parseTimestamp(raw.Timestamp),
			AgentID:     raw.AgentID,
			IsSidechain: raw.IsSidechain,
			Slug:        raw.Slug,
			TeamName:    raw.TeamName,
			AgentName:   raw.AgentName,
			ToolResults: make(map[string]string),
		}

		if raw.ParentUUID != nil {
			parsed.ParentUUID = *raw.ParentUUID
		}

		// Parse content based on role
		if msg.Role == "assistant" {
			parseAssistantContent(&parsed, msg.Content)
			if msg.Usage != nil {
				parsed.TokenUsage = &TokenUsage{
					InputTokens:   msg.Usage.InputTokens,
					OutputTokens:  msg.Usage.OutputTokens,
					CacheCreation: msg.Usage.CacheCreationInputTokens,
					CacheRead:     msg.Usage.CacheReadInputTokens,
				}
			}
			messages = append(messages, parsed)
		} else if msg.Role == "user" {
			parseUserContent(&parsed, msg.Content, toolResults)
			messages = append(messages, parsed)
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file %s: %w", filepath, err)
	}

	// Associate tool results with tool calls in previous messages
	associateToolResults(messages, toolResults)

	return messages, nil
}

// parseAssistantContent extracts text, thinking, and tool_use blocks from assistant content.
func parseAssistantContent(parsed *ParsedMessage, rawContent json.RawMessage) {
	if len(rawContent) == 0 {
		return
	}

	// Try as array of content blocks first
	var blocks []contentBlock
	if err := json.Unmarshal(rawContent, &blocks); err == nil {
		var textParts []string
		for _, block := range blocks {
			switch block.Type {
			case "text":
				if block.Text != "" {
					textParts = append(textParts, block.Text)
				}
			case "thinking":
				if block.Thinking != "" {
					if parsed.Thinking != "" {
						parsed.Thinking += "\n\n"
					}
					parsed.Thinking += block.Thinking
				}
			case "tool_use":
				tc := ParsedToolCall{
					ID:    block.ID,
					Name:  block.Name,
					Input: block.Input,
				}
				parsed.ToolCalls = append(parsed.ToolCalls, tc)
			}
		}
		parsed.Content = strings.Join(textParts, "\n")
		return
	}

	// Try as plain string
	var s string
	if err := json.Unmarshal(rawContent, &s); err == nil {
		parsed.Content = s
		return
	}
}

// parseUserContent extracts the user message content, which can be a string or tool_result array.
func parseUserContent(parsed *ParsedMessage, rawContent json.RawMessage, toolResults map[string]string) {
	if len(rawContent) == 0 {
		return
	}

	// Try as plain string first
	var s string
	if err := json.Unmarshal(rawContent, &s); err == nil {
		parsed.Content = s
		return
	}

	// Try as array of content blocks (tool_result messages)
	var blocks []contentBlock
	if err := json.Unmarshal(rawContent, &blocks); err == nil {
		for _, block := range blocks {
			if block.Type == "tool_result" && block.ToolUseID != "" {
				// Extract result content
				result := extractToolResultContent(block.Content)
				toolResults[block.ToolUseID] = result
				parsed.ToolResults[block.ToolUseID] = result
			}
		}
		return
	}
}

// extractToolResultContent extracts the string content from a tool_result's content field.
func extractToolResultContent(raw json.RawMessage) string {
	if len(raw) == 0 {
		return ""
	}

	// Try as string
	var s string
	if err := json.Unmarshal(raw, &s); err == nil {
		return s
	}

	// Try as array of objects with text
	var blocks []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	}
	if err := json.Unmarshal(raw, &blocks); err == nil {
		var parts []string
		for _, b := range blocks {
			if b.Text != "" {
				parts = append(parts, b.Text)
			}
		}
		return strings.Join(parts, "\n")
	}

	// Fallback: return raw JSON truncated
	s = string(raw)
	if len(s) > 500 {
		s = s[:500] + "..."
	}
	return s
}

// associateToolResults matches tool results back to their corresponding tool calls.
func associateToolResults(messages []ParsedMessage, toolResults map[string]string) {
	for i := range messages {
		for j := range messages[i].ToolCalls {
			if result, ok := toolResults[messages[i].ToolCalls[j].ID]; ok {
				messages[i].ToolCalls[j].Result = result
			}
		}
	}
}

// parseTimestamp parses an ISO 8601 timestamp string.
func parseTimestamp(ts string) time.Time {
	if ts == "" {
		return time.Time{}
	}

	// Try RFC3339 first
	t, err := time.Parse(time.RFC3339, ts)
	if err == nil {
		return t
	}

	// Try with milliseconds
	t, err = time.Parse("2006-01-02T15:04:05.000Z", ts)
	if err == nil {
		return t
	}

	// Try more flexible format
	t, err = time.Parse("2006-01-02T15:04:05Z", ts)
	if err == nil {
		return t
	}

	log.Printf("Warning: failed to parse timestamp %q: %v", ts, err)
	return time.Time{}
}
