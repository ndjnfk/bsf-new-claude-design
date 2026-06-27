// Package httpx holds small HTTP helpers shared by services.
package httpx

import "github.com/gofiber/fiber/v2"

// OK writes a 200 JSON payload wrapped in {data: ...}.
func OK(c *fiber.Ctx, data any) error {
	return c.JSON(fiber.Map{"data": data})
}

// Created writes a 201 JSON payload.
func Created(c *fiber.Ctx, data any) error {
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": data})
}

// Err writes a JSON error with the given status and message.
func Err(c *fiber.Ctx, status int, msg string) error {
	return c.Status(status).JSON(fiber.Map{"error": msg})
}

// BadRequest is a 400 helper.
func BadRequest(c *fiber.Ctx, msg string) error { return Err(c, fiber.StatusBadRequest, msg) }

// Unauthorized is a 401 helper.
func Unauthorized(c *fiber.Ctx, msg string) error { return Err(c, fiber.StatusUnauthorized, msg) }

// Forbidden is a 403 helper.
func Forbidden(c *fiber.Ctx, msg string) error { return Err(c, fiber.StatusForbidden, msg) }

// NotFound is a 404 helper.
func NotFound(c *fiber.Ctx, msg string) error { return Err(c, fiber.StatusNotFound, msg) }

// Internal is a 500 helper.
func Internal(c *fiber.Ctx, msg string) error { return Err(c, fiber.StatusInternalServerError, msg) }
