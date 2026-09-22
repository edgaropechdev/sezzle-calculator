// Package calc implements the arithmetic. It depends on math and nothing else:
// no transport, no serialization, no logging.
package calc

import "math"

// Op is the name of an operation as it travels over the wire.
type Op string

const (
	Add        Op = "add"
	Subtract   Op = "subtract"
	Multiply   Op = "multiply"
	Divide     Op = "divide"
	Power      Op = "power"
	Sqrt       Op = "sqrt"
	Percentage Op = "percentage"
)

// operations is the single source of truth for which operations exist. Adding
// one here is the whole change: Calculate, the unknown_operation error and
// Operations all read from this map.
//
// Every operation takes both operands even when it uses one, because the
// request shape is frozen: op, a and b are all required, and an operation that
// silently accepted a missing b would reintroduce the absent-versus-zero bug
// the pointer decoding exists to prevent.
var operations = map[Op]func(a, b float64) (float64, error){
	Add:      func(a, b float64) (float64, error) { return a + b, nil },
	Subtract: func(a, b float64) (float64, error) { return a - b, nil },
	Multiply: func(a, b float64) (float64, error) { return a * b, nil },
	Divide: func(a, b float64) (float64, error) {
		if b == 0 {
			return 0, ErrDivisionByZero
		}
		return a / b, nil
	},
	Power: func(a, b float64) (float64, error) { return math.Pow(a, b), nil },
	// Square root reads a and ignores b. math.Sqrt of a negative is NaN, which
	// would surface as the generic result_not_finite; the caller gets a reason
	// instead.
	Sqrt: func(a, _ float64) (float64, error) {
		if a < 0 {
			return 0, ErrNegativeSqrt
		}
		return math.Sqrt(a), nil
	},
	// Percentage is "a percent of b": 10 and 200 is 20. The other reading —
	// what percent a is of b — is a division, and divide already covers it.
	Percentage: func(a, b float64) (float64, error) { return a / 100 * b, nil },
}

// Calculate applies op to a and b.
//
// The result is checked for finiteness before it is returned: encoding/json
// fails on NaN and ±Inf, so an unchecked overflow would surface as a 500 on a
// request the caller got right in every other respect. It is a domain error
// instead, and the caller answers 400.
//
// No rounding happens here or anywhere else on the server: 0.1 + 0.2 is
// 0.30000000000000004. Formatting is the client's job.
func Calculate(op Op, a, b float64) (float64, error) {
	apply, ok := operations[op]
	if !ok {
		return 0, ErrUnknownOperation
	}

	result, err := apply(a, b)
	if err != nil {
		return 0, err
	}

	if math.IsNaN(result) || math.IsInf(result, 0) {
		return 0, ErrResultNotFinite
	}

	return result, nil
}
