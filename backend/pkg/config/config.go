// Package config loads runtime configuration for the monolith.
package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds settings read from the environment (see .env.example).
type Config struct {
	Env      string
	HTTPPort string

	MySQLDSN string
	MongoURI string
	MongoDB  string

	RedisAddr     string
	RedisPassword string

	JWTSecret string

	// EngineURL points at the dedicated Rust matching service. Empty = use the
	// in-process Go engine.
	EngineURL string

	// Bootstrap Super Duper Admin (created on first start if absent).
	SDAUsername string
	SDAPassword string

	// FeedURLs are the third-party events feeds, in priority order (primary
	// first). The feed wrapper fails over to the next on error.
	FeedURLs []string

	// OddsURLs are the live market-odds feeds (back/lay/runner+market status), in
	// priority order. Empty => use the built-in dummy odds generator. The wrapper
	// fails over across them, falling back to dummy so panels stay populated.
	OddsURLs []string
}

// Load reads configuration, loading a local .env file first if present.
func Load() Config {
	_ = godotenv.Load(".env", "../.env")

	return Config{
		Env:      env("APP_ENV", "local"),
		HTTPPort: env("HTTP_PORT", "8080"),

		MySQLDSN: env("MYSQL_DSN", "bsf:bsf@tcp(localhost:3306)/bsf2020?parseTime=true&charset=utf8mb4&loc=UTC"),
		MongoURI: env("MONGO_URI", "mongodb://bsf:bsf@localhost:27017/bsf2020?authSource=admin"),
		MongoDB:  env("MONGO_DB", "bsf2020"),

		RedisAddr:     env("REDIS_ADDR", "localhost:6379"),
		RedisPassword: env("REDIS_PASSWORD", ""),

		JWTSecret: env("JWT_SECRET", "change-me-in-prod"),

		EngineURL: env("ENGINE_URL", ""),

		SDAUsername: env("SDA_USERNAME", "bsf"),
		SDAPassword: env("SDA_PASSWORD", "Bsf@12345"),

		FeedURLs: splitCSV(env("FEED_URLS",
			"http://139.59.162.241:3000/api/events,http://139.59.162.241:3002/api/events,http://139.59.162.241:3003/api/events")),

		// No real odds URLs yet → dummy generator. Set ODDS_URLS (comma-separated,
		// primary first) once the real provider(s) are available.
		OddsURLs: splitCSV(env("ODDS_URLS", "")),
	}
}

// splitCSV trims a comma-separated list into non-empty entries.
func splitCSV(s string) []string {
	var out []string
	for _, p := range strings.Split(s, ",") {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

func env(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}
