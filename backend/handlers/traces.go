package handlers

import (
	"net/http"
	"time"

	"agent-observer/db"
	"agent-observer/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/datatypes"
)

func GetConversationTraces(c *gin.Context) {
	id := c.Param("id")

	// Fetch all root traces (no parent) for this conversation
	var rootTraces []models.Trace
	if err := db.DB.Where("conversation_id = ? AND parent_span_id IS NULL", id).
		Order("start_time ASC").
		Find(&rootTraces).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch traces"})
		return
	}

	// Build tree by loading children recursively
	for i := range rootTraces {
		loadChildren(&rootTraces[i])
	}

	c.JSON(http.StatusOK, rootTraces)
}

func loadChildren(trace *models.Trace) {
	var children []models.Trace
	db.DB.Where("parent_span_id = ?", trace.ID).Order("start_time ASC").Find(&children)
	trace.Children = children
	for i := range trace.Children {
		loadChildren(&trace.Children[i])
	}
}

func GetAgentTraces(c *gin.Context) {
	id := c.Param("id")

	query := db.DB.Where("agent_id = ?", id)

	// Optional time range filter
	if startStr := c.Query("start"); startStr != "" {
		if start, err := time.Parse(time.RFC3339, startStr); err == nil {
			query = query.Where("start_time >= ?", start)
		}
	}
	if endStr := c.Query("end"); endStr != "" {
		if end, err := time.Parse(time.RFC3339, endStr); err == nil {
			query = query.Where("start_time <= ?", end)
		}
	}

	var traces []models.Trace
	if err := query.Order("start_time DESC").Find(&traces).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch traces"})
		return
	}

	c.JSON(http.StatusOK, traces)
}

type LogTraceReq struct {
	TeamID         string         `json:"team_id" binding:"required"`
	AgentID        string         `json:"agent_id" binding:"required"`
	ConversationID string         `json:"conversation_id" binding:"required"`
	ParentSpanID   *string        `json:"parent_span_id,omitempty"`
	SpanName       string         `json:"span_name" binding:"required"`
	Attributes     datatypes.JSON `json:"attributes,omitempty"`
	StartTime      *time.Time     `json:"start_time,omitempty"`
	EndTime        *time.Time     `json:"end_time,omitempty"`
}

func LogTrace(c *gin.Context) {
	var req LogTraceReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	startTime := now
	if req.StartTime != nil {
		startTime = *req.StartTime
	}

	trace := models.Trace{
		ID:             uuid.New().String(),
		TeamID:         req.TeamID,
		AgentID:        req.AgentID,
		ConversationID: req.ConversationID,
		ParentSpanID:   req.ParentSpanID,
		SpanName:       req.SpanName,
		Attributes:     req.Attributes,
		StartTime:      startTime,
		EndTime:        req.EndTime,
	}

	if err := db.DB.Create(&trace).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log trace"})
		return
	}

	// Broadcast to WebSocket clients
	WSHub.Broadcast(gin.H{
		"type": "new_trace",
		"data": trace,
	})

	c.JSON(http.StatusCreated, trace)
}
