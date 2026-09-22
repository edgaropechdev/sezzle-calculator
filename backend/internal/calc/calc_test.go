package calc_test

import (
	"errors"
	"math"
	"testing"

	"github.com/edgaropechdev/sizzle-calculator/backend/internal/calc"
)

func TestCalculate(t *testing.T) {
	cases := []struct {
		name    string
		op      calc.Op
		a, b    float64
		want    float64
		wantErr error
	}{
		{name: "add", op: calc.Add, a: 2, b: 3, want: 5},
		{name: "add negative", op: calc.Add, a: -2, b: -3, want: -5},
		{name: "subtract", op: calc.Subtract, a: 10, b: 4, want: 6},
		{name: "subtract to negative", op: calc.Subtract, a: 4, b: 10, want: -6},
		{name: "multiply", op: calc.Multiply, a: 6, b: 7, want: 42},
		{name: "multiply by zero", op: calc.Multiply, a: 6, b: 0, want: 0},
		{name: "divide", op: calc.Divide, a: 10, b: 4, want: 2.5},
		{name: "divide by negative", op: calc.Divide, a: 10, b: -4, want: -2.5},
		{name: "power", op: calc.Power, a: 2, b: 10, want: 1024},
		{name: "power of zero exponent", op: calc.Power, a: 7, b: 0, want: 1},
		{name: "power of negative exponent", op: calc.Power, a: 2, b: -2, want: 0.25},
		{name: "square root", op: calc.Sqrt, a: 9, b: 0, want: 3},
		{name: "square root of zero", op: calc.Sqrt, a: 0, b: 0, want: 0},
		// b is required by the request shape and unused by the operation.
		{name: "square root ignores b", op: calc.Sqrt, a: 16, b: 999, want: 4},
		{name: "percentage", op: calc.Percentage, a: 10, b: 200, want: 20},
		{name: "percentage of zero", op: calc.Percentage, a: 10, b: 0, want: 0},
		{name: "percentage over one hundred", op: calc.Percentage, a: 150, b: 40, want: 60},

		// The server does not round. This asserts the contract, not float64.
		{name: "no rounding", op: calc.Add, a: 0.1, b: 0.2, want: 0.30000000000000004},

		{name: "divide by zero", op: calc.Divide, a: 10, b: 0, wantErr: calc.ErrDivisionByZero},
		{name: "zero divided by zero", op: calc.Divide, a: 0, b: 0, wantErr: calc.ErrDivisionByZero},
		{name: "square root of a negative", op: calc.Sqrt, a: -9, b: 0, wantErr: calc.ErrNegativeSqrt},
		{name: "unknown operation", op: "modulo", a: 10, b: 4, wantErr: calc.ErrUnknownOperation},
		{name: "empty operation", op: "", a: 10, b: 4, wantErr: calc.ErrUnknownOperation},
		{
			name:    "multiplication overflows to infinity",
			op:      calc.Multiply,
			a:       math.MaxFloat64,
			b:       2,
			wantErr: calc.ErrResultNotFinite,
		},
		{
			name:    "power overflows to infinity",
			op:      calc.Power,
			a:       10,
			b:       400,
			wantErr: calc.ErrResultNotFinite,
		},
		{
			name:    "zero to a negative power is infinite",
			op:      calc.Power,
			a:       0,
			b:       -1,
			wantErr: calc.ErrResultNotFinite,
		},
		{
			name:    "subtraction of infinities is NaN",
			op:      calc.Subtract,
			a:       math.Inf(1),
			b:       math.Inf(1),
			wantErr: calc.ErrResultNotFinite,
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, err := calc.Calculate(c.op, c.a, c.b)

			if !errors.Is(err, c.wantErr) {
				t.Fatalf("Calculate(%q, %v, %v) error = %v, want %v", c.op, c.a, c.b, err, c.wantErr)
			}
			if c.wantErr != nil {
				return
			}
			if got != c.want {
				t.Errorf("Calculate(%q, %v, %v) = %v, want %v", c.op, c.a, c.b, got, c.want)
			}
		})
	}
}

func TestEveryDeclaredOpIsWired(t *testing.T) {
	for _, op := range []calc.Op{
		calc.Add, calc.Subtract, calc.Multiply, calc.Divide,
		calc.Power, calc.Sqrt, calc.Percentage,
	} {
		t.Run(string(op), func(t *testing.T) {
			if _, err := calc.Calculate(op, 1, 1); errors.Is(err, calc.ErrUnknownOperation) {
				t.Errorf("Calculate(%q, 1, 1) reports the operation as unknown", op)
			}
		})
	}
}
