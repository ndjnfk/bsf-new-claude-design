// Package auth provides password hashing and JWT issue/verify helpers.
package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"bsf2020/pkg/domain"
)

// HashPassword returns a bcrypt hash of the plaintext password.
func HashPassword(plain string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	return string(b), err
}

// CheckPassword reports whether plain matches the stored bcrypt hash.
func CheckPassword(hash, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}

// Principal identifies the authenticated actor. For a normal user, UserID is
// its own id. For a helper, UserID is the PARENT's id (the helper acts in the
// parent's context), Usetype is the parent's role, IsHelper is true, ActorID is
// the helper's own id and Permissions is its granted set.
type Principal struct {
	UserID      int64
	Username    string
	Usetype     domain.Usetype
	IsHelper    bool
	ActorID     int64
	Permissions []string
}

// Claims is the JWT payload.
type Claims struct {
	UserID      int64          `json:"uid"`
	Username    string         `json:"usr"`
	Usetype     domain.Usetype `json:"utype"`
	IsHelper    bool           `json:"hlp,omitempty"`
	ActorID     int64          `json:"act,omitempty"`
	Permissions []string       `json:"perms,omitempty"`
	jwt.RegisteredClaims
}

// Issue mints a signed JWT for a principal valid for the given duration.
func Issue(secret string, p Principal, ttl time.Duration) (string, error) {
	claims := Claims{
		UserID:      p.UserID,
		Username:    p.Username,
		Usetype:     p.Usetype,
		IsHelper:    p.IsHelper,
		ActorID:     p.ActorID,
		Permissions: p.Permissions,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   p.Username,
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}

// Verify parses and validates a token, returning its claims.
func Verify(secret, token string) (*Claims, error) {
	parsed, err := jwt.ParseWithClaims(token, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
