package models

import "gorm.io/gorm"

type URLAnalysisResult struct {
	gorm.Model
	URL                     string `gorm:"type:varchar(225);uniqueIndex;not null"`
	HTMLVersion             string
	PageTitle               string
	H1Count                 int
	H2Count                 int
	H3Count                 int
	H4Count                 int
	H5Count                 int
	H6Count                 int
	InternalLinks           int
	ExternalLinks           int
	InaccessibleLinks       int
	InaccessibleLinkDetails string // JSON string of broken links and status codes
	HasLoginForm            bool
	Status                  string `gorm:"default:'queued'"` // queued, running, done, error
	ErrorMessage            string
}
