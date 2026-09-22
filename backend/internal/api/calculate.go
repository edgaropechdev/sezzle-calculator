package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/edgaropechdev/sizzle-calculator/backend/internal/calc"
)

// maxRequestBytes caps the body. The largest legitimate request is three short
// fields; anything past this is a mistake or an attack, and either way it is
// not worth buffering.
const maxRequestBytes = 4 << 10 // 4 KiB

// calculateRequest decodes the body.
//
// a and b are *float64, never float64: with a plain float64 an absent field
// and a zero field both arrive as 0, and {"op":"divide","a":10} would divide
// by a b nobody sent. A pointer tells the two apart.
type calculateRequest struct {
	Op *string  `json:"op"`
	A  *float64 `json:"a"`
	B  *float64 `json:"b"`
}

// calculateResponse echoes the input next to the result, so one log line is
// self-contained.
type calculateResponse struct {
	Op     string  `json:"op"`
	A      float64 `json:"a"`
	B      float64 `json:"b"`
	Result float64 `json:"result"`
}

func handleCalculate(w http.ResponseWriter, r *http.Request) {
	var req calculateRequest

	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequestBytes))
	if err := decoder.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, codeInvalidJSON, "request body is not valid JSON")
		return
	}

	if missing := firstMissingField(req); missing != "" {
		writeError(w, http.StatusBadRequest, codeMissingField, fmt.Sprintf("field %q is required", missing))
		return
	}

	result, err := calc.Calculate(calc.Op(*req.Op), *req.A, *req.B)
	if err != nil {
		writeDomainError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, calculateResponse{
		Op:     *req.Op,
		A:      *req.A,
		B:      *req.B,
		Result: result,
	})
}

// firstMissingField returns the name of the first required field the request
// left out, or "" when the request is complete. It reports one field at a
// time: the client fixes one and asks again.
func firstMissingField(req calculateRequest) string {
	switch {
	case req.Op == nil:
		return "op"
	case req.A == nil:
		return "a"
	case req.B == nil:
		return "b"
	default:
		return ""
	}
}
