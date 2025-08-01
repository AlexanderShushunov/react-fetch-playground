# Fetch Playground

A project to explore and implement robust data fetching patterns in React applications.

## Overview

This project is primarily focused on developing reusable React utilities 
for handling data fetching scenarios. The main functionality is contained in the `utils` directory,
while the `App` directory contains example implementations demonstrating how to use these utilities
in a real-world context.

## Key Features

- **useLoader** - A custom hook for handling loading states, errors, and data fetching
- **withRetry** - Utility for implementing retry logic on failed requests
- **isAbortError** - Helper to detect aborted fetch requests
- **wait** - Utility for creating controlled delays

## Utilities

### useLoader

A powerful React hook that simplifies data fetching by managing:
- Loading states
- Error handling
- Request cancellation

### withRetry

Implements configurable retry logic for failed requests with growing backoff support.

### Other Utilities

The project includes additional helpers for common data fetching scenarios and testing.

## Example App

The App directory contains a simple implementation that demonstrates how to use these utilities 
in a practical context:
- Products listing with fetch (thanx https://dummyjson.com for api)
- Error handling
- Loading states
- 
