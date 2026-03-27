package coreapi

import (
	"errors"
	"fmt"
)

var (
	ErrCapabilityDenied = errors.New("capability denied")
	ErrNotFound         = errors.New("not found")
	ErrValidation       = errors.New("validation error")
	ErrInternal         = errors.New("internal error")
)

type APIError struct {
	Code    error
	Message string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *APIError) Unwrap() error {
	return e.Code
}

func NewCapabilityDenied(capability string) *APIError {
	return &APIError{Code: ErrCapabilityDenied, Message: fmt.Sprintf("missing capability: %s", capability)}
}

func NewNotFound(resource string, id any) *APIError {
	return &APIError{Code: ErrNotFound, Message: fmt.Sprintf("%s %v not found", resource, id)}
}

func NewValidation(msg string) *APIError {
	return &APIError{Code: ErrValidation, Message: msg}
}

func NewInternal(msg string) *APIError {
	return &APIError{Code: ErrInternal, Message: msg}
}
