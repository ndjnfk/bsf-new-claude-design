// Package server builds a Fiber app with the middleware every service shares.
package server

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
)

// New builds a Fiber app with recover, request-id, logging and CORS, plus a
// cheap liveness probe at GET /health.
func New(serviceName string) *fiber.App {
	app := fiber.New(fiber.Config{AppName: serviceName, DisableStartupMessage: true})
	app.Use(recover.New())
	app.Use(requestid.New())
	app.Use(logger.New(logger.Config{Format: "[" + serviceName + "] ${time} ${status} ${method} ${path} ${latency}\n"}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": serviceName})
	})
	return app
}

// Check is a named readiness probe.
type Check struct {
	Name string
	Ping func(ctx context.Context) error
}

// AddReady registers GET /health/ready that runs every check.
func AddReady(app *fiber.App, checks ...Check) {
	app.Get("/health/ready", func(c *fiber.Ctx) error {
		ctx, cancel := context.WithTimeout(c.Context(), 3*time.Second)
		defer cancel()
		results := fiber.Map{}
		healthy := true
		for _, ch := range checks {
			if err := ch.Ping(ctx); err != nil {
				results[ch.Name] = err.Error()
				healthy = false
			} else {
				results[ch.Name] = "ok"
			}
		}
		status := fiber.StatusOK
		label := "ready"
		if !healthy {
			status = fiber.StatusServiceUnavailable
			label = "degraded"
		}
		return c.Status(status).JSON(fiber.Map{"status": label, "checks": results})
	})
}

// Run starts the app and blocks until SIGINT/SIGTERM, then shuts down gracefully.
func Run(app *fiber.App, port string) {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		addr := ":" + port
		log.Printf("listening on %s", addr)
		if err := app.Listen(addr); err != nil {
			log.Printf("listen: %v", err)
			stop()
		}
	}()

	<-ctx.Done()
	log.Println("shutting down...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = app.ShutdownWithContext(shutdownCtx)
}
