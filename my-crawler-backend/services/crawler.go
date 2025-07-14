package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"my-crawler-backend/initializers"
	"my-crawler-backend/models"

	"github.com/PuerkitoBio/goquery"
)

type BrokenLink struct {
	URL        string `json:"url"`
	StatusCode int    `json:"statusCode"`
}

func ProcessURL(urlAnalysisID uint) {
	var urlAnalysis models.URLAnalysisResult
	result := initializers.DB.First(&urlAnalysis, urlAnalysisID)
	if result.Error != nil {
		fmt.Printf("Error finding URLAnalysisResult %d: %v\n", urlAnalysisID, result.Error)
		return
	}

	urlAnalysis.Status = "running"
	initializers.DB.Save(&urlAnalysis)

	data, err := CrawlURL(urlAnalysis.URL)
	if err != nil {
		urlAnalysis.Status = "error"
		urlAnalysis.ErrorMessage = err.Error()
	} else {
		urlAnalysis.HTMLVersion = data.HTMLVersion
		urlAnalysis.PageTitle = data.PageTitle
		urlAnalysis.H1Count = data.H1Count
		urlAnalysis.H2Count = data.H2Count
		urlAnalysis.H3Count = data.H3Count
		urlAnalysis.H4Count = data.H4Count
		urlAnalysis.H5Count = data.H5Count
		urlAnalysis.H6Count = data.H6Count
		urlAnalysis.InternalLinks = data.InternalLinks
		urlAnalysis.ExternalLinks = data.ExternalLinks
		urlAnalysis.InaccessibleLinks = data.InaccessibleLinks

		if len(data.BrokenLinks) > 0 {
			jsonBrokenLinks, _ := json.Marshal(data.BrokenLinks)
			urlAnalysis.InaccessibleLinkDetails = string(jsonBrokenLinks)
		}
		urlAnalysis.HasLoginForm = data.HasLoginForm
		urlAnalysis.Status = "done"
	}

	initializers.DB.Save(&urlAnalysis)
	fmt.Printf("Finished processing URL: %s (Status: %s)\n", urlAnalysis.URL, urlAnalysis.Status)
}

type CrawlResult struct {
	HTMLVersion       string
	PageTitle         string
	H1Count           int
	H2Count           int
	H3Count           int
	H4Count           int
	H5Count           int
	H6Count           int
	InternalLinks     int
	ExternalLinks     int
	InaccessibleLinks int
	BrokenLinks       []BrokenLink
	HasLoginForm      bool
}

func CrawlURL(url string) (*CrawlResult, error) {
	res, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		return nil, fmt.Errorf("non-OK status code: %d %s", res.StatusCode, res.Status)
	}

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	result := &CrawlResult{}
	htmlNode := doc.Find("html").First()
	if htmlNode.Length() > 0 {
		if strings.Contains(strings.ToLower(doc.Nodes[0].FirstChild.Data), "html public") {
			result.HTMLVersion = "HTML 4.01 or XHTML"
		} else if strings.Contains(strings.ToLower(doc.Nodes[0].FirstChild.Data), "html") {
			result.HTMLVersion = "HTML5" // Assumes if not legacy, it's HTML5
		} else {
			result.HTMLVersion = "Unknown"
		}
	}

	// Page Title
	result.PageTitle = doc.Find("title").Text()

	// Heading Tags Count
	result.H1Count = doc.Find("h1").Length()
	result.H2Count = doc.Find("h2").Length()
	result.H3Count = doc.Find("h3").Length()
	result.H4Count = doc.Find("h4").Length()
	result.H5Count = doc.Find("h5").Length()
	result.H6Count = doc.Find("h6").Length()

	// Links and broken links
	var wg sync.WaitGroup
	linkChan := make(chan string)
	errorLinkChan := make(chan BrokenLink, 100)

	doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if !exists || href == "" || strings.HasPrefix(href, "#") || strings.HasPrefix(href, "javascript:") {
			return
		}

		fullURL := absoluteURL(url, href)

		if strings.HasPrefix(fullURL, url) {
			result.InternalLinks++
		} else {
			result.ExternalLinks++
		}

		wg.Add(1)
		go func(link string) {
			defer wg.Done()
			resp, err := http.Head(link)
			if err != nil {
				errorLinkChan <- BrokenLink{URL: link, StatusCode: 0}
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode >= 400 {
				errorLinkChan <- BrokenLink{URL: link, StatusCode: resp.StatusCode}
			}
		}(fullURL)
	})

	go func() {
		wg.Wait()
		close(errorLinkChan)
	}()

	for brokenLink := range errorLinkChan {
		result.InaccessibleLinks++
		result.BrokenLinks = append(result.BrokenLinks, brokenLink)
	}
	close(linkChan)

	result.HasLoginForm = doc.Find("input[type='password']").Length() > 0

	return result, nil
}

func absoluteURL(baseURL, relativeURL string) string {
	base, err := url.Parse(baseURL)
	if err != nil {
		return relativeURL // Fallback
	}
	rel, err := url.Parse(relativeURL)
	if err != nil {
		return relativeURL // Fallback
	}
	return base.ResolveReference(rel).String()
}
