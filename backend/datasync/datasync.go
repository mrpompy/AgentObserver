package datasync

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"agent-observer/db"
	"agent-observer/models"
	"agent-observer/parser"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// SyncSession takes a parsed session and upserts it into the database.
// Session -> Team, main session -> "lead" agent, each subagent -> "teammate" agent.
func SyncSession(parsed *parser.ParsedSession) error {
	if parsed == nil {
		return fmt.Errorf("nil parsed session")
	}

	log.Printf("Syncing session %s (slug: %s, %d main messages, %d subagents)",
		parsed.SessionID, parsed.Slug, len(parsed.MainMessages), len(parsed.SubAgents))

	// Determine team status based on latest message time
	status := "idle"
	if !parsed.EndedAt.IsZero() && time.Since(parsed.EndedAt) < 5*time.Minute {
		status = "running"
	}

	// Upsert Team
	team := models.Team{
		ID:          parsed.SessionID,
		Name:        parsed.Slug,
		Description: fmt.Sprintf("Claude Code session: %s", parsed.Slug),
		CreatedBy:   "claude-code",
		Status:      status,
		CreatedAt:   parsed.StartedAt,
	}
	if err := db.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"name", "description", "status"}),
	}).Create(&team).Error; err != nil {
		return fmt.Errorf("failed to upsert team %s: %w", parsed.SessionID, err)
	}

	// Create or update lead agent (main session)
	leadAgentID := parsed.SessionID + "-lead"
	leadAgent := models.Agent{
		ID:        leadAgentID,
		TeamID:    parsed.SessionID,
		Role:      "lead",
		Name:      agentDisplayName(parsed.Slug, "lead"),
		Specialty: "Main Claude Code session",
		Status:    agentStatus(parsed.MainMessages),
		CreatedAt: parsed.StartedAt,
	}
	if err := db.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"name", "status"}),
	}).Create(&leadAgent).Error; err != nil {
		return fmt.Errorf("failed to upsert lead agent: %w", err)
	}

	// Create or update subagent records
	for _, sa := range parsed.SubAgents {
		subAgent := models.Agent{
			ID:        sa.AgentID,
			TeamID:    parsed.SessionID,
			Role:      "teammate",
			Name:      agentDisplayName(sa.Slug, sa.AgentID),
			Specialty: fmt.Sprintf("Sub-agent %s", sa.AgentID),
			Status:    agentStatus(sa.Messages),
			CreatedAt: agentStartTime(sa.Messages, parsed.StartedAt),
		}
		if err := db.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "id"}},
			DoUpdates: clause.AssignmentColumns([]string{"name", "status"}),
		}).Create(&subAgent).Error; err != nil {
			log.Printf("Warning: failed to upsert subagent %s: %v", sa.AgentID, err)
		}
	}

	// Create the main conversation (one per session)
	convID := parsed.SessionID + "-conv"
	conv := models.Conversation{
		ID:        convID,
		TeamID:    parsed.SessionID,
		AgentID:   leadAgentID,
		Title:     parsed.Slug,
		StartedAt: parsed.StartedAt,
	}
	if !parsed.EndedAt.IsZero() {
		endedAt := parsed.EndedAt
		conv.EndedAt = &endedAt
	}
	if err := db.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"title", "ended_at"}),
	}).Create(&conv).Error; err != nil {
		return fmt.Errorf("failed to upsert conversation: %w", err)
	}

	// Sync messages: delete existing and re-insert for idempotency
	if err := db.DB.Where("conversation_id = ?", convID).Delete(&models.Message{}).Error; err != nil {
		log.Printf("Warning: failed to clear old messages for conversation %s: %v", convID, err)
	}
	if err := db.DB.Where("conversation_id = ?", convID).Delete(&models.Trace{}).Error; err != nil {
		log.Printf("Warning: failed to clear old traces for conversation %s: %v", convID, err)
	}

	// Sync main session messages
	syncMessages(parsed.MainMessages, parsed.SessionID, convID, leadAgentID, "")

	// Create separate conversations for each subagent and sync their messages
	for _, sa := range parsed.SubAgents {
		saConvID := parsed.SessionID + "-conv-" + sa.AgentID
		saConv := models.Conversation{
			ID:        saConvID,
			TeamID:    parsed.SessionID,
			AgentID:   sa.AgentID,
			Title:     agentDisplayName(sa.Slug, sa.AgentID),
			StartedAt: agentStartTime(sa.Messages, parsed.StartedAt),
		}
		if len(sa.Messages) > 0 {
			lastMsg := sa.Messages[len(sa.Messages)-1]
			if !lastMsg.Timestamp.IsZero() {
				t := lastMsg.Timestamp
				saConv.EndedAt = &t
			}
		}
		if err := db.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "id"}},
			DoUpdates: clause.AssignmentColumns([]string{"title", "ended_at"}),
		}).Create(&saConv).Error; err != nil {
			log.Printf("Warning: failed to upsert subagent conversation %s: %v", saConvID, err)
			continue
		}

		// Clear and re-sync subagent messages
		if err := db.DB.Where("conversation_id = ?", saConvID).Delete(&models.Message{}).Error; err != nil {
			log.Printf("Warning: failed to clear old messages for subagent conversation %s: %v", saConvID, err)
		}
		if err := db.DB.Where("conversation_id = ?", saConvID).Delete(&models.Trace{}).Error; err != nil {
			log.Printf("Warning: failed to clear old traces for subagent conversation %s: %v", saConvID, err)
		}

		syncMessages(sa.Messages, parsed.SessionID, saConvID, sa.AgentID, sa.AgentID)
	}

	log.Printf("Finished syncing session %s", parsed.SessionID)
	return nil
}

// syncMessages converts ParsedMessages to database Message and Trace records.
func syncMessages(messages []parser.ParsedMessage, teamID, convID, defaultAgentID, agentIDForTraces string) {
	var dbMessages []models.Message
	var dbTraces []models.Trace

	for _, msg := range messages {
		// Determine role for the database message
		dbRole := ""
		var agentIDPtr *string

		switch msg.Role {
		case "user":
			// Skip tool_result user messages (they only contain tool results, not user text)
			if msg.Content == "" && len(msg.ToolResults) > 0 {
				continue
			}
			// Skip empty user messages
			if msg.Content == "" {
				continue
			}
			dbRole = "user"
		case "assistant":
			dbRole = "agent"
			aid := defaultAgentID
			if msg.AgentID != "" {
				aid = msg.AgentID
			}
			agentIDPtr = &aid

			if msg.IsSidechain && msg.AgentID != "" {
				dbRole = "teammate_message"
			}
		default:
			continue
		}

		// Build message ID from UUID or generate one
		msgID := msg.UUID
		if msgID == "" {
			msgID = uuid.New().String()
		}

		// Build raw_thoughts JSON for assistant messages
		var rawThoughts datatypes.JSON
		if dbRole == "agent" || dbRole == "teammate_message" {
			thoughts := buildRawThoughts(msg)
			if thoughts != nil {
				b, err := json.Marshal(thoughts)
				if err == nil {
					rawThoughts = datatypes.JSON(b)
				}
			}
		}

		timestamp := msg.Timestamp
		if timestamp.IsZero() {
			timestamp = time.Now()
		}

		dbMsg := models.Message{
			ID:             msgID,
			ConversationID: convID,
			TeamID:         teamID,
			AgentID:        agentIDPtr,
			Role:           dbRole,
			Content:        msg.Content,
			RawThoughts:    rawThoughts,
			CreatedAt:      timestamp,
		}
		dbMessages = append(dbMessages, dbMsg)

		// Create trace spans for tool calls
		traceAgentID := defaultAgentID
		if agentIDForTraces != "" {
			traceAgentID = agentIDForTraces
		}

		for _, tc := range msg.ToolCalls {
			traceID := uuid.New().String()
			attrs := map[string]interface{}{
				"tool_name": tc.Name,
				"input":     tc.Input,
			}
			if tc.Result != "" {
				// Truncate result for storage
				result := tc.Result
				if len(result) > 2000 {
					result = result[:2000] + "...(truncated)"
				}
				attrs["result"] = result
			}

			attrsJSON, _ := json.Marshal(attrs)
			endTime := timestamp.Add(time.Second) // Approximate end time

			trace := models.Trace{
				ID:             traceID,
				TeamID:         teamID,
				AgentID:        traceAgentID,
				ConversationID: convID,
				SpanName:       "tool." + tc.Name,
				Attributes:     datatypes.JSON(attrsJSON),
				StartTime:      timestamp,
				EndTime:        &endTime,
			}
			dbTraces = append(dbTraces, trace)
		}

		// Create trace span for thinking blocks
		if msg.Thinking != "" {
			thinkingPreview := msg.Thinking
			if len(thinkingPreview) > 200 {
				thinkingPreview = thinkingPreview[:200] + "..."
			}
			attrs := map[string]interface{}{
				"thinking_preview": thinkingPreview,
			}
			if msg.TokenUsage != nil {
				attrs["input_tokens"] = msg.TokenUsage.InputTokens
				attrs["output_tokens"] = msg.TokenUsage.OutputTokens
				attrs["cache_creation"] = msg.TokenUsage.CacheCreation
				attrs["cache_read"] = msg.TokenUsage.CacheRead
			}

			attrsJSON, _ := json.Marshal(attrs)
			endTime := timestamp.Add(time.Second)

			trace := models.Trace{
				ID:             uuid.New().String(),
				TeamID:         teamID,
				AgentID:        traceAgentID,
				ConversationID: convID,
				SpanName:       "llm_call",
				Attributes:     datatypes.JSON(attrsJSON),
				StartTime:      timestamp,
				EndTime:        &endTime,
			}
			dbTraces = append(dbTraces, trace)
		}
	}

	// Batch insert messages
	if len(dbMessages) > 0 {
		batchSize := 100
		for i := 0; i < len(dbMessages); i += batchSize {
			end := i + batchSize
			if end > len(dbMessages) {
				end = len(dbMessages)
			}
			if err := db.DB.Session(&gorm.Session{CreateBatchSize: batchSize}).Create(dbMessages[i:end]).Error; err != nil {
				log.Printf("Warning: failed to batch insert messages (batch %d-%d): %v", i, end, err)
				// Try inserting one by one as fallback
				for _, m := range dbMessages[i:end] {
					if err := db.DB.Create(&m).Error; err != nil {
						log.Printf("Warning: failed to insert message %s: %v", m.ID, err)
					}
				}
			}
		}
	}

	// Batch insert traces
	if len(dbTraces) > 0 {
		batchSize := 100
		for i := 0; i < len(dbTraces); i += batchSize {
			end := i + batchSize
			if end > len(dbTraces) {
				end = len(dbTraces)
			}
			if err := db.DB.Session(&gorm.Session{CreateBatchSize: batchSize}).Create(dbTraces[i:end]).Error; err != nil {
				log.Printf("Warning: failed to batch insert traces (batch %d-%d): %v", i, end, err)
				for _, t := range dbTraces[i:end] {
					if err := db.DB.Create(&t).Error; err != nil {
						log.Printf("Warning: failed to insert trace %s: %v", t.ID, err)
					}
				}
			}
		}
	}
}

// buildRawThoughts creates the raw_thoughts JSON structure for an assistant message.
func buildRawThoughts(msg parser.ParsedMessage) map[string]interface{} {
	thoughts := make(map[string]interface{})
	hasContent := false

	if msg.Thinking != "" {
		thoughts["thinking"] = msg.Thinking
		hasContent = true
	}

	if len(msg.ToolCalls) > 0 {
		var calls []map[string]interface{}
		for _, tc := range msg.ToolCalls {
			call := map[string]interface{}{
				"name":  tc.Name,
				"input": tc.Input,
			}
			if tc.Result != "" {
				result := tc.Result
				if len(result) > 1000 {
					result = result[:1000] + "...(truncated)"
				}
				call["result"] = result
			}
			calls = append(calls, call)
		}
		thoughts["tool_calls"] = calls
		hasContent = true
	}

	if msg.TokenUsage != nil {
		thoughts["token_usage"] = map[string]int{
			"input":          msg.TokenUsage.InputTokens,
			"output":         msg.TokenUsage.OutputTokens,
			"cache_creation": msg.TokenUsage.CacheCreation,
			"cache_read":     msg.TokenUsage.CacheRead,
		}
		hasContent = true
	}

	if !hasContent {
		return nil
	}
	return thoughts
}

// agentDisplayName returns a human-readable name for an agent.
func agentDisplayName(slug, fallback string) string {
	if slug != "" {
		return slug
	}
	// Clean up agent ID for display
	name := fallback
	name = strings.TrimPrefix(name, "agent-")
	if len(name) > 12 {
		name = name[:12]
	}
	return name
}

// agentStatus determines agent status based on the most recent message time.
func agentStatus(messages []parser.ParsedMessage) string {
	if len(messages) == 0 {
		return "idle"
	}
	lastMsg := messages[len(messages)-1]
	if !lastMsg.Timestamp.IsZero() && time.Since(lastMsg.Timestamp) < 5*time.Minute {
		return "active"
	}
	return "idle"
}

// agentStartTime returns the earliest timestamp from the agent's messages.
func agentStartTime(messages []parser.ParsedMessage, fallback time.Time) time.Time {
	for _, msg := range messages {
		if !msg.Timestamp.IsZero() {
			return msg.Timestamp
		}
	}
	return fallback
}

// SyncAll parses and syncs all sessions from the default data directory.
func SyncAll() error {
	return SyncAllFromDir(parser.ClaudeDataDir)
}

// SyncAllFromDir parses and syncs all sessions from a specific directory.
func SyncAllFromDir(dir string) error {
	sessions, err := parser.ScanSessionsInDir(dir)
	if err != nil {
		return fmt.Errorf("failed to scan sessions: %w", err)
	}

	log.Printf("Found %d sessions to sync", len(sessions))

	for _, sessionID := range sessions {
		parsed, err := parser.ParseSessionInDir(dir, sessionID)
		if err != nil {
			log.Printf("Warning: failed to parse session %s: %v", sessionID, err)
			continue
		}

		if err := SyncSession(parsed); err != nil {
			log.Printf("Warning: failed to sync session %s: %v", sessionID, err)
			continue
		}
	}

	log.Println("Full sync completed")
	return nil
}

// SyncSingleSession parses and syncs a single session by ID.
func SyncSingleSession(sessionID string) error {
	return SyncSingleSessionFromDir(parser.ClaudeDataDir, sessionID)
}

// SyncSingleSessionFromDir parses and syncs a single session from a specific directory.
func SyncSingleSessionFromDir(dir, sessionID string) error {
	parsed, err := parser.ParseSessionInDir(dir, sessionID)
	if err != nil {
		return fmt.Errorf("failed to parse session %s: %w", sessionID, err)
	}
	return SyncSession(parsed)
}
