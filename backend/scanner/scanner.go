package scanner

import (
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
)

// Scanner watches the Claude Code data directory for changes and triggers
// callbacks when session files are created or modified.
type Scanner struct {
	DataDir  string
	OnUpdate func(sessionID string) // callback when a session is updated
	watcher  *fsnotify.Watcher
	done     chan struct{}
	mu       sync.Mutex
	// debounce map to avoid processing the same session multiple times in quick succession
	pending    map[string]time.Time
	debounceMs time.Duration
}

// NewScanner creates a new Scanner for the given data directory.
func NewScanner(dataDir string) *Scanner {
	return &Scanner{
		DataDir:    dataDir,
		done:       make(chan struct{}),
		pending:    make(map[string]time.Time),
		debounceMs: 2 * time.Second,
	}
}

// Start begins watching the data directory for file changes.
// It runs in a background goroutine.
func (s *Scanner) Start() error {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	s.watcher = watcher

	// Watch the main data directory
	if err := watcher.Add(s.DataDir); err != nil {
		watcher.Close()
		return err
	}

	// Also watch all existing session subdirectories (for subagent changes)
	entries, err := os.ReadDir(s.DataDir)
	if err == nil {
		for _, entry := range entries {
			if entry.IsDir() {
				subDir := filepath.Join(s.DataDir, entry.Name())
				_ = watcher.Add(subDir)

				// Watch the subagents directory if it exists
				subagentsDir := filepath.Join(subDir, "subagents")
				if _, err := os.Stat(subagentsDir); err == nil {
					_ = watcher.Add(subagentsDir)
				}
			}
		}
	}

	go s.watchLoop()
	go s.debounceLoop()

	log.Printf("Scanner started watching %s", s.DataDir)
	return nil
}

// Stop terminates the file watcher.
func (s *Scanner) Stop() {
	close(s.done)
	if s.watcher != nil {
		s.watcher.Close()
	}
}

// SyncAll triggers a full synchronization of all existing sessions.
func (s *Scanner) SyncAll() error {
	entries, err := os.ReadDir(s.DataDir)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if !strings.HasSuffix(name, ".jsonl") {
			continue
		}
		sessionID := strings.TrimSuffix(name, ".jsonl")
		if s.OnUpdate != nil {
			s.OnUpdate(sessionID)
		}
	}

	return nil
}

// watchLoop processes filesystem events.
func (s *Scanner) watchLoop() {
	for {
		select {
		case <-s.done:
			return
		case event, ok := <-s.watcher.Events:
			if !ok {
				return
			}
			if event.Op&(fsnotify.Write|fsnotify.Create) == 0 {
				continue
			}

			// If a new directory is created, watch it (and its subagents dir)
			if event.Op&fsnotify.Create != 0 {
				info, err := os.Stat(event.Name)
				if err == nil && info.IsDir() {
					_ = s.watcher.Add(event.Name)
					subagentsDir := filepath.Join(event.Name, "subagents")
					if _, err := os.Stat(subagentsDir); err == nil {
						_ = s.watcher.Add(subagentsDir)
					}
					continue
				}
			}

			// Only process .jsonl files
			if !strings.HasSuffix(event.Name, ".jsonl") {
				continue
			}

			sessionID := s.extractSessionID(event.Name)
			if sessionID == "" {
				continue
			}

			s.mu.Lock()
			s.pending[sessionID] = time.Now()
			s.mu.Unlock()

		case err, ok := <-s.watcher.Errors:
			if !ok {
				return
			}
			log.Printf("Scanner watcher error: %v", err)
		}
	}
}

// debounceLoop periodically checks for pending updates and fires callbacks.
func (s *Scanner) debounceLoop() {
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-s.done:
			return
		case <-ticker.C:
			s.processPending()
		}
	}
}

// processPending fires callbacks for sessions that have been pending long enough.
func (s *Scanner) processPending() {
	s.mu.Lock()
	now := time.Now()
	var ready []string
	for sessionID, lastUpdate := range s.pending {
		if now.Sub(lastUpdate) >= s.debounceMs {
			ready = append(ready, sessionID)
		}
	}
	for _, id := range ready {
		delete(s.pending, id)
	}
	s.mu.Unlock()

	for _, sessionID := range ready {
		if s.OnUpdate != nil {
			s.OnUpdate(sessionID)
		}
	}
}

// extractSessionID extracts the session ID from a file path.
// For main session files: /path/to/{session-id}.jsonl -> session-id
// For subagent files: /path/to/{session-id}/subagents/agent-xxx.jsonl -> session-id
func (s *Scanner) extractSessionID(path string) string {
	// Normalize and get relative path from data dir
	relPath, err := filepath.Rel(s.DataDir, path)
	if err != nil {
		return ""
	}

	parts := strings.Split(relPath, string(os.PathSeparator))

	if len(parts) == 1 {
		// Direct child: {session-id}.jsonl
		return strings.TrimSuffix(parts[0], ".jsonl")
	}

	if len(parts) >= 3 && parts[1] == "subagents" {
		// Subagent file: {session-id}/subagents/agent-xxx.jsonl
		return parts[0]
	}

	return ""
}
