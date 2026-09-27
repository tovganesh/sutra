# Contributing to Sutra

We welcome contributions from enterprise architects, developers, tax consultants, and open-source advocates around the globe!

## Development Setup

1. Fork and clone the repository.
2. Ensure you have Node.js (v20+) and Docker installed.
3. Install dependencies:
   ```bash
   npm.cmd install
   ```
4. Run the test suite and typechecks:
   ```bash
   npm.cmd run build
   ```

## Pull Request Guidelines

* All new modules or changes to compliance engines must include comprehensive unit tests.
* Ensure code follows strict TypeScript typing without unnecessary `any`.
* Keep commits clean, semantic, and well-described.
* All contributions are licensed under the Apache 2.0 License.
