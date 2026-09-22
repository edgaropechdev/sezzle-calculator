package api_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/edgaropechdev/sizzle-calculator/backend/internal/api"
)

// post sends body to the endpoint through the real router, so the method
// pattern and the handler are exercised together.
func post(t *testing.T, method, body string) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(method, api.Path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	rec := httptest.NewRecorder()
	api.NewRouter().ServeHTTP(rec, req)
	return rec
}

func TestCalculateSuccess(t *testing.T) {
	cases := []struct {
		name string
		body string
		want map[string]any
	}{
		{
			name: "divide echoes the input",
			body: `{"op":"divide","a":10,"b":4}`,
			want: map[string]any{"op": "divide", "a": 10.0, "b": 4.0, "result": 2.5},
		},
		{
			name: "add",
			body: `{"op":"add","a":2,"b":3}`,
			want: map[string]any{"op": "add", "a": 2.0, "b": 3.0, "result": 5.0},
		},
		{
			name: "subtract",
			body: `{"op":"subtract","a":2,"b":3}`,
			want: map[string]any{"op": "subtract", "a": 2.0, "b": 3.0, "result": -1.0},
		},
		{
			name: "multiply",
			body: `{"op":"multiply","a":6,"b":7}`,
			want: map[string]any{"op": "multiply", "a": 6.0, "b": 7.0, "result": 42.0},
		},
		{
			name: "power",
			body: `{"op":"power","a":2,"b":10}`,
			want: map[string]any{"op": "power", "a": 2.0, "b": 10.0, "result": 1024.0},
		},
		// sqrt is unary: b is not required, and the answer does not invent one.
		// The length check below is what enforces the absence — the response
		// must carry exactly these keys.
		{
			name: "sqrt needs only a",
			body: `{"op":"sqrt","a":9}`,
			want: map[string]any{"op": "sqrt", "a": 9.0, "result": 3.0},
		},
		{
			name: "sqrt disregards a b it was sent, and does not echo it",
			body: `{"op":"sqrt","a":9,"b":999}`,
			want: map[string]any{"op": "sqrt", "a": 9.0, "result": 3.0},
		},
		{
			name: "a binary operation still echoes b, including a zero",
			body: `{"op":"multiply","a":6,"b":0}`,
			want: map[string]any{"op": "multiply", "a": 6.0, "b": 0.0, "result": 0.0},
		},
		{
			name: "percentage is a percent of b",
			body: `{"op":"percentage","a":10,"b":200}`,
			want: map[string]any{"op": "percentage", "a": 10.0, "b": 200.0, "result": 20.0},
		},
		{
			name: "zero operands are values, not absences",
			body: `{"op":"add","a":0,"b":0}`,
			want: map[string]any{"op": "add", "a": 0.0, "b": 0.0, "result": 0.0},
		},
		{
			name: "the server does not round",
			body: `{"op":"add","a":0.1,"b":0.2}`,
			want: map[string]any{"op": "add", "a": 0.1, "b": 0.2, "result": 0.30000000000000004},
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			rec := post(t, http.MethodPost, c.body)

			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, http.StatusOK, rec.Body)
			}
			if got := rec.Header().Get("Content-Type"); got != "application/json" {
				t.Errorf("Content-Type = %q, want %q", got, "application/json")
			}

			var got map[string]any
			if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
				t.Fatalf("response is not valid JSON: %v (body %s)", err, rec.Body)
			}
			if len(got) != len(c.want) {
				t.Fatalf("response = %v, want exactly the keys of %v", got, c.want)
			}
			for key, want := range c.want {
				if got[key] != want {
					t.Errorf("response[%q] = %v, want %v", key, got[key], want)
				}
			}
		})
	}
}

func TestCalculateErrors(t *testing.T) {
	cases := []struct {
		name     string
		body     string
		wantCode string
	}{
		{name: "body is not JSON", body: `not json`, wantCode: "invalid_json"},
		{name: "body is empty", body: ``, wantCode: "invalid_json"},
		{name: "op is of the wrong type", body: `{"op":1,"a":1,"b":1}`, wantCode: "invalid_json"},
		{name: "a is not a number", body: `{"op":"add","a":"ten","b":1}`, wantCode: "invalid_json"},

		{name: "op is absent", body: `{"a":10,"b":4}`, wantCode: "missing_field"},
		{name: "a is absent", body: `{"op":"add","b":4}`, wantCode: "missing_field"},
		// The one the contract calls out: an absent b must not be read as zero.
		{name: "b is absent on divide", body: `{"op":"divide","a":10}`, wantCode: "missing_field"},
		{name: "b is null", body: `{"op":"divide","a":10,"b":null}`, wantCode: "missing_field"},

		{name: "op is not an operation", body: `{"op":"modulo","a":10,"b":4}`, wantCode: "unknown_operation"},
		// The operation is resolved first, so an unknown op is reported as
		// unknown even when operands are missing: nothing is known yet about
		// which operands it would have needed.
		{name: "op is not an operation and b is absent", body: `{"op":"modulo","a":10}`, wantCode: "unknown_operation"},

		{name: "divide by zero", body: `{"op":"divide","a":10,"b":0}`, wantCode: "division_by_zero"},
		{name: "square root of a negative", body: `{"op":"sqrt","a":-9}`, wantCode: "negative_sqrt"},
		// a is required by every operation, unary ones included.
		{name: "sqrt without a", body: `{"op":"sqrt"}`, wantCode: "missing_field"},
		{name: "sqrt with a null a", body: `{"op":"sqrt","a":null,"b":9}`, wantCode: "missing_field"},
		{name: "result overflows", body: `{"op":"multiply","a":1e308,"b":1e308}`, wantCode: "result_not_finite"},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			rec := post(t, http.MethodPost, c.body)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, http.StatusBadRequest, rec.Body)
			}

			var got struct {
				Error struct {
					Code    string `json:"code"`
					Message string `json:"message"`
				} `json:"error"`
			}
			if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
				t.Fatalf("response is not valid JSON: %v (body %s)", err, rec.Body)
			}
			if got.Error.Code != c.wantCode {
				t.Errorf("error.code = %q, want %q", got.Error.Code, c.wantCode)
			}
			if got.Error.Message == "" {
				t.Error("error.message is empty; the code is for the machine, the message for the person")
			}
		})
	}
}

func TestMethodNotAllowed(t *testing.T) {
	for _, method := range []string{http.MethodGet, http.MethodPut, http.MethodDelete, http.MethodPatch} {
		t.Run(method, func(t *testing.T) {
			rec := post(t, method, "")

			if rec.Code != http.StatusMethodNotAllowed {
				t.Fatalf("status = %d, want %d", rec.Code, http.StatusMethodNotAllowed)
			}
			if got := rec.Header().Get("Allow"); !strings.Contains(got, http.MethodPost) {
				t.Errorf("Allow = %q, want it to list %s", got, http.MethodPost)
			}
		})
	}
}

// The message names the field so a person reading a log knows which one to
// fix, and the field it names has to follow the operation's arity: a unary
// operation can only ever be missing a.
func TestMissingFieldNamesTheField(t *testing.T) {
	cases := []struct {
		name      string
		body      string
		wantField string
	}{
		{name: "op", body: `{"a":1,"b":2}`, wantField: `"op"`},
		{name: "a on a binary operation", body: `{"op":"add","b":2}`, wantField: `"a"`},
		{name: "b on a binary operation", body: `{"op":"add","a":1}`, wantField: `"b"`},
		{name: "a on a unary operation", body: `{"op":"sqrt"}`, wantField: `"a"`},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			rec := post(t, http.MethodPost, c.body)

			var got struct {
				Error struct {
					Code    string `json:"code"`
					Message string `json:"message"`
				} `json:"error"`
			}
			if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
				t.Fatalf("response is not valid JSON: %v (body %s)", err, rec.Body)
			}
			if got.Error.Code != "missing_field" {
				t.Fatalf("error.code = %q, want %q", got.Error.Code, "missing_field")
			}
			if !strings.Contains(got.Error.Message, c.wantField) {
				t.Errorf("error.message = %q, want it to name the field %s", got.Error.Message, c.wantField)
			}
		})
	}
}
