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

type LogMessageReq struct {
	ConversationID string         `json:"conversation_id" binding:"required"`
	TeamID         string         `json:"team_id" binding:"required"`
	AgentID        *string        `json:"agent_id,omitempty"`
	Role           string         `json:"role" binding:"required"`
	Content        string         `json:"content" binding:"required"`
	RawThoughts    datatypes.JSON `json:"raw_thoughts,omitempty"`
}

func LogMessage(c *gin.Context) {
	var req LogMessageReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg := models.Message{
		ID:             uuid.New().String(),
		ConversationID: req.ConversationID,
		TeamID:         req.TeamID,
		AgentID:        req.AgentID,
		Role:           req.Role,
		Content:        req.Content,
		RawThoughts:    req.RawThoughts,
		CreatedAt:      time.Now(),
	}

	if err := db.DB.Create(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log message"})
		return
	}

	// Broadcast to WebSocket clients
	WSHub.Broadcast(gin.H{
		"type": "new_message",
		"data": msg,
	})

	c.JSON(http.StatusCreated, msg)
}
