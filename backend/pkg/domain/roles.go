// Package domain holds core types shared across services.
package domain

// Usetype is the legacy numeric role code, kept for data compatibility.
type Usetype int

const (
	SuperDuperAdmin Usetype = 0
	Company         Usetype = 11
	Admin           Usetype = 10
	SubAdmin        Usetype = 9
	SuperMaster     Usetype = 8
	Master          Usetype = 1
	Dealer          Usetype = 2
	Player          Usetype = 3
	Helper          Usetype = 55
)

var roleNames = map[Usetype]string{
	SuperDuperAdmin: "Super Duper Admin",
	Company:         "Company",
	Admin:           "Admin",
	SubAdmin:        "Sub Admin",
	SuperMaster:     "Super Master",
	Master:          "Master",
	Dealer:          "Dealer",
	Player:          "End User (Player)",
	Helper:          "Helper",
}

// rank orders the tiers top→bottom. A management tier may create ANY tier below
// it (Company → Admin … User), except the Super Duper Admin who creates Company
// (whitelabel) only, and the User who creates nothing.
var rank = map[Usetype]int{
	SuperDuperAdmin: 0,
	Company:         1,
	Admin:           2,
	SubAdmin:        3,
	SuperMaster:     4, // Super Stockist
	Master:          5, // Stockist
	Dealer:          6,
	Player:          7, // User
}

// downlineOrder lists the creatable tiers below Company, top→bottom.
var downlineOrder = []Usetype{Admin, SubAdmin, SuperMaster, Master, Dealer, Player}

// Name returns the display name for a usetype.
func (u Usetype) Name() string {
	if n, ok := roleNames[u]; ok {
		return n
	}
	return "Unknown"
}

// CanCreate reports whether role u may create role target.
//   - Super Duper Admin → Company only.
//   - Company … Dealer  → any tier strictly below them (but never another Company).
//   - User              → nothing.
func (u Usetype) CanCreate(target Usetype) bool {
	if u == SuperDuperAdmin {
		return target == Company
	}
	ur, ok := rank[u]
	tr, ok2 := rank[target]
	if !ok || !ok2 || target == Helper || target == Company {
		return false
	}
	return u != Player && tr > ur
}

// CreatableRoles returns every tier this role may create, top→bottom.
func (u Usetype) CreatableRoles() []Usetype {
	if u == SuperDuperAdmin {
		return []Usetype{Company}
	}
	var out []Usetype
	for _, t := range downlineOrder {
		if u.CanCreate(t) {
			out = append(out, t)
		}
	}
	return out
}

// Creates returns the immediate next tier below this role (the default when no
// specific target is requested). For the SDA that is Company.
func (u Usetype) Creates() (Usetype, bool) {
	roles := u.CreatableRoles()
	if len(roles) == 0 {
		return 0, false
	}
	return roles[0], true
}
