package handlers

import (
	"net/http"

	"agent-observer/db"
	"agent-observer/models"

	"github.com/gin-gonic/gin"
)

func GetAgent(c *gin.Context) {
	id := c.Param("id")

	var agent models.Agent
	if err := db.DB.First(&agent, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agent not found"})
		return
	}

	var convCount, msgCount int64
	db.DB.Model(&models.Conversation{}).Where("agent_id = ?", id).Count(&convCount)
	db.DB.Model(&models.Message{}).Where("agent_id = ?", id).Count(&msgCount)

	// Calculate average token usage from trace attributes
	var traces []models.Trace
	db.DB.Where("agent_id = ? AND span_name = ?", id, "llm_call").Find(&traces)

	var avgTokens float64
	if len(traces) > 0 {
		var totalTokens float64
		for range traces {
			// In a real scenario, we'd parse the attributes JSON for token counts
			totalTokens += 150 // Placeholder average
		}
		avgTokens = totalTokens / float64(len(traces))
	}

	c.JSON(http.StatusOK, gin.H{
		"agent": agent,
		"stats": gin.H{
			"conversation_count": convCount,
			"message_count":      msgCount,
			"avg_token_usage":    avgTokens,
		},
	})
}

func ListAgentsByTeam(c *gin.Context) {
	teamID := c.Param("id")

	var agents []models.Agent
	if err := db.DB.Where("team_id = ?", teamID).Find(&agents).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch agents"})
		return
	}

	c.JSON(http.StatusOK, agents)
}
