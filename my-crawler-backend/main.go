package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"my-crawler-backend/controllers"
	"my-crawler-backend/initializers"
)

func init() {
	godotenv.Load() // Load .env file
	initializers.ConnectToDB()
	initializers.SyncDatabase()
}

func main() {
	r := gin.Default()

	r.Use(cors.Default())

	// Example: CORS setup (for development)
	// r.Use(func(c *gin.Context) {
	// 	c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173/")
	// 	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	// 	c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
	// 	c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
	// 	if c.Request.Method == "OPTIONS" {
	// 		c.AbortWithStatus(204)
	// 		return
	// 	}
	// 	c.Next()
	// })

	r.POST("/urls", controllers.CreateURLAnalysis)
	r.GET("/urls", controllers.GetURLAnalyses)
	r.GET("/urls/:id", controllers.GetURLAnalysis) // New single URL endpoint

	r.POST("/urls/rerun", controllers.RerunURLAnalyses)
	r.POST("/urls/delete-batch", controllers.DeleteURLAnalyses) // Using POST for batch delete

	log.Fatal(r.Run(":9090"))
}
