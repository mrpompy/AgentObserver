package seed

import (
	"encoding/json"
	"log"
	"time"

	"agent-observer/db"
	"agent-observer/models"

	"gorm.io/datatypes"
)

func mustJSON(v interface{}) datatypes.JSON {
	b, err := json.Marshal(v)
	if err != nil {
		log.Fatal("Failed to marshal JSON for seed data:", err)
	}
	return datatypes.JSON(b)
}

func strPtr(s string) *string {
	return &s
}

func timePtr(t time.Time) *time.Time {
	return &t
}

func SeedDB() {
	log.Println("Seeding database with sample data...")

	now := time.Now()

	// Teams
	teams := []models.Team{
		{
			ID:          "team-001",
			Name:        "Code Review Team",
			Description: "Automated code review and quality assurance team that analyzes pull requests and suggests improvements",
			CreatedBy:   "admin@example.com",
			Status:      "running",
			CreatedAt:   now.Add(-72 * time.Hour),
		},
		{
			ID:          "team-002",
			Name:        "Research Team",
			Description: "Research and analysis team that gathers information, synthesizes findings, and produces reports",
			CreatedBy:   "admin@example.com",
			Status:      "idle",
			CreatedAt:   now.Add(-48 * time.Hour),
		},
	}

	for _, t := range teams {
		db.DB.Create(&t)
	}

	// Agents
	agents := []models.Agent{
		// Code Review Team agents
		{
			ID:        "agent-cr-lead",
			TeamID:    "team-001",
			Role:      "lead",
			Name:      "ReviewLead",
			Specialty: "Code architecture and design patterns",
			Status:    "active",
			CreatedAt: now.Add(-72 * time.Hour),
		},
		{
			ID:        "agent-cr-security",
			TeamID:    "team-001",
			Role:      "teammate",
			Name:      "SecurityAnalyzer",
			Specialty: "Security vulnerability detection and best practices",
			Status:    "active",
			CreatedAt: now.Add(-72 * time.Hour),
		},
		{
			ID:        "agent-cr-perf",
			TeamID:    "team-001",
			Role:      "teammate",
			Name:      "PerfOptimizer",
			Specialty: "Performance analysis and optimization suggestions",
			Status:    "idle",
			CreatedAt: now.Add(-72 * time.Hour),
		},
		{
			ID:        "agent-cr-test",
			TeamID:    "team-001",
			Role:      "teammate",
			Name:      "TestAdvisor",
			Specialty: "Test coverage analysis and test case generation",
			Status:    "active",
			CreatedAt: now.Add(-70 * time.Hour),
		},
		// Research Team agents
		{
			ID:        "agent-rs-lead",
			TeamID:    "team-002",
			Role:      "lead",
			Name:      "ResearchLead",
			Specialty: "Research coordination and synthesis",
			Status:    "idle",
			CreatedAt: now.Add(-48 * time.Hour),
		},
		{
			ID:        "agent-rs-web",
			TeamID:    "team-002",
			Role:      "teammate",
			Name:      "WebResearcher",
			Specialty: "Web search and information gathering",
			Status:    "idle",
			CreatedAt: now.Add(-48 * time.Hour),
		},
		{
			ID:        "agent-rs-analyst",
			TeamID:    "team-002",
			Role:      "teammate",
			Name:      "DataAnalyst",
			Specialty: "Data analysis and statistical interpretation",
			Status:    "idle",
			CreatedAt: now.Add(-48 * time.Hour),
		},
	}

	for _, a := range agents {
		db.DB.Create(&a)
	}

	// Conversations
	conversations := []models.Conversation{
		// Code Review Team conversations
		{
			ID:        "conv-cr-001",
			TeamID:    "team-001",
			AgentID:   "agent-cr-lead",
			Title:     "Review PR #142: Auth middleware refactor",
			StartedAt: now.Add(-24 * time.Hour),
		},
		{
			ID:        "conv-cr-002",
			TeamID:    "team-001",
			AgentID:   "agent-cr-lead",
			Title:     "Review PR #138: Database connection pooling",
			StartedAt: now.Add(-48 * time.Hour),
			EndedAt:   timePtr(now.Add(-46 * time.Hour)),
		},
		{
			ID:        "conv-cr-003",
			TeamID:    "team-001",
			AgentID:   "agent-cr-security",
			Title:     "Security audit: API endpoints",
			StartedAt: now.Add(-12 * time.Hour),
		},
		// Research Team conversations
		{
			ID:        "conv-rs-001",
			TeamID:    "team-002",
			AgentID:   "agent-rs-lead",
			Title:     "Research: LLM fine-tuning best practices 2025",
			StartedAt: now.Add(-36 * time.Hour),
			EndedAt:   timePtr(now.Add(-30 * time.Hour)),
		},
		{
			ID:        "conv-rs-002",
			TeamID:    "team-002",
			AgentID:   "agent-rs-web",
			Title:     "Competitor analysis: AI agent frameworks",
			StartedAt: now.Add(-20 * time.Hour),
		},
	}

	for _, c := range conversations {
		db.DB.Create(&c)
	}

	// Messages for conv-cr-001 (Auth middleware review)
	messages := []models.Message{
		{
			ID:             "msg-cr-001-01",
			ConversationID: "conv-cr-001",
			TeamID:         "team-001",
			AgentID:        nil,
			Role:           "user",
			Content:        "Please review the authentication middleware refactor in PR #142. Focus on security implications and backward compatibility.",
			CreatedAt:      now.Add(-24 * time.Hour),
		},
		{
			ID:             "msg-cr-001-02",
			ConversationID: "conv-cr-001",
			TeamID:         "team-001",
			AgentID:        strPtr("agent-cr-lead"),
			Role:           "agent",
			Content:        "I'll coordinate the review of PR #142. Let me first analyze the changes and then delegate specific aspects to the team.\n\nInitial observations:\n1. The PR modifies 12 files across the auth middleware package\n2. JWT token validation logic has been restructured\n3. New refresh token rotation mechanism added\n4. Session management moved from in-memory to Redis\n\nI'm delegating security analysis to @SecurityAnalyzer and performance impact to @PerfOptimizer.",
			RawThoughts: mustJSON(map[string]interface{}{
				"iteration": 1,
				"decision":  "search_codebase",
				"tool_calls": []map[string]interface{}{
					{"name": "grep", "args": map[string]string{"pattern": "handleAuth"}},
					{"name": "read_file", "args": map[string]string{"path": "middleware/auth.go"}},
				},
				"reasoning": "Need to find the authentication handler to understand the current flow before reviewing changes",
			}),
			CreatedAt: now.Add(-23*time.Hour - 55*time.Minute),
		},
		{
			ID:             "msg-cr-001-03",
			ConversationID: "conv-cr-001",
			TeamID:         "team-001",
			AgentID:        strPtr("agent-cr-security"),
			Role:           "teammate_message",
			Content:        "Security analysis of PR #142:\n\n**Critical Issues:**\n- The JWT secret rotation doesn't invalidate existing tokens. This creates a window where old tokens remain valid.\n- The refresh token endpoint lacks rate limiting.\n\n**Recommendations:**\n1. Implement a token blacklist during secret rotation\n2. Add rate limiting (max 5 refresh attempts per minute per user)\n3. The CORS configuration should explicitly list allowed origins rather than using wildcard\n\n**Positive Changes:**\n- Moving to Redis-based sessions improves security by enabling centralized session invalidation\n- The new PKCE implementation follows RFC 7636 correctly",
			RawThoughts: mustJSON(map[string]interface{}{
				"iteration": 1,
				"decision":  "analyze_security",
				"tool_calls": []map[string]interface{}{
					{"name": "search_vulnerabilities", "args": map[string]string{"pattern": "jwt.*secret"}},
					{"name": "check_owasp", "args": map[string]string{"category": "A07:2021"}},
				},
				"reasoning":         "Checking for common authentication vulnerabilities and OWASP top 10 compliance",
				"confidence":        0.92,
				"tokens_used":       1847,
				"model":             "claude-3-opus",
				"vulnerabilities_found": 2,
			}),
			CreatedAt: now.Add(-23*time.Hour - 30*time.Minute),
		},
		{
			ID:             "msg-cr-001-04",
			ConversationID: "conv-cr-001",
			TeamID:         "team-001",
			AgentID:        strPtr("agent-cr-perf"),
			Role:           "teammate_message",
			Content:        "Performance impact analysis:\n\n**Redis Session Store:**\n- Average latency increase: ~2ms per request (acceptable)\n- Redis connection pool sized at 10 connections - may need tuning under load\n- Recommend adding connection pool metrics\n\n**JWT Validation:**\n- New validation adds one additional hash comparison (~0.1ms)\n- Token caching reduces redundant validations by ~60%\n\nOverall performance impact is minimal and well within acceptable bounds.",
			RawThoughts: mustJSON(map[string]interface{}{
				"iteration": 1,
				"decision":  "benchmark_analysis",
				"tool_calls": []map[string]interface{}{
					{"name": "run_benchmark", "args": map[string]string{"target": "middleware/auth_test.go"}},
				},
				"reasoning":   "Running performance benchmarks to quantify the impact of the refactor",
				"latency_p99": "4.2ms",
				"tokens_used": 1203,
			}),
			CreatedAt: now.Add(-23 * time.Hour),
		},
		{
			ID:             "msg-cr-001-05",
			ConversationID: "conv-cr-001",
			TeamID:         "team-001",
			AgentID:        strPtr("agent-cr-lead"),
			Role:           "agent",
			Content:        "## Summary of PR #142 Review\n\n**Overall Assessment: Approve with required changes**\n\nThe refactor is well-structured and improves the authentication architecture. However, there are 2 critical security issues that must be addressed before merging:\n\n1. **Token invalidation during secret rotation** - Must implement a token blacklist\n2. **Rate limiting on refresh endpoint** - Must add rate limiting\n\nPerformance impact is acceptable. The move to Redis sessions is a positive architectural decision.\n\nRecommend addressing the security issues and re-requesting review.",
			RawThoughts: mustJSON(map[string]interface{}{
				"iteration": 3,
				"decision":  "synthesize_review",
				"reasoning": "Combining feedback from security and performance analysis to provide final recommendation",
				"sub_reviews": []string{
					"security: 2 critical issues found",
					"performance: acceptable impact",
					"architecture: positive changes",
				},
				"final_verdict":   "approve_with_changes",
				"tokens_used":     956,
				"total_iterations": 3,
			}),
			CreatedAt: now.Add(-22*time.Hour - 30*time.Minute),
		},

		// Messages for conv-cr-002 (Database connection pooling)
		{
			ID:             "msg-cr-002-01",
			ConversationID: "conv-cr-002",
			TeamID:         "team-001",
			AgentID:        nil,
			Role:           "user",
			Content:        "Review the database connection pooling changes in PR #138.",
			CreatedAt:      now.Add(-48 * time.Hour),
		},
		{
			ID:             "msg-cr-002-02",
			ConversationID: "conv-cr-002",
			TeamID:         "team-001",
			AgentID:        strPtr("agent-cr-lead"),
			Role:           "agent",
			Content:        "PR #138 review complete. The connection pooling implementation looks solid. Max pool size of 25 with idle timeout of 5 minutes is appropriate for the expected load. Approved.",
			RawThoughts: mustJSON(map[string]interface{}{
				"iteration": 1,
				"decision":  "quick_review",
				"reasoning": "Straightforward change with well-established patterns, no security concerns",
				"tokens_used": 534,
			}),
			CreatedAt: now.Add(-47 * time.Hour),
		},

		// Messages for conv-cr-003 (Security audit)
		{
			ID:             "msg-cr-003-01",
			ConversationID: "conv-cr-003",
			TeamID:         "team-001",
			AgentID:        nil,
			Role:           "system",
			Content:        "Automated security audit triggered for all API endpoints.",
			CreatedAt:      now.Add(-12 * time.Hour),
		},
		{
			ID:             "msg-cr-003-02",
			ConversationID: "conv-cr-003",
			TeamID:         "team-001",
			AgentID:        strPtr("agent-cr-security"),
			Role:           "agent",
			Content:        "Beginning comprehensive security audit of all API endpoints. Scanning for:\n- SQL injection vulnerabilities\n- XSS attack vectors\n- Authentication bypass possibilities\n- Rate limiting gaps\n- Input validation issues\n\nScanning 47 endpoints across 12 route groups...",
			RawThoughts: mustJSON(map[string]interface{}{
				"iteration": 1,
				"decision":  "full_scan",
				"tool_calls": []map[string]interface{}{
					{"name": "scan_endpoints", "args": map[string]string{"scope": "all"}},
					{"name": "check_headers", "args": map[string]string{"security_headers": "strict"}},
				},
				"reasoning":      "Performing comprehensive endpoint security audit",
				"endpoints_total": 47,
				"tokens_used":    2341,
			}),
			CreatedAt: now.Add(-11*time.Hour - 50*time.Minute),
		},

		// Messages for conv-rs-001 (LLM research)
		{
			ID:             "msg-rs-001-01",
			ConversationID: "conv-rs-001",
			TeamID:         "team-002",
			AgentID:        nil,
			Role:           "user",
			Content:        "Research the latest best practices for LLM fine-tuning in 2025, focusing on parameter-efficient methods.",
			CreatedAt:      now.Add(-36 * time.Hour),
		},
		{
			ID:             "msg-rs-001-02",
			ConversationID: "conv-rs-001",
			TeamID:         "team-002",
			AgentID:        strPtr("agent-rs-lead"),
			Role:           "agent",
			Content:        "I'll coordinate the research effort. Delegating web search to @WebResearcher and data analysis of published benchmarks to @DataAnalyst.",
			RawThoughts: mustJSON(map[string]interface{}{
				"iteration": 1,
				"decision":  "delegate_research",
				"reasoning": "Complex research topic requires parallel information gathering and analysis",
				"subtasks": []string{
					"web_search: recent papers and blog posts",
					"data_analysis: benchmark comparisons",
					"synthesis: combine findings into report",
				},
			}),
			CreatedAt: now.Add(-35*time.Hour - 50*time.Minute),
		},
		{
			ID:             "msg-rs-001-03",
			ConversationID: "conv-rs-001",
			TeamID:         "team-002",
			AgentID:        strPtr("agent-rs-web"),
			Role:           "teammate_message",
			Content:        "Web research findings on LLM fine-tuning best practices:\n\n1. **LoRA and QLoRA** remain the most popular PEFT methods, with QLoRA enabling fine-tuning of 70B models on consumer hardware\n2. **DoRA (Weight-Decomposed Low-Rank Adaptation)** shows promising results with ~3% improvement over LoRA on most benchmarks\n3. **NEFTune** (adding noise to embeddings during training) consistently improves instruction-following by 5-10%\n4. **DPO/ORPO** are replacing RLHF for alignment, being simpler and more stable\n5. New trend: **Mixture of LoRA Experts** combining multiple specialized adapters\n\nSources: 15 papers, 8 technical blog posts, 3 benchmark repositories analyzed.",
			RawThoughts: mustJSON(map[string]interface{}{
				"iteration": 2,
				"decision":  "web_search",
				"tool_calls": []map[string]interface{}{
					{"name": "web_search", "args": map[string]string{"query": "LLM fine-tuning best practices 2025 PEFT"}},
					{"name": "web_search", "args": map[string]string{"query": "LoRA QLoRA DoRA comparison benchmarks"}},
					{"name": "read_paper", "args": map[string]string{"arxiv_id": "2402.xxxxx"}},
				},
				"reasoning":    "Gathering comprehensive information about current PEFT methods and comparing their effectiveness",
				"sources_found": 26,
				"tokens_used":  3567,
			}),
			CreatedAt: now.Add(-34 * time.Hour),
		},
		{
			ID:             "msg-rs-001-04",
			ConversationID: "conv-rs-001",
			TeamID:         "team-002",
			AgentID:        strPtr("agent-rs-analyst"),
			Role:           "teammate_message",
			Content:        "Benchmark analysis complete:\n\n| Method | MMLU | HellaSwag | TruthfulQA | Avg Improvement |\n|--------|------|-----------|------------|------------------|\n| Full FT | 68.2 | 82.1 | 51.3 | baseline |\n| LoRA r=16 | 66.8 | 80.9 | 50.1 | -1.9% |\n| QLoRA | 66.1 | 80.2 | 49.8 | -2.7% |\n| DoRA | 67.5 | 81.6 | 51.0 | -0.7% |\n| LoRA + NEFTune | 67.9 | 81.8 | 52.1 | +0.3% |\n\nKey insight: DoRA with NEFTune achieves near full fine-tuning quality at 1/10th the compute cost.",
			RawThoughts: mustJSON(map[string]interface{}{
				"iteration": 1,
				"decision":  "analyze_benchmarks",
				"tool_calls": []map[string]interface{}{
					{"name": "parse_benchmark_data", "args": map[string]string{"source": "open_llm_leaderboard"}},
				},
				"reasoning":        "Comparing quantitative benchmarks across different fine-tuning methods",
				"datasets_analyzed": 4,
				"models_compared":  5,
				"tokens_used":      2890,
			}),
			CreatedAt: now.Add(-33 * time.Hour),
		},
		{
			ID:             "msg-rs-001-05",
			ConversationID: "conv-rs-001",
			TeamID:         "team-002",
			AgentID:        strPtr("agent-rs-lead"),
			Role:           "agent",
			Content:        "## Research Report: LLM Fine-Tuning Best Practices 2025\n\n### Executive Summary\nParameter-efficient fine-tuning (PEFT) has matured significantly. The combination of DoRA + NEFTune represents the current best practice, achieving near-full fine-tuning quality at a fraction of the cost.\n\n### Key Recommendations\n1. Use DoRA over standard LoRA for most use cases\n2. Always enable NEFTune during training\n3. Consider DPO over RLHF for alignment\n4. For resource-constrained settings, QLoRA remains the best option\n5. Explore Mixture of LoRA Experts for multi-task scenarios\n\nFull report has been compiled and is available for download.",
			RawThoughts: mustJSON(map[string]interface{}{
				"iteration":  3,
				"decision":   "synthesize_report",
				"reasoning":  "Combining web research and benchmark analysis into a coherent report with actionable recommendations",
				"tokens_used": 1456,
				"report_sections": []string{
					"executive_summary",
					"methodology_comparison",
					"benchmark_analysis",
					"recommendations",
					"references",
				},
			}),
			CreatedAt: now.Add(-31 * time.Hour),
		},

		// Messages for conv-rs-002 (Competitor analysis)
		{
			ID:             "msg-rs-002-01",
			ConversationID: "conv-rs-002",
			TeamID:         "team-002",
			AgentID:        nil,
			Role:           "user",
			Content:        "Analyze the current landscape of AI agent frameworks. Compare AutoGen, CrewAI, LangGraph, and any emerging competitors.",
			CreatedAt:      now.Add(-20 * time.Hour),
		},
		{
			ID:             "msg-rs-002-02",
			ConversationID: "conv-rs-002",
			TeamID:         "team-002",
			AgentID:        strPtr("agent-rs-web"),
			Role:           "agent",
			Content:        "Starting competitive analysis of AI agent frameworks. I'll research each framework's architecture, capabilities, community adoption, and recent updates.\n\nInitial framework list:\n- AutoGen (Microsoft)\n- CrewAI\n- LangGraph (LangChain)\n- Agency Swarm\n- Semantic Kernel (Microsoft)\n- OpenAI Assistants API\n\nSearching for recent updates and community metrics...",
			RawThoughts: mustJSON(map[string]interface{}{
				"iteration": 1,
				"decision":  "comprehensive_search",
				"tool_calls": []map[string]interface{}{
					{"name": "web_search", "args": map[string]string{"query": "AI agent frameworks comparison 2025"}},
					{"name": "github_stats", "args": map[string]string{"repos": "microsoft/autogen,joaomdmoura/crewai,langchain-ai/langgraph"}},
				},
				"reasoning":   "Need to gather comprehensive data on each framework including GitHub stars, release frequency, and community size",
				"tokens_used": 1823,
			}),
			CreatedAt: now.Add(-19*time.Hour - 45*time.Minute),
		},
	}

	for _, m := range messages {
		db.DB.Create(&m)
	}

	// Traces for conv-cr-001
	traces := []models.Trace{
		// Root span: overall review process
		{
			ID:             "trace-cr-001-root",
			TeamID:         "team-001",
			AgentID:        "agent-cr-lead",
			ConversationID: "conv-cr-001",
			ParentSpanID:   nil,
			SpanName:       "agent.decision",
			Attributes: mustJSON(map[string]interface{}{
				"decision_type": "coordinate_review",
				"pr_number":     142,
				"files_changed": 12,
			}),
			StartTime: now.Add(-24 * time.Hour),
			EndTime:   timePtr(now.Add(-22*time.Hour - 30*time.Minute)),
		},
		// LLM call to analyze PR
		{
			ID:             "trace-cr-001-llm1",
			TeamID:         "team-001",
			AgentID:        "agent-cr-lead",
			ConversationID: "conv-cr-001",
			ParentSpanID:   strPtr("trace-cr-001-root"),
			SpanName:       "llm_call",
			Attributes: mustJSON(map[string]interface{}{
				"model":         "claude-3-opus",
				"prompt_tokens": 2450,
				"output_tokens": 380,
				"temperature":   0.3,
				"purpose":       "analyze_pr_diff",
			}),
			StartTime: now.Add(-23*time.Hour - 58*time.Minute),
			EndTime:   timePtr(now.Add(-23*time.Hour - 55*time.Minute)),
		},
		// Tool call: search codebase
		{
			ID:             "trace-cr-001-tool1",
			TeamID:         "team-001",
			AgentID:        "agent-cr-lead",
			ConversationID: "conv-cr-001",
			ParentSpanID:   strPtr("trace-cr-001-root"),
			SpanName:       "tool.search",
			Attributes: mustJSON(map[string]interface{}{
				"tool_name": "grep",
				"pattern":   "handleAuth",
				"results":   8,
				"duration_ms": 45,
			}),
			StartTime: now.Add(-23*time.Hour - 54*time.Minute),
			EndTime:   timePtr(now.Add(-23*time.Hour - 53*time.Minute)),
		},
		// Tool call: read file
		{
			ID:             "trace-cr-001-tool2",
			TeamID:         "team-001",
			AgentID:        "agent-cr-lead",
			ConversationID: "conv-cr-001",
			ParentSpanID:   strPtr("trace-cr-001-root"),
			SpanName:       "tool.read_file",
			Attributes: mustJSON(map[string]interface{}{
				"tool_name":   "read_file",
				"file_path":   "middleware/auth.go",
				"lines_read":  245,
				"duration_ms": 12,
			}),
			StartTime: now.Add(-23*time.Hour - 52*time.Minute),
			EndTime:   timePtr(now.Add(-23*time.Hour - 51*time.Minute)),
		},
		// Delegation to security analyzer
		{
			ID:             "trace-cr-001-delegate-sec",
			TeamID:         "team-001",
			AgentID:        "agent-cr-security",
			ConversationID: "conv-cr-001",
			ParentSpanID:   strPtr("trace-cr-001-root"),
			SpanName:       "agent.decision",
			Attributes: mustJSON(map[string]interface{}{
				"decision_type":      "security_analysis",
				"delegated_by":       "agent-cr-lead",
				"focus_areas":        []string{"jwt", "session_management", "cors"},
			}),
			StartTime: now.Add(-23*time.Hour - 50*time.Minute),
			EndTime:   timePtr(now.Add(-23*time.Hour - 30*time.Minute)),
		},
		// Security analyzer LLM call
		{
			ID:             "trace-cr-001-sec-llm",
			TeamID:         "team-001",
			AgentID:        "agent-cr-security",
			ConversationID: "conv-cr-001",
			ParentSpanID:   strPtr("trace-cr-001-delegate-sec"),
			SpanName:       "llm_call",
			Attributes: mustJSON(map[string]interface{}{
				"model":         "claude-3-opus",
				"prompt_tokens": 3200,
				"output_tokens": 847,
				"temperature":   0.2,
				"purpose":       "security_vulnerability_scan",
			}),
			StartTime: now.Add(-23*time.Hour - 45*time.Minute),
			EndTime:   timePtr(now.Add(-23*time.Hour - 38*time.Minute)),
		},
		// Security tool: vulnerability scan
		{
			ID:             "trace-cr-001-sec-tool1",
			TeamID:         "team-001",
			AgentID:        "agent-cr-security",
			ConversationID: "conv-cr-001",
			ParentSpanID:   strPtr("trace-cr-001-delegate-sec"),
			SpanName:       "tool.search",
			Attributes: mustJSON(map[string]interface{}{
				"tool_name":            "search_vulnerabilities",
				"pattern":              "jwt.*secret",
				"vulnerabilities_found": 2,
				"severity":             "critical",
				"duration_ms":          230,
			}),
			StartTime: now.Add(-23*time.Hour - 37*time.Minute),
			EndTime:   timePtr(now.Add(-23*time.Hour - 35*time.Minute)),
		},
		// Performance analysis delegation
		{
			ID:             "trace-cr-001-delegate-perf",
			TeamID:         "team-001",
			AgentID:        "agent-cr-perf",
			ConversationID: "conv-cr-001",
			ParentSpanID:   strPtr("trace-cr-001-root"),
			SpanName:       "agent.decision",
			Attributes: mustJSON(map[string]interface{}{
				"decision_type": "performance_analysis",
				"delegated_by":  "agent-cr-lead",
				"focus_areas":   []string{"latency", "connection_pooling", "caching"},
			}),
			StartTime: now.Add(-23*time.Hour - 30*time.Minute),
			EndTime:   timePtr(now.Add(-23 * time.Hour)),
		},
		// Performance LLM call
		{
			ID:             "trace-cr-001-perf-llm",
			TeamID:         "team-001",
			AgentID:        "agent-cr-perf",
			ConversationID: "conv-cr-001",
			ParentSpanID:   strPtr("trace-cr-001-delegate-perf"),
			SpanName:       "llm_call",
			Attributes: mustJSON(map[string]interface{}{
				"model":         "claude-3-opus",
				"prompt_tokens": 1800,
				"output_tokens": 520,
				"temperature":   0.3,
				"purpose":       "performance_benchmark_analysis",
			}),
			StartTime: now.Add(-23*time.Hour - 20*time.Minute),
			EndTime:   timePtr(now.Add(-23*time.Hour - 12*time.Minute)),
		},
		// Final synthesis LLM call
		{
			ID:             "trace-cr-001-synthesis",
			TeamID:         "team-001",
			AgentID:        "agent-cr-lead",
			ConversationID: "conv-cr-001",
			ParentSpanID:   strPtr("trace-cr-001-root"),
			SpanName:       "llm_call",
			Attributes: mustJSON(map[string]interface{}{
				"model":         "claude-3-opus",
				"prompt_tokens": 4100,
				"output_tokens": 956,
				"temperature":   0.3,
				"purpose":       "synthesize_final_review",
			}),
			StartTime: now.Add(-22*time.Hour - 45*time.Minute),
			EndTime:   timePtr(now.Add(-22*time.Hour - 35*time.Minute)),
		},

		// Traces for conv-rs-001
		{
			ID:             "trace-rs-001-root",
			TeamID:         "team-002",
			AgentID:        "agent-rs-lead",
			ConversationID: "conv-rs-001",
			ParentSpanID:   nil,
			SpanName:       "agent.decision",
			Attributes: mustJSON(map[string]interface{}{
				"decision_type": "coordinate_research",
				"topic":         "LLM fine-tuning best practices",
			}),
			StartTime: now.Add(-36 * time.Hour),
			EndTime:   timePtr(now.Add(-31 * time.Hour)),
		},
		// Web search span
		{
			ID:             "trace-rs-001-search",
			TeamID:         "team-002",
			AgentID:        "agent-rs-web",
			ConversationID: "conv-rs-001",
			ParentSpanID:   strPtr("trace-rs-001-root"),
			SpanName:       "tool.search",
			Attributes: mustJSON(map[string]interface{}{
				"tool_name":   "web_search",
				"query":       "LLM fine-tuning best practices 2025 PEFT",
				"results":     26,
				"duration_ms": 1250,
			}),
			StartTime: now.Add(-35*time.Hour - 45*time.Minute),
			EndTime:   timePtr(now.Add(-35*time.Hour - 30*time.Minute)),
		},
		// LLM call for analysis
		{
			ID:             "trace-rs-001-llm",
			TeamID:         "team-002",
			AgentID:        "agent-rs-analyst",
			ConversationID: "conv-rs-001",
			ParentSpanID:   strPtr("trace-rs-001-root"),
			SpanName:       "llm_call",
			Attributes: mustJSON(map[string]interface{}{
				"model":         "claude-3-opus",
				"prompt_tokens": 5600,
				"output_tokens": 2890,
				"temperature":   0.4,
				"purpose":       "benchmark_analysis_and_comparison",
			}),
			StartTime: now.Add(-34 * time.Hour),
			EndTime:   timePtr(now.Add(-33*time.Hour - 30*time.Minute)),
		},

		// Traces for conv-cr-003 (Security audit)
		{
			ID:             "trace-cr-003-root",
			TeamID:         "team-001",
			AgentID:        "agent-cr-security",
			ConversationID: "conv-cr-003",
			ParentSpanID:   nil,
			SpanName:       "agent.decision",
			Attributes: mustJSON(map[string]interface{}{
				"decision_type":   "full_security_audit",
				"endpoints_total": 47,
				"route_groups":    12,
			}),
			StartTime: now.Add(-12 * time.Hour),
			EndTime:   nil, // Still in progress
		},
		// Endpoint scanning tool
		{
			ID:             "trace-cr-003-scan",
			TeamID:         "team-001",
			AgentID:        "agent-cr-security",
			ConversationID: "conv-cr-003",
			ParentSpanID:   strPtr("trace-cr-003-root"),
			SpanName:       "tool.search",
			Attributes: mustJSON(map[string]interface{}{
				"tool_name":        "scan_endpoints",
				"scope":            "all",
				"endpoints_scanned": 23,
				"endpoints_total":  47,
				"status":           "in_progress",
			}),
			StartTime: now.Add(-11*time.Hour - 45*time.Minute),
			EndTime:   nil, // Still in progress
		},
	}

	for _, t := range traces {
		db.DB.Create(&t)
	}

	log.Println("Database seeded successfully")
}
