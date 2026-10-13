#!/bin/bash
sed -i 's/ErrInternal         = errors.New("internal error")/ErrInternal         = errors.New("internal error")\n\tErrNoProvider       = errors.New("no provider for tag")/g' internal/coreapi/errors.go
