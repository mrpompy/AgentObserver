package db

import (
	"log"

	"agent-observer/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open("agent_observer.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = DB.AutoMigrate(
		&models.Team{},
		&models.Agent{},
		&models.Conversation{},
		&models.Message{},
		&models.Trace{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database initialized and migrated successfully")
}

func IsEmpty() bool {
	var count int64
	DB.Model(&models.Team{}).Count(&count)
	return count == 0
}
