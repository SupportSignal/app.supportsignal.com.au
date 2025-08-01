# Error Handling Strategy

The strategy uses custom error classes, structured JSON logging with mandatory `correlationId`s, and a combination of retry policies and circuit breakers for external API calls, all designed to make the distributed system observable and resilient.
