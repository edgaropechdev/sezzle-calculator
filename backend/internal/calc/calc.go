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

// Arity is how many operands an operation reads.
//
// It lives next to the operation because this is the only place that can know
// it, and two things downstream depend on it: which operands the api package
// requires, and which ones the response echoes back. Declared anywhere else it
// would be a second source of truth waiting to disagree with this one.
type Arity int

const (
	Unary  Arity = 1
	Binary Arity = 2
)

type operation struct {
	arity Arity
	apply func(a, b float64) (float64, error)
}

// operations is the single source of truth for which operations exist and how
// many numbers each one reads. Adding one here is the whole change: Calculate,
// ArityOf and the unknown_operation error all read from this map.
var operations = map[Op]operation{
	Add:      {arity: Binary, apply: func(a, b float64) (float64, error) { return a + b, nil }},
	Subtract: {arity: Binary, apply: func(a, b float64) (float64, error) { return a - b, nil }},
	Multiply: {arity: Binary, apply: func(a, b float64) (float64, error) { return a * b, nil }},
	Divide: {arity: Binary, apply: func(a, b float64) (float64, error) {
		if b == 0 {
			return 0, ErrDivisionByZero
		}
		return a / b, nil
	}},
	Power: {arity: Binary, apply: func(a, b float64) (float64, error) { return math.Pow(a, b), nil }},
	// Square root reads a and nothing else, which is what Unary declares. b is
	// not merely ignored here: the api package never requires it and never
	// echoes it, so no caller is asked for a number that takes no part in the
	// result. math.Sqrt of a negative is NaN, which would surface as the
	// generic result_not_finite; the caller gets a reason instead.
	Sqrt: {arity: Unary, apply: func(a, _ float64) (float64, error) {
		if a < 0 {
			return 0, ErrNegativeSqrt
		}
		return math.Sqrt(a), nil
	}},
	// Percentage is "a percent of b": 10 and 200 is 20. The other reading —
	// what percent a is of b — is a division, and divide already covers it.
	Percentage: {arity: Binary, apply: func(a, b float64) (float64, error) { return a / 100 * b, nil }},
}

// ArityOf reports how many operands op reads, and whether op exists at all.
//
// The api package calls this before it validates the body, because which
// operands are required is a property of the operation: the operation has to be
// resolved first, and an unknown one is answered as unknown rather than as a
// missing field.
func ArityOf(op Op) (Arity, bool) {
	o, ok := operations[op]
	if !ok {
		return 0, false
	}
	return o.arity, true
}

// Calculate applies op to a and b. A unary operation reads a and disregards b,
// and its caller is expected to have checked ArityOf rather than to have
// invented a second operand.
//
// The result is checked for finiteness before it is returned: encoding/json
// fails on NaN and ±Inf, so an unchecked overflow would surface as a 500 on a
// request the caller got right in every other respect. It is a domain error
// instead, and the caller answers 400.
//
// No rounding happens here or anywhere else on the server: 0.1 + 0.2 is
// 0.30000000000000004. Formatting is the client's job.
func Calculate(op Op, a, b float64) (float64, error) {
	o, ok := operations[op]
	if !ok {
		return 0, ErrUnknownOperation
	}

	result, err := o.apply(a, b)
	if err != nil {
		return 0, err
	}

	if math.IsNaN(result) || math.IsInf(result, 0) {
		return 0, ErrResultNotFinite
	}

	return result, nil
}
