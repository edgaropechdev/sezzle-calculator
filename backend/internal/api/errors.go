package api

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/edgaropechdev/sizzle-calculator/backend/internal/calc"
)

// Error codes owned by the transport layer. The rest of the codes are the
// domain's and arrive on a *calc.Error.
const (
	codeInvalidJSON  = "invalid_json"
	codeMissingField = "missing_field"
)

// errorResponse is the one shape every error answer takes.
//
//	{"error": {"code": "division_by_zero", "message": "cannot divide by zero"}}
//
// code is for the machine, message for the person.
type errorResponse struct {
	Error errorBody `json:"error"`
}

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// writeDomainError translates a domain error into an HTTP answer. Every error
// calc can return is the caller sending bad input, so every one of them is a
// 400 — bad input never becomes a 500. An error this function does not
// recognise is a bug on the server, and only that is a 500.
func writeDomainError(w http.ResponseWriter, err error) {
	var domainErr *calc.Error
	if errors.As(err, &domainErr) {
		writeError(w, http.StatusBadRequest, domainErr.Code, domainErr.Message)
		return
	}

	log.Printf("api: unexpected error from calc: %v", err)
	http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, errorResponse{Error: errorBody{Code: code, Message: message}})
}

// writeJSON serialises before it touches the response, so a serialisation
// failure can still be answered with a status code instead of appending
// garbage to a 200 whose header has already gone out.
func writeJSON(w http.ResponseWriter, status int, payload any) {
	body, err := json.Marshal(payload)
	if err != nil {
		log.Printf("api: cannot serialise %T: %v", payload, err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if _, err := w.Write(body); err != nil {
		// The client hung up mid-write. There is no status left to send.
		log.Printf("api: cannot write response body: %v", err)
	}
}
