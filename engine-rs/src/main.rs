// BSF2020 matching engine (Rust).
//
// A dedicated, out-of-process order-matching service. It mirrors the Go
// in-process engine's behaviour exactly and speaks the same JSON contract, so
// the Go monolith can switch to it purely via ENGINE_URL — no caller changes.
//
// Why Rust for this layer: the matching hot path benefits from predictable,
// GC-free latency. Matching is serialized through a single Mutex (a matching
// engine must process orders in a deterministic order anyway).

use std::collections::HashMap;
use std::io::Read;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tiny_http::{Header, Method, Response, Server, StatusCode};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
struct Order {
    user_id: i64,
    market_id: String,
    selection: String,
    side: String, // "back" (LAGAI) | "lay" (KHAI)
    price: f64,
    size: f64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Fill {
    matched_size: f64,
    price: f64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MatchResult {
    fills: Vec<Fill>,
    matched_size: f64,
    open_size: f64,
    exposure: f64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Level {
    price: f64,
    size: f64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BookSnapshot {
    market_id: String,
    backs: Vec<Level>,
    lays: Vec<Level>,
}

struct Resting {
    price: f64,
    size: f64,
}

#[derive(Default)]
struct Book {
    backs: Vec<Resting>,
    lays: Vec<Resting>,
}

#[derive(Default)]
struct Engine {
    books: HashMap<String, Book>,
}

impl Engine {
    /// Match an incoming order against the opposite side of the book. A BACK at
    /// price P matches resting LAYs with price >= P (best/highest first); a LAY
    /// at P matches resting BACKs with price <= P (best/lowest first). Matches
    /// execute at the resting price; any remainder rests on the incoming side.
    fn submit(&mut self, o: &Order) -> MatchResult {
        let key = format!("{}|{}", o.market_id, o.selection);
        let book = self.books.entry(key).or_default();

        let mut remaining = o.size;
        let mut fills: Vec<Fill> = Vec::new();
        let mut matched = 0.0;
        let exposure;

        if o.side == "back" {
            book.lays
                .sort_by(|a, b| b.price.partial_cmp(&a.price).unwrap()); // highest first
            consume(&mut book.lays, |r| r.price >= o.price, &mut remaining, &mut fills, &mut matched);
            if remaining > 0.0 {
                book.backs.push(Resting { price: o.price, size: remaining });
            }
            exposure = o.size; // backer risks the stake
        } else {
            book.backs
                .sort_by(|a, b| a.price.partial_cmp(&b.price).unwrap()); // lowest first
            consume(&mut book.backs, |r| r.price <= o.price, &mut remaining, &mut fills, &mut matched);
            if remaining > 0.0 {
                book.lays.push(Resting { price: o.price, size: remaining });
            }
            exposure = o.size * (o.price - 1.0); // layer risks stake * (odds-1)
        }

        MatchResult { fills, matched_size: matched, open_size: remaining, exposure }
    }

    /// Aggregated back/lay depth across every selection of a market.
    fn book(&self, market_id: &str) -> BookSnapshot {
        let prefix = format!("{}|", market_id);
        let mut back_agg: HashMap<u64, f64> = HashMap::new();
        let mut lay_agg: HashMap<u64, f64> = HashMap::new();
        for (k, b) in &self.books {
            if !k.starts_with(&prefix) {
                continue;
            }
            for r in &b.backs {
                *back_agg.entry(r.price.to_bits()).or_insert(0.0) += r.size;
            }
            for r in &b.lays {
                *lay_agg.entry(r.price.to_bits()).or_insert(0.0) += r.size;
            }
        }
        BookSnapshot {
            market_id: market_id.to_string(),
            backs: levels(back_agg),
            lays: levels(lay_agg),
        }
    }
}

/// Fill the incoming order from a resting side while the predicate holds and
/// size remains, removing fully-consumed resting orders.
fn consume<F: Fn(&Resting) -> bool>(
    side: &mut Vec<Resting>,
    ok: F,
    remaining: &mut f64,
    fills: &mut Vec<Fill>,
    matched: &mut f64,
) {
    let mut kept: Vec<Resting> = Vec::with_capacity(side.len());
    for r in side.drain(..) {
        if *remaining <= 0.0 || !ok(&r) {
            kept.push(r);
            continue;
        }
        let m = r.size.min(*remaining);
        fills.push(Fill { matched_size: m, price: r.price });
        *matched += m;
        *remaining -= m;
        if r.size > m {
            kept.push(Resting { price: r.price, size: r.size - m });
        }
    }
    *side = kept;
}

fn levels(agg: HashMap<u64, f64>) -> Vec<Level> {
    let mut out: Vec<Level> = agg
        .into_iter()
        .map(|(bits, size)| Level { price: f64::from_bits(bits), size })
        .collect();
    out.sort_by(|a, b| b.price.partial_cmp(&a.price).unwrap());
    out
}

fn main() {
    let addr = std::env::var("ENGINE_ADDR").unwrap_or_else(|_| "0.0.0.0:9090".to_string());
    let server = Server::http(&addr).expect("failed to bind");
    println!("bsf-engine listening on {addr}");

    let engine = Mutex::new(Engine::default());
    let json = Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap();

    for mut request in server.incoming_requests() {
        let method = request.method().clone();
        let url = request.url().to_string();
        let path = url.split('?').next().unwrap_or("").to_string();

        match (&method, path.as_str()) {
            (Method::Get, "/health") => {
                let _ = request.respond(Response::from_string("ok"));
            }
            (Method::Post, "/submit") => {
                let mut body = String::new();
                let _ = request.as_reader().read_to_string(&mut body);
                match serde_json::from_str::<Order>(&body) {
                    Ok(order) => {
                        let result = engine.lock().unwrap().submit(&order);
                        let payload = serde_json::to_string(&result).unwrap();
                        let _ = request.respond(Response::from_string(payload).with_header(json.clone()));
                    }
                    Err(_) => {
                        let _ = request.respond(Response::from_string("bad request").with_status_code(StatusCode(400)));
                    }
                }
            }
            (Method::Get, "/book") => {
                let market_id = query_param(&url, "marketId").unwrap_or_default();
                let snap = engine.lock().unwrap().book(&market_id);
                let payload = serde_json::to_string(&snap).unwrap();
                let _ = request.respond(Response::from_string(payload).with_header(json.clone()));
            }
            _ => {
                let _ = request.respond(Response::from_string("not found").with_status_code(StatusCode(404)));
            }
        }
    }
}

fn query_param(url: &str, key: &str) -> Option<String> {
    let q = url.split('?').nth(1)?;
    for pair in q.split('&') {
        let mut it = pair.splitn(2, '=');
        let k = it.next()?;
        if k == key {
            return Some(percent_decode(it.next().unwrap_or("")));
        }
    }
    None
}

fn percent_decode(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out: Vec<u8> = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'%' if i + 2 < bytes.len() => match (hex_val(bytes[i + 1]), hex_val(bytes[i + 2])) {
                (Some(h), Some(l)) => {
                    out.push((h << 4) | l);
                    i += 3;
                }
                _ => {
                    out.push(bytes[i]);
                    i += 1;
                }
            },
            b'+' => {
                out.push(b' ');
                i += 1;
            }
            c => {
                out.push(c);
                i += 1;
            }
        }
    }
    String::from_utf8_lossy(&out).into_owned()
}

fn hex_val(b: u8) -> Option<u8> {
    match b {
        b'0'..=b'9' => Some(b - b'0'),
        b'a'..=b'f' => Some(b - b'a' + 10),
        b'A'..=b'F' => Some(b - b'A' + 10),
        _ => None,
    }
}
