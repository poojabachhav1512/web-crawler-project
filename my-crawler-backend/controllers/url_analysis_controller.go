package controllers

import (
	"my-crawler-backend/initializers"
	"my-crawler-backend/models"
	"my-crawler-backend/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AddURLInput struct {
	URL string `json:"url" binding:"required,url"`
}

func GetURLAnalyses(c *gin.Context) {
	var urlAnalyses []models.URLAnalysisResult
	result := initializers.DB.Order("created_at desc").Find(&urlAnalyses)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch URLs", "details": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": urlAnalyses})
}

func CreateURLAnalysis(c *gin.Context) {
	var input AddURLInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if URL already exists
	var existingURL models.URLAnalysisResult
	if err := initializers.DB.Where("url = ?", input.URL).First(&existingURL).Error; err == nil {
		// URL exists, return existing data or a message
		c.JSON(http.StatusOK, gin.H{"message": "URL already exists and is being processed or done.", "data": existingURL})
		return
	}

	urlAnalysis := models.URLAnalysisResult{URL: input.URL, Status: "queued"}
	result := initializers.DB.Create(&urlAnalysis)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add URL", "details": result.Error.Error()})
		return
	}

	// Start the crawling process in a goroutine
	go services.ProcessURL(urlAnalysis.ID)

	c.JSON(http.StatusAccepted, gin.H{"message": "URL added and processing started", "data": urlAnalysis})
}

// New endpoint to get a single URL analysis result
func GetURLAnalysis(c *gin.Context) {
	id := c.Param("id")
	var urlAnalysis models.URLAnalysisResult
	result := initializers.DB.First(&urlAnalysis, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL analysis not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": urlAnalysis})
}

// BulkActionInput struct for receiving multiple IDs
type BulkActionInput struct {
	IDs []uint `json:"ids" binding:"required"`
}

// RerunURLAnalyses handles re-processing of multiple URLs
func RerunURLAnalyses(c *gin.Context) {
	var input BulkActionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var urls []models.URLAnalysisResult
	// Find the URLs by their IDs
	result := initializers.DB.Find(&urls, input.IDs)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find URLs for re-run", "details": result.Error.Error()})
		return
	}

	if len(urls) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "No URLs found for the provided IDs."})
		return
	}

	// Update status and re-trigger processing for each selected URL
	for _, url := range urls {
		// Only re-queue if it's not already running or queued
		if url.Status != "running" && url.Status != "queued" {
			url.Status = "queued" // Reset status to queued for re-processing
			url.ErrorMessage = "" // Clear any previous error message
			initializers.DB.Save(&url)
			go services.ProcessURL(url.ID) // Start new goroutine for re-analysis
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Re-analysis started for selected URLs."})
}

// DeleteURLAnalyses handles deleting multiple URLs
func DeleteURLAnalyses(c *gin.Context) {
	var input BulkActionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Perform a batch delete using the provided IDs
	result := initializers.DB.Delete(&models.URLAnalysisResult{}, input.IDs)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete URLs", "details": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "No URLs found for the provided IDs to delete."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Selected URLs deleted successfully.", "deletedCount": result.RowsAffected})
}
