package initializers

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"my-crawler-backend/models" // Assuming models package is defined
)

var DB *gorm.DB

func ConnectToDB() {
	var err error
	dsn := os.Getenv("DB_DSN")
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("Connected to database!")
}

func SyncDatabase() {
	err := DB.AutoMigrate(&models.URLAnalysisResult{})
	if err != nil {
		log.Fatal("Failed to auto migrate database:", err)
	}
	fmt.Println("Database migrated!")
}
