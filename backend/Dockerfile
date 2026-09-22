FROM golang:1.27-alpine AS build

WORKDIR /src

# go.sum is absent while the module has no dependencies; the bracket glob makes
# it optional so this layer keeps working either way.
COPY go.mod go.su[m] ./
RUN go mod download

# Only the source trees, so editing the README or the ignore files does not
# invalidate the build cache.
COPY cmd/ ./cmd/
COPY internal/ ./internal/

RUN go vet ./... && go test ./...

RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath -ldflags="-s -w" \
    -o /bin/server ./cmd/server

FROM scratch

USER 65534:65534

COPY --from=build /bin/server /server

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["/server"]
