package handlers

import (
	"net/http"

	"agent-observer/db"
	"agent-observer/models"

	"github.com/gin-gonic/gin"
)

func ListConversationsByTeam(c *gin.Context) {
	teamID := c.Param("teamId")

	var conversations []models.Conversation
	if err := db.DB.Where("team_id = ?", teamID).Order("started_at DESC").Find(&conversations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch conversations"})
		return
	}

	c.JSON(http.StatusOK, conversations)
}

func GetConversation(c *gin.Context) {
	id := c.Param("id")

	var conversation models.Conversation
	if err := db.DB.First(&conversation, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversation not found"})
		return
	}

	var messageCount int64
	db.DB.Model(&models.Message{}).Where("conversation_id = ?", id).Count(&messageCount)

	c.JSON(http.StatusOK, gin.H{
		"conversation":  conversation,
		"message_count": messageCount,
	})
}

func GetConversationMessages(c *gin.Context) {
	id := c.Param("id")

	var messages []models.Message
	if err := db.DB.Where("conversation_id = ?", id).Order("created_at ASC").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	c.JSON(http.StatusOK, messages)
}
