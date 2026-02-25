package models

import (
	"time"

	"gorm.io/datatypes"
)

type Team struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedBy   string    `json:"created_by"`
	Status      string    `json:"status"` // running, stopped, idle
	TeamName    string    `json:"team_name"` // Claude Code team name (for grouping)
	CreatedAt   time.Time `json:"created_at"`
	Agents      []Agent   `json:"agents,omitempty" gorm:"foreignKey:TeamID"`
}

type Agent struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	TeamID    string    `json:"team_id"`
	Role      string    `json:"role"` // lead, teammate
	Name      string    `json:"name"`
	Specialty string    `json:"specialty"`
	Status    string    `json:"status"` // active, idle, error
	CreatedAt time.Time `json:"created_at"`
}

type Conversation struct {
	ID        string     `json:"id" gorm:"primaryKey;type:varchar(36)"`
	TeamID    string     `json:"team_id"`
	AgentID   string     `json:"agent_id"`
	Title     string     `json:"title"`
	StartedAt time.Time  `json:"started_at"`
	EndedAt   *time.Time `json:"ended_at,omitempty"`
}

type Message struct {
	ID             string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	ConversationID string         `json:"conversation_id"`
	TeamID         string         `json:"team_id"`
	AgentID        *string        `json:"agent_id,omitempty"`
	Role           string         `json:"role"` // user, agent, system, teammate_message
	Content        string         `json:"content"`
	RawThoughts    datatypes.JSON `json:"raw_thoughts,omitempty" gorm:"type:json"`
	CreatedAt      time.Time      `json:"created_at"`
}

type Trace struct {
	ID             string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	TeamID         string         `json:"team_id"`
	AgentID        string         `json:"agent_id"`
	ConversationID string         `json:"conversation_id"`
	ParentSpanID   *string        `json:"parent_span_id,omitempty"`
	SpanName       string         `json:"span_name"` // agent.decision, tool.search, llm_call, etc.
	Attributes     datatypes.JSON `json:"attributes,omitempty" gorm:"type:json"`
	StartTime      time.Time      `json:"start_time"`
	EndTime        *time.Time     `json:"end_time,omitempty"`
	Children       []Trace        `json:"children,omitempty" gorm:"foreignKey:ParentSpanID;references:ID"`
}
