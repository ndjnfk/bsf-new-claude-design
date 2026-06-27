// Command server is the BSF2020 modular-monolith entrypoint. One process,
// many modules (identity, wallet, sports, betting, reporting, realtime, engine).
package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"
	"time"

	"bsf2020/internal/app"
	"bsf2020/pkg/config"
	"bsf2020/pkg/database"
	"bsf2020/pkg/server"
)

func main() {
	cfg := config.Load()
	log.Printf("starting bsf2020 (env=%s)", cfg.Env)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	mysqlDB, err := database.NewMySQL(ctx, cfg.MySQLDSN)
	if err != nil {
		log.Fatalf("mysql: %v", err)
	}
	defer mysqlDB.Close()
	log.Println("mysql: connected")

	mongoClient, mongoDB, err := database.NewMongo(ctx, cfg.MongoURI, cfg.MongoDB)
	if err != nil {
		log.Fatalf("mongo: %v", err)
	}
	defer func() {
		dc, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = mongoClient.Disconnect(dc)
	}()
	log.Println("mongo: connected")

	redisClient, err := database.NewRedis(ctx, cfg.RedisAddr, cfg.RedisPassword)
	if err != nil {
		log.Fatalf("redis: %v", err)
	}
	defer redisClient.Close()
	log.Println("redis: connected")

	application := app.Build(app.Deps{
		MySQL:     mysqlDB,
		Mongo:     mongoDB,
		Redis:     redisClient,
		JWTSecret: cfg.JWTSecret,
		EngineURL: cfg.EngineURL,
		FeedURLs:  cfg.FeedURLs,
		OddsURLs:  cfg.OddsURLs,
	})

	// Seed the root Super Duper Admin on first start.
	if err := application.Identity.EnsureSuperDuperAdmin(ctx, cfg.SDAUsername, cfg.SDAPassword); err != nil {
		log.Fatalf("bootstrap sda: %v", err)
	}

	application.StartBackground(ctx)
	server.Run(application.Fiber, cfg.HTTPPort)
}
