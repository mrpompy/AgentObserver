package handlers

import (
	"net/http"
	"time"

	"agent-observer/db"
	"agent-observer/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TeamWithStats struct {
	models.Team
	AgentCount        int64 `json:"agent_count"`
	ConversationCount int64 `json:"conversation_count"`
	MessageCount      int64 `json:"message_count"`
}

func ListTeams(c *gin.Context) {
	var teams []models.Team
	// Sort by most recently created (which corresponds to most recently active for synced sessions)
	if err := db.DB.Order("created_at DESC").Find(&teams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch teams"})
		return
	}

	var result []TeamWithStats
	for _, team := range teams {
		var agentCount, convCount, msgCount int64
		db.DB.Model(&models.Agent{}).Where("team_id = ?", team.ID).Count(&agentCount)
		db.DB.Model(&models.Conversation{}).Where("team_id = ?", team.ID).Count(&convCount)
		db.DB.Model(&models.Message{}).Where("team_id = ?", team.ID).Count(&msgCount)

		result = append(result, TeamWithStats{
			Team:              team,
			AgentCount:        agentCount,
			ConversationCount: convCount,
			MessageCount:      msgCount,
		})
	}

	c.JSON(http.StatusOK, result)
}

func GetTeam(c *gin.Context) {
	id := c.Param("id")

	var team models.Team
	if err := db.DB.Preload("Agents").First(&team, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Team not found"})
		return
	}

	var conversations []models.Conversation
	db.DB.Where("team_id = ?", id).Order("started_at DESC").Limit(10).Find(&conversations)

	var agentCount, convCount, msgCount int64
	db.DB.Model(&models.Agent{}).Where("team_id = ?", id).Count(&agentCount)
	db.DB.Model(&models.Conversation{}).Where("team_id = ?", id).Count(&convCount)
	db.DB.Model(&models.Message{}).Where("team_id = ?", id).Count(&msgCount)

	c.JSON(http.StatusOK, gin.H{
		"team":                team,
		"recent_conversations": conversations,
		"stats": gin.H{
			"agent_count":        agentCount,
			"conversation_count": convCount,
			"message_count":      msgCount,
		},
	})
}

type CreateTeamReq struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	CreatedBy   string `json:"created_by"`
}

func GetTeamGroup(c *gin.Context) {
	teamName := c.Param("teamName")

	var teams []models.Team
	if err := db.DB.Preload("Agents").Where("team_name = ?", teamName).Order("created_at DESC").Find(&teams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch team group"})
		return
	}

	var result []TeamWithStats
	for _, team := range teams {
		var agentCount, convCount, msgCount int64
		db.DB.Model(&models.Agent{}).Where("team_id = ?", team.ID).Count(&agentCount)
		db.DB.Model(&models.Conversation{}).Where("team_id = ?", team.ID).Count(&convCount)
		db.DB.Model(&models.Message{}).Where("team_id = ?", team.ID).Count(&msgCount)

		result = append(result, TeamWithStats{
			Team:              team,
			AgentCount:        agentCount,
			ConversationCount: convCount,
			MessageCount:      msgCount,
		})
	}

	c.JSON(http.StatusOK, result)
}

func CreateTeam(c *gin.Context) {
	var req CreateTeamReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	team := models.Team{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		CreatedBy:   req.CreatedBy,
		Status:      "idle",
		CreatedAt:   time.Now(),
	}

	if err := db.DB.Create(&team).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create team"})
		return
	}

	c.JSON(http.StatusCreated, team)
}
