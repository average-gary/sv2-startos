package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/BurntSushi/toml"
)

var redactByService = map[string][]string{
	"pool":       {"authority_secret_key"},
	"translator": {},
	"jdc":        {"authority_secret_key"},
}

const redactedPlaceholder = "***REDACTED***"

func redact(m map[string]any, keys []string) {
	keySet := make(map[string]struct{}, len(keys))
	for _, k := range keys {
		keySet[k] = struct{}{}
	}
	var walk func(any)
	walk = func(v any) {
		switch t := v.(type) {
		case map[string]any:
			for k, vv := range t {
				if _, hit := keySet[k]; hit {
					t[k] = redactedPlaceholder
				} else {
					walk(vv)
				}
			}
		case []any:
			for _, vv := range t {
				walk(vv)
			}
		}
	}
	walk(m)
}

func handler(configPath, service string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Content-Type", "application/json")

		raw, err := os.ReadFile(configPath)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"read failed: %s"}`, err), http.StatusServiceUnavailable)
			return
		}
		parsed := map[string]any{}
		if err := toml.Unmarshal(raw, &parsed); err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"toml parse failed: %s"}`, err), http.StatusInternalServerError)
			return
		}
		keys := redactByService[service]
		redact(parsed, keys)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"raw":           parsed,
			"redacted_keys": keys,
			"service":       service,
			"loaded_at":     time.Now().UTC().Format(time.RFC3339),
		})
	}
}

func main() {
	addr := flag.String("addr", ":9091", "listen address")
	configPath := flag.String("config", "/data/config.toml", "path to TOML config to expose")
	service := flag.String("service", os.Getenv("CONFIGD_SERVICE"), "service name (pool|translator|jdc)")
	flag.Parse()

	if *service == "" {
		*service = "pool"
	}
	if _, ok := redactByService[*service]; !ok {
		log.Fatalf("unknown service %q (expected pool|translator|jdc)", *service)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/config", handler(*configPath, *service))
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	log.Printf("configd listening on %s, serving %s for service %s", *addr, *configPath, *service)
	srv := &http.Server{
		Addr:              *addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}
	if err := srv.ListenAndServe(); err != nil && !strings.Contains(err.Error(), "Server closed") {
		log.Fatal(err)
	}
}
