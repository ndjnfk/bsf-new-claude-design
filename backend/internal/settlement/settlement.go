// Package settlement settles bets when a market result is declared and
// distributes the resulting profit/loss up the user hierarchy by partnership
// share — the financial keystone.
//
// Model (ported from the reference PartnershipCalculator): the bettor keeps
// their own bet P&L; the opposite ("book") amount is distributed to the upline,
// where each ancestor absorbs (its_share − child_share)% of the book. The shares
// telescope from 0 at the bettor up to 100 at the root, so the distribution sums
// to exactly the book — money is conserved (zero-sum, before commission).
//
// Non-partnership accounts carry a flat 100 share, so the immediate management
// account (e.g. the dealer) absorbs the entire book and the levels above it
// absorb nothing — matching "No Partnership → the dealer bears 100%".
package settlement

import (
	"context"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"bsf2020/internal/exposure"
)

// Engine settles markets and posts the partnership P&L.
type Engine struct {
	sql      *sqlx.DB
	bets     *mongo.Collection
	exposure *exposure.Tracker
}

// New builds the settlement engine.
func New(sql *sqlx.DB, mongoDB *mongo.Database, exp *exposure.Tracker) *Engine {
	return &Engine{sql: sql, bets: mongoDB.Collection("bets"), exposure: exp}
}

type betDoc struct {
	ID        primitive.ObjectID `bson:"_id"`
	UserID    int64              `bson:"userId"`
	MatchID   int64              `bson:"matchId"`
	MarketID  string             `bson:"marketId"`
	Selection string             `bson:"selection"`
	Side      string             `bson:"side"`
	Price     float64            `bson:"price"`
	Stake     float64            `bson:"stake"`
	Exposure  float64            `bson:"exposure"`
}

// betPL is the bettor's profit/loss for a settled outcome (+ = bettor won).
//
//	back: wins stake*(price-1) on the winning selection, else loses the stake.
//	lay : inverse of back.
func betPL(side, selection, winning string, price, stake float64) float64 {
	won := selection == winning
	if side == "lay" {
		if won {
			return -stake * (price - 1)
		}
		return stake
	}
	if won {
		return stake * (price - 1)
	}
	return -stake
}

// SettleMarket settles every open bet on a match+market for the winning
// selection and returns how many were settled. Idempotent: already-settled bets
// (settled=true) are skipped, so re-declaring is safe.
//
// Bets placed from the live page carry the synthetic marketId "MATCH_ODDS:<id>"
// (the page doesn't know the real market_id), while a result is declared with the
// real market_id. We match BOTH so declaring a result settles those bets.
func (e *Engine) SettleMarket(ctx context.Context, matchID int64, marketID, winning string) (int, error) {
	marketIDs := []string{marketID, fmt.Sprintf("MATCH_ODDS:%d", matchID)}
	filter := bson.M{
		"matchId":  matchID,
		"marketId": bson.M{"$in": marketIDs},
		"settled":  bson.M{"$ne": true},
	}
	cur, err := e.bets.Find(ctx, filter)
	if err != nil {
		return 0, fmt.Errorf("load bets: %w", err)
	}
	var bets []betDoc
	if err := cur.All(ctx, &bets); err != nil {
		return 0, fmt.Errorf("decode bets: %w", err)
	}

	settled := 0
	for _, b := range bets {
		pl := betPL(b.Side, b.Selection, winning, b.Price, b.Stake)
		if err := e.settleBet(ctx, b, pl); err != nil {
			return settled, err
		}
		_, _ = e.bets.UpdateByID(ctx, b.ID,
			bson.M{"$set": bson.M{"settled": true, "pl": pl, "settledAt": time.Now().UTC()}})
		// The bet is realised — release its live exposure from the chain.
		e.exposure.Apply(ctx, b.UserID, b.Exposure, -1)
		settled++
	}
	return settled, nil
}

type node struct {
	id    int64
	share float64
}

// chain returns the settlement chain from the bettor (share 0) up to the root.
// Each ancestor's share is its partner_cricket (the % of P&L flowing into its
// subtree); the root / Super Duper Admin holds 100.
func (e *Engine) chain(ctx context.Context, bettorID int64) ([]node, error) {
	var out []node
	id := bettorID
	first := true
	for {
		var row struct {
			ParentID       *int64  `db:"parent_id"`
			PartnerCricket float64 `db:"partner_cricket"`
			Usetype        int     `db:"usetype"`
		}
		if err := e.sql.GetContext(ctx, &row,
			`SELECT parent_id, partner_cricket, usetype FROM users WHERE id = ?`, id); err != nil {
			break
		}
		share := row.PartnerCricket
		if row.Usetype == 0 {
			share = 100
		}
		if first { // the bettor takes no partnership share on their own bet
			share = 0
			first = false
		}
		out = append(out, node{id: id, share: share})
		if row.ParentID == nil {
			break
		}
		id = *row.ParentID
	}
	return out, nil
}

// settleBet posts the bettor's P&L and the upline partnership split atomically.
func (e *Engine) settleBet(ctx context.Context, b betDoc, playerPL float64) error {
	ch, err := e.chain(ctx, b.UserID)
	if err != nil || len(ch) == 0 {
		return err
	}
	tx, err := e.sql.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	// The bettor's liability was debited from balance at placement (deduct-on-
	// placement), so settlement credits back the RETURN = liability + P&L: a win
	// returns stake plus winnings, a loss returns nothing (liability − stake = 0).
	// Net effect on balance over the bet's life is exactly the P&L.
	if err := adjust(ctx, tx, b.UserID, b.Exposure+playerPL, "Bet settled "+b.MarketID); err != nil {
		return err
	}
	// Distribute the book (−playerPL) up the chain.
	book := -playerPL
	for i := 1; i < len(ch); i++ {
		amt := (ch[i].share - ch[i-1].share) / 100 * book
		if amt == 0 {
			continue
		}
		if err := adjust(ctx, tx, ch[i].id, amt, "Partnership P/L"); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func adjust(ctx context.Context, tx *sqlx.Tx, userID int64, delta float64, narration string) error {
	if _, err := tx.ExecContext(ctx, `UPDATE users SET balance = balance + ? WHERE id = ?`, delta, userID); err != nil {
		return err
	}
	var bal float64
	_ = tx.GetContext(ctx, &bal, `SELECT balance FROM users WHERE id = ?`, userID)
	credit, debit, crdr := 0.0, 0.0, 1
	if delta >= 0 {
		credit = delta
	} else {
		debit = -delta
		crdr = 2
	}
	_, err := tx.ExecContext(ctx,
		`INSERT INTO account_statement (user_id, narration, credit, debit, balance_after, account_type, crdr)
		 VALUES (?,?,?,?,?,3,?)`, userID, narration, credit, debit, bal, crdr)
	return err
}
