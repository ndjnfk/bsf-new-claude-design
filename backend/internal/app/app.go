// Package app composes the modular monolith: it constructs every module with
// its shared dependencies and registers all routes onto one Fiber app.
package app

import (
	"context"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"

	"bsf2020/internal/audit"
	"bsf2020/internal/betting"
	"bsf2020/internal/casino"
	"bsf2020/internal/domains"
	"bsf2020/internal/engine"
	"bsf2020/internal/fancy"
	"bsf2020/internal/helpers"
	"bsf2020/internal/identity"
	"bsf2020/internal/markets"
	"bsf2020/internal/news"
	"bsf2020/internal/queries"
	"bsf2020/internal/realtime"
	"bsf2020/internal/reporting"
	"bsf2020/internal/requests"
	"bsf2020/internal/restrictions"
	"bsf2020/internal/settings"
	"bsf2020/internal/catalog"
	"bsf2020/internal/exposure"
	"bsf2020/internal/feed"
	"bsf2020/internal/odds"
	"bsf2020/internal/settlement"
	"bsf2020/internal/sports"
	userpanel "bsf2020/internal/user-panel"
	"bsf2020/internal/wallet"
	"bsf2020/pkg/domain"
	"bsf2020/pkg/middleware"
	"bsf2020/pkg/server"
)

// Deps are the infrastructure handles shared by all modules.
type Deps struct {
	MySQL     *sqlx.DB
	Mongo     *mongo.Database
	Redis     *redis.Client
	JWTSecret string
	EngineURL string   // empty = in-process Go matching engine
	FeedURLs  []string // third-party events feeds (primary first), with failover
	OddsURLs  []string // live market-odds feeds (empty = dummy generator)
}

// App holds the composed application.
type App struct {
	Fiber    *fiber.App
	Identity *identity.Service
	hub      *realtime.Hub
	oddsPub  *odds.Publisher
	expo     *exposure.Tracker
}

// Build wires modules and routes. It returns the app ready to serve; call
// StartBackground to launch the realtime hub loop.
func Build(d Deps) *App {
	f := server.New("bsf2020")
	// --- shared cross-module pieces ---
	hub := realtime.NewHub(d.Redis) // implements events.Publisher

	// Matching engine: a remote Rust service if ENGINE_URL is set, otherwise the
	// in-process Go engine. The betting module depends only on the interface.
	var matchEngine engine.MatchingEngine
	if d.EngineURL != "" {
		matchEngine = engine.NewRemoteEngine(d.EngineURL)
		log.Printf("matching engine: remote (%s)", d.EngineURL)
	} else {
		matchEngine = engine.NewMemoryEngine()
		log.Println("matching engine: in-process (Go)")
	}

	checks := []server.Check{
		{Name: "mysql", Ping: d.MySQL.PingContext},
		{Name: "mongo", Ping: func(ctx context.Context) error { return d.Mongo.Client().Ping(ctx, nil) }},
		{Name: "redis", Ping: func(ctx context.Context) error { return d.Redis.Ping(ctx).Err() }},
	}
	if re, ok := matchEngine.(*engine.RemoteEngine); ok {
		checks = append(checks, server.Check{Name: "engine", Ping: re.Ping})
	}
	server.AddReady(f, checks...)

	requireAuth := middleware.RequireAuth(d.JWTSecret)
	// Platform-global features (config, content, surveillance, catalog mutations)
	// are restricted to the Super Duper Admin. Downline-scoped features stay open
	// to every management tier (they are naturally scoped by parent_id).
	requireSDA := middleware.RequireAuthRole(d.JWTSecret, domain.SuperDuperAdmin)
	// Stricter: a *real* SDA only — excludes helpers acting in an SDA's context.
	// Used for pure-global config that is never delegated to a worker account.
	requireRealSDA := middleware.RequireSuperAdmin(d.JWTSecret)
	api := f.Group("/api")

	// --- modules ---
	identitySvc := identity.NewService(identity.NewStore(d.MySQL), d.JWTSecret)
	identityStore := identity.NewStore(d.MySQL)

	// Audit module records logins + password changes and powers IP surveillance.
	auditMod := audit.New(d.Mongo)
	identitySvc.SetLoginRecorder(auditMod)
	identitySvc.SetPasswordRecorder(auditMod)

	// Helpers module also serves as the helper-login authenticator.
	helpersMod := helpers.New(d.MySQL)
	identitySvc.SetHelperAuth(helpersMod)

	// Live per-level exposure: a bet adds liability up the chain, settlement
	// releases it. Maintained in MySQL (users.exposure) + Redis (live counters).
	expoTracker := exposure.New(d.MySQL, d.Redis, hub)

	// User Panel (bettor / Player) API under /api/user/*, separate from the admin API.
	// Registered BEFORE identity so its PUBLIC /user/login isn't caught by the global
	// requireAuth the identity module mounts on /api (its `api.Group("", requireAuth)`).
	// /user/me keeps its own explicit requireAuth.
	userpanel.New(identitySvc, d.MySQL, d.Mongo).Register(api, requireAuth)
	identity.NewHTTP(identitySvc).Register(api, requireAuth)
	wallet.New(d.MySQL, identityStore, hub).Register(api, requireAuth)
	requests.New(d.MySQL, identityStore).Register(api, requireAuth)
	betting.New(d.Mongo, d.MySQL, matchEngine, hub, d.Redis, expoTracker).Register(api, requireAuth)
	reporting.New(d.MySQL, d.Mongo).Register(api, requireAuth)
	restrictions.New(d.MySQL).Register(api, requireAuth)
	helpersMod.Register(api, requireAuth)

	// Settlement engine: declaring a result settles the market's bets and
	// distributes partnership P&L up the hierarchy.
	settler := settlement.New(d.MySQL, d.Mongo, expoTracker)

	// Views open to any tier, mutations SDA-only.
	sports.New(d.MySQL, settler).Register(api, requireAuth, requireSDA)
	fancy.New(d.MySQL).Register(api, requireAuth, requireSDA)
	oddsRegistry := odds.NewRegistry(d.Redis) // markets to stream (Redis set)
	markets.New(d.MySQL, oddsRegistry).Register(api, requireAuth, requireSDA)
	catalog.New(d.MySQL, hub).Register(api, requireAuth) // per-tier catalog block cascade

	// Pure-global config — real Super Duper Admin only (no helper delegation).
	auditMod.Register(api, requireRealSDA)
	casino.New(d.MySQL).Register(api, requireRealSDA)
	domains.New(d.MySQL).Register(api, requireRealSDA)
	settings.New(d.MySQL).Register(api, requireRealSDA)
	news.New(d.Mongo).Register(api, requireRealSDA)
	queries.New(d.Mongo).Register(api, requireRealSDA)

	// Third-party events feed — failover wrapper, Super Duper Admin only.
	feed.NewModule(feed.New(d.FeedURLs), d.MySQL).Register(api, requireRealSDA)

	// Live market-odds wrapper: dummy generator unless ODDS_URLS is set, with
	// multi-provider failover. A background publisher streams every PUBLISHED
	// market's book to all subscribed panels (the publish→live-page flow).
	var oddsProvider odds.Provider = odds.NewDummy(oddsRegistry)
	if len(d.OddsURLs) > 0 {
		oddsProvider = odds.NewMulti(d.OddsURLs, oddsProvider)
	}
	odds.NewModule(oddsProvider, oddsRegistry).Register(api, requireAuth)
	oddsPub := odds.NewPublisher(oddsProvider, oddsRegistry, d.Redis, hub)
	// Seed the published-odds set + meta from the DB so markets published before a
	// restart resume streaming without a hot-path MySQL read.
	seedOdds(context.Background(), d.MySQL, oddsRegistry)

	realtime.New(hub).Register(f)

	return &App{Fiber: f, Identity: identitySvc, hub: hub, oddsPub: oddsPub, expo: expoTracker}
}

// StartBackground launches long-running loops (the realtime hub subscription and
// the live market-odds publisher).
func (a *App) StartBackground(ctx context.Context) {
	go a.hub.Run(ctx)
	go a.oddsPub.Run(ctx)
	go a.expo.Run(ctx) // batched MySQL flush of live exposure deltas
}

// seedOdds re-populates the Redis published-odds set and each market's runner
// meta from the DB on startup, so markets published before a restart resume
// streaming (and the dummy never hits MySQL on the hot path).
func seedOdds(ctx context.Context, db *sqlx.DB, reg *odds.Registry) {
	var rows []struct {
		ID       int64  `db:"id"`
		MarketID string `db:"market_id"`
		MatchID  int64  `db:"match_id"`
		Name     string `db:"name"`
	}
	if err := db.SelectContext(ctx, &rows,
		`SELECT id, market_id, match_id, name FROM markets WHERE is_published = 1`); err != nil {
		return
	}
	for _, r := range rows {
		var rs []struct {
			SelectionID string `db:"selection_id"`
			Name        string `db:"name"`
		}
		_ = db.SelectContext(ctx, &rs,
			`SELECT selection_id, name FROM runners WHERE market_row_id = ? ORDER BY sort_order`, r.ID)
		meta := odds.MarketMeta{MarketID: r.MarketID, MatchID: r.MatchID, Name: r.Name}
		for _, x := range rs {
			meta.Runners = append(meta.Runners, odds.MetaRunner{SelectionID: x.SelectionID, Name: x.Name})
		}
		_ = reg.SetMeta(ctx, meta)
		_ = reg.Add(ctx, r.MarketID)
	}
}
