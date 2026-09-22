// Package api exposes the calculator over HTTP. It owns request decoding,
// validation of the request shape and the translation of domain errors into
// status codes. It does no arithmetic.
package api

import "net/http"

// Path is the single endpoint. One operation, one route: the operation
// travels in the body, which keeps every request the same shape and every
// error the same shape.
const Path = "/api/v1/calculate"

// NewRouter wires the endpoint. The method is part of the pattern, so
// net/http itself answers 405 with an Allow header for anything but POST.
//
// No CORS headers: in both shipped topologies (the Vite proxy in development,
// nginx in Docker) the page and the API share an origin.
func NewRouter() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST "+Path, handleCalculate)
	return mux
}
