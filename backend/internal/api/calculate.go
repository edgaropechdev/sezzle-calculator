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
//
// B is a pointer so that it can be left out entirely. A unary operation never
// took a second operand, and echoing one — a zero, or even the number the
// caller happened to send — would report an operand that took no part in the
// result. Absent is the honest answer.
type calculateResponse struct {
	Op     string   `json:"op"`
	A      float64  `json:"a"`
	B      *float64 `json:"b,omitempty"`
	Result float64  `json:"result"`
}

func handleCalculate(w http.ResponseWriter, r *http.Request) {
	var req calculateRequest

	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequestBytes))
	if err := decoder.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, codeInvalidJSON, "request body is not valid JSON")
		return
	}

	if req.Op == nil {
		writeMissingField(w, "op")
		return
	}

	// The operation is resolved before the operands are validated, because it
	// is the operation that decides which operands exist. An unknown op is
	// answered as unknown rather than as a missing b it would never have used.
	op := calc.Op(*req.Op)
	arity, known := calc.ArityOf(op)
	if !known {
		writeDomainError(w, calc.ErrUnknownOperation)
		return
	}

	if missing := firstMissingOperand(req, arity); missing != "" {
		writeMissingField(w, missing)
		return
	}

	// b is zero for a unary operation, which reads a and disregards it. The
	// arity check above is what makes that safe: a binary operation cannot
	// reach this line without a b the caller actually sent.
	var b float64
	if req.B != nil {
		b = *req.B
	}

	result, err := calc.Calculate(op, *req.A, b)
	if err != nil {
		writeDomainError(w, err)
		return
	}

	var echoedB *float64
	if arity == calc.Binary {
		echoedB = req.B
	}

	writeJSON(w, http.StatusOK, calculateResponse{
		Op:     *req.Op,
		A:      *req.A,
		B:      echoedB,
		Result: result,
	})
}

// firstMissingOperand returns the name of the first operand the operation needs
// and the request left out, or "" when the request is complete. It reports one
// field at a time: the caller fixes one and asks again.
//
// Which operands are needed is read from the arity, not hardcoded. Demanding a
// b that the operation would then disregard is the bug this exists to prevent:
// every operation reads a, only a binary one reads b.
func firstMissingOperand(req calculateRequest, arity calc.Arity) string {
	switch {
	case req.A == nil:
		return "a"
	case arity == calc.Binary && req.B == nil:
		return "b"
	default:
		return ""
	}
}

func writeMissingField(w http.ResponseWriter, field string) {
	writeError(w, http.StatusBadRequest, codeMissingField, fmt.Sprintf("field %q is required", field))
}
