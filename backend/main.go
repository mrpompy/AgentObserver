package main

import (
	"log"
	"net/http"
	"time"

	"agent-observer/datasync"
	"agent-observer/db"
	"agent-observer/handlers"
	"agent-observer/parser"
	"agent-observer/scanner"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	db.InitDB()

	// Parse and sync all existing Claude Code sessions
	log.Println("Starting initial sync of Claude Code sessions...")
	if err := datasync.SyncAll(); err != nil {
		log.Printf("Warning: initial sync encountered errors: %v", err)
	}

	// Start the file scanner to watch for new/updated sessions
	sc := scanner.NewScanner(parser.ClaudeDataDir)
	sc.OnUpdate = func(sessionID string) {
		log.Printf("Session %s updated, re-syncing...", sessionID)
		if err := datasync.SyncSingleSession(sessionID); err != nil {
			log.Printf("Error syncing session %s: %v", sessionID, err)
			return
		}
		// Broadcast update to WebSocket clients
		handlers.WSHub.Broadcast(gin.H{
			"type": "session_updated",
			"data": gin.H{"session_id": sessionID},
		})
	}
	if err := sc.Start(); err != nil {
		log.Printf("Warning: failed to start file scanner: %v", err)
	} else {
		defer sc.Stop()
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
		api.POST("/teams", handlers.CreateTeam)

		// Team detail routes (use :id consistently)
		api.GET("/teams/:id", handlers.GetTeam)
		api.GET("/teams/:id/agents", handlers.ListAgentsByTeam)
		api.GET("/teams/:id/conversations", handlers.ListConversationsByTeam)

		// Agents
		api.GET("/agents/:id", handlers.GetAgent)
		api.GET("/agents/:id/traces", handlers.GetAgentTraces)

		// Conversations
		api.GET("/conversations/:id", handlers.GetConversation)
		api.GET("/conversations/:id/messages", handlers.GetConversationMessages)
		api.GET("/conversations/:id/traces", handlers.GetConversationTraces)
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
