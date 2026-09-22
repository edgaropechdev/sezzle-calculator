package calc

// Error is a domain error: a value with a stable machine-readable Code and a
// human-readable Message. It carries no HTTP status — this package does not
// know HTTP exists; translating a domain error to a status code is the api
// package's job.
type Error struct {
	Code    string
	Message string
}

func (e *Error) Error() string { return e.Message }

// The domain errors Calculate can return. They are compared with errors.Is,
// so they are values, never formatted on the fly.
var (
	ErrUnknownOperation = &Error{
		Code:    "unknown_operation",
		Message: "unknown operation",
	}
	ErrDivisionByZero = &Error{
		Code:    "division_by_zero",
		Message: "cannot divide by zero",
	}
	ErrNegativeSqrt = &Error{
		Code:    "negative_sqrt",
		Message: "cannot take the square root of a negative number",
	}
	ErrResultNotFinite = &Error{
		Code:    "result_not_finite",
		Message: "result is not a finite number",
	}
)
