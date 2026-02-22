package main

import (
	"log"
	"net/http"
	"time"

	"agent-observer/db"
	"agent-observer/handlers"
	"agent-observer/seed"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	db.InitDB()

	// Seed database if empty
	if db.IsEmpty() {
		seed.SeedDB()
	}

	// Set up Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// WebSocket endpoint
	r.GET("/ws", handlers.HandleWebSocket)

	// API routes
	api := r.Group("/api")
	{
		// Teams
		api.GET("/teams", handlers.ListTeams)
		api.GET("/teams/:id", handlers.GetTeam)
		api.POST("/teams", handlers.CreateTeam)

		// Agents
		api.GET("/agents/:id", handlers.GetAgent)
		api.GET("/teams/:teamId/agents", handlers.ListAgentsByTeam)

		// Conversations
		api.GET("/teams/:teamId/conversations", handlers.ListConversationsByTeam)
		api.GET("/conversations/:id", handlers.GetConversation)
		api.GET("/conversations/:id/messages", handlers.GetConversationMessages)

		// Traces
		api.GET("/conversations/:id/traces", handlers.GetConversationTraces)
		api.GET("/agents/:id/traces", handlers.GetAgentTraces)
	}

	// Internal endpoints (for agentlogger SDK)
	internal := r.Group("/internal")
	{
		internal.POST("/log_message", handlers.LogMessage)
		internal.POST("/log_trace", handlers.LogTrace)
		internal.PATCH("/traces/:id/end", handleEndSpan)
	}

	log.Println("Server starting on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func handleEndSpan(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		EndTime time.Time `json:"end_time"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.DB.Table("traces").Where("id = ?", id).Update("end_time", req.EndTime).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to end span"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
