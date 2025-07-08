# Project Overview

A modular web scraping framework written in TypeScript, designed around three pluggable responsibilities—**fetching**, **parsing**, and **writing**—with clear contracts to enable easy extension and testing.

---



## 📁 Folder Structure

* **src/**

  * **Fetchers**: handle HTTP requests, retries, timeouts, and rate-limit behavior.
  * **Parsers**: convert raw responses (HTML, JSON) into well-typed domain objects.
  * **Writers**: persist structured data to files, databases, or other storage backends without overwriting existing content.
  * **Types**: define shared interfaces (e.g. parser and writer contracts) and data models.
  * **Utilities**: logging, error handling, and helper functions.
  * **Configuration**: lists scraping jobs by name, URL, parser, and writer, driving the orchestration.
  * **Entry Point**: the bootstrap script that ties together fetchers, parsers, and writers in a workflow.

* **output/**: generated data exports (JSON, CSV, etc.).

* **tests/**: unit and integration tests for each module.

* **package.json**, **tsconfig.json**, and other root-level manifests for dependencies and tooling.

---

## 🔌 Core Concepts

* **Fetcher**
  A service that retrieves remote content with configurable options (timeouts, retries, headers) and exposes a `fetch` method returning raw text.

* **Parser**
  A component implementing a `parse(html: string): T[]` contract, responsible for extracting structured domain objects from raw input.

* **Writer**
  A component implementing a `write(data: T[]): Promise<void>` contract, handling data persistence and ensuring files or database records are created only when absent.

* **Job Configuration**

  * Each job has a unique identifier, target URL, parser instance, and writer instance.
  * Jobs are defined in a centralized configuration module, allowing new sources to be added without modifying core orchestration logic.

* **Orchestration Flow**

  1. Iterate through configured jobs.
  2. Fetch raw content for each job.
  3. Parse content into typed objects.
  4. Write parsed data to the appropriate sink.
  5. Log successes and handle errors gracefully.

---

## 🛠️ Extensibility & Maintenance

* **Adding Data Sources**: Implement a new parser module adhering to the parser interface and register it in the configuration.
* **Extending Storage Backends**: Implement a new writer module conforming to the writer interface for any storage system (e.g., cloud storage, message queues).
* **Scalable Configuration**: All jobs live in a single config file, minimizing touchpoints when scaling up.
* **Testing**: Keep tests close to implementation; add unit tests for fetchers, parsers, and writers to ensure resilience.

---

## 📦 Tools & Libraries

* **HTTP Client**: Axios (or similar) for flexible request options.
* **User-Agent Rotation**: Generates realistic headers for each request.
* **DOM Parsing**: Cheerio or equivalent for HTML scraping.
* **File I/O**: Node.js fs/promises for reading and writing files.
* **Logging**: A simple logging utility to capture flow and errors.